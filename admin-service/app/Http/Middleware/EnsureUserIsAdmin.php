<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!auth()->check()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                ], 401);
            }

            return redirect()->guest(route('login'));
        }

        if (!auth()->user()->isAdmin()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Unauthorized. Admin access required.',
                ], 403);
            }

            abort(403, 'Admin access required.');
        }

        return $next($request);
    }
}


