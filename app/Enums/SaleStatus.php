<?php

namespace App\Enums;

enum SaleStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Voided = 'voided';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Por confirmar',
            self::Confirmed => 'Confirmada',
            self::Voided => 'Anulada',
        };
    }
}
