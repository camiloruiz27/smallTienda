import { Button } from '@/components/ui/button';
import { createBarcodeDetector, isBarcodeScanningSupported } from '@/lib/barcode';
import { ScanBarcode, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface BarcodeScanButtonProps {
    onDetect: (value: string) => void;
    label?: string;
}

/**
 * Opens a full-screen camera view and reports the first barcode it reads.
 * Renders nothing when the browser cannot scan, so the manual search always remains the fallback.
 */
export default function BarcodeScanButton({ onDetect, label = 'Escanear' }: BarcodeScanButtonProps) {
    const [supported] = useState(isBarcodeScanningSupported);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        let stream: MediaStream | null = null;
        let timer: number | undefined;
        let cancelled = false;
        const detector = createBarcodeDetector();

        const start = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
                if (cancelled || !videoRef.current) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }

                videoRef.current.srcObject = stream;
                await videoRef.current.play();

                timer = window.setInterval(async () => {
                    if (!videoRef.current || !detector) {
                        return;
                    }
                    try {
                        const codes = await detector.detect(videoRef.current);
                        if (codes.length > 0 && !cancelled) {
                            cancelled = true;
                            if ('vibrate' in navigator) {
                                navigator.vibrate(60);
                            }
                            setOpen(false);
                            onDetect(codes[0].rawValue);
                        }
                    } catch {
                        // A frame that cannot be decoded is simply skipped.
                    }
                }, 250);
            } catch {
                setError('No pudimos abrir la cámara. Revisa el permiso del navegador o busca el producto escribiendo su nombre.');
            }
        };

        setError(null);
        void start();

        return () => {
            cancelled = true;
            window.clearInterval(timer);
            stream?.getTracks().forEach((track) => track.stop());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    if (!supported) {
        return null;
    }

    return (
        <>
            <Button type="button" variant="outline" size="icon" onClick={() => setOpen(true)} aria-label={label} title={label}>
                <ScanBarcode />
            </Button>

            {open && (
                <div className="fixed inset-0 z-[70] flex flex-col bg-black" role="dialog" aria-modal="true" aria-label="Escáner de código de barras">
                    <div className="pt-safe flex items-center justify-between p-4 text-white">
                        <p className="font-medium">Apunta al código de barras</p>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="flex size-11 items-center justify-center rounded-full bg-white/15"
                            aria-label="Cerrar escáner"
                        >
                            <X className="size-6" />
                        </button>
                    </div>
                    <div className="relative flex-1">
                        <video ref={videoRef} className="absolute inset-0 size-full object-cover" playsInline muted />
                        <div className="absolute inset-x-8 top-1/2 h-40 -translate-y-1/2 rounded-2xl border-2 border-white/80" aria-hidden />
                    </div>
                    {error && <p className="pb-safe bg-destructive p-4 text-center text-sm text-white">{error}</p>}
                </div>
            )}
        </>
    );
}
