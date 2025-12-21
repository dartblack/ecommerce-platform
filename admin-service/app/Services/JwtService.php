<?php

namespace App\Services;

use App\Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\Log;

class JwtService
{
    /**
     * Check if JWT library is available
     */
    private function isJwtAvailable(): bool
    {
        return class_exists(JWT::class);
    }

    /**
     * Get the JWT secret key from environment
     */
    private function getSecretKey(): string
    {
        return config('jwt.secret');
    }

    /**
     * Get the JWT algorithm
     */
    private function getAlgorithm(): string
    {
        return config('jwt.algorithm', 'HS256');
    }

    /**
     * Get the JWT expiration time in seconds
     */
    private function getExpiration(): int
    {
        return config('jwt.expiration', 60 * 60 * 24); // 24 hours default
    }

    /**
     * Generate a JWT token for a user
     */
    public function generateToken(User $user): string
    {
        if (!$this->isJwtAvailable()) {
            throw new \RuntimeException('JWT library not installed. Please run: composer require firebase/php-jwt');
        }

        $payload = [
            'iss' => config('app.url'), // Issuer
            'iat' => time(), // Issued at
            'exp' => time() + $this->getExpiration(), // Expiration
            'sub' => $user->id, // Subject (user ID)
            'email' => $user->email,
            'role' => $user->role,
        ];

        return JWT::encode($payload, $this->getSecretKey(), $this->getAlgorithm());
    }

    /**
     * Decode and validate a JWT token
     */
    public function decodeToken(string $token): ?object
    {
        if (!$this->isJwtAvailable()) {
            throw new \RuntimeException('JWT library not installed. Please run: composer require firebase/php-jwt');
        }

        try {
            return JWT::decode($token, new Key($this->getSecretKey(), $this->getAlgorithm()));
        } catch (\Exception $e) {
            Log::warning('JWT decode failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get user from token
     */
    public function getUserFromToken(string $token): ?User
    {
        $decoded = $this->decodeToken($token);

        if (!$decoded || !isset($decoded->sub)) {
            return null;
        }

        return User::find($decoded->sub);
    }

    /**
     * Refresh a token (generate a new one for the same user)
     */
    public function refreshToken(string $token): ?string
    {
        $user = $this->getUserFromToken($token);

        if (!$user) {
            return null;
        }

        return $this->generateToken($user);
    }
}

