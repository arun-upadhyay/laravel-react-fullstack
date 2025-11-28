<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

// Public routes (no auth)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes (must send Bearer token)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Example protected route
    Route::get('/dashboard', function () {
        return response()->json([
            'message' => 'Welcome to the protected dashboard!',
        ]);
    });
});


