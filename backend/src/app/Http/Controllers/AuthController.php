<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // POST /api/register
    public function register(Request $request)
    {
         $data = $request->validate([
        'name'                  => ['required', 'string', 'max:255'],
        'email'                 => ['required', 'email', 'max:255', 'unique:users,email'],
        'password'              => ['required', 'string', 'min:8', 'confirmed'],
    ]);

    $user = User::create([
        'name'     => $data['name'],
        'email'    => $data['email'],
        'password' => Hash::make($data['password']),
    ]);

    // ⬇️ Queue-based email verification
    $user->sendEmailVerificationNotification();

    return response()->json([
        'message' => 'Registration successful. Please check your email to verify your account.',
    ], 201);
    }

    // POST /api/login
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password))
        {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (!$user->hasVerifiedEmail())
        {
            // Logout just in case auth()->attempt() started a session
            auth()->logout();

            return response()->json([
                'message' => 'Email not verified. Please check your email for the verification link.',
            ], 403);
        }
        // optional: delete old tokens so one active token per user
        $user->tokens()->delete();

        $plainToken = $user->createToken(
            'api-token', ['*'], now()->addHour()
        )->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $plainToken,
        ]);
    }

    // GET /api/me  (requires auth:sanctum)
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    // POST /api/logout  (requires auth:sanctum)
    public function logout(Request $request)
    {
        // Delete the token that was used for this request
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out',
        ]);
    }
    public function refresh(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        $current = $user->currentAccessToken();
        if ($current)
        {
            $current->delete();
        }
        $plainToken = $user->createToken(
            'api-token', ['*'], now()->addHour()
        )->plainTextToken;

        return response()->json([
            'token' => $plainToken,
        ]);
    }
}
