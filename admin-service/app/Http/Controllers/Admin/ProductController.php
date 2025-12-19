<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    /**
     * Display a listing of products
     */
    public function index(Request $request): Response
    {
        // Filter by trashed status
        $trashed = $request->get('trashed', '');
        
        // Build base query
        $query = Product::query();

        // Apply trashed filter first
        if ($trashed === 'only') {
            $query->onlyTrashed();
        } elseif ($trashed === 'with') {
            $query->withTrashed();
        }

        // Load category relationship (with trashed if needed)
        if ($trashed === 'only' || $trashed === 'with') {
            $query->with(['category' => function ($q) {
                $q->withTrashed();
            }]);
        } else {
            $query->with('category');
        }

        // Search - must be applied after trashed filter
        $search = $request->input('search');
        if ($search !== null && trim($search) !== '') {
            $search = trim($search);
            $searchTerm = '%' . $search . '%';
            $dbDriver = config('database.default');
            $isPostgres = config("database.connections.{$dbDriver}.driver") === 'pgsql';
            
            $query->where(function ($q) use ($searchTerm, $isPostgres) {
                if ($isPostgres) {
                    $q->whereRaw('name ILIKE ?', [$searchTerm])
                        ->orWhereRaw('description ILIKE ?', [$searchTerm])
                        ->orWhereRaw('sku ILIKE ?', [$searchTerm]);
                } else {
                    $q->whereRaw('LOWER(name) LIKE LOWER(?)', [$searchTerm])
                        ->orWhereRaw('LOWER(description) LIKE LOWER(?)', [$searchTerm])
                        ->orWhereRaw('LOWER(sku) LIKE LOWER(?)', [$searchTerm]);
                }
            });
        }

        // Filter by category
        $categoryId = $request->input('category_id');
        if ($categoryId !== null && $categoryId !== '') {
            $query->where('category_id', $categoryId);
        }

        // Filter by stock status
        $stockStatus = $request->input('stock_status');
        if ($stockStatus !== null && $stockStatus !== '') {
            $query->where('stock_status', $stockStatus);
        }

        // Filter by active status
        $isActive = $request->input('is_active');
        if ($isActive !== null && $isActive !== '') {
            $query->where('is_active', $isActive === 'true' || $isActive === '1');
        }

        // Sort
        $sortBy = $request->get('sort_by', 'sort_order');
        $sortOrder = $request->get('sort_order', 'asc');
        
        // For trashed items, also sort by deleted_at
        if ($trashed === 'only' || $trashed === 'with') {
            $query->orderBy('deleted_at', 'desc')->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy($sortBy, $sortOrder);
        }

        $products = $query->paginate($request->get('per_page', 15))
            ->withQueryString()
            ->through(function ($product) {
                $product->image_url = $product->image_url;
                return $product;
            });

        // Get all categories for filter dropdown
        $categories = Category::select('id', 'name')
            ->whereNull('deleted_at')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Products/Index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category_id', 'stock_status', 'is_active', 'sort_by', 'sort_order', 'trashed']),
        ]);
    }

    /**
     * Show the form for creating a new product
     */
    public function create(): Response
    {
        $categories = Category::select('id', 'name', 'parent_id')
            ->with('parent:id,name')
            ->whereNull('deleted_at')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Products/Create', [
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created product
     */
    public function store(StoreProductRequest $request)
    {
        $data = $request->validated();

        // Handle slug generation if not provided
        $slug = $data['slug'] ?: Str::slug($data['name']);
        $originalSlug = $slug;
        $counter = 1;
        while (Product::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }
        $data['slug'] = $slug;

        // Handle image upload
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('products', 'public');
            $data['image'] = $imagePath;
        }

        Product::create($data);

        return redirect()->route('admin.products.index')
            ->with('success', 'Product created successfully.');
    }

    /**
     * Display the specified product
     */
    public function show($id): Response
    {
        $product = Product::withTrashed()->with(['category'])->findOrFail($id);
        $product->image_url = $product->image_url;

        return Inertia::render('Admin/Products/Show', [
            'product' => $product,
            'isDeleted' => $product->trashed(),
        ]);
    }

    /**
     * Show the form for editing the specified product
     */
    public function edit($id): Response
    {
        $product = Product::withTrashed()->findOrFail($id);
        
        if ($product->trashed()) {
            return redirect()->route('admin.products.show', $product->id)
                ->with('error', 'Cannot edit a deleted product. Please restore it first.');
        }

        $product->image_url = $product->image_url;

        $categories = Category::select('id', 'name', 'parent_id')
            ->with('parent:id,name')
            ->whereNull('deleted_at')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Products/Edit', [
            'product' => $product,
            'categories' => $categories,
        ]);
    }

    /**
     * Update the specified product
     */
    public function update(UpdateProductRequest $request, $id)
    {
        $product = Product::withTrashed()->findOrFail($id);
        
        if ($product->trashed()) {
            return redirect()->route('admin.products.show', $product->id)
                ->with('error', 'Cannot update a deleted product. Please restore it first.');
        }

        $data = $request->validated();

        // Handle slug generation if not provided
        if (isset($data['name']) && (!isset($data['slug']) || empty($data['slug']))) {
            $slug = Str::slug($data['name']);
            $originalSlug = $slug;
            $counter = 1;
            while (Product::where('slug', $slug)->where('id', '!=', $product->id)->exists()) {
                $slug = $originalSlug . '-' . $counter;
                $counter++;
            }
            $data['slug'] = $slug;
        }

        // Handle image upload
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($product->image && Storage::disk('public')->exists($product->image)) {
                Storage::disk('public')->delete($product->image);
            }

            // Store new image
            $imagePath = $request->file('image')->store('products', 'public');
            $data['image'] = $imagePath;
        }

        $product->update($data);

        return redirect()->route('admin.products.index')
            ->with('success', 'Product updated successfully.');
    }

    /**
     * Remove the specified product (soft delete)
     */
    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        $product->delete();

        return redirect()->route('admin.products.index')
            ->with('success', 'Product deleted successfully.');
    }

    /**
     * Restore a soft-deleted product
     */
    public function restore($id)
    {
        $product = Product::withTrashed()->findOrFail($id);
        
        if ($product->trashed()) {
            $product->restore();
            
            return redirect()->route('admin.products.index')
                ->with('success', 'Product restored successfully.');
        }

        return redirect()->route('admin.products.index')
            ->with('error', 'Product is not deleted.');
    }

    /**
     * Permanently delete a product
     */
    public function forceDelete($id)
    {
        $product = Product::withTrashed()->findOrFail($id);
        
        if ($product->trashed()) {
            // Delete image if exists
            if ($product->image && Storage::disk('public')->exists($product->image)) {
                Storage::disk('public')->delete($product->image);
            }

            $product->forceDelete();
            
            return redirect()->route('admin.products.index', ['trashed' => 'only'])
                ->with('success', 'Product permanently deleted.');
        }

        return redirect()->route('admin.products.index')
            ->with('error', 'Product must be deleted first before permanent deletion.');
    }
}

