<?php

namespace Database\Seeders;

use App\Actions\CreateStoreWithOwner;
use App\Actions\RecordMovement;
use App\Actions\RecordSale;
use App\Enums\MovementType;
use App\Enums\PaymentMethod;
use App\Enums\SaleStatus;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Demo data: an owner (demo@smalltienda.test / password) with a small self-service store.
 */
class DemoStoreSeeder extends Seeder
{
    /**
     * @var array<string, list<array{0: string, 1: int, 2: int, 3: int, 4: int}>>
     */
    private const CATALOG = [
        'Bebidas' => [
            ['Agua 600 ml', 2000, 1200, 24, 6],
            ['Gaseosa 400 ml', 3000, 1900, 18, 6],
            ['Jugo de naranja', 3500, 2300, 12, 4],
            ['Té frío limón', 3200, 2000, 10, 4],
            ['Energizante', 6500, 4500, 8, 3],
            ['Agua con gas', 2500, 1500, 10, 4],
            ['Cerveza lata', 4500, 3000, 20, 6],
        ],
        'Snacks' => [
            ['Papas fritas pequeñas', 2500, 1500, 20, 5],
            ['Maní salado', 1500, 900, 15, 5],
            ['Galletas de chocolate', 2000, 1200, 16, 5],
            ['Galletas saladas', 1800, 1000, 14, 5],
            ['Barra de granola', 2800, 1700, 12, 4],
            ['Chocolatina', 2200, 1300, 25, 8],
            ['Chicles', 1000, 600, 30, 10],
            ['Gomitas', 2000, 1200, 12, 4],
        ],
        'Comida rápida' => [
            ['Sándwich de pollo', 8500, 5500, 6, 3],
            ['Empanada', 3000, 1800, 10, 4],
            ['Yogurt con cereal', 5500, 3600, 8, 3],
            ['Ensalada de frutas', 6000, 3800, 5, 3],
            ['Sopa instantánea', 3500, 2200, 9, 3],
        ],
        'Aseo y otros' => [
            ['Pañuelos faciales', 2500, 1500, 10, 3],
            ['Jabón de manos', 4500, 2800, 6, 2],
            ['Cargador de celular', 25000, 16000, 3, 1],
            ['Café en sobre', 1200, 700, 40, 10],
            ['Azúcar sobre', 300, 150, 60, 20],
            ['Vaso desechable', 500, 250, 50, 15],
            ['Toalla higiénica', 3000, 1800, 8, 3],
            ['Medicamento para el dolor', 2000, 1100, 14, 4],
        ],
    ];

    public function run(RecordMovement $recordMovement, RecordSale $recordSale): void
    {
        $owner = User::query()->firstOrCreate(
            ['email' => 'demo@smalltienda.test'],
            ['name' => 'Dueña Demo', 'password' => 'password', 'email_verified_at' => now()],
        );

        if ($owner->stores()->exists()) {
            return;
        }

        $store = app(CreateStoreWithOwner::class)->handle(
            $owner,
            'Tienda Piso 3',
            '@tiendapiso3',
        );

        $products = $this->createCatalog($store, $owner, $recordMovement);
        $this->createSampleSales($store, $products, $recordSale);
    }

    /**
     * @return list<Product>
     */
    private function createCatalog(Store $store, User $owner, RecordMovement $recordMovement): array
    {
        $products = [];
        $barcode = 7701000000000;

        foreach (self::CATALOG as $categoryName => $items) {
            $category = $store->categories()->create([
                'name' => $categoryName,
                'sort_order' => count($store->categories) + 1,
            ]);
            $store->unsetRelation('categories');

            foreach ($items as [$name, $price, $cost, $stock, $minStock]) {
                $product = $store->products()->create([
                    'category_id' => $category->id,
                    'name' => $name,
                    'barcode' => (string) ++$barcode,
                    'price' => $price,
                    'cost' => $cost,
                    'stock' => 0,
                    'min_stock' => $minStock,
                ]);

                $recordMovement->handle($product, MovementType::Restock, $stock, $owner, 'Stock inicial', $cost);
                $products[] = $product->refresh();
            }
        }

        return $products;
    }

    /**
     * @param  list<Product>  $products
     */
    private function createSampleSales(Store $store, array $products, RecordSale $recordSale): void
    {
        $customers = ['Laura', 'Camilo', 'Marta', null, 'Andrés'];

        foreach ($customers as $index => $customer) {
            $picked = collect($products)->shuffle()->take(random_int(1, 3));

            $sale = $recordSale->handle(
                $store,
                $picked->map(fn (Product $product): array => ['product_id' => $product->id, 'quantity' => random_int(1, 2)])->all(),
                collect(PaymentMethod::cases())->random(),
                (string) Str::uuid(),
                $customer,
            );

            if ($index < 2) {
                $sale->update(['status' => SaleStatus::Confirmed, 'confirmed_at' => now()]);
            }
        }
    }
}
