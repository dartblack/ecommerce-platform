<?php

namespace App\Providers;

use App\Events\ProductCreated;
use App\Events\ProductDeleted;
use App\Events\ProductRestored;
use App\Events\ProductUpdated;
use App\Listeners\DeleteProductFromElasticsearch;
use App\Listeners\SyncProductToElasticsearch;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        ProductCreated::class => [
            SyncProductToElasticsearch::class,
        ],
        ProductUpdated::class => [
            SyncProductToElasticsearch::class,
        ],
        ProductRestored::class => [
            SyncProductToElasticsearch::class,
        ],
        ProductDeleted::class => [
            DeleteProductFromElasticsearch::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        //
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}

