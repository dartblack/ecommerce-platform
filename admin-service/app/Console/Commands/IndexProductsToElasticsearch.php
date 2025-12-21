<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Services\ElasticsearchService;
use Illuminate\Console\Command;

class IndexProductsToElasticsearch extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'elasticsearch:index-products
                            {--chunk=100 : Number of products to process at a time}
                            {--force : Force re-index even if product already exists}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Index all products to Elasticsearch';

    /**
     * Execute the console command.
     */
    public function handle(ElasticsearchService $elasticsearchService): int
    {
        $this->info('Starting product indexing to Elasticsearch...');

        // Check if Elasticsearch is available
        if (!$elasticsearchService->isAvailable()) {
            $this->error('Elasticsearch is not available. Please check your configuration.');
            return Command::FAILURE;
        }

        // Create index if it doesn't exist
        $this->info('Creating Elasticsearch index...');
        if (!$elasticsearchService->createIndex()) {
            $this->warn('Index creation failed or already exists. Continuing...');
        }

        // Get total count
        $total = Product::count();
        $this->info("Found {$total} products to index.");

        if ($total === 0) {
            $this->info('No products to index.');
            return Command::SUCCESS;
        }

        $chunkSize = (int)$this->option('chunk');
        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $indexed = 0;
        $failed = 0;

        Product::with('category')
            ->chunk($chunkSize, function ($products) use ($elasticsearchService, $bar, &$indexed, &$failed) {
                foreach ($products as $product) {
                    try {
                        if ($elasticsearchService->indexProduct($product)) {
                            $indexed++;
                        } else {
                            $failed++;
                            $this->newLine();
                            $this->warn("Failed to index product ID: {$product->id}");
                        }
                    } catch (\Exception $e) {
                        $failed++;
                        $this->newLine();
                        $this->error("Error indexing product ID {$product->id}: {$e->getMessage()}");
                    }
                    $bar->advance();
                }
            });

        $bar->finish();
        $this->newLine(2);

        $this->info("Indexing completed!");
        $this->info("Successfully indexed: {$indexed}");
        if ($failed > 0) {
            $this->warn("Failed: {$failed}");
        }

        return Command::SUCCESS;
    }
}

