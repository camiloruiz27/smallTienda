<?php

use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\CountController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\InventoryController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\RestockController;
use App\Http\Controllers\Admin\SaleController;
use App\Http\Controllers\Admin\StoreController;
use App\Http\Controllers\Admin\StoreSettingsController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('tiendas', [StoreController::class, 'index'])->name('stores.index');
    Route::get('tiendas/crear', [StoreController::class, 'create'])->name('stores.create');
    Route::post('tiendas', [StoreController::class, 'store'])->name('stores.store');

    Route::middleware('store.member')
        ->prefix('tiendas/{store}')
        ->scopeBindings()
        ->name('store.')
        ->group(function () {
            Route::get('/', DashboardController::class)->name('dashboard');

            Route::resource('productos', ProductController::class)
                ->parameters(['productos' => 'product'])
                ->except('show')
                ->names('products');

            Route::resource('categorias', CategoryController::class)
                ->parameters(['categorias' => 'category'])
                ->only(['index', 'store', 'update', 'destroy'])
                ->names('categories');

            Route::get('inventario', [InventoryController::class, 'index'])->name('inventory.index');
            Route::get('inventario/movimientos', [InventoryController::class, 'movements'])->name('inventory.movements');
            Route::get('inventario/reponer', [RestockController::class, 'create'])->name('inventory.restock');
            Route::post('inventario/reponer', [RestockController::class, 'store'])->name('inventory.restock.store');
            Route::get('inventario/conteo', [CountController::class, 'create'])->name('inventory.count');
            Route::post('inventario/conteo', [CountController::class, 'store'])->name('inventory.count.store');
            Route::post('inventario/{product}/ajustar', [InventoryController::class, 'adjust'])->name('inventory.adjust');

            Route::get('ventas', [SaleController::class, 'index'])->name('sales.index');
            Route::post('ventas/{sale}/confirmar', [SaleController::class, 'confirm'])->name('sales.confirm');
            Route::post('ventas/{sale}/anular', [SaleController::class, 'void'])->name('sales.void');

            Route::get('reportes', [ReportController::class, 'index'])->name('reports');
            Route::get('reportes/exportar/{type}', [ReportController::class, 'export'])->name('reports.export');

            Route::get('configuracion', [StoreSettingsController::class, 'edit'])->name('settings.edit');
            Route::put('configuracion', [StoreSettingsController::class, 'update'])->name('settings.update');
            Route::delete('configuracion', [StoreSettingsController::class, 'destroy'])->name('settings.destroy');
            Route::post('configuracion/enlace', [StoreSettingsController::class, 'regenerateToken'])->name('settings.token');
        });
});
