import { useState } from 'react'
import QRScanner from '../components/QRScanner'
import { useNavigate } from 'react-router-dom'

export default function Scan() {
  const navigate = useNavigate()
  const [scanned, setScanned] = useState('')

  function handleScan(decodedText) {
    setScanned(decodedText)
    setTimeout(() => navigate(`/file/${decodedText}`), 1000)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Scan QR Code</h2>
      <p className="text-sm text-gray-500">Point the camera at a file's QR code sticker</p>

      {!scanned ? (
        <QRScanner onScan={handleScan} onClose={() => navigate('/dashboard')} />
      ) : (
        <div className="text-center py-8">
          <p className="text-green-600 font-semibold">✅ Scanned: {scanned}</p>
          <p className="text-gray-400 text-sm mt-1">Redirecting to file...</p>
        </div>
      )}
    </div>
  )
}