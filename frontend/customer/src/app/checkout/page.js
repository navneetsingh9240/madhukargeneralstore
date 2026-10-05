"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, CreditCard, CheckCircle2, ShieldCheck, AlertCircle, Plus, ArrowRight, Navigation, LocateFixed, Map, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function CheckoutPage() {
  const { user, token } = useAuth();
  const { cartItems, subtotal, deliveryInfo, appliedCoupon, pincode, clearCart } = useCart();
  const router = useRouter();

  const [step, setStep] = useState(1); // 1: Address, 2: Payment
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // UPI Payment Details
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState('');
  const [storeUpiId, setStoreUpiId] = useState('madhukarkumarmatihani@okicici');

  // New Address Form State
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: user ? user.name : '',
    mobileNumber: user ? user.phone || '' : '',
    houseFlat: '',
    streetArea: '',
    city: 'Patna',
    state: 'Bihar',
    pincode: pincode || '800001',
    latitude: null,
    longitude: null,
    mapUrl: '',
  });

  // GPS Location fetch handler with Google Maps redirection
  const handleFetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // Open Google Maps in new tab pointing to detected coordinates
          window.open(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`, '_blank');

          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
          const data = await res.json();

          if (data && data.address) {
            const addr = data.address;
            const extractedStreet = addr.road || addr.street || addr.suburb || addr.neighbourhood || addr.residential || addr.pedestrian || addr.subdistrict || [addr.road, addr.suburb].filter(Boolean).join(', ') || addr.display_name?.slice(0, 40) || '';
            const extractedCity = addr.city || addr.town || addr.village || addr.district || addr.subdistrict || addr.county || addr.state_district || 'Patna';
            const extractedState = addr.state || 'Bihar';
            const extractedPin = (addr.postcode || '').replace(/\D/g, '').slice(0, 6);

            const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

            setAddressForm(prev => ({
              ...prev,
              streetArea: extractedStreet || prev.streetArea,
              city: extractedCity,
              state: extractedState,
              pincode: /^\d{6}$/.test(extractedPin) ? extractedPin : prev.pincode,
              latitude,
              longitude,
              mapUrl,
            }));

            if (/^\d{6}$/.test(extractedPin)) {
              handlePincodeChange(extractedPin);
            }
          }
        } catch (err) {
          setError('Failed to fetch location address details.');
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        setGeoLoading(false);
        setError('Location permission denied or unavailable.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Auto-fill Street/Area, City & State when 6-digit PIN code is typed
  const handlePincodeChange = async (pinValue) => {
    const cleanPin = pinValue.replace(/\D/g, '');
    setAddressForm(prev => ({ ...prev, pincode: cleanPin }));

    if (cleanPin.length === 6) {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/delivery/check/${cleanPin}`);
        const data = await res.json();
        if (data.isServiceable && data.data) {
          setAddressForm(prev => ({
            ...prev,
            city: data.data.city || prev.city,
            state: data.data.state || prev.state,
            streetArea: prev.streetArea || data.data.area || '',
          }));
        } else {
          // Fallback lookup via India Post PIN API if not in local store table
          const postRes = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
          const postData = await postRes.json();
          if (postData && postData[0] && postData[0].Status === 'Success' && postData[0].PostOffice?.length > 0) {
            const po = postData[0].PostOffice[0];
            setAddressForm(prev => ({
              ...prev,
              city: po.District || po.Division || prev.city,
              state: po.State || prev.state,
              streetArea: prev.streetArea || po.Name || '',
            }));
          }
        }
      } catch (err) {
        console.error('PIN lookup error:', err);
      }
    }
  };

  useEffect(() => {
    if (!token) {
      router.push('/login?redirect=/checkout');
      return;
    }

    async function fetchAddresses() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/addresses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setAddresses(data.data);
          setSelectedAddressId(prev => prev || (data.data.find((a) => a.isDefault) || data.data[0]).id);
        } else {
          setShowAddAddress(true);
        }
      } catch (e) {
        console.error('Fetch addresses error:', e);
      }
    }

    fetchAddresses();

    // Fetch store settings for UPI ID
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${API_URL}/api/store-settings`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.upiId) {
          setStoreUpiId(data.data.upiId);
        }
      })
      .catch(() => {});

    const interval = setInterval(fetchAddresses, 5000);
    return () => clearInterval(interval);
  }, [token, router]);

  const handleScreenshotChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Screenshot image size exceeds 5MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPaymentScreenshot(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setError('');

    if (!/^\d{6}$/.test(addressForm.pincode)) {
      setError('PIN code must be exactly 6 digits');
      return;
    }

    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addressForm),
      });
      const data = await res.json();

      if (data.success) {
        setAddresses([data.data, ...addresses]);
        setSelectedAddressId(data.data.id);
        setShowAddAddress(false);
      } else {
        setError(data.message || 'Failed to save address');
      }
    } catch (err) {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Please select or add a delivery address');
      return;
    }

    if (paymentMethod === 'UPI' && !utrNumber.trim()) {
      setError('Please enter your UPI Transaction ID / UTR number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const orderPayload = {
        items: cartItems.map((item) => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
        })),
        addressId: selectedAddressId,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        paymentMethod,
      };

      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();

      if (data.success) {
        const createdOrder = data.data;

        // If UPI payment, submit payment proof
        if (paymentMethod === 'UPI' && utrNumber.trim()) {
          const proofRes = await fetch(`${API_URL}/api/orders/${createdOrder.id}/payment/submit`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              utr: utrNumber.trim(),
              screenshot: paymentScreenshot,
            }),
          });
          await proofRes.json();
        }

        clearCart();
        router.push(`/account/orders/${createdOrder.id}?success=true`);
      } else {
        setError(data.message || 'Failed to place order');
      }
    } catch (err) {
      setError('Error placing order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deliveryCharge = deliveryInfo ? deliveryInfo.deliveryCharge : 30;
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const grandTotal = Math.max(0, subtotal - couponDiscount + deliveryCharge);

  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold">Your Cart is Empty</h2>
        <Link href="/shop" className="inline-block bg-brand-600 text-white text-xs font-bold px-4 py-2 rounded-xl">
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <h1 className="text-2xl font-black text-slate-900 tracking-tight">Checkout</h1>

      {/* Progress Steps Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
        <div className={`flex items-center gap-2 font-bold text-xs ${step >= 1 ? 'text-brand-600' : 'text-slate-400'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-brand-600 text-white' : 'bg-slate-200'}`}>1</div>
          <span>Delivery Address & PIN</span>
        </div>
        <div className="h-0.5 flex-1 bg-slate-200 mx-4" />
        <div className={`flex items-center gap-2 font-bold text-xs ${step >= 2 ? 'text-brand-600' : 'text-slate-400'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-brand-600 text-white' : 'bg-slate-200'}`}>2</div>
          <span>Payment & Order Review</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Address Selection & Mandatory PIN */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-600" />
                <span>Select Delivery Address (Mandatory 6-Digit PIN Check)</span>
              </h2>
              <button
                onClick={() => setShowAddAddress(!showAddAddress)}
                className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddAddress ? 'Cancel' : 'Add New Address'}</span>
              </button>
            </div>

            {!showAddAddress && addresses.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition ${
                      selectedAddressId === addr.id ? 'border-brand-600 bg-brand-50/50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-extrabold text-xs text-slate-900">{addr.fullName}</span>
                      {selectedAddressId === addr.id && <CheckCircle2 className="w-4 h-4 text-brand-600" />}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{addr.houseFlat}, {addr.streetArea}</p>
                    <p className="text-xs text-slate-600">{addr.city}, {addr.state} - <span className="font-mono font-bold text-slate-900">{addr.pincode}</span></p>
                    <p className="text-[11px] font-semibold text-slate-500 mt-2">Mobile: {addr.mobileNumber}</p>
                    {(addr.mapUrl || (addr.latitude && addr.longitude)) && (
                      <a
                        href={addr.mapUrl || `https://www.google.com/maps/dir/?api=1&destination=${addr.latitude},${addr.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-md mt-2"
                      >
                        <Map className="w-3 h-3" />
                        <span>Google Maps Location</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add Address Form */}
            {(showAddAddress || addresses.length === 0) && (
              <form onSubmit={handleSaveAddress} className="space-y-3 pt-2">
                <div className="flex justify-between items-center bg-brand-50 p-3 rounded-2xl border border-brand-200">
                  <div>
                    <p className="text-xs font-bold text-brand-900">Auto-detect Google Maps Location</p>
                    <p className="text-[11px] text-brand-700">Pins exact location for customer & delivery navigation</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleFetchCurrentLocation}
                    disabled={geoLoading}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-black text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow transition disabled:opacity-50"
                  >
                    <Map className={`w-3.5 h-3.5 ${geoLoading ? 'animate-spin' : ''}`} />
                    <span>{geoLoading ? 'Detecting Location...' : 'Use Google Maps Location'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Full Name *"
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    className="px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                  <input
                    type="text"
                    required
                    placeholder="10-digit Mobile Number *"
                    value={addressForm.mobileNumber}
                    onChange={(e) => setAddressForm({ ...addressForm, mobileNumber: e.target.value })}
                    className="px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <input
                  type="text"
                  required
                  placeholder="House / Flat / Building No *"
                  value={addressForm.houseFlat}
                  onChange={(e) => setAddressForm({ ...addressForm, houseFlat: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
                <input
                  type="text"
                  required
                  placeholder="Street / Colony / Landmark *"
                  value={addressForm.streetArea}
                  onChange={(e) => setAddressForm({ ...addressForm, streetArea: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                />
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="City *"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                  <input
                    type="text"
                    required
                    placeholder="State *"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="6-digit PIN *"
                    value={addressForm.pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    className="px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white font-bold text-xs py-2.5 rounded-xl">
                  {loading ? 'Saving Address...' : 'SAVE & USE ADDRESS'}
                </button>
              </form>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                if (!selectedAddressId) setError('Please select an address');
                else { setError(''); setStep(2); }
              }}
              className="bg-brand-600 hover:bg-brand-700 text-white font-black text-xs px-8 py-3.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-brand-600/30"
            >
              <span>CONTINUE TO PAYMENT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Payment Method & Place Order */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-600" />
              <span>Select Payment Method</span>
            </h2>

            <div className="space-y-3">
              <div
                onClick={() => setPaymentMethod('COD')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                  paymentMethod === 'COD' ? 'border-brand-600 bg-brand-50/50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <p className="font-extrabold text-xs text-slate-900">Cash on Delivery (COD)</p>
                  <p className="text-[11px] text-slate-500">Pay cash upon doorstep handover</p>
                </div>
                {paymentMethod === 'COD' && <CheckCircle2 className="w-5 h-5 text-brand-600" />}
              </div>

              <div
                onClick={() => setPaymentMethod('UPI')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                  paymentMethod === 'UPI' ? 'border-brand-600 bg-brand-50/50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <p className="font-extrabold text-xs text-slate-900">UPI / Online Payment (Google Pay / PhonePe / Paytm / BHIM)</p>
                  <p className="text-[11px] text-slate-500">Scan QR code & submit UTR for instant manual verification</p>
                </div>
                {paymentMethod === 'UPI' && <CheckCircle2 className="w-5 h-5 text-brand-600" />}
              </div>
            </div>

            {/* UPI QR & Payment Proof Section */}
            {paymentMethod === 'UPI' && (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="text-center space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-700 bg-brand-100 px-3 py-1 rounded-full">
                    UPI PAYMENT
                  </span>
                  <div className="pt-2">
                    <p className="text-xs font-bold text-slate-600">Amount to Pay</p>
                    <p className="text-2xl font-black text-brand-700">₹{grandTotal}</p>
                    <p className="text-[11px] font-semibold text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                      🔒 Amount fixed by order calculation
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      `upi://pay?pa=${storeUpiId}&pn=Madhukar%20General%20Store&am=${grandTotal.toFixed(2)}&cu=INR`
                    )}`}
                    alt="UPI Payment QR Code"
                    className="w-48 h-48 object-contain border border-slate-100 rounded-xl"
                  />
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-800">Scan using Google Pay, PhonePe, Paytm, or BHIM</p>
                    <p className="text-xs font-mono font-bold text-brand-700 mt-1">UPI ID: {storeUpiId}</p>
                  </div>

                  <a
                    href={`upi://pay?pa=${storeUpiId}&pn=Madhukar%20General%20Store&am=${grandTotal.toFixed(2)}&cu=INR`}
                    className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-black text-white text-xs font-extrabold px-4 py-2 rounded-xl transition"
                  >
                    Open UPI App
                  </a>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      UPI Transaction ID / UTR Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter 12-digit UTR or Transaction ID"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:border-brand-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Payment Screenshot (Optional, Max 5MB)
                    </label>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handleScreenshotChange}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Final Order Amount Summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between font-semibold text-slate-600">
                <span>Subtotal ({cartItems.length} items)</span>
                <span>₹{subtotal}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between font-semibold text-amber-600">
                  <span>Coupon Discount ({appliedCoupon.code})</span>
                  <span>-₹{couponDiscount}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-slate-600">
                <span>Delivery Charge</span>
                <span>₹{deliveryCharge}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-sm text-slate-900">
                <span>Total Amount Payable</span>
                <span className="text-brand-700 text-lg">₹{grandTotal}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="text-xs font-bold text-slate-600 px-4 py-3">
              Back to Address
            </button>
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="bg-brand-600 hover:bg-brand-700 text-white font-black text-xs px-8 py-3.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-brand-600/30 transition disabled:opacity-50"
            >
              <span>{loading ? 'PROCESSING ORDER...' : 'CONFIRM & PLACE ORDER'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}