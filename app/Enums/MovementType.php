<?php

namespace App\Enums;

enum MovementType: string
{
    case Sale = 'sale';
    case Restock = 'restock';
    case Adjustment = 'adjustment';
    case Waste = 'waste';
    case Count = 'count';
    case Void = 'void';

    public function label(): string
    {
        return match ($this) {
            self::Sale => 'Venta',
            self::Restock => 'Reposición',
            self::Adjustment => 'Ajuste',
            self::Waste => 'Merma',
            self::Count => 'Conteo',
            self::Void => 'Anulación',
        };
    }

    /**
     * Whether the stock delta must be strictly positive, strictly negative, or either sign.
     */
    public function expectedSign(): int
    {
        return match ($this) {
            self::Restock, self::Void => 1,
            self::Sale, self::Waste => -1,
            self::Adjustment, self::Count => 0,
        };
    }
}
