<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// All API routes require admin access
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});
