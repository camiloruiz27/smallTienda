<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Cash = 'cash';
    case BreB = 'breb';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Efectivo',
            self::BreB => 'Bre-B',
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $method): array => ['value' => $method->value, 'label' => $method->label()],
            self::cases(),
        );
    }
}
