<?php

namespace App\Notifications;

use App\Models\Product;
use App\Models\Store;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Collection;

class LowStockNotification extends Notification
{
    /**
     * @param  Collection<int, Product>  $products  Products that just dropped to or below their minimum stock.
     */
    public function __construct(public Store $store, public Collection $products) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $count = $this->products->count();

        $mail = (new MailMessage)
            ->subject("Stock bajo en {$this->store->name}: {$count} ".($count === 1 ? 'producto' : 'productos'))
            ->greeting('Es hora de reponer')
            ->line($count === 1 ? 'Este producto llegó a su stock mínimo:' : 'Estos productos llegaron a su stock mínimo:');

        foreach ($this->products as $product) {
            $detail = $product->stock < 0
                ? "{$product->stock} (conteo negativo: revisa el inventario)"
                : "quedan {$product->stock}, avisar en {$product->min_stock}";

            $mail->line("{$product->name} — {$detail}");
        }

        return $mail
            ->action('Ver inventario', route('store.inventory.index', ['store' => $this->store, 'filter' => 'low']))
            ->salutation("— {$this->store->name}");
    }
}
