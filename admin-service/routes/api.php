<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\OrderSyncController;

/*
|--------------------------------------------------------------------------
| API v1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
    });


    Route::middleware('jwt.auth')->prefix('auth')->group(function () {
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });


    Route::middleware('jwt.auth')->get('me', function (Request $request) {
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'role' => $request->user()->role,
            ],
        ]);
    });
});

/*
|--------------------------------------------------------------------------
| Internal Service-to-Service APIs
| Never exposed to frontend
|--------------------------------------------------------------------------
*/

Route::prefix('internal')
    ->middleware('api.key')
    ->group(function () {

        Route::prefix('products')->group(function () {
            // Read
            Route::get('{id}', [ProductController::class, 'show']);
            Route::post('batch', [ProductController::class, 'getByIds']);

            // Write (used by background jobs / internal sync)
            Route::post('/', [ProductController::class, 'store']);
            Route::put('{id}', [ProductController::class, 'update']);
        });


        Route::post(
            'inventory/deduct-for-order',
            [InventoryController::class, 'deductForOrder']
        );


        Route::prefix('orders')->group(function () {
            Route::post('sync', [OrderSyncController::class, 'sync']);
            Route::put('{orderNumber}/status', [OrderSyncController::class, 'updateStatus']);
            Route::put('{orderNumber}/cancel', [OrderSyncController::class, 'cancel']);
        });
    });
