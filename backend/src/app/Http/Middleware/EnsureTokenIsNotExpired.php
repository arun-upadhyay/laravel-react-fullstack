<?php

namespace App\Http\MIddleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class EnsureTokenIsNotExpired
{
    public function handle(Request $request, Closure $next)
    {
       $user = $request->user();
        $token = $user?->currentAccessToken();

        if ($user && $token) {
            if ($token->expires_at && now()->greaterThan($token->expires_at)) {
                return response()->json([
                    'message' => 'Token expired from middleware',
                ], 401);
            }
        }

        return $next($request);
    }
}
