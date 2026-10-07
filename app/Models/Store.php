<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Enums\StoreRole;
use Database\Factories\StoreFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Store extends Model
{
    /** @use HasFactory<StoreFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'public_token',
        'payment_key',
        'payment_qr_path',
        'payment_instructions',
        'accepted_payment_methods',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'accepted_payment_methods' => 'array',
        ];
    }

    /**
     * @return BelongsToMany<User, $this>
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class)->withPivot('role')->withTimestamps();
    }

    /**
     * @return HasMany<Category, $this>
     */
    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    /**
     * @return HasMany<Product, $this>
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /**
     * @return HasMany<Sale, $this>
     */
    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    /**
     * @return HasMany<InventoryMovement, $this>
     */
    public function movements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class);
    }

    /**
     * Public URL of the owner's Bre-B payment QR, if one was uploaded.
     */
    public function paymentQrUrl(): ?string
    {
        return $this->payment_qr_path ? Storage::disk('public')->url($this->payment_qr_path) : null;
    }

    public function isOwnedBy(User $user): bool
    {
        return $this->members()
            ->wherePivot('user_id', $user->getKey())
            ->wherePivot('role', StoreRole::Owner->value)
            ->exists();
    }

    /**
     * Payment methods the store has enabled, as enum cases.
     *
     * @return list<PaymentMethod>
     */
    public function acceptedPaymentMethods(): array
    {
        return array_values(array_filter(array_map(
            fn (string $value): ?PaymentMethod => PaymentMethod::tryFrom($value),
            $this->accepted_payment_methods ?? [],
        )));
    }
}
