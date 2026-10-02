"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Trash2, Plus, Minus, MapPin, Tag, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, FileText, Sparkles, MessageCircle, RefreshCw, Lightbulb } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';

export default function CartPage() {
  const { cartItems, updateQuantity, removeFromCart, addToCart, subtotal, totalMrp, totalDiscount, pincode, deliveryInfo, saveDeliveryPincode, appliedCoupon, setAppliedCoupon } = useCart();
  const { lang, t } = useLanguage();

  const [inputPin, setInputPin] = useState(pincode || '');
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [pinStatus, setPinStatus] = useState(null);
  const [pinLoading, setPinLoading] = useState(false);

  // Grocery List Parser State
  const [listText, setListText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState('');

  // Substitute Alternatives State
  const [substitutes, setSubstitutes] = useState([]);

  // Check for out-of-stock items and fetch alternatives in the same category
  React.useEffect(() => {
    const outOfStockItem = cartItems.find((item) => item.inventory && item.inventory.status === 'OUT_OF_STOCK');
    if (outOfStockItem && outOfStockItem.categoryId) {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      fetch(`${API_URL}/api/products?limit=20`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            const alternatives = data.data.filter(
              (p) =>
                p.id !== outOfStockItem.id &&
                p.categoryId === outOfStockItem.categoryId &&
                (!p.inventory || p.inventory.status !== 'OUT_OF_STOCK')
            );
            setSubstitutes(alternatives.slice(0, 3));
          }
        })
        .catch((err) => console.error(err));
    } else {
      setSubstitutes([]);
    }
  }, [cartItems]);

  const handleSwapProduct = (outOfStockId, newProduct) => {
    removeFromCart(outOfStockId);
    addToCart(newProduct, 1);
  };

  const handleParseList = async (e) => {
    e.preventDefault();
    if (!listText.trim()) return;

    setParsing(true);
    setParseStatus('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/products?limit=50`);
      const data = await res.json();

      if (data.success) {
        const allProducts = data.data;
        const lines = listText.split(/[\n,;]+/).map((l) => l.trim()).filter(Boolean);
        let count = 0;

        lines.forEach((line) => {
          const matched = allProducts.find((p) =>
            p.name.toLowerCase().includes(line.toLowerCase()) ||
            line.toLowerCase().includes(p.name.toLowerCase())
          );
          if (matched) {
            addToCart(matched, 1);
            count++;
          }
        });

        if (count > 0) {
          setParseStatus(`🎉 Successfully matched and added ${count} items to your cart!`);
          setListText('');
        } else {
          setParseStatus('No exact catalog matches found. Try items like "Atta", "Rice", "Milk", or "Biscuits".');
        }
      }
    } catch (err) {
      setParseStatus('Failed to process grocery list.');
    } finally {
      setParsing(false);
    }
  };

  const handlePinCheck = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(inputPin)) {
      setPinStatus({ error: true, message: 'Please enter a valid 6-digit Indian PIN code' });
      return;
    }

    setPinLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/delivery/check/${inputPin}`);
      const data = await res.json();

      if (data.isServiceable) {
        setPinStatus({ error: false, message: data.message, data: data.data });
        saveDeliveryPincode(inputPin, data.data);
      } else {
        setPinStatus({ error: true, message: data.message || 'Delivery unavailable for this PIN' });
      }
    } catch (err) {
      setPinStatus({ error: true, message: 'Could not connect to delivery server' });
    } finally {
      setPinLoading(false);
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    if (!couponCode.trim()) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), subtotal }),
      });
      const data = await res.json();

      if (data.success) {
        setAppliedCoupon(data.data);
      } else {
        setCouponError(data.message || 'Invalid coupon');
      }
    } catch (err) {
      setCouponError('Failed to validate coupon');
    }
  };

  const deliveryFee = deliveryInfo ? deliveryInfo.deliveryCharge : 30;
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const netTotal = Math.max(0, subtotal - couponDiscount + deliveryFee);

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {t('yourCart')} ({cartItems.length} {lang === 'hi' ? 'सामान' : 'Items'})
        </h1>
      </div>

      {/* Smart Grocery List Parser Card */}
      <div className="bg-gradient-to-r from-brand-900 to-slate-900 text-white rounded-3xl p-5 shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          <h3 className="text-sm font-extrabold tracking-tight">Paste Grocery List to Quick Add</h3>
        </div>
        <p className="text-xs text-slate-300">
          Paste your shopping list (e.g., <em>"5kg Atta, 2L Milk, Sugar, Chana Dal"</em>) and we will automatically find and add available products to your cart!
        </p>
        <form onSubmit={handleParseList} className="space-y-2">
          <textarea
            rows={2}
            placeholder="e.g. Atta, Milk, Rice, Biscuits..."
            value={listText}
            onChange={(e) => setListText(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-400"
          />
          <div className="flex items-center justify-between">
            {parseStatus ? (
              <span className="text-xs font-semibold text-amber-300">{parseStatus}</span>
            ) : <span />}
            <button
              type="submit"
              disabled={parsing || !listText.trim()}
              className="bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition disabled:opacity-50"
            >
              {parsing ? 'Matching Catalog...' : 'ADD LIST TO CART'}
            </button>
          </div>
        </form>
      </div>

      {cartItems.length === 0 ? (
        <div className="max-w-xl mx-auto py-12 text-center space-y-4">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">{t('emptyCart')}</h2>
          <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
            {lang === 'hi' ? 'आपने अभी तक अपनी कार्ट में कोई सामान नहीं जोड़ा है।' : 'You haven\'t added any fresh groceries or staples to your cart yet. Paste a list above or browse our catalog!'}
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition shadow-lg shadow-brand-600/30"
          >
            <span>{t('continueShopping')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-8 space-y-4">

            {/* Out-of-Stock Substitute Suggestions Banner */}
            {substitutes.length > 0 && (
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-100 to-amber-50 border-2 border-amber-300 rounded-3xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                  <Lightbulb className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Out-of-Stock Substitute / Alternative Suggestions</span>
                </div>
                <p className="text-xs text-amber-800 font-semibold">
                  An item in your cart is out of stock. Swap it instantly with these in-stock alternatives from the same department:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {substitutes.map((sub) => {
                    const outOfStockItem = cartItems.find((i) => i.inventory && i.inventory.status === 'OUT_OF_STOCK');
                    const imgUrl = sub.images && sub.images.length > 0 ? sub.images[0].url : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500';

                    return (
                      <div key={sub.id} className="bg-white p-3 rounded-2xl border border-amber-200 shadow-sm space-y-2 flex flex-col justify-between">
                        <div className="flex items-center gap-2">
                          <img src={imgUrl} alt={sub.name} className="w-10 h-10 object-cover rounded-xl shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-slate-900 truncate">{sub.name}</p>
                            <p className="text-[10px] text-slate-500">{sub.unit}</p>
                            <p className="font-black text-xs text-brand-700">₹{sub.sellingPrice}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSwapProduct(outOfStockItem?.id, sub)}
                          className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-[11px] py-1.5 rounded-xl shadow transition flex items-center justify-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>SWAP WITH THIS</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 p-2 sm:p-4 shadow-sm">
              {cartItems.map((item) => (
                <div key={item.id} className="p-3 sm:p-4 flex items-center gap-4">
                  <img src={item.image} alt={item.name} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl bg-slate-50 border border-slate-100 shrink-0" />

                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{item.name}</h3>
                    <p className="text-[11px] font-semibold text-slate-500">{item.unit}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="font-black text-sm text-slate-900">₹{item.sellingPrice}</span>
                      {item.mrp > item.sellingPrice && (
                        <span className="text-xs text-slate-400 line-through">₹{item.mrp}</span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Selector */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-700">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 font-black text-xs text-slate-900">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-700">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Order Summary & PIN / Coupon */}
          <div className="lg:col-span-4 space-y-4">

            {/* PIN Delivery Check Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-brand-600" />
                <span>1. Delivery PIN Code *</span>
              </h3>

              <form onSubmit={handlePinCheck} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="6-digit PIN code"
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:outline-none focus:border-brand-500"
                />
                <button type="submit" disabled={pinLoading} className="bg-brand-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl">
                  CHECK
                </button>
              </form>

              {pinStatus && (
                <div className={`p-2.5 rounded-xl text-xs font-semibold ${pinStatus.error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'}`}>
                  {pinStatus.message}
                </div>
              )}
            </div>

            {/* Coupon Code Input */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
              <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Tag className="w-4 h-4 text-amber-600" />
                <span>2. Apply Coupon Code</span>
              </h3>

              {appliedCoupon ? (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center justify-between text-xs font-bold text-emerald-800">
                  <div>
                    <span>Code: {appliedCoupon.code}</span>
                    <p className="text-[10px] font-medium text-emerald-600">Saved ₹{appliedCoupon.discountAmount}</p>
                  </div>
                  <button onClick={() => setAppliedCoupon(null)} className="text-xs text-red-600 font-extrabold hover:underline">
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. WELCOME50"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono uppercase focus:outline-none focus:border-brand-500"
                  />
                  <button type="submit" className="bg-slate-900 text-white font-bold text-xs px-3.5 py-2 rounded-xl">
                    APPLY
                  </button>
                </form>
              )}

              {couponError && <p className="text-xs font-semibold text-red-600">{couponError}</p>}
            </div>

            {/* Price Breakdown Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 pb-2 border-b border-slate-100">{lang === 'hi' ? 'बिल का विवरण' : 'Bill Summary'}</h3>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>{t('subtotal')} (MRP)</span>
                  <span>₹{totalMrp}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>{t('itemDiscount')}</span>
                  <span>-₹{totalDiscount}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-amber-600 font-semibold">
                    <span>{t('couponDiscount')} ({appliedCoupon.code})</span>
                    <span>-₹{couponDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{t('deliveryCharge')}</span>
                  <span>₹{deliveryFee}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline font-black text-slate-900 text-base">
                <span>{t('grandTotal')}</span>
                <span className="text-xl text-brand-700">₹{netTotal}</span>
              </div>

              <Link
                href="/checkout"
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-black text-xs py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 transition block text-center"
              >
                <span>{t('proceedToCheckout')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href={`https://wa.me/919876543210?text=${encodeURIComponent(
                  `Namaste Madhukar General Store! I would like to order:\n` +
                  cartItems.map((i) => `- ${i.name} (${i.unit}) x ${i.quantity} = ₹${i.sellingPrice * i.quantity}`).join('\n') +
                  `\n\nGrand Total: ₹${netTotal}\nDelivery PIN: ${inputPin || 'Not specified'}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md transition block text-center mt-2"
              >
                <MessageCircle className="w-4 h-4 fill-white text-emerald-500" />
                <span>ORDER VIA WHATSAPP</span>
              </a>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}