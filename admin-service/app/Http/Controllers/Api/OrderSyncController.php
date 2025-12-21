<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\CancelOrderRequest;
use App\Http\Requests\Api\SyncOrderRequest;
use App\Http\Requests\Api\UpdateOrderStatusRequest;
use App\Services\OrderSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

class OrderSyncController extends Controller
{
    public function __construct(
        private readonly OrderSyncService $orderSyncService
    )
    {
    }

    /**
     * Sync order from api-gateway
     */
    public function sync(SyncOrderRequest $request): JsonResponse
    {
        return $this->withIdempotency($request, function () use ($request) {
            $validated = $request->validated();

            return $this->executeOperation('sync order', function () use ($validated) {
                $order = $this->orderSyncService->syncOrder($validated);
                return $this->successResponse('Order synced successfully', [
                    'order' => $order->load('orderItems'),
                ]);
            }, $validated['order_number'] ?? null);
        });
    }

    /**
     * Update order status
     */
    public function updateStatus(UpdateOrderStatusRequest $request, string $orderNumber): JsonResponse
    {
        return $this->withIdempotency($request, function () use ($request, $orderNumber) {
            $validated = $request->validated();

            return $this->executeOperation('update order status', function () use ($validated, $orderNumber) {
                $order = $this->orderSyncService->updateOrderStatus(
                    $orderNumber,
                    $validated['status'],
                    $validated['tracking_number'] ?? null,
                    $validated['payment_status'] ?? null
                );
                return $this->successResponse('Order status updated successfully', [
                    'order' => $order,
                ]);
            }, $orderNumber);
        });
    }

    /**
     * Cancel order
     */
    public function cancel(CancelOrderRequest $request, string $orderNumber): JsonResponse
    {
        $validated = $request->validated();

        return $this->executeOperation('cancel order', function () use ($validated, $orderNumber) {
            $order = $this->orderSyncService->cancelOrder($orderNumber, $validated['reason'] ?? null);

            return $this->successResponse('Order cancelled successfully', [
                'order' => $order,
            ]);
        }, $orderNumber);
    }

    /**
     * Execute an operation and normalize exception handling / error responses.
     */
    private function executeOperation(string $operation, callable $callback, ?string $orderNumber = null): JsonResponse
    {
        try {
            return $callback();
        } catch (\Exception $e) {
            return $this->errorResponse($e, $operation, $orderNumber);
        }
    }

    /**
     * Return success response
     */
    private function successResponse(string $message, array $data = []): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], 200);
    }

    /**
     * Handle exception and return an error response
     */
    private function errorResponse(\Exception $e, string $operation, ?string $orderNumber = null): JsonResponse
    {
        $context = ['exception' => $e];
        if ($orderNumber) {
            $context['order_number'] = $orderNumber;
        }

        Log::error("Failed to {$operation}: " . $e->getMessage(), $context);

        return response()->json([
            'success' => false,
            'message' => "Failed to {$operation}: " . $e->getMessage(),
        ], 500);
    }

    /**
     * Handle idempotency for request
     */
    private function withIdempotency(Request $request, callable $callback): JsonResponse
    {
        $key = $request->header('Idempotency-Key');
        if (!$key) {
            return $callback();
        }

        $cached = Cache::get("idempotency:order:{$key}");
        if ($cached) {
            return response()->json($cached);
        }

        $response = $callback();
        Cache::put("idempotency:order:{$key}", $response->getData(true), now()->addMinutes(10));

        return $response;
    }
}

