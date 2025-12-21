<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderSyncService
{
    /**
     * Sync order from api-gateway
     */
    public function syncOrder(array $orderData): Order
    {
        return DB::transaction(function () use ($orderData) {
            // Check if order already exists by order_number
            $order = Order::where('order_number', $orderData['order_number'])->first();

            if ($order) {
                // Update existing order
                $order->update($this->mapOrderData($orderData));
            } else {
                // Create new order
                $order = Order::create($this->mapOrderData($orderData));
            }

            // Sync order items
            if (isset($orderData['order_items']) && is_array($orderData['order_items'])) {
                $this->syncOrderItems($order, $orderData['order_items']);
            }

            return $order->fresh(['orderItems']);
        });
    }

    /**
     * Update order status
     */
    public function updateOrderStatus(string $orderNumber, string $status, ?string $trackingNumber = null, ?string $paymentStatus = null): Order
    {
        $order = Order::where('order_number', $orderNumber)->firstOrFail();

        $updateData = ['status' => $status];

        if ($trackingNumber) {
            $updateData['tracking_number'] = $trackingNumber;
        }

        if ($paymentStatus) {
            $updateData['payment_status'] = $paymentStatus;
        }

        // Update timestamps based on status
        if ($status === 'shipped' && !$order->shipped_at) {
            $updateData['shipped_at'] = now();
        } elseif ($status === 'delivered' && !$order->delivered_at) {
            $updateData['delivered_at'] = now();
        }

        $order->update($updateData);

        return $order->fresh();
    }

    /**
     * Cancel order
     * @throws \Exception
     */
    public function cancelOrder(string $orderNumber, ?string $reason = null): Order
    {
        $order = Order::where('order_number', $orderNumber)->firstOrFail();

        if (!$order->canBeCancelled()) {
            throw new \Exception("Order {$orderNumber} cannot be cancelled in its current status");
        }

        $order->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        if ($reason) {
            // Store reason in notes if needed
            $order->update([
                'notes' => ($order->notes ? $order->notes . "\n\n" : '') . "Cancellation reason: {$reason}",
            ]);
        }

        return $order->fresh();
    }

    /**
     * Map order data from api-gateway format to admin-service format
     */
    private function mapOrderData(array $data): array
    {
        return [
            'order_number' => $data['order_number'],
            'user_id' => $data['user_id'] ?? null,
            'status' => $data['status'] ?? 'pending',
            'payment_status' => $data['payment_status'] ?? 'pending',
            'payment_method' => $data['payment_method'] ?? null,
            'subtotal' => $data['subtotal'] ?? 0,
            'tax' => $data['tax'] ?? 0,
            'shipping' => $data['shipping'] ?? 0,
            'discount' => $data['discount'] ?? 0,
            'total' => $data['total'] ?? 0,
            'shipping_first_name' => $data['shipping_first_name'] ?? null,
            'shipping_last_name' => $data['shipping_last_name'] ?? null,
            'shipping_email' => $data['shipping_email'] ?? null,
            'shipping_phone' => $data['shipping_phone'] ?? null,
            'shipping_address_line_1' => $data['shipping_address_line_1'] ?? null,
            'shipping_address_line_2' => $data['shipping_address_line_2'] ?? null,
            'shipping_city' => $data['shipping_city'] ?? null,
            'shipping_state' => $data['shipping_state'] ?? null,
            'shipping_postal_code' => $data['shipping_postal_code'] ?? null,
            'shipping_country' => $data['shipping_country'] ?? null,
            'billing_first_name' => $data['billing_first_name'] ?? null,
            'billing_last_name' => $data['billing_last_name'] ?? null,
            'billing_email' => $data['billing_email'] ?? null,
            'billing_phone' => $data['billing_phone'] ?? null,
            'billing_address_line_1' => $data['billing_address_line_1'] ?? null,
            'billing_address_line_2' => $data['billing_address_line_2'] ?? null,
            'billing_city' => $data['billing_city'] ?? null,
            'billing_state' => $data['billing_state'] ?? null,
            'billing_postal_code' => $data['billing_postal_code'] ?? null,
            'billing_country' => $data['billing_country'] ?? null,
            'notes' => $data['notes'] ?? null,
            'tracking_number' => $data['tracking_number'] ?? null,
            'shipped_at' => $data['shipped_at'] ?? null,
            'delivered_at' => $data['delivered_at'] ?? null,
            'cancelled_at' => $data['cancelled_at'] ?? null,
        ];
    }

    /**
     * Sync order items
     */
    private function syncOrderItems(Order $order, array $orderItems): void
    {
        // Delete existing items that are not in the new data
        $existingItemIds = collect($orderItems)->pluck('id')->filter()->toArray();
        if (!empty($existingItemIds)) {
            OrderItem::where('order_id', $order->id)
                ->whereNotIn('id', $existingItemIds)
                ->delete();
        } else {
            // If no IDs provided, delete all and recreate
            OrderItem::where('order_id', $order->id)->delete();
        }

        // Create or update order items
        foreach ($orderItems as $itemData) {
            if (isset($itemData['id'])) {
                // Update existing item
                $item = OrderItem::find($itemData['id']);
                if ($item && $item->order_id === $order->id) {
                    $item->update([
                        'product_id' => $itemData['product_id'],
                        'product_name' => $itemData['product_name'],
                        'product_sku' => $itemData['product_sku'],
                        'quantity' => $itemData['quantity'],
                        'price' => $itemData['price'],
                        'subtotal' => $itemData['subtotal'],
                    ]);
                }
            } else {
                // Create new item
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $itemData['product_id'],
                    'product_name' => $itemData['product_name'],
                    'product_sku' => $itemData['product_sku'],
                    'quantity' => $itemData['quantity'],
                    'price' => $itemData['price'],
                    'subtotal' => $itemData['subtotal'],
                ]);
            }
        }
    }
}

