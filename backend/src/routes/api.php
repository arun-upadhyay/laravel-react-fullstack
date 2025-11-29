<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;

// Public routes (no auth)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/refresh', [AuthController::class, 'refresh']);


// Protected routes (must send Bearer token)
Route::middleware(['auth:sanctum'])->group(function ()
{
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Example protected route
    Route::get('/dashboard', function ()
    {
        return response()->json([
            'message' => 'Welcome to the protected dashboard!',
        ]);
    });
});

Route::get('/email/verify/{id}/{hash}', function (Request $request, $id, $hash)
{
    $user = User::findOrFail($id);

    // Check that the hash in the URL matches the user's email
    if (!hash_equals(sha1($user->getEmailForVerification()), (string) $hash))
    {
        return response()->json([
            'message' => 'Invalid verification link.',
        ], 400);
    }

    if ($user->hasVerifiedEmail())
    {
        return response()->json([
            'message' => 'Email already verified.',
        ]);
    }

    // Mark email as verified
    $user->markEmailAsVerified();

    event(new Verified($user));

    // For SPA you might want to redirect to frontend:
    // return redirect(config('app.frontend_url').'/email-verified');

    return response()->json([
        'message' => 'Email verified successfully.',
    ]);

})->middleware(['signed', 'throttle:6,1'])->name('verification.verify');


// Resend verification email (user is logged in but not verified)
Route::post('/email/verification-notification', function (Request $request)
{
    $data = $request->validate([
        'email' => ['required', 'email'],
    ]);

    $user = User::where('email', $data['email'])->first();

    // Optional: don't leak if email doesn't exist
    if (!$user)
    {
        return response()->json([
            'message' => 'If your account exists, a verification link has been sent.',
        ], 200);
    }

    if ($user->hasVerifiedEmail())
    {
        return response()->json([
            'message' => 'Email already verified.',
        ], 200);
    }

    $user->sendEmailVerificationNotification();

    return response()->json([
        'message' => 'Verification link sent.',
    ], 200);
})->middleware(['throttle:6,1'])->name('verification.send');
