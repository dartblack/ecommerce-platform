<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryMovement extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'product_id',
        'user_id',
        'type',
        'quantity_change',
        'quantity_before',
        'quantity_after',
        'reason',
        'notes',
        'reference_number',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity_change' => 'integer',
            'quantity_before' => 'integer',
            'quantity_after' => 'integer',
        ];
    }

    /**
     * Get the product that owns the inventory movement.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the user who created the inventory movement.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the type label.
     *
     * @return string
     */
    public function getTypeLabelAttribute(): string
    {
        return match($this->type) {
            'adjustment' => 'Stock Adjustment',
            'sale' => 'Sale',
            'return' => 'Return',
            'damage' => 'Damage/Loss',
            'transfer_in' => 'Transfer In',
            'transfer_out' => 'Transfer Out',
            'initial_stock' => 'Initial Stock',
            default => ucfirst(str_replace('_', ' ', $this->type)),
        };
    }

    /**
     * Scope a query to only include movements of a specific type.
     *
     * @param Builder $query
     * @param string $type
     * @return Builder
     */
    public function scopeOfType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }
}

