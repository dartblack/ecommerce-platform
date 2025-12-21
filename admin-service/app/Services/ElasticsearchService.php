<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ElasticsearchService
{
    protected string $host;
    protected string $index;

    public function __construct()
    {
        $this->host = config('services.elasticsearch.host', 'http://elasticsearch:9200');
        $this->index = config('services.elasticsearch.products_index', 'products');
    }

    /**
     * Index a product in Elasticsearch
     */
    public function indexProduct(Product $product): bool
    {
        try {
            $product->load('category');

            $document = [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'description' => $product->description,
                'short_description' => $product->short_description,
                'sku' => $product->sku,
                'price' => (float)$product->price,
                'compare_at_price' => $product->compare_at_price ? (float)$product->compare_at_price : null,
                'category_id' => $product->category_id,
                'category_name' => $product->category?->name,
                'stock_quantity' => $product->stock_quantity,
                'stock_status' => $product->stock_status,
                'is_active' => $product->is_active,
                'image' => $product->image,
                'image_url' => $product->image_url,
                'sort_order' => $product->sort_order,
                'created_at' => $product->created_at?->toIso8601String(),
                'updated_at' => $product->updated_at?->toIso8601String(),
            ];

            $response = Http::put("{$this->host}/{$this->index}/_doc/{$product->id}", $document);

            if ($response && $response->successful()) {
                Log::info("Product indexed successfully: {$product->id}");
                return true;
            }

            Log::error("Failed to index product {$product->id}: " . ($response?->body() ?? 'No response'));
            return false;
        } catch (\Exception $e) {
            Log::error("Error indexing product {$product->id}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Update a product in Elasticsearch
     */
    public function updateProduct(Product $product): bool
    {
        return $this->indexProduct($product);
    }

    /**
     * Delete a product from Elasticsearch
     */
    public function deleteProduct(int $productId): bool
    {
        try {
            $response = Http::delete("{$this->host}/{$this->index}/_doc/{$productId}");

            if ($response && ($response->successful() || $response->status() === 404)) {
                Log::info("Product deleted from Elasticsearch: {$productId}");
                return true;
            }

            Log::error("Failed to delete product {$productId} from Elasticsearch: " . ($response?->body() ?? 'No response'));
            return false;
        } catch (\Exception $e) {
            Log::error("Error deleting product {$productId} from Elasticsearch: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Create the products index with mapping
     */
    public function createIndex(): bool
    {
        try {
            $mapping = [
                'mappings' => [
                    'properties' => [
                        'id' => ['type' => 'integer'],
                        'name' => [
                            'type' => 'text',
                            'fields' => [
                                'keyword' => ['type' => 'keyword'],
                            ],
                        ],
                        'slug' => ['type' => 'keyword'],
                        'description' => ['type' => 'text'],
                        'short_description' => ['type' => 'text'],
                        'sku' => ['type' => 'keyword'],
                        'price' => ['type' => 'float'],
                        'compare_at_price' => ['type' => 'float'],
                        'category_id' => ['type' => 'integer'],
                        'category_name' => [
                            'type' => 'text',
                            'fields' => [
                                'keyword' => ['type' => 'keyword'],
                            ],
                        ],
                        'stock_quantity' => ['type' => 'integer'],
                        'stock_status' => ['type' => 'keyword'],
                        'is_active' => ['type' => 'boolean'],
                        'image' => ['type' => 'keyword'],
                        'image_url' => ['type' => 'keyword'],
                        'sort_order' => ['type' => 'integer'],
                        'created_at' => ['type' => 'date'],
                        'updated_at' => ['type' => 'date'],
                    ],
                ],
            ];

            $response = Http::put("{$this->host}/{$this->index}", $mapping);

            if ($response && $response->successful()) {
                Log::info("Elasticsearch index created: {$this->index}");
                return true;
            }

            // Index might already exist, which is okay
            if ($response && $response->status() === 400 && str_contains($response->body() ?? '', 'resource_already_exists_exception')) {
                Log::info("Elasticsearch index already exists: {$this->index}");
                return true;
            }

            Log::error("Failed to create Elasticsearch index: " . ($response?->body() ?? 'No response'));
            return false;
        } catch (\Exception $e) {
            Log::error("Error creating Elasticsearch index: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Check if Elasticsearch is available
     */
    public function isAvailable(): bool
    {
        try {
            $response = Http::get("{$this->host}/_cluster/health");
            return $response && $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }
}

