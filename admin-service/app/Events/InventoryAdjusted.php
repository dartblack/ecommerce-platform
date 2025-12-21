<?php

namespace App\Events;

use App\Models\InventoryMovement;
use App\Models\Product;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InventoryAdjusted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Product           $product,
        public InventoryMovement $movement
    )
    {
        //
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'inventory.adjusted';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'product' => [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'sku' => $this->product->sku,
                'stock_quantity' => $this->product->stock_quantity,
                'stock_status' => $this->product->stock_status,
            ],
            'movement' => [
                'id' => $this->movement->id,
                'type' => $this->movement->type,
                'quantity_change' => $this->movement->quantity_change,
                'quantity_before' => $this->movement->quantity_before,
                'quantity_after' => $this->movement->quantity_after,
                'reason' => $this->movement->reason,
            ],
        ];
    }
}

