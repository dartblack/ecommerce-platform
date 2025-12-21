<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\DeductInventoryForOrderRequest;
use App\Models\InventoryMovement;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InventoryController extends Controller
{
    /**
     * Deduct inventory for an order
     */
    public function deductForOrder(DeductInventoryForOrderRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $orderNumber = $validated['order_number'];
        $items = $validated['items'];

        return $this->withIdempotency($request, function () use ($orderNumber, $items) {
            return $this->executeOperation('deduct inventory', function () use ($orderNumber, $items) {
                $results = DB::transaction(function () use ($orderNumber, $items) {
                    $results = [];

                    foreach ($items as $item) {
                        $product = Product::query()
                            ->lockForUpdate()
                            ->findOrFail($item['product_id']);

                        $quantity = (int)$item['quantity'];
                        $quantityBefore = (int)$product->stock_quantity;

                        if ($quantityBefore < $quantity) {
                            $message = "Insufficient stock for product {$product->name}. Available: {$quantityBefore}, Requested: {$quantity}";

                            Log::warning("Inventory deduction blocked for order {$orderNumber}: {$message}", [
                                'order_number' => $orderNumber,
                                'product_id' => $product->id,
                                'requested_quantity' => $quantity,
                                'available_quantity' => $quantityBefore,
                            ]);

                            throw new HttpResponseException(response()->json([
                                'success' => false,
                                'message' => $message,
                            ], 400));
                        }

                        $quantityAfter = $quantityBefore - $quantity;
                        $quantityChange = -$quantity;

                        $product->stock_quantity = $quantityAfter;

                        // Update stock status if needed
                        if ($quantityAfter <= 0) {
                            $product->stock_status = 'out_of_stock';
                        } elseif ($product->stock_status === 'out_of_stock' && $quantityAfter > 0) {
                            $product->stock_status = 'in_stock';
                        }

                        $product->save();

                        InventoryMovement::create([
                            'product_id' => $product->id,
                            'user_id' => null, // System operation
                            'type' => 'sale',
                            'quantity_change' => $quantityChange,
                            'quantity_before' => $quantityBefore,
                            'quantity_after' => $quantityAfter,
                            'reason' => 'Order sale',
                            'notes' => "Deducted for order: {$orderNumber}",
                            'reference_number' => $orderNumber,
                        ]);

                        $results[] = [
                            'product_id' => $product->id,
                            'product_name' => $product->name,
                            'quantity_deducted' => $quantity,
                            'quantity_before' => $quantityBefore,
                            'quantity_after' => $quantityAfter,
                        ];
                    }

                    return $results;
                });

                Log::info("Inventory deducted for order {$orderNumber}", [
                    'order_number' => $orderNumber,
                    'items' => $results,
                ]);

                return $this->successResponse('Inventory deducted successfully', [
                    'order_number' => $orderNumber,
                    'items' => $results,
                ]);
            }, $orderNumber, ['order_number' => $orderNumber, 'items' => $items]);
        });
    }

    private function executeOperation(
        string   $operation,
        callable $callback,
        ?string  $orderNumber = null,
        array    $context = []
    ): JsonResponse
    {
        try {
            return $callback();
        } catch (HttpResponseException $e) {
            // Return intentional HTTP JSON responses (e.g., insufficient stock) so idempotency can cache them.
            return $e->getResponse();
        } catch (\Exception $e) {
            return $this->errorResponse($e, $operation, $orderNumber, $context);
        }
    }

    private function successResponse(string $message, array $data = []): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], 200);
    }

    private function errorResponse(
        \Exception $e,
        string     $operation,
        ?string    $orderNumber = null,
        array      $context = []
    ): JsonResponse
    {
        $logContext = array_merge($context, [
            'exception' => $e,
            'order_number' => $orderNumber,
        ]);

        Log::error("Failed to {$operation}: " . $e->getMessage(), $logContext);

        return response()->json([
            'success' => false,
            'message' => 'Failed to ' . $operation . ': ' . $e->getMessage(),
        ], 500);
    }

    private function withIdempotency(Request $request, callable $callback): JsonResponse
    {
        $key = $request->header('Idempotency-Key');
        if (!$key) {
            return $callback();
        }

        $cacheKey = "idempotency:inventory:{$key}";
        $cached = Cache::get($cacheKey);

        if (is_array($cached) && array_key_exists('status', $cached) && array_key_exists('body', $cached)) {
            return response()->json($cached['body'], $cached['status']);
        }

        if ($cached) {
            return response()->json($cached);
        }

        $response = $callback();

        Cache::put($cacheKey, [
            'status' => $response->getStatusCode(),
            'body' => $response->getData(true),
        ], now()->addMinutes(10));

        return $response;
    }
}

