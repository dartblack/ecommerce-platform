<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDeleteRequest;
use App\Http\Requests\Admin\BulkRestoreRequest;
use App\Http\Requests\Admin\BulkUpdateProductsRequest;
use App\Http\Requests\Admin\ImportProductRequest;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
use App\Models\Category;
use App\Models\Product;
use App\Services\ProductImportExportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ProductController extends Controller
{
    /**
     * Product listing
     */
    public function index(Request $request): InertiaResponse
    {
        $filters = $request->only([
            'search',
            'category_id',
            'stock_status',
            'is_active',
            'trashed',
            'sort_by',
            'sort_order',
        ]);

        $products = Product::query()
            ->withCategoryForTrashState($filters['trashed'] ?? null)
            ->applyTrashedFilter($filters['trashed'] ?? null)
            ->search($filters['search'] ?? null)
            ->filterCategory($filters['category_id'] ?? null)
            ->filterStockStatus($filters['stock_status'] ?? null)
            ->filterActive($filters['is_active'] ?? null)
            ->applySorting(
                $filters['sort_by'] ?? 'sort_order',
                $filters['sort_order'] ?? 'asc',
                $filters['trashed'] ?? null
            )
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return Inertia::render('Admin/Products/Index', [
            'products' => $products,
            'categories' => Category::withoutTrashed()
                ->select('id', 'name')
                ->orderBy('name')
                ->get(),
            'filters' => $filters,
        ]);
    }

    /**
     * Create form
     */
    public function create(): InertiaResponse
    {
        return Inertia::render('Admin/Products/Create', [
            'categories' => Category::withoutTrashed()
                ->select('id', 'name', 'parent_id')
                ->with('parent:id,name')
                ->orderBy('name')
                ->get(),
        ]);
    }

    /**
     * Store product
     */
    public function store(StoreProductRequest $request): RedirectResponse
    {
        DB::transaction(static function () use ($request) {
            $data = $request->validated();

            $data['slug'] = Product::generateUniqueSlug(
                $data['slug'] ?? $data['name']
            );

            if ($request->hasFile('image')) {
                $data['image'] = $request
                    ->file('image')
                    ->store('products', 'public');
            }

            Product::create($data);
        });

        return redirect()
            ->route('admin.products.index')
            ->with('success', 'Product created successfully.');
    }

    /**
     * Show product
     */
    public function show(Product $product): InertiaResponse
    {
        $product->loadMissing('category');

        return Inertia::render('Admin/Products/Show', [
            'product' => $product,
            'isDeleted' => $product->trashed(),
        ]);
    }

    /**
     * Edit form
     */
    public function edit(Product $product): InertiaResponse|RedirectResponse
    {
        if ($product->trashed()) {
            return redirect()
                ->route('admin.products.show', $product)
                ->with('error', 'Cannot edit a deleted product.');
        }

        return Inertia::render('Admin/Products/Edit', [
            'product' => $product,
            'categories' => Category::withoutTrashed()
                ->select('id', 'name', 'parent_id')
                ->with('parent:id,name')
                ->orderBy('name')
                ->get(),
        ]);
    }

    /**
     * Update product
     */
    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        if ($product->trashed()) {
            return redirect()
                ->route('admin.products.show', $product)
                ->with('error', 'Cannot update a deleted product.');
        }

        DB::transaction(static function () use ($request, $product) {
            $data = $request->validated();

            if (!empty($data['name']) && empty($data['slug'])) {
                $data['slug'] = Product::generateUniqueSlug(
                    $data['name'],
                    $product->id
                );
            }

            if ($request->hasFile('image')) {
                $oldImage = $product->image;

                $data['image'] = $request
                    ->file('image')
                    ->store('products', 'public');

                if ($oldImage && Storage::disk('public')->exists($oldImage)) {
                    Storage::disk('public')->delete($oldImage);
                }
            } else {
                unset($data['image']);
            }

            $product->update($data);
        });

        return redirect()
            ->route('admin.products.index')
            ->with('success', 'Product updated successfully.');
    }

    /**
     * Soft delete
     */
    public function destroy(Product $product): RedirectResponse
    {
        if (!$product->trashed()) {
            $product->delete();
        }

        return redirect()
            ->route('admin.products.index')
            ->with('success', 'Product deleted successfully.');
    }

    /**
     * Restore
     */
    public function restore(int $id): RedirectResponse
    {
        $product = Product::withTrashed()->findOrFail($id);
        $product->restore();

        return redirect()
            ->route('admin.products.index')
            ->with('success', 'Product restored successfully.');
    }

    /**
     * Permanent delete
     */
    public function forceDelete(int $id): RedirectResponse
    {
        $product = Product::withTrashed()->findOrFail($id);

        if ($product->image && Storage::disk('public')->exists($product->image)) {
            Storage::disk('public')->delete($product->image);
        }

        $product->forceDelete();

        return redirect()
            ->route('admin.products.index', ['trashed' => 'only'])
            ->with('success', 'Product permanently deleted.');
    }

    /**
     * Export CSV
     */
    public function export(
        Request                    $request,
        ProductImportExportService $service
    ): StreamedResponse
    {
        $rows = $service->exportToCsv(
            $request->only(['search', 'category_id', 'stock_status', 'is_active'])
        );

        $filename = 'products-' . now()->format('YmdHis') . '.csv';

        return Response::streamDownload(static function () use ($rows) {
            $out = fopen('php://output', 'wb');
            fprintf($out, chr(0xEF) . chr(0xBB) . chr(0xBF));

            foreach ($rows as $row) {
                fputcsv($out, $row);
            }

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /**
     * Import CSV
     */
    public function import(
        ImportProductRequest       $request,
        ProductImportExportService $service
    ): RedirectResponse
    {
        $result = $service->importFromFile(
            $request->file('file'),
            $request->boolean('update_existing')
        );

        return redirect()
            ->route('admin.products.index')
            ->with(
                $result->success > 0 ? 'success' : 'error',
                $result->summary()
            )
            ->with('import_errors', $result->limitedErrors());
    }

    /**
     * Bulk delete products
     */
    public function bulkDelete(BulkDeleteRequest $request): RedirectResponse
    {
        $ids = $request->validated()['ids'];
        $count = 0;

        DB::transaction(static function () use ($ids, &$count) {
            $products = Product::whereIn('id', $ids)
                ->whereNull('deleted_at')
                ->get();

            foreach ($products as $product) {
                $product->delete();
                $count++;
            }
        });

        return redirect()
            ->route('admin.products.index')
            ->with('success', "{$count} product(s) deleted successfully.");
    }

    /**
     * Bulk restore products
     */
    public function bulkRestore(BulkRestoreRequest $request): RedirectResponse
    {
        $ids = $request->validated()['ids'];
        $count = 0;

        DB::transaction(static function () use ($ids, &$count) {
            $products = Product::withTrashed()
                ->whereIn('id', $ids)
                ->whereNotNull('deleted_at')
                ->get();

            foreach ($products as $product) {
                $product->restore();
                $count++;
            }
        });

        return redirect()
            ->route('admin.products.index')
            ->with('success', "{$count} product(s) restored successfully.");
    }

    /**
     * Bulk update products
     */
    public function bulkUpdate(BulkUpdateProductsRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $ids = $data['ids'];
        unset($data['ids']);

        // Only include fields that were actually provided
        $updateData = array_filter($data, static fn($value) => $value !== null);

        if (empty($updateData)) {
            return redirect()
                ->route('admin.products.index')
                ->with('error', 'No fields to update.');
        }

        $count = 0;

        DB::transaction(static function () use ($ids, $updateData, &$count) {
            $products = Product::whereIn('id', $ids)
                ->whereNull('deleted_at')
                ->get();

            foreach ($products as $product) {
                $product->update($updateData);
                $count++;
            }
        });

        $fields = implode(', ', array_keys($updateData));
        return redirect()
            ->route('admin.products.index')
            ->with('success', "{$count} product(s) updated successfully. Updated fields: {$fields}.");
    }
}
