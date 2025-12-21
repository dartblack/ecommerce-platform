<?php

namespace App\Models;

use App\Events\ProductCreated;
use App\Events\ProductDeleted;
use App\Events\ProductRestored;
use App\Events\ProductUpdated;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The event map for the model.
     *
     * @var array<string, class-string>
     */
    protected $dispatchesEvents = [
        'created' => ProductCreated::class,
        'updated' => ProductUpdated::class,
        'deleted' => ProductDeleted::class,
        'restored' => ProductRestored::class,
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'short_description',
        'sku',
        'price',
        'compare_at_price',
        'category_id',
        'stock_quantity',
        'stock_status',
        'is_active',
        'image',
        'sort_order',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'image_url',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'compare_at_price' => 'decimal:2',
            'stock_quantity' => 'integer',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Get the category that owns the product.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the inventory movements for the product.
     */
    public function inventoryMovements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class)->orderBy('created_at', 'desc');
    }

    /**
     * Get the order items for the product.
     */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Get the image URL attribute.
     *
     * @return string|null
     */
    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image) {
            return null;
        }

        if (filter_var($this->image, FILTER_VALIDATE_URL)) {
            return $this->image;
        }

        return Storage::disk('public')->url($this->image);
    }

    /**
     * Scope a query to only include active products.
     *
     * @param Builder $query
     * @return Builder
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include products in stock.
     *
     * @param Builder $query
     * @return Builder
     */
    public function scopeInStock(Builder $query): Builder
    {
        return $query->where('stock_status', 'in_stock');
    }

    public function scopeApplyTrashedFilter(Builder $q, ?string $state): Builder
    {
        return match ($state) {
            'only' => $q->onlyTrashed(),
            'with' => $q->withTrashed(),
            default => $q,
        };
    }

    public function scopeWithCategoryForTrashState(
        Builder $q,
        ?string $state
    ): Builder
    {
        return $q->with([
            'category' => fn($c) => in_array($state, ['only', 'with'], true)
                ? $c->withTrashed()
                : $c
        ]);
    }

    public function scopeSearch(Builder $q, ?string $term): Builder
    {
        if (!$term) {
            return $q;
        }

        $term = '%' . trim($term) . '%';

        return $q->where(function ($w) use ($term) {
            $w->where('name', 'ILIKE', $term)
                ->orWhere('sku', 'ILIKE', $term)
                ->orWhere('description', 'ILIKE', $term);
        });
    }

    public function scopeFilterCategory(Builder $q, ?int $categoryId): Builder
    {
        if (!$categoryId) {
            return $q;
        }

        return $q->where('category_id', $categoryId);
    }

    public function scopeFilterStockStatus(Builder $q, ?string $status): Builder
    {
        if (!$status) {
            return $q;
        }

        return $q->where('stock_status', $status);
    }

    public function scopeFilterActive(Builder $q, ?bool $isActive): Builder
    {
        if ($isActive === null) {
            return $q;
        }

        return $q->where('is_active', $isActive);
    }

    public function scopeApplySorting(
        Builder $q,
        string  $field,
        string  $direction,
        ?string $trashed
    ): Builder
    {
        $allowed = ['name', 'price', 'sort_order', 'created_at'];

        if (!in_array($field, $allowed, true)) {
            $field = 'sort_order';
        }

        $q->orderBy($field, $direction);

        if (in_array($trashed, ['only', 'with'], true)) {
            $q->orderByDesc('deleted_at');
        }

        return $q;
    }

    public static function generateUniqueSlug(
        string $value,
        ?int   $ignoreId = null
    ): string
    {
        $slug = Str::slug($value);
        $base = $slug;
        $i = 1;

        while (
        static::where('slug', $slug)
            ->when($ignoreId, fn($q) => $q->whereKeyNot($ignoreId))
            ->exists()
        ) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }

}

