import BottomSheet from '@/components/bottom-sheet';
import FormField from '@/components/form-field';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import StoreLayout from '@/layouts/store-layout';
import { copyText } from '@/lib/clipboard';
import { compressImage } from '@/lib/image';
import { cn } from '@/lib/utils';
import { type PaymentMethodOption, type SharedData } from '@/types';
import { router, useForm, usePage } from '@inertiajs/react';
import { Camera, Check, Copy, LoaderCircle, Nfc, Printer, RefreshCw, Share2, Trash2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ChangeEvent, FormEventHandler, useRef, useState } from 'react';

interface SettingsProps {
    settings: { name: string; payment_key: string | null; payment_instructions: string | null; accepted_payment_methods: string[] };
    paymentQrUrl: string | null;
    paymentMethods: PaymentMethodOption[];
    shopUrl: string;
    canEdit: boolean;
}

export default function Settings({ settings, paymentQrUrl, paymentMethods, shopUrl, canEdit }: SettingsProps) {
    const store = usePage<SharedData>().props.currentStore!;
    const [copied, setCopied] = useState(false);
    const [confirmingRotate, setConfirmingRotate] = useState(false);
    const [rotating, setRotating] = useState(false);
    const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

    const qrInput = useRef<HTMLInputElement>(null);
    const [qrPreview, setQrPreview] = useState<string | null>(paymentQrUrl);

    const { data, setData, post, processing, errors, transform } = useForm<{
        name: string;
        payment_key: string;
        payment_qr: File | null;
        remove_payment_qr: boolean;
        payment_instructions: string;
        accepted_payment_methods: string[];
    }>({
        name: settings.name,
        payment_key: settings.payment_key ?? '',
        payment_qr: null,
        remove_payment_qr: false,
        payment_instructions: settings.payment_instructions ?? '',
        accepted_payment_methods: settings.accepted_payment_methods,
    });

    const handleQr = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        // Keep the QR sharp enough to scan: a larger size and higher quality than product photos.
        const prepared = await compressImage(file, 1200, 0.92);
        setData((current) => ({ ...current, payment_qr: prepared, remove_payment_qr: false }));
        setQrPreview(URL.createObjectURL(prepared));
    };

    const removeQr = () => {
        setData((current) => ({ ...current, payment_qr: null, remove_payment_qr: true }));
        setQrPreview(null);
        if (qrInput.current) {
            qrInput.current.value = '';
        }
    };

    const deleteForm = useForm({ password: '' });
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    const deleteStore: FormEventHandler = (event) => {
        event.preventDefault();
        deleteForm.delete(route('store.settings.destroy', store.id), { onFinish: () => deleteForm.reset() });
    };

    const toggleMethod = (value: string) => {
        setData(
            'accepted_payment_methods',
            data.accepted_payment_methods.includes(value)
                ? data.accepted_payment_methods.filter((method) => method !== value)
                : [...data.accepted_payment_methods, value],
        );
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        // PUT with a file needs method spoofing: PHP only parses multipart bodies on POST.
        transform((values) => ({ ...values, _method: 'put' }));
        post(route('store.settings.update', store.id), { forceFormData: true, preserveScroll: true });
    };

    const copyLink = async () => {
        if (await copyText(shopUrl)) {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } else {
            window.prompt('Copia este enlace:', shopUrl);
        }
    };

    const rotate = () => {
        setRotating(true);
        router.post(
            route('store.settings.token', store.id),
            {},
            { preserveScroll: true, onSuccess: () => setConfirmingRotate(false), onFinish: () => setRotating(false) },
        );
    };

    return (
        <StoreLayout title="Configuración y QR" back={route('store.dashboard', store.id)} hideNav>
            <div className="grid gap-8 p-4 pb-10 print:hidden">
                <section aria-labelledby="qr-title" className="grid gap-4">
                    <div>
                        <h2 id="qr-title" className="text-lg font-semibold">
                            QR de tu tienda
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            Pégalo en la tienda. Tus clientes lo escanean, eligen lo que toman y registran su compra.
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-3 rounded-3xl border p-6">
                        <div className="rounded-2xl bg-white p-4">
                            <QRCodeSVG value={shopUrl} size={200} level="M" marginSize={0} title={`QR de ${settings.name}`} />
                        </div>
                        <p className="text-muted-foreground max-w-full text-center text-xs break-all">{shopUrl}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="lg" onClick={copyLink}>
                            {copied ? <Check /> : <Copy />} {copied ? 'Copiado' : 'Copiar enlace'}
                        </Button>
                        {canShare ? (
                            <Button variant="outline" size="lg" onClick={() => navigator.share({ title: settings.name, url: shopUrl })}>
                                <Share2 /> Compartir
                            </Button>
                        ) : (
                            <Button variant="outline" size="lg" asChild>
                                <a href={shopUrl} target="_blank" rel="noreferrer">
                                    Abrir
                                </a>
                            </Button>
                        )}
                    </div>
                    <Button size="lg" onClick={() => window.print()}>
                        <Printer /> Imprimir cartel con QR
                    </Button>

                    <div className="bg-muted/50 grid gap-1.5 rounded-2xl p-4 text-sm">
                        <h3 className="flex items-center gap-2 font-semibold">
                            <Nfc className="size-4" /> ¿Tarjeta o sticker NFC?
                        </h3>
                        <p className="text-muted-foreground">
                            Usa exactamente el mismo enlace de arriba: con una app como “NFC Tools” elige{' '}
                            <strong>Escribir → Agregar un registro → URL</strong>, pega el enlace y guarda. Al terminar, bloquea la tarjeta para que
                            nadie la sobrescriba.
                        </p>
                    </div>
                </section>

                <form onSubmit={submit} className="grid gap-5" aria-labelledby="settings-title">
                    <h2 id="settings-title" className="text-lg font-semibold">
                        Datos de la tienda
                    </h2>

                    <FormField
                        label="Nombre"
                        value={data.name}
                        onChange={(event) => setData('name', event.target.value)}
                        error={errors.name}
                        disabled={!canEdit}
                        required
                    />

                    <FormField
                        label="Tu llave Bre-B"
                        value={data.payment_key}
                        onChange={(event) => setData('payment_key', event.target.value)}
                        error={errors.payment_key}
                        placeholder="Celular, correo o @llave"
                        autoComplete="off"
                        disabled={!canEdit}
                        hint="Se le muestra al cliente con un botón para copiarla."
                    />

                    <div className="grid gap-2">
                        <Label>QR de pago Bre-B</Label>
                        <div className="flex items-center gap-4">
                            <div className="bg-muted flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border">
                                {qrPreview ? (
                                    <img src={qrPreview} alt="QR de pago" className="size-full bg-white object-contain" />
                                ) : (
                                    <Camera className="text-muted-foreground size-7" />
                                )}
                            </div>
                            <input ref={qrInput} type="file" accept="image/*" className="sr-only" onChange={handleQr} tabIndex={-1} aria-hidden />
                            {canEdit && (
                                <div className="grid gap-2">
                                    <Button type="button" variant="secondary" size="sm" onClick={() => qrInput.current?.click()}>
                                        {qrPreview ? 'Cambiar QR' : 'Subir QR'}
                                    </Button>
                                    {qrPreview && (
                                        <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={removeQr}>
                                            <Trash2 /> Quitar
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                        <p className="text-muted-foreground text-xs">
                            Sube la captura o imagen del QR que te da tu banco. Los clientes lo ven al terminar su compra.
                        </p>
                        <InputError message={errors.payment_qr} />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="payment_instructions">Instrucciones para pagar en efectivo (opcional)</Label>
                        <Textarea
                            id="payment_instructions"
                            value={data.payment_instructions}
                            onChange={(event) => setData('payment_instructions', event.target.value)}
                            placeholder="Ej. Deja el efectivo en la caja de la entrada."
                            disabled={!canEdit}
                        />
                        <InputError message={errors.payment_instructions} />
                    </div>

                    <fieldset className="grid gap-2" disabled={!canEdit}>
                        <legend className="mb-1 text-sm font-medium">Métodos de pago que aceptas</legend>
                        {paymentMethods.map((method) => {
                            const checked = data.accepted_payment_methods.includes(method.value);

                            return (
                                <label
                                    key={method.value}
                                    className={cn(
                                        'flex min-h-14 items-center justify-between gap-3 rounded-xl border px-4',
                                        checked && 'border-primary bg-primary/5',
                                    )}
                                >
                                    <span className="font-medium">{method.label}</span>
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleMethod(method.value)}
                                        className="accent-primary size-6"
                                    />
                                </label>
                            );
                        })}
                        <InputError message={errors.accepted_payment_methods} />
                    </fieldset>

                    {canEdit ? (
                        <Button type="submit" size="lg" disabled={processing}>
                            {processing && <LoaderCircle className="animate-spin" />}
                            Guardar cambios
                        </Button>
                    ) : (
                        <p className="bg-muted text-muted-foreground rounded-xl p-3 text-sm">Solo el dueño puede cambiar esta configuración.</p>
                    )}
                </form>

                {canEdit && (
                    <section aria-labelledby="rotate-title" className="grid gap-3 rounded-2xl border p-4">
                        <h2 id="rotate-title" className="font-semibold">
                            ¿Alguien abusa del enlace?
                        </h2>
                        <p className="text-muted-foreground text-sm">
                            Genera un enlace nuevo. El QR impreso anterior dejará de funcionar y tendrás que imprimir el nuevo.
                        </p>
                        <Button variant="outline" onClick={() => setConfirmingRotate(true)}>
                            <RefreshCw /> Generar enlace nuevo
                        </Button>
                    </section>
                )}

                {canEdit && (
                    <section aria-labelledby="delete-title" className="bg-destructive/10 grid gap-3 rounded-2xl p-4">
                        <h2 id="delete-title" className="text-destructive font-semibold">
                            Eliminar tienda
                        </h2>
                        <p className="text-destructive text-sm">Se borran para siempre sus productos, ventas e historial de inventario.</p>
                        <Button variant="destructive" onClick={() => setConfirmingDelete(true)}>
                            <Trash2 /> Eliminar esta tienda
                        </Button>
                    </section>
                )}
            </div>

            <div className="hidden min-h-svh flex-col items-center justify-center gap-8 p-10 text-center print:flex">
                <h1 className="text-5xl font-bold">{settings.name}</h1>
                <p className="text-2xl">Escanea, toma lo que quieras y registra tu compra</p>
                <QRCodeSVG value={shopUrl} size={360} level="M" marginSize={0} />
                <ol className="text-left text-xl">
                    <li>1. Escanea el código con la cámara de tu celular</li>
                    <li>2. Elige los productos que tomaste</li>
                    <li>3. Confirma y paga como prefieras</li>
                </ol>
            </div>

            <BottomSheet
                open={confirmingDelete}
                onOpenChange={(isOpen) => {
                    setConfirmingDelete(isOpen);
                    if (!isOpen) {
                        deleteForm.reset();
                        deleteForm.clearErrors();
                    }
                }}
                title="¿Eliminar la tienda?"
                description="Escribe tu contraseña para confirmar. No se puede deshacer."
            >
                <form onSubmit={deleteStore} className="grid gap-4">
                    <FormField
                        label="Contraseña"
                        type="password"
                        value={deleteForm.data.password}
                        onChange={(event) => deleteForm.setData('password', event.target.value)}
                        error={deleteForm.errors.password}
                        autoComplete="current-password"
                    />
                    <Button type="submit" variant="destructive" size="lg" disabled={deleteForm.processing}>
                        {deleteForm.processing && <LoaderCircle className="animate-spin" />}
                        Eliminar definitivamente
                    </Button>
                    <Button type="button" variant="outline" size="lg" onClick={() => setConfirmingDelete(false)}>
                        Cancelar
                    </Button>
                </form>
            </BottomSheet>

            <BottomSheet
                open={confirmingRotate}
                onOpenChange={setConfirmingRotate}
                title="¿Generar un enlace nuevo?"
                description="El QR impreso actual dejará de funcionar de inmediato."
            >
                <div className="grid gap-2">
                    <Button variant="destructive" size="lg" onClick={rotate} disabled={rotating}>
                        {rotating && <LoaderCircle className="animate-spin" />}
                        Sí, generar enlace nuevo
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => setConfirmingRotate(false)}>
                        Cancelar
                    </Button>
                </div>
            </BottomSheet>
        </StoreLayout>
    );
}
