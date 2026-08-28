import { useCallback, useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export default function QRScanner({ onScan, onClose }) {
  const scannerRef = useRef(null)
  const onScanRef = useRef(onScan)
  const [error, setError] = useState('')

  useEffect(() => { onScanRef.current = onScan }, [onScan])

  const stopScanner = useCallback(async () => {
    const qr = scannerRef.current
    if (!qr) return
    try {
      if (qr.isScanning) await qr.stop()
      qr.clear()
    } catch {
      // already stopped
    }
  }, [])

  useEffect(() => {
    const qr = new Html5Qrcode('qr-reader')
    scannerRef.current = qr
    let cancelled = false

    qr.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      decodedText => {
        if (cancelled) return
        stopScanner().catch(() => {})
        onScanRef.current?.(decodedText)
      },
      () => {}
    ).catch(() => {
      if (!cancelled) setError('Camera access denied or unavailable')
    })

    return () => {
      cancelled = true
      stopScanner().catch(() => {})
    }
  }, [stopScanner])

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex justify-between items-center px-4 py-3 bg-gray-900 text-white">
        <span className="font-semibold">Scan QR Code</span>
        <button onClick={() => { stopScanner().finally(() => onClose?.()) }} className="text-xl">✕</button>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div id="qr-reader" className="w-full max-w-sm"></div>
      </div>
      {error && <p className="text-red-400 text-center pb-4">{error}</p>}
      <p className="text-gray-400 text-center text-sm pb-4">Point camera at file QR code</p>
    </div>
  )
}