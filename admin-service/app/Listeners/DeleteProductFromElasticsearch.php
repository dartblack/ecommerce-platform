<?php

namespace App\Listeners;

use App\Events\ProductDeleted;
use App\Services\ElasticsearchService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class DeleteProductFromElasticsearch implements ShouldQueue
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
    public function handle(ProductDeleted $event): void
    {
        $elasticsearchService = app(ElasticsearchService::class);

        try {
            $elasticsearchService->deleteProduct($event->product->id);
        } catch (\Exception $e) {
            Log::error("Failed to delete product from Elasticsearch: " . $e->getMessage(), [
                'product_id' => $event->product->id,
            ]);

            throw $e;
        }
    }
}

