import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export default function QRScanner({ onScan, onClose }) {
  const scannerRef = useRef(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const qr = new Html5Qrcode('qr-reader')
    scannerRef.current = qr

    qr.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      decodedText => {
        qr.stop().catch(() => {})
        onScan?.(decodedText)
      },
      () => {}
    ).catch(err => setError('Camera access denied or unavailable'))

    return () => {
      qr.stop().catch(() => {})
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex justify-between items-center px-4 py-3 bg-gray-900 text-white">
        <span className="font-semibold">Scan QR Code</span>
        <button onClick={onClose} className="text-xl">✕</button>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div id="qr-reader" className="w-full max-w-sm"></div>
      </div>
      {error && <p className="text-red-400 text-center pb-4">{error}</p>}
      <p className="text-gray-400 text-center text-sm pb-4">Point camera at file QR code</p>
    </div>
  )
}