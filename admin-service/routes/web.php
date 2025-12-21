<?php

use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\InventoryController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\SalesReportController;
use App\Http\Controllers\Admin\UserController;
use App\Models\User;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Public routes - only login/register (for non-authenticated users)
Route::get('/welcome', static function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => false, // Registration disabled for admin-only panel
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
})->name('welcome');

// All authenticated routes require admin access
Route::middleware([
    'auth:sanctum',
    config('jetstream.auth_session'),
    'verified',
    'admin', // All authenticated routes require admin
])->group(function () {
    // Root route - Admin Dashboard (first page)
    Route::get('/', static function () {
        $stats = [
            'totalUsers' => User::count(),
            'totalAdmins' => User::where('role', 'admin')->count(),
            'totalCustomers' => User::where('role', 'customer')->count(),
        ];

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
        ]);
    })->name('admin.dashboard');

    // Redirect dashboard to admin dashboard
    Route::get('/dashboard', static function () {
        return redirect()->route('admin.dashboard');
    })->name('dashboard');

    // Admin Dashboard (alternative route)
    Route::get('/admin', static function () {
        return redirect()->route('admin.dashboard');
    });

    // User Management
    Route::resource('admin/users', UserController::class)
        ->names('admin.users');

    // Category Management
    Route::resource('admin/categories', CategoryController::class)
        ->names('admin.categories');

    // Category restore and force delete routes
    Route::post('admin/categories/{id}/restore', [CategoryController::class, 'restore'])
        ->name('admin.categories.restore');
    Route::delete('admin/categories/{id}/force-delete', [CategoryController::class, 'forceDelete'])
        ->name('admin.categories.force-delete');

    // Category bulk operations routes
    Route::post('admin/categories/bulk/delete', [CategoryController::class, 'bulkDelete'])
        ->name('admin.categories.bulk-delete');
    Route::post('admin/categories/bulk/restore', [CategoryController::class, 'bulkRestore'])
        ->name('admin.categories.bulk-restore');
    Route::post('admin/categories/bulk/update', [CategoryController::class, 'bulkUpdate'])
        ->name('admin.categories.bulk-update');

    // Product Management
    Route::resource('admin/products', ProductController::class)
        ->names('admin.products');

    // Product restore and force delete routes
    Route::post('admin/products/{id}/restore', [ProductController::class, 'restore'])
        ->name('admin.products.restore');
    Route::delete('admin/products/{id}/force-delete', [ProductController::class, 'forceDelete'])
        ->name('admin.products.force-delete');

    // Product bulk operations routes
    Route::post('admin/products/bulk/delete', [ProductController::class, 'bulkDelete'])
        ->name('admin.products.bulk-delete');
    Route::post('admin/products/bulk/restore', [ProductController::class, 'bulkRestore'])
        ->name('admin.products.bulk-restore');
    Route::post('admin/products/bulk/update', [ProductController::class, 'bulkUpdate'])
        ->name('admin.products.bulk-update');

    // Product bulk import/export routes
    Route::get('admin/products/export/csv', [ProductController::class, 'export'])
        ->name('admin.products.export');
    Route::post('admin/products/import/csv', [ProductController::class, 'import'])
        ->name('admin.products.import');

    // Inventory Management
    Route::get('admin/inventory', [InventoryController::class, 'index'])
        ->name('admin.inventory.index');
    Route::get('admin/inventory/movements', [InventoryController::class, 'movements'])
        ->name('admin.inventory.movements');
    Route::get('admin/inventory/{id}', [InventoryController::class, 'show'])
        ->name('admin.inventory.show');
    Route::post('admin/inventory/{id}/adjust', [InventoryController::class, 'adjust'])
        ->name('admin.inventory.adjust');

    // Order Management
    Route::get('admin/orders', [OrderController::class, 'index'])
        ->name('admin.orders.index');
    Route::get('admin/orders/{id}', [OrderController::class, 'show'])
        ->name('admin.orders.show');
    Route::put('admin/orders/{id}/status', [OrderController::class, 'updateStatus'])
        ->name('admin.orders.update-status');
    Route::post('admin/orders/{id}/ship', [OrderController::class, 'markAsShipped'])
        ->name('admin.orders.ship');
    Route::post('admin/orders/{id}/deliver', [OrderController::class, 'markAsDelivered'])
        ->name('admin.orders.deliver');
    Route::post('admin/orders/{id}/cancel', [OrderController::class, 'cancel'])
        ->name('admin.orders.cancel');

    // Order bulk operations routes
    Route::post('admin/orders/bulk/delete', [OrderController::class, 'bulkDelete'])
        ->name('admin.orders.bulk-delete');
    Route::post('admin/orders/bulk/update', [OrderController::class, 'bulkUpdate'])
        ->name('admin.orders.bulk-update');
    Route::post('admin/orders/bulk/cancel', [OrderController::class, 'bulkCancel'])
        ->name('admin.orders.bulk-cancel');

    // Sales Reports
    Route::get('admin/sales-reports', [SalesReportController::class, 'index'])
        ->name('admin.sales-reports.index');
    Route::get('admin/sales-reports/export/csv', [SalesReportController::class, 'exportCsv'])
        ->name('admin.sales-reports.export.csv');
    Route::get('admin/sales-reports/export/pdf', [SalesReportController::class, 'exportPdf'])
        ->name('admin.sales-reports.export.pdf');
});
