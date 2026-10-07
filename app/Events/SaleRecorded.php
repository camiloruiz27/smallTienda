<?php

namespace App\Events;

use App\Models\Product;
use App\Models\Sale;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Support\Collection;

class SaleRecorded
{
    use Dispatchable;

    /**
     * @param  Collection<int, Product>  $productsNowLow  Products of this sale whose stock just crossed their minimum.
     */
    public function __construct(public Sale $sale, public Collection $productsNowLow) {}
}
