<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDeleteRequest;
use App\Http\Requests\Admin\BulkRestoreRequest;
use App\Http\Requests\Admin\BulkUpdateCategoriesRequest;
use App\Http\Requests\Admin\StoreCategoryRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        $trashed = $request->get('trashed', '');
        $query = Category::query();
        if ($trashed === 'only') {
            $query->onlyTrashed();
        } elseif ($trashed === 'with') {
            $query->withTrashed();
        }

        if ($trashed === 'only' || $trashed === 'with') {
            $query->with(['parent' => function ($q) {
                $q->withTrashed();
            }]);
        } else {
            $query->with('parent');
        }

        $search = $request->input('search');
        if ($search !== null && trim($search) !== '') {
            $search = trim($search);
            $searchTerm = '%' . $search . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->whereRaw('name ILIKE ?', [$searchTerm])
                    ->orWhereRaw('description ILIKE ?', [$searchTerm]);
            });
        }

        $parentId = $request->input('parent_id');
        if ($parentId === 'null') {
            $query->whereNull('parent_id');
        } elseif ($parentId !== null && $parentId !== '') {
            $query->where('parent_id', $parentId);
        }
        
        $isActive = $request->input('is_active');
        if ($isActive !== null && $isActive !== '') {
            $query->where('is_active', $isActive === 'true' || $isActive === '1');
        }

        $sortBy = $request->get('sort_by', 'sort_order');
        $sortOrder = $request->get('sort_order', 'asc');

        if ($trashed === 'only' || $trashed === 'with') {
            $query->orderBy('deleted_at', 'desc')->orderBy($sortBy, $sortOrder);
        } else {
            $query->orderBy($sortBy, $sortOrder);
        }

        $categories = $query->paginate($request->get('per_page', 15))
            ->withQueryString();

        $allCategoriesQuery = Category::select('id', 'name', 'parent_id')
            ->with('parent:id,name');

        if ($trashed !== 'only' && $trashed !== 'with') {
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
    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $slug = $request->slug ?: Str::slug($request->name);
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
    public function edit($id): Response|RedirectResponse
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
    public function update(UpdateCategoryRequest $request, $id): RedirectResponse
    {
        $category = Category::withTrashed()->findOrFail($id);

        if ($category->trashed()) {
            return redirect()->route('admin.categories.show', $category->id)
                ->with('error', 'Cannot update a deleted category. Please restore it first.');
        }
        $data = $request->validated();

        if (isset($data['name']) && (!isset($data['slug']) || empty($data['slug']))) {
            $slug = Str::slug($data['name']);
            $originalSlug = $slug;
            $counter = 1;
            while (Category::where('slug', $slug)->where('id', '!=', $category->id)->exists()) {
                $slug = $originalSlug . '-' . $counter;
                $counter++;
            }

            $data['slug'] = $slug;
        }

        if (isset($data['parent_id']) && $data['parent_id'] == $category->id) {
            return redirect()->back()
                ->withErrors(['parent_id' => 'A category cannot be its own parent.']);
        }

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
    public function destroy($id): RedirectResponse
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
    public function restore($id): RedirectResponse
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
    public function forceDelete($id): RedirectResponse
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

    /**
     * Bulk delete categories
     */
    public function bulkDelete(BulkDeleteRequest $request): RedirectResponse
    {
        $ids = $request->validated()['ids'];
        $count = 0;
        $errors = [];

        DB::transaction(static function () use ($ids, &$count, &$errors) {
            $categories = Category::whereIn('id', $ids)
                ->whereNull('deleted_at')
                ->get();

            foreach ($categories as $category) {
                if ($category->canBeDeleted()) {
                    $category->delete();
                    $count++;
                } else {
                    $errors[] = "Category '{$category->name}' cannot be deleted because it has child categories.";
                }
            }
        });

        $message = "{$count} category(ies) deleted successfully.";
        if (!empty($errors)) {
            $message .= ' ' . implode(' ', array_slice($errors, 0, 3));
            if (count($errors) > 3) {
                $message .= ' And ' . (count($errors) - 3) . ' more.';
            }
        }

        return redirect()
            ->route('admin.categories.index')
            ->with($count > 0 ? 'success' : 'error', $message);
    }

    /**
     * Bulk restore categories
     */
    public function bulkRestore(BulkRestoreRequest $request): RedirectResponse
    {
        $ids = $request->validated()['ids'];
        $count = 0;

        DB::transaction(static function () use ($ids, &$count) {
            $categories = Category::withTrashed()
                ->whereIn('id', $ids)
                ->whereNotNull('deleted_at')
                ->get();

            foreach ($categories as $category) {
                $category->restore();
                $count++;
            }
        });

        return redirect()
            ->route('admin.categories.index')
            ->with('success', "{$count} category(ies) restored successfully.");
    }

    /**
     * Bulk update categories
     */
    public function bulkUpdate(BulkUpdateCategoriesRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $ids = $data['ids'];
        unset($data['ids']);

        // Only include fields that were actually provided
        $updateData = array_filter($data, static fn($value) => $value !== null);

        if (empty($updateData)) {
            return redirect()
                ->route('admin.categories.index')
                ->with('error', 'No fields to update.');
        }

        $count = 0;

        DB::transaction(static function () use ($ids, $updateData, &$count) {
            $categories = Category::whereIn('id', $ids)
                ->whereNull('deleted_at')
                ->get();

            foreach ($categories as $category) {
                $category->update($updateData);
                $count++;
            }
        });

        $fields = implode(', ', array_keys($updateData));
        return redirect()
            ->route('admin.categories.index')
            ->with('success', "{$count} category(ies) updated successfully. Updated fields: {$fields}.");
    }
}

