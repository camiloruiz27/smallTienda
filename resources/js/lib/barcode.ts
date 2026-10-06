interface DetectedBarcode {
    rawValue: string;
}

interface BarcodeDetectorLike {
    detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

/**
 * The native BarcodeDetector API (Chrome/Android, Safari 17+) is used so no scanning library is needed.
 * It also requires a secure context (HTTPS or localhost), otherwise the camera is unavailable.
 */
export function createBarcodeDetector(): BarcodeDetectorLike | null {
    const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;

    if (!Detector || !window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        return null;
    }

    try {
        return new Detector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'] });
    } catch {
        return new Detector();
    }
}

export function isBarcodeScanningSupported(): boolean {
    return createBarcodeDetector() !== null;
}
