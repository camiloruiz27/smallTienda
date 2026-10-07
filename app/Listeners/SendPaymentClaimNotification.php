<?php

namespace App\Listeners;

use App\Events\PaymentClaimed;
use App\Notifications\PaymentClaimedNotification;
use Illuminate\Support\Facades\Notification;
use Throwable;

use function Illuminate\Support\defer;

class SendPaymentClaimNotification
{
    public function handle(PaymentClaimed $event): void
    {
        $sale = $event->sale;
        $store = $sale->store;

        if (! $store->notify_payment_claims) {
            return;
        }

        defer(function () use ($sale, $store): void {
            try {
                Notification::send($store->notifiableMembers(), new PaymentClaimedNotification($sale));
            } catch (Throwable $exception) {
                report($exception);
            }
        });
    }
}
