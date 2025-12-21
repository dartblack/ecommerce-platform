<?php

return [
    /*
    |--------------------------------------------------------------------------
    | JWT Secret Key
    |--------------------------------------------------------------------------
    |
    | This is the secret key used to sign JWT tokens. Make sure to set this
    | to a random, secure string in your .env file.
    |
    */

    'secret' => env('JWT_SECRET', 'your-secret-key-change-this-in-production'),

    /*
    |--------------------------------------------------------------------------
    | JWT Algorithm
    |--------------------------------------------------------------------------
    |
    | The algorithm used to sign the JWT tokens.
    |
    */

    'algorithm' => env('JWT_ALGORITHM', 'HS256'),

    /*
    |--------------------------------------------------------------------------
    | JWT Expiration Time
    |--------------------------------------------------------------------------
    |
    | The number of seconds until the JWT token expires.
    | Default is 24 hours (86400 seconds).
    |
    */

    'expiration' => env('JWT_EXPIRATION', 86400),

    /*
    |--------------------------------------------------------------------------
    | JWT Refresh Token Expiration
    |--------------------------------------------------------------------------
    |
    | The number of seconds until the refresh token expires.
    | Default is 7 days (604800 seconds).
    |
    */

    'refresh_expiration' => env('JWT_REFRESH_EXPIRATION', 604800),
];

