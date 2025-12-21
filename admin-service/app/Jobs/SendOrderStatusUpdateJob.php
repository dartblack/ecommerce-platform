<?php

namespace App\Jobs;

use App\Services\ApiGatewayService;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class SendOrderStatusUpdateJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     *
     */
    public array $backoff = [10, 30, 60];

    /**
     * Create a new job instance.
     */
    public function __construct(
        public string  $orderNumber,
        public string  $status,
        public ?string $trackingNumber = null,
        public ?string $paymentStatus = null
    )
    {
    }

    /**
     * Execute the job.
     * @throws Exception
     */
    public function handle(ApiGatewayService $apiGatewayService): void
    {
        try {
            $success = $apiGatewayService->updateOrderStatus(
                $this->orderNumber,
                $this->status,
                $this->trackingNumber,
                $this->paymentStatus
            );

            if (!$success) {
                Log::warning("Order status update job failed for order: {$this->orderNumber}", [
                    'status' => $this->status,
                    'tracking_number' => $this->trackingNumber,
                    'payment_status' => $this->paymentStatus,
                ]);

                throw new RuntimeException("Failed to update order status in api-gateway");
            }

            Log::info("Order status update job completed successfully", [
                'order_number' => $this->orderNumber,
                'status' => $this->status,
            ]);
        } catch (Exception $e) {
            Log::error("Error in order status update job: {$e->getMessage()}", [
                'order_number' => $this->orderNumber,
                'status' => $this->status,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(Throwable $exception): void
    {
        Log::error("Order status update job failed permanently", [
            'order_number' => $this->orderNumber,
            'status' => $this->status,
            'tracking_number' => $this->trackingNumber,
            'payment_status' => $this->paymentStatus,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
        ]);
    }
}

