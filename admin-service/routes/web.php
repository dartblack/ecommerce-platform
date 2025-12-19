<?php

use App\Models\User;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Public routes - only login/register (for non-authenticated users)
Route::get('/welcome', function () {
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
    Route::get('/', function () {
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
    Route::get('/dashboard', function () {
        return redirect()->route('admin.dashboard');
    })->name('dashboard');

    // Admin Dashboard (alternative route)
    Route::get('/admin', function () {
        return redirect()->route('admin.dashboard');
    });

    // User Management
    Route::resource('admin/users', \App\Http\Controllers\Admin\UserController::class)
        ->names('admin.users');

    // Category Management
    Route::resource('admin/categories', \App\Http\Controllers\Admin\CategoryController::class)
        ->names('admin.categories');
    
    // Category restore and force delete routes
    Route::post('admin/categories/{id}/restore', [\App\Http\Controllers\Admin\CategoryController::class, 'restore'])
        ->name('admin.categories.restore');
    Route::delete('admin/categories/{id}/force-delete', [\App\Http\Controllers\Admin\CategoryController::class, 'forceDelete'])
        ->name('admin.categories.force-delete');

    // Product Management
    Route::resource('admin/products', \App\Http\Controllers\Admin\ProductController::class)
        ->names('admin.products');
    
    // Product restore and force delete routes
    Route::post('admin/products/{id}/restore', [\App\Http\Controllers\Admin\ProductController::class, 'restore'])
        ->name('admin.products.restore');
    Route::delete('admin/products/{id}/force-delete', [\App\Http\Controllers\Admin\ProductController::class, 'forceDelete'])
        ->name('admin.products.force-delete');

    // Inventory Management
    Route::get('admin/inventory', [\App\Http\Controllers\Admin\InventoryController::class, 'index'])
        ->name('admin.inventory.index');
    Route::get('admin/inventory/{id}', [\App\Http\Controllers\Admin\InventoryController::class, 'show'])
        ->name('admin.inventory.show');
    Route::post('admin/inventory/{id}/adjust', [\App\Http\Controllers\Admin\InventoryController::class, 'adjust'])
        ->name('admin.inventory.adjust');
    Route::get('admin/inventory/movements', [\App\Http\Controllers\Admin\InventoryController::class, 'movements'])
        ->name('admin.inventory.movements');

    // Order Management
    Route::get('admin/orders', [\App\Http\Controllers\Admin\OrderController::class, 'index'])
        ->name('admin.orders.index');
    Route::get('admin/orders/{id}', [\App\Http\Controllers\Admin\OrderController::class, 'show'])
        ->name('admin.orders.show');
    Route::put('admin/orders/{id}/status', [\App\Http\Controllers\Admin\OrderController::class, 'updateStatus'])
        ->name('admin.orders.update-status');
    Route::post('admin/orders/{id}/ship', [\App\Http\Controllers\Admin\OrderController::class, 'markAsShipped'])
        ->name('admin.orders.ship');
    Route::post('admin/orders/{id}/deliver', [\App\Http\Controllers\Admin\OrderController::class, 'markAsDelivered'])
        ->name('admin.orders.deliver');
    Route::post('admin/orders/{id}/cancel', [\App\Http\Controllers\Admin\OrderController::class, 'cancel'])
        ->name('admin.orders.cancel');

    // Sales Reports
    Route::get('admin/sales-reports', [\App\Http\Controllers\Admin\SalesReportController::class, 'index'])
        ->name('admin.sales-reports.index');
    Route::get('admin/sales-reports/export/csv', [\App\Http\Controllers\Admin\SalesReportController::class, 'exportCsv'])
        ->name('admin.sales-reports.export.csv');
    Route::get('admin/sales-reports/export/pdf', [\App\Http\Controllers\Admin\SalesReportController::class, 'exportPdf'])
        ->name('admin.sales-reports.export.pdf');
});
