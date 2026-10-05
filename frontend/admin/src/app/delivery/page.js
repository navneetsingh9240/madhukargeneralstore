"use client";

import React, {
  useState,
  useEffect,
  Suspense,
} from "react";

import { useSearchParams } from "next/navigation";

import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Search,
  Camera,
  X,
  Globe,
} from "lucide-react";

import jsQR from "jsqr";

// ============================================================
// DELIVERY CONTENT
// ============================================================

function DeliveryContent() {
  const { lang, changeLanguage, t } = useLanguage();
  const searchParams = useSearchParams();

  const urlToken = searchParams.get("token");

  const { token, user } = useAuth();

  // IMPORTANT:
  // searchParams.get() can return null.
  // Always keep controlled input value as a string.
  const [qrInput, setQrInput] = useState(urlToken || "");

  const [scannedOrder, setScannedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Doorstep Payment Collection State
  const [storeUpiId, setStoreUpiId] = useState("9235070979@ptaxis");
  const [collectionMethod, setCollectionMethod] = useState("CASH"); // "CASH" or "UPI"
  const [doorstepUtr, setDoorstepUtr] = useState("");
  const [showConfirmCashModal, setShowConfirmCashModal] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [collecting, setCollecting] = useState(false);

  // Fetch Store Settings UPI ID
  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    fetch(`${API_URL}/api/store-settings`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.upiId) {
          setStoreUpiId(data.data.upiId);
        }
      })
      .catch(() => {});
  }, []);

  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const animationFrameId = React.useRef(null);

  // ==========================================================
  // AUTO VERIFY TOKEN FROM URL
  // ==========================================================

  useEffect(() => {
    if (urlToken) {
      setQrInput(urlToken);
      verifyToken(urlToken);
    }
  }, [urlToken]);

  // ==========================================================
  // VERIFY QR TOKEN
  // ==========================================================

  const verifyToken = async (targetToken) => {
    if (!targetToken || !targetToken.trim()) {
      return;
    }

    setLoading(true);
    setMessage(null);
    setScannedOrder(null);

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5000";

      const res = await fetch(
        `${API_URL}/api/invoices/scan/${encodeURIComponent(
          targetToken.trim()
        )}`,
        {
          headers: {
            Authorization: token
              ? `Bearer ${token}`
              : "",
          },
        }
      );

      const data = await res.json();

      if (data.success) {
        setScannedOrder(data.data);

        setMessage({
          error: false,
          text: data.message,
        });
      } else {
        setMessage({
          error: true,
          text:
            data.message ||
            "Invoice QR token or Unique QR ID is invalid",
        });
      }
    } catch (err) {
      console.error(
        "QR verification error:",
        err
      );

      setMessage({
        error: true,
        text: "Could not connect to verification server",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // MANUAL VERIFY FORM
  // ==========================================================

  const handleScanOrVerify = (e) => {
    e.preventDefault();

    verifyToken(qrInput);
  };

  // ==========================================================
  // START CAMERA SCANNER
  // ==========================================================

  const startCameraScanner = async () => {
    setShowCamera(true);
    setCameraError(null);

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
          },
        });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        videoRef.current.setAttribute(
          "playsinline",
          "true"
        );

        await videoRef.current.play();

        animationFrameId.current =
          requestAnimationFrame(tickScan);
      }
    } catch (err) {
      console.error(
        "Camera access error:",
        err
      );

      setCameraError(
        "Unable to access device camera. Please check camera permissions."
      );
    }
  };

  // ==========================================================
  // STOP CAMERA SCANNER
  // ==========================================================

  const stopCameraScanner = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(
        animationFrameId.current
      );

      animationFrameId.current = null;
    }

    if (
      videoRef.current &&
      videoRef.current.srcObject
    ) {
      const tracks =
        videoRef.current.srcObject.getTracks();

      tracks.forEach((track) => {
        track.stop();
      });

      videoRef.current.srcObject = null;
    }

    setShowCamera(false);
  };

  // ==========================================================
  // QR CAMERA SCANNING LOOP
  // ==========================================================

  const tickScan = () => {
    if (
      videoRef.current &&
      videoRef.current.readyState ===
        videoRef.current.HAVE_ENOUGH_DATA
    ) {
      const video = videoRef.current;

      const canvas =
        canvasRef.current ||
        document.createElement("canvas");

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        animationFrameId.current =
          requestAnimationFrame(tickScan);

        return;
      }

      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;

      ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const imageData = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

      const code = jsQR(
        imageData.data,
        imageData.width,
        imageData.height,
        {
          inversionAttempts: "dontInvert",
        }
      );

      if (code && code.data) {
        const decodedText = code.data;

        let tokenToVerify = decodedText;

        // ----------------------------------------------------
        // Extract token from QR URL
        // ----------------------------------------------------

        if (decodedText.includes("token=")) {
          try {
            const urlObj =
              new URL(decodedText);

            tokenToVerify =
              urlObj.searchParams.get(
                "token"
              ) || decodedText;
          } catch (e) {
            const match =
              decodedText.match(
                /token=([^&]+)/
              );

            if (match) {
              tokenToVerify = match[1];
            }
          }
        }

        // ----------------------------------------------------
        // Set scanned token
        // ----------------------------------------------------

        setQrInput(
          tokenToVerify || ""
        );

        // ----------------------------------------------------
        // Stop camera and verify
        // ----------------------------------------------------

        stopCameraScanner();

        verifyToken(tokenToVerify);

        return;
      }
    }

    animationFrameId.current =
      requestAnimationFrame(tickScan);
  };

  // ==========================================================
  // COLLECT DOORSTEP PAYMENT
  // ==========================================================

  const handleCollectPayment = async (selectedMethod) => {
    if (!scannedOrder || !token) return;

    setCollecting(true);
    setMessage(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_URL}/api/delivery/collect-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: scannedOrder.orderId,
          method: selectedMethod,
          utr: doorstepUtr,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setShowConfirmCashModal(false);
        setShowUpiModal(false);
        setDoorstepUtr("");

        setMessage({
          error: false,
          text: data.message,
        });

        setScannedOrder((prev) => ({
          ...prev,
          orderStatus: "DELIVERED",
          paymentStatus: "COMPLETED",
          paymentMethod: selectedMethod,
        }));
      } else {
        setMessage({
          error: true,
          text: data.message || "Failed to collect payment",
        });
      }
    } catch (err) {
      console.error("Collect payment error:", err);
      setMessage({
        error: true,
        text: "Could not connect to payment collection server",
      });
    } finally {
      setCollecting(false);
    }
  };

  // ==========================================================
  // MARK ORDER DELIVERED
  // ==========================================================

  const handleMarkDelivered = async () => {
    if (!scannedOrder || !token) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5000";

      const res = await fetch(
        `${API_URL}/api/admin/orders/${scannedOrder.orderId}/status`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            orderStatus: "DELIVERED",
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setMessage({
          error: false,
          text: data.message,
        });

        setScannedOrder((prev) => ({
          ...prev,
          orderStatus: "DELIVERED",
          paymentStatus: "COMPLETED",
        }));
      } else {
        setMessage({
          error: true,
          text:
            data.message ||
            "Failed to update order status",
        });
      }
    } catch (err) {
      console.error(
        "Delivery confirmation error:",
        err
      );

      setMessage({
        error: true,
        text:
          "Failed to complete delivery verification",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8 pb-16">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="bg-amber-500 text-slate-900 p-6 rounded-3xl space-y-2 shadow-xl">

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2">

            <QrCode className="w-6 h-6" />

            <span className="font-extrabold text-xs uppercase tracking-wider bg-slate-900 text-amber-400 px-2.5 py-0.5 rounded">
              {t("deliveryConsole")}
            </span>

          </div>

          <button
            onClick={() =>
              changeLanguage(
                lang === "en"
                  ? "hi"
                  : "en"
              )
            }
            className="inline-flex items-center gap-1.5 bg-slate-900 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-sm hover:bg-slate-800 transition"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />

            <span>
              {lang === "en"
                ? "हिंदी"
                : "English"}
            </span>
          </button>

        </div>

        <h1 className="text-2xl font-black tracking-tight">
          {t("deliveryVerification")}
        </h1>

        <p className="text-xs font-semibold text-slate-800">
          {lang === "hi"
            ? "डिलीवरी एजेंट ग्राहक के प्रिंटेड या डिजिटल बिल का क्यूआर कोड स्कैन करके या क्यूआर आईडी डालकर डिलीवरी सत्यापित कर सकते हैं।"
            : "Authorized delivery agents scan the digital QR code on customer's printed or digital bill or enter the Unique QR ID manually to inspect items & verify doorstep delivery."}
        </p>

      </div>

      {/* ======================================================
          MESSAGE
      ====================================================== */}

      {message && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            message.error
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
          }`}
        >
          {message.error ? (
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          ) : (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          )}

          <span>
            {message.text}
          </span>
        </div>
      )}

      {/* ======================================================
          INPUT / SCANNER CONTROLS
      ====================================================== */}

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">

        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">

          <Search className="w-4 h-4 text-amber-600" />

          <span>
            {t("scanQrCode")}
          </span>

        </h3>

        <form
          onSubmit={handleScanOrVerify}
          className="flex flex-col sm:flex-row gap-2"
        >

          <div className="relative flex-1 flex items-center">

            <input
              type="text"
              required
              placeholder="Enter Unique QR Token (e.g. mgs_qr_tok_...)"

              /*
               * IMPORTANT:
               * Never pass null to a controlled input.
               */
              value={qrInput || ""}

              onChange={(e) =>
                setQrInput(e.target.value)
              }

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
            {loading
              ? lang === "hi"
                ? "सत्यापित हो रहा है..."
                : "VERIFYING..."
              : lang === "hi"
                ? "ऑर्डर सत्यापित करें"
                : "VERIFY ORDER"}
          </button>

        </form>

        <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
          <span>
            Click camera icon{" "}
            <Camera className="w-3.5 h-3.5 inline text-amber-600" />{" "}
            to scan QR directly with camera or paste QR URL / token above.
          </span>
        </p>

      </div>

      {/* ======================================================
          LIVE CAMERA SCANNER MODAL
      ====================================================== */}

      {showCamera && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 relative shadow-2xl">

            <div className="flex justify-between items-center border-b pb-3">

              <div className="flex items-center gap-2 text-slate-900 font-black text-sm">

                <Camera className="w-5 h-5 text-amber-500" />

                <span>
                  Live Camera QR Code Scanner
                </span>

              </div>

              <button
                onClick={stopCameraScanner}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            {cameraError ? (
              <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-xs font-bold space-y-2 text-center">

                <AlertCircle className="w-8 h-8 mx-auto text-red-600" />

                <p>
                  {cameraError}
                </p>

                <button
                  onClick={stopCameraScanner}
                  className="bg-slate-900 text-white text-xs px-4 py-2 rounded-xl font-extrabold mt-2"
                >
                  Close Scanner
                </button>

              </div>
            ) : (
              <div className="relative aspect-square bg-slate-900 rounded-2xl overflow-hidden border-2 border-amber-500 flex items-center justify-center">

                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                />

                <canvas
                  ref={canvasRef}
                  className="hidden"
                />

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

      {/* ======================================================
          SCANNED ORDER SUMMARY
      ====================================================== */}

      {scannedOrder && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-6">

          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-2">

            <div>

              <span className="font-black text-slate-900 text-lg">
                Order #{scannedOrder.orderNumber}
              </span>

              <p className="text-xs text-slate-500">
                Invoice: {scannedOrder.invoiceNumber}
              </p>

            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                scannedOrder.orderStatus ===
                "DELIVERED"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              STATUS: {scannedOrder.orderStatus}
            </span>

          </div>

          {/* Customer Information */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">

            <div className="space-y-1">

              <p className="font-extrabold text-slate-900 mb-1">
                Customer Delivery Details:
              </p>

              <p className="font-bold text-slate-800">
                {scannedOrder.customerName}
              </p>

              <p className="text-slate-600">
                {scannedOrder.address}
              </p>

              <p className="text-slate-600 font-mono font-bold">
                PIN Code: {scannedOrder.pincode}
              </p>

            </div>

            <div>

              <p className="font-extrabold text-slate-900 mb-1">
                Payment & Amount:
              </p>

              <p className="text-slate-700">
                <span className="font-semibold">
                  Method:
                </span>{" "}
                {scannedOrder.paymentMethod}
              </p>

              <p className="text-slate-700">
                <span className="font-semibold">
                  Payment Status:
                </span>{" "}
                {scannedOrder.paymentStatus}
              </p>

              <p className="text-slate-900 font-mono font-black text-base mt-1">
                Total: ₹{scannedOrder.totalAmount}
              </p>

            </div>

          </div>

          {/* ====================================================
              ITEMS LIST
          ==================================================== */}

          <div className="space-y-2">

            <h4 className="font-extrabold text-xs text-slate-900">
              Order Items ({scannedOrder.items.length}):
            </h4>

            <div className="divide-y divide-slate-100 text-xs">

              {scannedOrder.items.map(
                (it, idx) => (
                  <div
                    key={idx}
                    className="py-2 flex justify-between items-center text-slate-700"
                  >
                    <span>
                      {it.quantity} ×{" "}
                      {it.name} ({it.unit})
                    </span>

                    <span className="font-bold text-slate-900 font-mono">
                      ₹{it.subtotal}
                    </span>
                  </div>
                )
              )}

            </div>

          </div>

          {/* ====================================================
              DELIVERY & PAYMENT COLLECTION CONTROLS
          ==================================================== */}

          {user &&
            ["ADMIN", "STAFF", "DELIVERY"].includes(user.role) &&
            scannedOrder.orderStatus !== "DELIVERED" && (
              <div className="space-y-4 pt-2">
                {scannedOrder.paymentStatus === "COMPLETED" ? (
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Payment Status: PAID ({scannedOrder.paymentMethod}) — No Doorstep Collection Required</span>
                    </div>
                    <button
                      onClick={handleMarkDelivered}
                      disabled={loading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-xl shadow transition disabled:opacity-50"
                    >
                      {loading ? "CONFIRMING DELIVERY..." : "✓ MARK ORDER DELIVERED"}
                    </button>
                  </div>
                ) : (
                  <div className="bg-amber-50/80 p-5 rounded-3xl border border-amber-200 space-y-4">
                    <div className="text-center space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-200 px-3 py-0.5 rounded-full">
                        DOORSTEP PAYMENT COLLECTION
                      </span>
                      <p className="text-xs font-bold text-slate-700 pt-1">Amount Due From Customer</p>
                      <p className="text-2xl font-black text-amber-900">₹{scannedOrder.totalAmount}</p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-800 text-center">Select Doorstep Payment Method:</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setCollectionMethod("CASH");
                            setShowConfirmCashModal(true);
                          }}
                          className="bg-slate-900 hover:bg-black text-white font-black text-xs py-3 rounded-2xl shadow transition flex items-center justify-center gap-1.5"
                        >
                          💵 CASH
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCollectionMethod("UPI");
                            setShowUpiModal(true);
                          }}
                          className="bg-brand-600 hover:bg-brand-700 text-white font-black text-xs py-3 rounded-2xl shadow transition flex items-center justify-center gap-1.5"
                        >
                          📱 UPI QR
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

        </div>
      )}

      {/* ======================================================
          CASH PAYMENT CONFIRMATION MODAL
      ====================================================== */}

      {showConfirmCashModal && scannedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 text-center shadow-2xl">
            <h3 className="text-lg font-black text-slate-900">Confirm Cash Collection</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Confirm that cash payment of <strong className="text-slate-900 font-extrabold text-base">₹{scannedOrder.totalAmount}</strong> has been received in full from customer <strong className="text-slate-900">{scannedOrder.customerName}</strong> for Order <strong className="text-slate-900">#{scannedOrder.orderNumber}</strong>?
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                disabled={collecting}
                onClick={() => setShowConfirmCashModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                disabled={collecting}
                onClick={() => handleCollectPayment("CASH")}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-xl transition shadow-md shadow-emerald-600/30"
              >
                {collecting ? "Processing..." : "✓ CASH RECEIVED"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          DOORSTEP UPI QR MODAL
      ====================================================== */}

      {showUpiModal && scannedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 text-center shadow-2xl">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-700 bg-brand-100 px-3 py-0.5 rounded-full">
                DOORSTEP UPI PAYMENT
              </span>
              <p className="text-xs font-bold text-slate-600 pt-1">Amount To Pay</p>
              <p className="text-2xl font-black text-brand-700">₹{scannedOrder.totalAmount}</p>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  `upi://pay?pa=${storeUpiId}&pn=Madhukar%20General%20Store&am=${Number(scannedOrder.totalAmount).toFixed(2)}&cu=INR`
                )}`}
                alt="Doorstep UPI QR Code"
                className="w-52 h-52 object-contain border border-slate-200 rounded-xl bg-white p-1"
              />
              <div className="text-center">
                <p className="text-xs font-bold text-slate-800">Scan using Google Pay, PhonePe, Paytm, or BHIM</p>
                <p className="text-xs font-mono font-bold text-brand-700 mt-0.5">UPI ID: {storeUpiId}</p>
              </div>
            </div>

            <div className="text-left space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                UPI Transaction ID / UTR Number (Optional)
              </label>
              <input
                type="text"
                placeholder="Enter 12-digit UTR if available"
                value={doorstepUtr}
                onChange={(e) => setDoorstepUtr(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                disabled={collecting}
                onClick={() => setShowUpiModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                disabled={collecting}
                onClick={() => handleCollectPayment("UPI")}
                className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-black text-xs py-3 rounded-xl transition shadow-md shadow-brand-600/30"
              >
                {collecting ? "Verifying..." : "✓ PAYMENT RECEIVED"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ============================================================
// DELIVERY PORTAL PAGE
// ============================================================

export default function DeliveryPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500 font-bold">
          Loading Delivery Verification Portal...
        </div>
      }
    >
      <DeliveryContent />
    </Suspense>
  );
}