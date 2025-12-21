<?php

namespace App\Listeners;

use App\Events\ProductCreated;
use App\Events\ProductUpdated;
use App\Events\ProductRestored;
use App\Services\ElasticsearchService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SyncProductToElasticsearch implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * The name of the connection the job should be sent to.
     *
     * @var string|null
     */
    public ?string $connection = 'redis';

    /**
     * The name of the queue the job should be sent to.
     *
     * @var string|null
     */
    public ?string $queue = 'default';

    /**
     * Handle the event.
     * @throws \Exception
     */
    public function handle(ProductCreated|ProductUpdated|ProductRestored $event): void
    {
        $elasticsearchService = app(ElasticsearchService::class);

        try {
            $elasticsearchService->createIndex();
            $elasticsearchService->indexProduct($event->product);
        } catch (\Exception $e) {
            Log::error("Failed to sync product to Elasticsearch: " . $e->getMessage(), [
                'product_id' => $event->product->id,
                'event' => get_class($event),
            ]);
            
            throw $e;
        }
    }
}

