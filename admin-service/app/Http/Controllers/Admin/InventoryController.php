<?php

namespace App\Http\Controllers\Admin;

use App\Events\InventoryAdjusted;
use App\Events\LowStockAlert;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdjustInventoryRequest;
use App\Models\Category;
use App\Models\InventoryMovement;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    /**
     * Display a listing of inventory
     */
    public function index(Request $request): Response
    {
        $query = Product::query()->with('category');

        $search = $request->input('search');
        if ($search !== null && trim($search) !== '') {
            $search = trim($search);
            $searchTerm = '%' . $search . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->whereRaw('name ILIKE ?', [$searchTerm])
                    ->orWhereRaw('sku ILIKE ?', [$searchTerm]);
            });
        }

        $stockStatus = $request->input('stock_status');
        if ($stockStatus !== null && $stockStatus !== '') {
            $query->where('stock_status', $stockStatus);
        }

        $lowStock = $request->input('low_stock');
        if ($lowStock === 'true' || $lowStock === '1') {
            $query->where('stock_quantity', '<=', 10); // Consider 10 or less as low stock
        }

        $categoryId = $request->input('category_id');
        if ($categoryId !== null && $categoryId !== '') {
            $query->where('category_id', $categoryId);
        }

        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        $products = $query->paginate($request->get('per_page', 15))
            ->withQueryString();

        $categories = Category::select('id', 'name')
            ->whereNull('deleted_at')
            ->orderBy('name')
            ->get();

        $stats = [
            'total_products' => Product::count(),
            'in_stock' => Product::where('stock_status', 'in_stock')->count(),
            'out_of_stock' => Product::where('stock_status', 'out_of_stock')->count(),
            'low_stock' => Product::where('stock_quantity', '<=', 10)->count(),
            'total_quantity' => Product::sum('stock_quantity'),
        ];

        return Inertia::render('Admin/Inventory/Index', [
            'products' => $products,
            'categories' => $categories,
            'stats' => $stats,
            'filters' => $request->only(['search', 'stock_status', 'low_stock', 'category_id', 'sort_by', 'sort_order']),
        ]);
    }

    /**
     * Show inventory details for a specific product
     */
    public function show($id): Response
    {
        $product = Product::with(['category', 'inventoryMovements.user'])->findOrFail($id);

        $recentMovements = $product->inventoryMovements()
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        $movementStats = [
            'total_additions' => InventoryMovement::where('product_id', $product->id)
                ->where('quantity_change', '>', 0)
                ->sum('quantity_change'),
            'total_removals' => abs(InventoryMovement::where('product_id', $product->id)
                ->where('quantity_change', '<', 0)
                ->sum('quantity_change')),
            'total_movements' => InventoryMovement::where('product_id', $product->id)->count(),
        ];

        return Inertia::render('Admin/Inventory/Show', [
            'product' => $product,
            'recentMovements' => $recentMovements,
            'movementStats' => $movementStats,
        ]);
    }

    /**
     * Adjust inventory for a product
     */
    public function adjust(AdjustInventoryRequest $request, $id): RedirectResponse
    {
        $product = Product::findOrFail($id);
        $user = auth()->user();

        $quantityBefore = $product->stock_quantity;
        $quantityChange = 0;
        $quantityAfter = 0;

        switch ($request->adjustment_type) {
            case 'add':
                $quantityChange = $request->quantity;
                $quantityAfter = $quantityBefore + $quantityChange;
                break;
            case 'remove':
                $quantityChange = -$request->quantity;
                $quantityAfter = max(0, $quantityBefore + $quantityChange);
                break;
            case 'set':
                $quantityChange = $request->quantity - $quantityBefore;
                $quantityAfter = $request->quantity;
                break;
        }

        $product->stock_quantity = $quantityAfter;

        if ($quantityAfter <= 0) {
            $product->stock_status = 'out_of_stock';
        } elseif ($product->stock_status === 'out_of_stock') {
            $product->stock_status = 'in_stock';
        }

        $product->save();

        $movement = InventoryMovement::create([
            'product_id' => $product->id,
            'user_id' => $user->id,
            'type' => $request->type,
            'quantity_change' => $quantityChange,
            'quantity_before' => $quantityBefore,
            'quantity_after' => $quantityAfter,
            'reason' => $request->reason,
            'notes' => $request->notes,
            'reference_number' => $request->reference_number,
        ]);

        $product->refresh();

        event(new InventoryAdjusted($product, $movement));

        if ($quantityAfter > 0 && $quantityAfter <= 10) {
            event(new LowStockAlert($product, $quantityAfter, 10));
        }

        return redirect()->route('admin.inventory.show', $product->id)
            ->with('success', 'Inventory adjusted successfully.');
    }

    /**
     * Get inventory movements history
     */
    public function movements(Request $request): Response
    {
        $query = InventoryMovement::with(['product', 'user']);

        $productId = $request->input('product_id');
        if ($productId) {
            $query->where('product_id', $productId);
        }

        $type = $request->input('type');
        if ($type) {
            $query->where('type', $type);
        }

        $userId = $request->input('user_id');
        if ($userId) {
            $query->where('user_id', $userId);
        }

        if ($request->input('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }
        if ($request->input('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $movements = $query->paginate($request->get('per_page', 20))
            ->withQueryString();

        $products = Product::select('id', 'name', 'sku')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Inventory/Movements', [
            'movements' => $movements,
            'products' => $products,
            'filters' => $request->only(['product_id', 'type', 'user_id', 'date_from', 'date_to', 'sort_by', 'sort_order']),
        ]);
    }
}

