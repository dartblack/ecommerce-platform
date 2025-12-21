<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductController extends Controller
{

    public function show(int $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        return $this->successResponse($this->transform($product));
    }

    public function getByIds(Request $request): JsonResponse
    {
        $ids = $request->input('ids');

        if (!is_array($ids) || empty($ids)) {
            return $this->errorResponse('Product IDs are required', 400);
        }

        $products = Product::whereIn('id', $ids)->get();

        return $this->successResponse(
            $products->map(fn($product) => $this->transform($product))
        );
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $data = $request->validated();

        $data['slug'] = $this->resolveSlug($data['slug'] ?? null, $data['name']);
        $data['image'] = $this->handleImageUpload($request);

        $product = Product::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully',
            'data' => $this->transform($product),
        ], 201);
    }

    public function update(UpdateProductRequest $request, int $id): JsonResponse
    {

        $product = Product::findOrFail($id);
        $data = $request->validated();

        if (array_key_exists('name', $data) && empty($data['slug'])) {
            $data['slug'] = $this->resolveSlug(null, $data['name'], $product->id);
        }

        if ($request->hasFile('image')) {
            $this->deleteImageIfExists($product->image);
            $data['image'] = $this->handleImageUpload($request);
        } else {
            unset($data['image']); // preserve existing image
        }

        $product->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully',
            'data' => $this->transform($product),
        ]);

    }

    private function resolveSlug(?string $slug, string $name, ?int $ignoreId = null): string
    {
        $base = $slug ?: Str::slug($name);
        $final = $base;
        $counter = 1;

        while (
        Product::where('slug', $final)
            ->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))
            ->exists()
        ) {
            $final = "{$base}-{$counter}";
            $counter++;
        }

        return $final;
    }

    private function handleImageUpload(Request $request): ?string
    {
        if (!$request->hasFile('image')) {
            return null;
        }

        return $request->file('image')->store('products', 'public');
    }

    private function deleteImageIfExists(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    private function transform(Product $product): array
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'sku' => $product->sku,
            'price' => (float)$product->price,
            'compare_at_price' => $product->compare_at_price,
            'category_id' => $product->category_id,
            'stock_quantity' => $product->stock_quantity,
            'stock_status' => $product->stock_status,
            'is_active' => (bool)$product->is_active,
            'image' => $product->image,
            'created_at' => $product->created_at,
            'updated_at' => $product->updated_at,
        ];
    }

    private function successResponse($data): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    private function errorResponse(string $message, int $status): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], $status);
    }
}
