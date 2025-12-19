<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'order_id',
        'product_id',
        'product_name',
        'product_sku',
        'quantity',
        'price',
        'subtotal',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'price' => 'decimal:2',
            'subtotal' => 'decimal:2',
        ];
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($orderItem) {
            // If product_id is provided, snapshot product details
            if ($orderItem->product_id && !$orderItem->product_name) {
                $product = Product::find($orderItem->product_id);
                if ($product) {
                    $orderItem->product_name = $product->name;
                    $orderItem->product_sku = $product->sku;
                    if (!$orderItem->price) {
                        $orderItem->price = $product->price;
                    }
                }
            }

            // Calculate subtotal if not set
            if (!$orderItem->subtotal && $orderItem->quantity && $orderItem->price) {
                $orderItem->subtotal = $orderItem->quantity * $orderItem->price;
            }
        });

        static::updating(function ($orderItem) {
            // Recalculate subtotal if quantity or price changed
            if ($orderItem->isDirty(['quantity', 'price'])) {
                $orderItem->subtotal = $orderItem->quantity * $orderItem->price;
            }
        });
    }

    /**
     * Get the order that owns the order item.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get the product that the order item references.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}

