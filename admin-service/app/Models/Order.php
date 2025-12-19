<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'order_number',
        'user_id',
        'status',
        'payment_status',
        'payment_method',
        'subtotal',
        'tax',
        'shipping',
        'discount',
        'total',
        'shipping_first_name',
        'shipping_last_name',
        'shipping_email',
        'shipping_phone',
        'shipping_address_line_1',
        'shipping_address_line_2',
        'shipping_city',
        'shipping_state',
        'shipping_postal_code',
        'shipping_country',
        'billing_first_name',
        'billing_last_name',
        'billing_email',
        'billing_phone',
        'billing_address_line_1',
        'billing_address_line_2',
        'billing_city',
        'billing_state',
        'billing_postal_code',
        'billing_country',
        'notes',
        'tracking_number',
        'shipped_at',
        'delivered_at',
        'cancelled_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'tax' => 'decimal:2',
            'shipping' => 'decimal:2',
            'discount' => 'decimal:2',
            'total' => 'decimal:2',
            'shipped_at' => 'datetime',
            'delivered_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($order) {
            if (empty($order->order_number)) {
                $order->order_number = static::generateOrderNumber();
            }
        });
    }

    /**
     * Generate a unique order number.
     *
     * @return string
     */
    protected static function generateOrderNumber(): string
    {
        do {
            $orderNumber = 'ORD-' . strtoupper(uniqid());
        } while (static::where('order_number', $orderNumber)->exists());

        return $orderNumber;
    }

    /**
     * Get the user that owns the order.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the order items for the order.
     */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Calculate the total from order items.
     *
     * @return void
     */
    public function calculateTotal(): void
    {
        $this->subtotal = $this->orderItems->sum('subtotal');
        $this->total = $this->subtotal + $this->tax + $this->shipping - $this->discount;
    }

    /**
     * Scope a query to only include orders with a specific status.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $status
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope a query to only include orders with a specific payment status.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $paymentStatus
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopePaymentStatus($query, string $paymentStatus)
    {
        return $query->where('payment_status', $paymentStatus);
    }

    /**
     * Check if the order can be cancelled.
     *
     * @return bool
     */
    public function canBeCancelled(): bool
    {
        return in_array($this->status, ['pending', 'processing']);
    }

    /**
     * Check if the order can be shipped.
     *
     * @return bool
     */
    public function canBeShipped(): bool
    {
        return $this->status === 'processing' && $this->payment_status === 'paid';
    }

    /**
     * Mark the order as shipped.
     *
     * @param string|null $trackingNumber
     * @return void
     */
    public function markAsShipped(?string $trackingNumber = null): void
    {
        if ($this->canBeShipped()) {
            $this->update([
                'status' => 'shipped',
                'tracking_number' => $trackingNumber,
                'shipped_at' => now(),
            ]);
        }
    }

    /**
     * Mark the order as delivered.
     *
     * @return void
     */
    public function markAsDelivered(): void
    {
        if ($this->status === 'shipped') {
            $this->update([
                'status' => 'delivered',
                'delivered_at' => now(),
            ]);
        }
    }

    /**
     * Cancel the order.
     *
     * @return void
     */
    public function cancel(): void
    {
        if ($this->canBeCancelled()) {
            $this->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
            ]);
        }
    }
}

