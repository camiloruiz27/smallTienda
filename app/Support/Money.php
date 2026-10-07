<?php

namespace App\Support;

class Money
{
    /**
     * Colombian pesos for emails, e.g. "$ 12.500". The frontend uses Intl; emails are built on the server.
     */
    public static function cop(int $amount): string
    {
        return '$ '.number_format($amount, 0, ',', '.');
    }
}
