"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { QrCode, CheckCircle2, ShieldCheck, AlertCircle, Package, MapPin, Phone, Search, Camera, X, Globe } from 'lucide-react';
import jsQR from 'jsqr';

function DeliveryContent() {
  const { lang, changeLanguage, t } = useLanguage();
  const searchParams = useSearchParams();
  const urlToken = searchParams.get('token');

  const { token, user } = useAuth();
  const [qrInput, setQrInput] = useState(urlToken);
  const [scannedOrder, setScannedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const animationFrameId = React.useRef(null);

  useEffect(() => {
    if (urlToken) {
      setQrInput(urlToken);
      verifyToken(urlToken);
    }
  }, [urlToken]);

  const verifyToken = async (targetToken) => {
    if (!targetToken || !targetToken.trim()) return;

    setLoading(true);
    setMessage(null);
    setScannedOrder(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/invoices/scan/${encodeURIComponent(targetToken.trim())}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });

      const data = await res.json();

      if (data.success) {
        setScannedOrder(data.data);
        setMessage({ error: false, text: data.message });
      } else {
        setMessage({ error: true, text: data.message || 'Invoice QR token or Unique QR ID is invalid' });
      }
    } catch (err) {
      setMessage({ error: true, text: 'Could not connect to verification server' });
    } finally {
      setLoading(false);
    }
  };

  const handleScanOrVerify = (e) => {
    e.preventDefault();
    verifyToken(qrInput);
  };

  // Start Camera Stream
  const startCameraScanner = async () => {
    setShowCamera(true);
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        requestAnimationFrame(tickScan);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access device camera. Please check camera permissions.');
    }
  };

  const stopCameraScanner = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const tickScan = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        const decodedText = code.data;
        let tokenToVerify = decodedText;

        // Extract token parameter if scanned code is a full URL
        if (decodedText.includes('token=')) {
          try {
            const urlObj = new URL(decodedText);
            tokenToVerify = urlObj.searchParams.get('token') || decodedText;
          } catch (e) {
            const match = decodedText.match(/token=([^&]+)/);
            if (match) tokenToVerify = match[1];
          }
        }

        setQrInput(tokenToVerify);
        stopCameraScanner();
        verifyToken(tokenToVerify);
        return;
      }
    }
    animationFrameId.current = requestAnimationFrame(tickScan);
  };

  const handleMarkDelivered = async () => {
    if (!scannedOrder || !token) return;

    setLoading(true);
    setMessage(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/admin/orders/${scannedOrder.orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderStatus: 'DELIVERED' }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ error: false, text: data.message });
        setScannedOrder((prev) => ({ ...prev, orderStatus: 'DELIVERED', paymentStatus: 'COMPLETED' }));
      } else {
        setMessage({ error: true, text: data.message || 'Failed to update order status' });
      }
    } catch (err) {
      setMessage({ error: true, text: 'Failed to complete delivery verification' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8 pb-16">

      {/* Header */}
      <div className="bg-amber-500 text-slate-900 p-6 rounded-3xl space-y-2 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-6 h-6" />
            <span className="font-extrabold text-xs uppercase tracking-wider bg-slate-900 text-amber-400 px-2.5 py-0.5 rounded">
              {t('deliveryConsole')}
            </span>
          </div>

          <button
            onClick={() => changeLanguage(lang === 'en' ? 'hi' : 'en')}
            className="inline-flex items-center gap-1.5 bg-slate-900 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-sm hover:bg-slate-800 transition"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'en' ? 'हिंदी' : 'English'}</span>
          </button>
        </div>

        <h1 className="text-2xl font-black tracking-tight">{t('deliveryVerification')}</h1>
        <p className="text-xs font-semibold text-slate-800">
          {lang === 'hi'
            ? 'डिलीवरी एजेंट ग्राहक के प्रिंटेड या डिजिटल बिल का क्यूआर कोड स्कैन करके या क्यूआर आईडी डालकर डिलीवरी सत्यापित कर सकते हैं।'
            : "Authorized delivery agents scan the digital QR code on customer's printed or digital bill or enter the Unique QR ID manually to inspect items & verify doorstep delivery."}
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${message.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
          {message.error ? <AlertCircle className="w-5 h-5 shrink-0 text-red-600" /> : <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Input / Scanner Controls */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <Search className="w-4 h-4 text-amber-600" />
          <span>{t('scanQrCode')}</span>
        </h3>

        <form onSubmit={handleScanOrVerify} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 flex items-center">
            <input
              type="text"
              required
              placeholder="Enter Unique QR Token (e.g. mgs_qr_tok_...)"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              className="w-full pl-4 pr-12 py-3 text-xs border border-slate-300 rounded-xl font-mono focus:border-amber-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={startCameraScanner}
              title="Scan QR Code using Camera"
              className="absolute right-2 p-1.5 text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold text-xs px-6 py-3 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 shrink-0"
          >
            {loading ? (lang === 'hi' ? 'सत्यापित हो रहा है...' : 'VERIFYING...') : (lang === 'hi' ? 'ऑर्डर सत्यापित करें' : 'VERIFY ORDER')}
          </button>
        </form>

        <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
          <span>Click camera icon <Camera className="w-3.5 h-3.5 inline text-amber-600" /> to scan QR directly with camera or paste QR URL / token above.</span>
        </p>
      </div>

      {/* Live Camera Scanner Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 relative shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                <Camera className="w-5 h-5 text-amber-500" />
                <span>Live Camera QR Code Scanner</span>
              </div>
              <button onClick={stopCameraScanner} className="p-1 rounded-full hover:bg-slate-100 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {cameraError ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-xs font-bold space-y-2 text-center">
                <AlertCircle className="w-8 h-8 mx-auto text-red-600" />
                <p>{cameraError}</p>
                <button
                  onClick={stopCameraScanner}
                  className="bg-slate-900 text-white text-xs px-4 py-2 rounded-xl font-extrabold mt-2"
                >
                  Close Scanner
                </button>
              </div>
            ) : (
              <div className="relative aspect-square bg-slate-900 rounded-2xl overflow-hidden border-2 border-amber-500 flex items-center justify-center">
                <video ref={videoRef} className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />

                {/* Scanning reticle overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-amber-400 rounded-2xl border-dashed animate-pulse" />
                </div>

                <div className="absolute bottom-3 left-0 right-0 text-center">
                  <span className="bg-slate-900/80 text-amber-300 px-3 py-1 rounded-full text-[10px] font-mono font-bold">
                    Point camera at QR code on bill
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scanned Order Summary */}
      {scannedOrder && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-2">
            <div>
              <span className="font-black text-slate-900 text-lg">Order #{scannedOrder.orderNumber}</span>
              <p className="text-xs text-slate-500">Invoice: {scannedOrder.invoiceNumber}</p>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
              scannedOrder.orderStatus === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              STATUS: {scannedOrder.orderStatus}
            </span>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
            <div className="space-y-1">
              <p className="font-extrabold text-slate-900 mb-1">Customer Delivery Details:</p>
              <p className="font-bold text-slate-800">{scannedOrder.customerName}</p>
              <p className="text-slate-600">{scannedOrder.address}</p>
              <p className="text-slate-600 font-mono font-bold">PIN Code: {scannedOrder.pincode}</p>
            </div>

            <div>
              <p className="font-extrabold text-slate-900 mb-1">Payment & Amount:</p>
              <p className="text-slate-700"><span className="font-semibold">Method:</span> {scannedOrder.paymentMethod}</p>
              <p className="text-slate-700"><span className="font-semibold">Payment Status:</span> {scannedOrder.paymentStatus}</p>
              <p className="text-slate-900 font-mono font-black text-base mt-1">Total: ₹{scannedOrder.totalAmount}</p>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-xs text-slate-900">Order Items ({scannedOrder.items.length}):</h4>
            <div className="divide-y divide-slate-100 text-xs">
              {scannedOrder.items.map((it, idx) => (
                <div key={idx} className="py-2 flex justify-between items-center text-slate-700">
                  <span>{it.quantity} × {it.name} ({it.unit})</span>
                  <span className="font-bold text-slate-900 font-mono">₹{it.subtotal}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Confirmation Button */}
          {user && ['ADMIN', 'STAFF', 'DELIVERY'].includes(user.role) && scannedOrder.orderStatus !== 'DELIVERED' && (
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
              <button
                onClick={handleMarkDelivered}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-xl shadow transition disabled:opacity-50"
              >
                {loading ? 'CONFIRMING DELIVERY...' : '✓ MARK ORDER DELIVERED'}
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default function DeliveryPortalPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500 font-bold">Loading Delivery Verification Portal...</div>}>
      <DeliveryContent />
    </Suspense>
  );
}