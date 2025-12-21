<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiKeyAuth
{
    /**
     * Handle an incoming request.
     *
     * @param Closure(Request): (Response) $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $apiKey = $this->extractApiKey($request);
        $validApiKey = config('services.api_key');

        if (!$apiKey) {
            return response()->json([
                'success' => false,
                'message' => 'API key is required',
            ], 401);
        }

        if (!$validApiKey) {
            return response()->json([
                'success' => false,
                'message' => 'API key validation is not configured',
            ], 500);
        }

        if ($apiKey !== $validApiKey) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid API key',
            ], 401);
        }

        return $next($request);
    }

    /**
     * Extract API key from request
     * Supports:
     * - X-API-Key header
     * - Authorization: ApiKey <key> header
     * - api_key query parameter (for backward compatibility, not recommended)
     */
    private function extractApiKey(Request $request): ?string
    {
        // Check X-API-Key header
        if ($request->hasHeader('X-API-Key')) {
            return $request->header('X-API-Key');
        }

        // Check Authorization header with ApiKey prefix
        $authHeader = $request->header('Authorization');
        if ($authHeader && str_starts_with($authHeader, 'ApiKey ')) {
            return substr($authHeader, 7);
        }

        // Check query parameter (backward compatibility)
        if ($request->has('api_key')) {
            return $request->query('api_key');
        }

        return null;
    }
}

