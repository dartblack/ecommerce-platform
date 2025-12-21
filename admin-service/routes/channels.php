<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int)$user->id === (int)$id;
});

// Admin channel - only authenticated admin users can listen
Broadcast::channel('admin', function ($user) {
    return $user && $user->role === 'admin';
});

// Admin notifications channel - for admin-specific notifications
Broadcast::channel('admin.notifications', function ($user) {
    return $user && $user->role === 'admin';
});

