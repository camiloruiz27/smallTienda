<?php

namespace App\Notifications;

use App\Enums\PaymentMethod;
use App\Models\Sale;
use App\Support\Money;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewSaleNotification extends Notification
{
    private const MAX_LISTED_ITEMS = 10;

    public function __construct(public Sale $sale) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $sale = $this->sale->loadMissing('items', 'store');
        $store = $sale->store;
        $customer = $sale->customer_name ?: 'Un cliente';

        $mail = (new MailMessage)
            ->subject("Nueva compra en {$store->name}: ".Money::cop($sale->total))
            ->greeting('Nueva compra registrada')
            ->line("{$customer} registró una compra por **".Money::cop($sale->total)."** ({$sale->payment_method->label()}). Código: **{$sale->code}**.");

        foreach ($sale->items->take(self::MAX_LISTED_ITEMS) as $item) {
            $mail->line("{$item->quantity} × {$item->product_name} — ".Money::cop($item->subtotal));
        }

        $hidden = $sale->items->count() - self::MAX_LISTED_ITEMS;
        if ($hidden > 0) {
            $mail->line("…y {$hidden} producto(s) más.");
        }

        return $mail
            ->line($sale->payment_method === PaymentMethod::BreB
                ? 'Cuando veas el pago en tu banco, toca «Pago recibido» en la app.'
                : 'Pago en efectivo: confírmalo en la app cuando recibas el dinero.')
            ->action('Ver ventas', route('store.sales.index', $store))
            ->salutation("— {$store->name}");
    }
}
