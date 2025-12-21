<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ProductImportExportService
{
    /**
     * Export products to CSV format
     *
     * @param array $filters
     * @return array
     */
    public function exportToCsv(array $filters = []): array
    {
        $query = Product::query()->with('category');

        // Apply filters
        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $searchTerm = '%' . $search . '%';

            $query->where(function ($q) use ($searchTerm) {
                $q->whereRaw('name ILIKE ?', [$searchTerm])
                    ->orWhereRaw('description ILIKE ?', [$searchTerm])
                    ->orWhereRaw('sku ILIKE ?', [$searchTerm]);
            });
        }

        if (!empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (!empty($filters['stock_status'])) {
            $query->where('stock_status', $filters['stock_status']);
        }

        if (isset($filters['is_active']) && $filters['is_active'] !== '') {
            $query->where('is_active', $filters['is_active'] === 'true' || $filters['is_active'] === '1');
        }

        $products = $query->orderBy('sort_order')->orderBy('name')->get();

        $csvData = [];
        $csvData[] = [
            'SKU',
            'Name',
            'Slug',
            'Description',
            'Short Description',
            'Price',
            'Compare At Price',
            'Category Name',
            'Category ID',
            'Stock Quantity',
            'Stock Status',
            'Is Active',
            'Image URL',
            'Sort Order',
        ];

        foreach ($products as $product) {
            $csvData[] = [
                $product->sku,
                $product->name,
                $product->slug,
                $product->description ?? '',
                $product->short_description ?? '',
                $product->price,
                $product->compare_at_price ?? '',
                $product->category ? $product->category->name : '',
                $product->category_id ?? '',
                $product->stock_quantity,
                $product->stock_status,
                $product->is_active ? '1' : '0',
                $product->image_url ?? '',
                $product->sort_order,
            ];
        }

        return $csvData;
    }

    /**
     * Import products from CSV data
     *
     * @param array $csvData
     * @param bool $updateExisting
     * @return array
     * @throws \Throwable
     */
    public function importFromCsv(array $csvData, bool $updateExisting = false): array
    {
        $results = [
            'success' => 0,
            'failed' => 0,
            'updated' => 0,
            'created' => 0,
            'errors' => [],
        ];

        if (empty($csvData)) {
            $results['errors'][] = 'CSV file is empty';
            return $results;
        }

        // Skip header row
        $headerRow = array_shift($csvData);

        // Validate header columns
        $expectedColumns = [
            'SKU', 'Name', 'Slug', 'Description', 'Short Description',
            'Price', 'Compare At Price', 'Category Name', 'Category ID',
            'Stock Quantity', 'Stock Status', 'Is Active', 'Image URL', 'Sort Order',
        ];

        if (count($headerRow) !== count($expectedColumns)) {
            $results['errors'][] = 'Invalid CSV format. Expected ' . count($expectedColumns) . ' columns, got ' . count($headerRow);
            return $results;
        }

        DB::beginTransaction();

        try {
            foreach ($csvData as $rowIndex => $row) {
                $rowNumber = $rowIndex + 2; // +2 because we removed header and arrays are 0-indexed

                try {
                    // Skip empty rows
                    if (empty(array_filter($row))) {
                        continue;
                    }

                    // Map CSV columns to data array
                    $data = $this->mapCsvRowToData($row, $headerRow);

                    // Validate required fields
                    if (empty($data['sku']) || empty($data['name'])) {
                        $results['failed']++;
                        $results['errors'][] = "Row {$rowNumber}: SKU and Name are required";
                        continue;
                    }

                    // Check if product exists
                    $product = Product::withTrashed()->where('sku', $data['sku'])->first();

                    if ($product && $product->trashed()) {
                        $results['failed']++;
                        $results['errors'][] = "Row {$rowNumber}: Product with SKU '{$data['sku']}' is deleted. Please restore it first.";
                        continue;
                    }

                    // Handle category
                    $categoryId = null;
                    if (!empty($data['category_id'])) {
                        $category = Category::find($data['category_id']);
                        if (!$category) {
                            $results['failed']++;
                            $results['errors'][] = "Row {$rowNumber}: Category ID '{$data['category_id']}' not found";
                            continue;
                        }
                        $categoryId = $category->id;
                    } elseif (!empty($data['category_name'])) {
                        $category = Category::where('name', $data['category_name'])->first();
                        if ($category) {
                            $categoryId = $category->id;
                        } else {
                            $results['failed']++;
                            $results['errors'][] = "Row {$rowNumber}: Category '{$data['category_name']}' not found";
                            continue;
                        }
                    }

                    // Prepare product data
                    $productData = [
                        'name' => $data['name'],
                        'sku' => $data['sku'],
                        'description' => $data['description'] ?? null,
                        'short_description' => $data['short_description'] ?? null,
                        'price' => (float)($data['price'] ?? 0),
                        'compare_at_price' => !empty($data['compare_at_price']) ? (float)$data['compare_at_price'] : null,
                        'category_id' => $categoryId,
                        'stock_quantity' => (int)($data['stock_quantity'] ?? 0),
                        'stock_status' => $data['stock_status'] ?? 'in_stock',
                        'is_active' => filter_var($data['is_active'] ?? true, FILTER_VALIDATE_BOOLEAN),
                        'sort_order' => (int)($data['sort_order'] ?? 0),
                    ];

                    // Handle slug
                    if (!empty($data['slug'])) {
                        $slug = $data['slug'];
                    } else {
                        $slug = Str::slug($data['name']);
                    }
                    $originalSlug = $slug;
                    $counter = 1;
                    while (Product::where('slug', $slug)->where('id', '!=', $product?->id)->exists()) {
                        $slug = $originalSlug . '-' . $counter;
                        $counter++;
                    }
                    $productData['slug'] = $slug;

                    // Validate stock_status
                    if (!in_array($productData['stock_status'], ['in_stock', 'out_of_stock', 'on_backorder'])) {
                        $productData['stock_status'] = 'in_stock';
                    }

                    // Create or update product
                    if ($product && $updateExisting) {
                        $product->update($productData);
                        $results['updated']++;
                        $results['success']++;
                    } elseif (!$product) {
                        Product::create($productData);
                        $results['created']++;
                        $results['success']++;
                    } else {
                        $results['failed']++;
                        $results['errors'][] = "Row {$rowNumber}: Product with SKU '{$data['sku']}' already exists. Set 'update existing' to update.";
                    }
                } catch (\Exception $e) {
                    $results['failed']++;
                    $results['errors'][] = "Row {$rowNumber}: " . $e->getMessage();
                    Log::error("Product import error on row {$rowNumber}: " . $e->getMessage(), [
                        'row' => $row,
                        'trace' => $e->getTraceAsString(),
                    ]);
                }
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            $results['errors'][] = 'Import failed: ' . $e->getMessage();
            Log::error('Product import transaction failed: ' . $e->getMessage());
        }

        return $results;
    }

    /**
     * Map CSV row to product data array
     *
     * @param array $row
     * @param array $headerRow
     * @return array
     */
    protected function mapCsvRowToData(array $row, array $headerRow): array
    {
        $data = [];

        $columnMap = [
            'SKU' => 'sku',
            'Name' => 'name',
            'Slug' => 'slug',
            'Description' => 'description',
            'Short Description' => 'short_description',
            'Price' => 'price',
            'Compare At Price' => 'compare_at_price',
            'Category Name' => 'category_name',
            'Category ID' => 'category_id',
            'Stock Quantity' => 'stock_quantity',
            'Stock Status' => 'stock_status',
            'Is Active' => 'is_active',
            'Image URL' => 'image_url',
            'Sort Order' => 'sort_order',
        ];

        foreach ($headerRow as $index => $header) {
            $header = trim($header);
            if (isset($columnMap[$header], $row[$index])) {
                $data[$columnMap[$header]] = trim($row[$index]);
            }
        }

        return $data;
    }

    /**
     * Import products from CSV file
     *
     * @param UploadedFile $file
     * @param bool $updateExisting
     * @return ImportResult
     * @throws \Throwable
     */
    public function importFromFile(UploadedFile $file, bool $updateExisting = false): ImportResult
    {
        // Read CSV file
        $csvData = [];
        if (($handle = fopen($file->getRealPath(), 'rb')) !== false) {
            while (($data = fgetcsv($handle, 1000, ',')) !== false) {
                $csvData[] = $data;
            }
            fclose($handle);
        }

        if (empty($csvData)) {
            return new ImportResult([
                'success' => 0,
                'failed' => 0,
                'updated' => 0,
                'created' => 0,
                'errors' => ['CSV file is empty or could not be read.'],
            ]);
        }

        $results = $this->importFromCsv($csvData, $updateExisting);

        return new ImportResult($results);
    }
}

