<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Throwable;

use function Illuminate\Support\defer;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * @return BelongsToMany<Store, $this>
     */
    public function stores(): BelongsToMany
    {
        return $this->belongsToMany(Store::class)->withPivot('role')->withTimestamps();
    }

    /**
     * Sends the verification email after the response has been delivered. A mail server problem is logged
     * instead of breaking registration or the "resend" button.
     */
    public function sendEmailVerificationNotification(): void
    {
        defer(function (): void {
            try {
                $this->notify(new VerifyEmail);
            } catch (Throwable $exception) {
                report($exception);
            }
        });
    }

    /**
     * Same approach as the verification email: never let SMTP problems break the "forgot password" page.
     *
     * @param  string  $token
     */
    public function sendPasswordResetNotification($token): void
    {
        defer(function () use ($token): void {
            try {
                $this->notify(new ResetPassword($token));
            } catch (Throwable $exception) {
                report($exception);
            }
        });
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
