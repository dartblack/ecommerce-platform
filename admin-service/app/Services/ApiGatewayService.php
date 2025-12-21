<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ApiGatewayService
{
    protected string $baseUrl;
    protected string $apiKey;

    public function __construct()
    {
        $this->baseUrl = config('services.api_gateway.url', 'http://api-gateway:3000');
        $this->apiKey = config('services.api_gateway.api_key');
    }

    /**
     * Update order status in api-gateway
     */
    public function updateOrderStatus(
        string $orderNumber,
        string $status,
        ?string $trackingNumber = null,
        ?string $paymentStatus = null
    ): bool {
        try {
            $payload = [
                'status' => $status,
            ];

            if ($trackingNumber) {
                $payload['trackingNumber'] = $trackingNumber;
            }

            if ($paymentStatus) {
                $payload['paymentStatus'] = $paymentStatus;
            }

            $response = Http::withHeaders([
                'X-API-Key' => $this->apiKey,
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])->put(
                "{$this->baseUrl}/api/internal/orders/{$orderNumber}/status",
                $payload
            );

            if ($response->successful()) {
                Log::info("Order status updated in api-gateway: {$orderNumber}", [
                    'status' => $status,
                    'response' => $response->json(),
                ]);
                return true;
            }

            Log::warning("Failed to update order status in api-gateway: {$orderNumber}", [
                'status' => $status,
                'status_code' => $response->status(),
                'response' => $response->body(),
            ]);

            return false;
        } catch (\Exception $e) {
            Log::error("Error updating order status in api-gateway: {$orderNumber}", [
                'status' => $status,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}

