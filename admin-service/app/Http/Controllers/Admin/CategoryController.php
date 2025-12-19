<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCategoryRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    /**
     * Display a listing of categories
     */
    public function index(Request $request): Response
    {
        // Filter by trashed status
        $trashed = $request->get('trashed', '');
        
        // Build base query
        $query = Category::query();

        // Apply trashed filter first
        if ($trashed === 'only') {
            $query->onlyTrashed();
        } elseif ($trashed === 'with') {
            $query->withTrashed();
        }

        // Load parent relationship (with trashed if needed)
        if ($trashed === 'only' || $trashed === 'with') {
            $query->with(['parent' => function ($q) {
                $q->withTrashed();
            }]);
        } else {
            $query->with('parent');
        }

        // Search - must be applied after trashed filter
        // Only apply search if the parameter exists and has a non-empty value after trimming
        $search = $request->input('search');
        if ($search !== null && trim($search) !== '') {
            $search = trim($search);
            $searchTerm = '%' . $search . '%';
            // Use case-insensitive search (ILIKE for PostgreSQL, or LOWER for other databases)
            $dbDriver = config('database.default');
            $isPostgres = config("database.connections.{$dbDriver}.driver") === 'pgsql';
            
            $query->where(function ($q) use ($searchTerm, $isPostgres) {
                if ($isPostgres) {
                    $q->whereRaw('name ILIKE ?', [$searchTerm])
                        ->orWhereRaw('description ILIKE ?', [$searchTerm]);
                } else {
                    $q->whereRaw('LOWER(name) LIKE LOWER(?)', [$searchTerm])
                        ->orWhereRaw('LOWER(description) LIKE LOWER(?)', [$searchTerm]);
                }
            });
        }

        // Filter by parent
        $parentId = $request->input('parent_id');
        if ($parentId !== null) {
            if ($parentId === 'null' || $parentId === '') {
                $query->whereNull('parent_id');
            } elseif ($parentId !== '') {
                $query->where('parent_id', $parentId);
            }
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

        $categories = $query->paginate($request->get('per_page', 15))
            ->withQueryString();

        // Get all categories for parent dropdown (excluding trashed when viewing active)
        $allCategoriesQuery = Category::select('id', 'name', 'parent_id')
            ->with('parent:id,name');
        
        if ($trashed !== 'only' && $trashed !== 'with') {
            // Only show non-trashed categories in dropdown when viewing active categories
            $allCategoriesQuery = $allCategoriesQuery->whereNull('deleted_at');
        }
        
        $allCategories = $allCategoriesQuery->orderBy('name')->get();

        return Inertia::render('Admin/Categories/Index', [
            'categories' => $categories,
            'allCategories' => $allCategories,
            'filters' => $request->only(['search', 'parent_id', 'is_active', 'sort_by', 'sort_order', 'trashed']),
        ]);
    }

    /**
     * Show the form for creating a new category
     */
    public function create(): Response
    {
        $categories = Category::select('id', 'name', 'parent_id')
            ->with('parent:id,name')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Categories/Create', [
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created category
     */
    public function store(StoreCategoryRequest $request)
    {
        $slug = $request->slug ?: Str::slug($request->name);
        
        // Ensure slug is unique (excluding trashed)
        $originalSlug = $slug;
        $counter = 1;
        while (Category::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        Category::create([
            'name' => $request->name,
            'slug' => $slug,
            'description' => $request->description,
            'parent_id' => $request->parent_id ?: null,
            'is_active' => $request->is_active ?? true,
            'sort_order' => $request->sort_order ?? 0,
        ]);

        return redirect()->route('admin.categories.index')
            ->with('success', 'Category created successfully.');
    }

    /**
     * Display the specified category
     */
    public function show($id): Response
    {
        $category = Category::withTrashed()->with(['parent', 'children'])->findOrFail($id);

        return Inertia::render('Admin/Categories/Show', [
            'category' => $category,
            'isDeleted' => $category->trashed(),
        ]);
    }

    /**
     * Show the form for editing the specified category
     */
    public function edit($id)
    {
        $category = Category::withTrashed()->findOrFail($id);
        
        if ($category->trashed()) {
            return redirect()->route('admin.categories.show', $category->id)
                ->with('error', 'Cannot edit a deleted category. Please restore it first.');
        }

        $categories = Category::where('id', '!=', $category->id)
            ->select('id', 'name', 'parent_id')
            ->with('parent:id,name')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Categories/Edit', [
            'category' => $category,
            'categories' => $categories,
        ]);
    }

    /**
     * Update the specified category
     */
    public function update(UpdateCategoryRequest $request, $id)
    {
        $category = Category::withTrashed()->findOrFail($id);
        
        if ($category->trashed()) {
            return redirect()->route('admin.categories.show', $category->id)
                ->with('error', 'Cannot update a deleted category. Please restore it first.');
        }

        $data = $request->validated();

        // Handle slug generation if not provided
        if (isset($data['name']) && (!isset($data['slug']) || empty($data['slug']))) {
            $slug = Str::slug($data['name']);
            
            // Ensure slug is unique (excluding current category and trashed)
            $originalSlug = $slug;
            $counter = 1;
            while (Category::where('slug', $slug)->where('id', '!=', $category->id)->exists()) {
                $slug = $originalSlug . '-' . $counter;
                $counter++;
            }
            
            $data['slug'] = $slug;
        }

        // Prevent setting category as its own parent
        if (isset($data['parent_id']) && $data['parent_id'] == $category->id) {
            return redirect()->back()
                ->withErrors(['parent_id' => 'A category cannot be its own parent.']);
        }

        // Prevent circular references (check if parent is a descendant)
        if (isset($data['parent_id']) && $data['parent_id']) {
            $parent = Category::find($data['parent_id']);
            if ($parent && $this->isDescendant($parent, $category)) {
                return redirect()->back()
                    ->withErrors(['parent_id' => 'Cannot set parent: would create a circular reference.']);
            }
        }

        $category->update($data);

        return redirect()->route('admin.categories.index')
            ->with('success', 'Category updated successfully.');
    }

    /**
     * Remove the specified category (soft delete)
     */
    public function destroy($id)
    {
        $category = Category::findOrFail($id);
        
        if (!$category->canBeDeleted()) {
            return redirect()->route('admin.categories.index')
                ->with('error', 'Cannot delete category: it has child categories. Please delete or move child categories first.');
        }

        $category->delete();

        return redirect()->route('admin.categories.index')
            ->with('success', 'Category deleted successfully.');
    }

    /**
     * Restore a soft-deleted category
     */
    public function restore($id)
    {
        $category = Category::withTrashed()->findOrFail($id);
        
        if ($category->trashed()) {
            $category->restore();
            
            return redirect()->route('admin.categories.index')
                ->with('success', 'Category restored successfully.');
        }

        return redirect()->route('admin.categories.index')
            ->with('error', 'Category is not deleted.');
    }

    /**
     * Permanently delete a category
     */
    public function forceDelete($id)
    {
        $category = Category::withTrashed()->findOrFail($id);
        
        if ($category->trashed()) {
            // Check if it has children (including trashed)
            if ($category->childrenWithTrashed()->count() > 0) {
                return redirect()->route('admin.categories.index', ['trashed' => 'only'])
                    ->with('error', 'Cannot permanently delete category: it has child categories. Please delete or move child categories first.');
            }

            $category->forceDelete();
            
            return redirect()->route('admin.categories.index', ['trashed' => 'only'])
                ->with('success', 'Category permanently deleted.');
        }

        return redirect()->route('admin.categories.index')
            ->with('error', 'Category must be deleted first before permanent deletion.');
    }

    /**
     * Check if a category is a descendant of another category
     */
    private function isDescendant(Category $potentialAncestor, Category $category): bool
    {
        $parent = $category->parent;
        
        while ($parent) {
            if ($parent->id === $potentialAncestor->id) {
                return true;
            }
            $parent = $parent->parent;
        }
        
        return false;
    }
}

