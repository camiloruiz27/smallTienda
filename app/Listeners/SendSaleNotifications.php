<?php

namespace App\Listeners;

use App\Events\SaleRecorded;
use App\Notifications\LowStockNotification;
use App\Notifications\NewSaleNotification;
use Illuminate\Support\Facades\Notification;
use Throwable;

use function Illuminate\Support\defer;

class SendSaleNotifications
{
    /**
     * Emails go out after the customer already got their response (no queue worker needed on shared hosting),
     * and a mail failure is only logged so it can never break a purchase.
     */
    public function handle(SaleRecorded $event): void
    {
        $sale = $event->sale;
        $store = $sale->store;

        if (! $store->notify_new_sales && ! ($store->notify_low_stock && $event->productsNowLow->isNotEmpty())) {
            return;
        }

        defer(function () use ($event, $sale, $store): void {
            try {
                $members = $store->notifiableMembers();

                if ($store->notify_new_sales) {
                    Notification::send($members, new NewSaleNotification($sale));
                }

                if ($store->notify_low_stock && $event->productsNowLow->isNotEmpty()) {
                    Notification::send($members, new LowStockNotification($store, $event->productsNowLow));
                }
            } catch (Throwable $exception) {
                report($exception);
            }
        });
    }
}
