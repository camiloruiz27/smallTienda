<?php

namespace App\Notifications;

use App\Models\Sale;
use App\Support\Money;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentClaimedNotification extends Notification
{
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
        $sale = $this->sale->loadMissing('store');
        $store = $sale->store;
        $customer = $sale->customer_name ?: 'Un cliente';

        return (new MailMessage)
            ->subject("{$customer} dice que ya pagó ".Money::cop($sale->total))
            ->greeting('Un cliente avisó que ya pagó')
            ->line("{$customer} tocó «Ya pagué» en su compra **{$sale->code}** por **".Money::cop($sale->total)."** ({$sale->payment_method->label()}).")
            ->line('Esto no confirma el pago: revisa tu banco y, cuando lo veas, toca «Pago recibido» en la app.')
            ->action('Revisar y confirmar', route('store.sales.index', $store))
            ->salutation("— {$store->name}");
    }
}
