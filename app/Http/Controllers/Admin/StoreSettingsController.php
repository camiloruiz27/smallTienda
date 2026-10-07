<?php

namespace App\Http\Controllers\Admin;

use App\Actions\CreateStoreWithOwner;
use App\Enums\PaymentMethod;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSettingsRequest;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class StoreSettingsController extends Controller
{
    public function edit(Request $request, Store $store): Response
    {
        return Inertia::render('store/settings', [
            'settings' => $store->only([
                'name', 'payment_key', 'payment_instructions', 'accepted_payment_methods',
                'notify_new_sales', 'notify_payment_claims', 'notify_low_stock',
            ]),
            'paymentQrUrl' => $store->paymentQrUrl(),
            'paymentMethods' => PaymentMethod::options(),
            'shopUrl' => route('shop.show', $store->public_token),
            'canEdit' => $store->isOwnedBy($request->user()),
        ]);
    }

    public function update(StoreSettingsRequest $request, Store $store): RedirectResponse
    {
        $this->ensureOwner($request, $store);

        $data = $request->safe()->except(['payment_qr', 'remove_payment_qr']);

        if ($request->hasFile('payment_qr')) {
            $this->deletePaymentQr($store);
            $data['payment_qr_path'] = $request->file('payment_qr')->store("stores/{$store->id}", 'public');
        } elseif ($request->boolean('remove_payment_qr')) {
            $this->deletePaymentQr($store);
            $data['payment_qr_path'] = null;
        }

        $store->update($data);

        return back()->with('success', 'Configuración guardada.');
    }

    /**
     * Rotates the public token so printed QR codes stop working.
     */
    public function regenerateToken(Request $request, Store $store): RedirectResponse
    {
        $this->ensureOwner($request, $store);

        $store->update(['public_token' => CreateStoreWithOwner::newPublicToken()]);

        return back()->with('success', 'Nuevo enlace generado. Imprime de nuevo el QR: el anterior ya no funciona.');
    }

    /**
     * Permanently deletes the store with all its products, sales and movements. Owner only, password required.
     */
    public function destroy(Request $request, Store $store): RedirectResponse
    {
        $this->ensureOwner($request, $store);

        $request->validate(['password' => ['required', 'current_password']]);

        $this->deletePaymentQr($store);
        $store->delete();

        return to_route('dashboard')->with('success', 'Tienda eliminada.');
    }

    private function deletePaymentQr(Store $store): void
    {
        if ($store->payment_qr_path) {
            Storage::disk('public')->delete($store->payment_qr_path);
        }
    }

    private function ensureOwner(Request $request, Store $store): void
    {
        abort_unless($store->isOwnedBy($request->user()), 403);
    }
}
