"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Star, Plus, Minus, ShoppingBag, ShieldCheck, Heart, MapPin, CheckCircle2, ChevronRight, Truck, Sparkles, Tag, MessageCircle, Scale, Calculator } from 'lucide-react';
import { useCart } from '../../../context/CartContext';
import ProductCard from '../../../components/ProductCard';

export default function ProductDetailPage({ params }) {
  const { slug } = use(params);
  const { addToCart, updateQuantity, cartItems, pincode, saveDeliveryPincode } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [bundleAdded, setBundleAdded] = useState(false);

  // Loose Item / Weighted Calculator state
  const [customWeightGrams, setCustomWeightGrams] = useState(1000); // Default 1000g = 1kg
  const [weightModeActive, setWeightModeActive] = useState(false);

  // Delivery PIN state
  const [inputPin, setInputPin] = useState(pincode || '');
  const [pinStatus, setPinStatus] = useState(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/products/${slug}`);
        const data = await res.json();

        if (data.success) {
          setProduct(data.data);
          setSelectedImg(prev => prev || (data.data.images && data.data.images.length > 0 ? data.data.images[0].url : ''));
        }
      } catch (e) {
        console.error('Fetch product detail error:', e);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchProduct();
      const interval = setInterval(fetchProduct, 5000);
      return () => clearInterval(interval);
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="py-12 max-w-5xl mx-auto space-y-6">
        <div className="h-96 bg-slate-200 animate-pulse rounded-3xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Product Not Found</h2>
        <Link href="/shop" className="inline-block bg-brand-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl">
          Back to Shop
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.inventory && product.inventory.status === 'OUT_OF_STOCK';

  // Check if product unit is weighted (e.g. 1 kg, 500g, 1 L, etc.)
  const unitLower = (product.unit || '').toLowerCase();
  const isWeightedProduct = unitLower.includes('kg') || unitLower.includes(' g') || unitLower.includes('l') || unitLower.includes('ml');

  // Base 1kg or 1000g price scaling factor
  let baseGrams = 1000;
  if (unitLower.includes('500g') || unitLower.includes('500 g')) baseGrams = 500;
  else if (unitLower.includes('250g') || unitLower.includes('250 g')) baseGrams = 250;
  else if (unitLower.includes('100g') || unitLower.includes('100 g')) baseGrams = 100;
  else if (unitLower.includes('5kg') || unitLower.includes('5 kg')) baseGrams = 5000;

  const scaledMultiplier = customWeightGrams / baseGrams;
  const computedSellingPrice = Math.round(product.sellingPrice * scaledMultiplier * 100) / 100;
  const computedMRP = Math.round(product.mrp * scaledMultiplier * 100) / 100;

  const handleAddToCart = () => {
    if (weightModeActive && isWeightedProduct) {
      const weightLabel = customWeightGrams >= 1000 ? `${customWeightGrams / 1000} kg` : `${customWeightGrams}g`;
      const customWeightedProduct = {
        ...product,
        id: `${product.id}_weight_${customWeightGrams}g`,
        name: `${product.name} (${weightLabel})`,
        sellingPrice: computedSellingPrice,
        mrp: computedMRP,
        unit: weightLabel,
      };
      addToCart(customWeightedProduct, quantity);
    } else {
      addToCart(product, quantity);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleAddBundle = () => {
    addToCart(product, 1);
    if (product.similarProducts) {
      product.similarProducts.slice(0, 2).forEach((sim) => addToCart(sim, 1));
    }
    setBundleAdded(true);
    setTimeout(() => setBundleAdded(false), 1800);
  };

  const handlePinCheck = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(inputPin)) {
      setPinStatus({ error: true, message: 'Please enter a valid 6-digit PIN' });
      return;
    }
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/delivery/check/${inputPin}`);
      const data = await res.json();
      if (data.isServiceable) {
        setPinStatus({ error: false, message: data.message, data: data.data });
        saveDeliveryPincode(inputPin, data.data);
      } else {
        setPinStatus({ error: true, message: data.message });
      }
    } catch (err) {
      setPinStatus({ error: true, message: 'Failed to check PIN availability' });
    }
  };

  const bundleItems = product.similarProducts ? [product, ...product.similarProducts.slice(0, 2)] : [product];
  const bundleTotalPrice = bundleItems.reduce((acc, item) => {
    const price = Number(item?.sellingPrice ?? item?.price ?? 0);
    return acc + (Number.isFinite(price) ? price : 0);
  }, 0);
  const formattedBundlePrice = bundleTotalPrice % 1 === 0 ? bundleTotalPrice : bundleTotalPrice.toFixed(2);

  return (
    <div className="space-y-10 pb-16">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 pt-2">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/shop" className="hover:text-brand-600">Shop</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 font-bold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Detail Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-10 grid grid-cols-1 md:grid-cols-12 gap-8 shadow-sm">

        {/* Left Column: Image Gallery */}
        <div className="md:col-span-5 space-y-4">
          <div className="aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 relative">
            <img src={selectedImg || product.images[0]?.url} alt={product.name} className="w-full h-full object-cover" />
            {product.discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-extrabold px-3 py-1 rounded-lg">
                {product.discountPercent}% OFF
              </span>
            )}
          </div>

          {product.images && product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImg(img.url)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition ${selectedImg === img.url ? 'border-brand-600 scale-105' : 'border-slate-200 opacity-70'}`}
                >
                  <img src={img.url} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Info & Actions */}
        <div className="md:col-span-7 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-md">
                {product.brand ? product.brand.name : 'Madhukar Store'}
              </span>
              <span className="text-xs text-slate-400">SKU: {product.sku}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">{product.name}</h1>
            <p className="text-sm font-bold text-slate-500 mt-1">Net Weight / Unit: {product.unit}</p>

            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg font-bold text-xs border border-amber-200">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{product.ratingAverage || '4.8'}</span>
              </div>
              <span className="text-xs text-slate-500 font-semibold">{product.ratingCount || 42} Verified Buyer Reviews</span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {weightModeActive ? `Calculated Price (${customWeightGrams >= 1000 ? `${customWeightGrams / 1000} kg` : `${customWeightGrams}g`})` : 'Special Selling Price'}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">₹{weightModeActive ? computedSellingPrice : product.sellingPrice}</span>
                {(weightModeActive ? computedMRP > computedSellingPrice : product.mrp > product.sellingPrice) && (
                  <span className="text-sm text-slate-400 line-through font-semibold">
                    MRP ₹{weightModeActive ? computedMRP : product.mrp}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${isOutOfStock ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}`}>
                {isOutOfStock ? 'OUT OF STOCK' : 'IN STOCK'}
              </span>
            </div>
          </div>

          {/* Loose / Weighted Grocery Price Calculator Widget */}
          {isWeightedProduct && (
            <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                  <Scale className="w-4 h-4 text-amber-600" />
                  <span>Loose Grocery Custom Weight Calculator</span>
                </div>

                <button
                  type="button"
                  onClick={() => setWeightModeActive(!weightModeActive)}
                  className={`text-[11px] font-black px-2.5 py-1 rounded-lg transition ${
                    weightModeActive ? 'bg-amber-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  {weightModeActive ? '✓ Custom Weight Active' : '+ Calculate Custom Weight'}
                </button>
              </div>

              {weightModeActive && (
                <div className="space-y-3 pt-1">
                  <p className="text-[11px] text-amber-800 font-semibold">
                    Select or enter exact weight required (e.g. 250g, 500g, 1kg) for real-time proportional pricing:
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {[100, 250, 500, 750, 1000, 2000, 5000].map((wGrams) => (
                      <button
                        key={wGrams}
                        type="button"
                        onClick={() => setCustomWeightGrams(wGrams)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                          customWeightGrams === wGrams
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-white text-slate-800 border border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {wGrams >= 1000 ? `${wGrams / 1000} kg` : `${wGrams}g`}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs font-bold text-slate-700">Custom Grams:</span>
                    <input
                      type="number"
                      min={50}
                      step={50}
                      value={customWeightGrams}
                      onChange={(e) => setCustomWeightGrams(Math.max(10, parseInt(e.target.value) || 100))}
                      className="w-28 px-3 py-1.5 text-xs font-mono font-bold border border-amber-300 rounded-xl bg-white focus:outline-none focus:border-amber-600"
                    />
                    <span className="text-xs font-bold text-slate-500">
                      = ₹{computedSellingPrice} ({customWeightGrams >= 1000 ? `${customWeightGrams / 1000} kg` : `${customWeightGrams}g`})
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quantity & Buy Actions */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-700">Quantity:</span>
              <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-slate-200 rounded-lg text-slate-700 transition"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 font-black text-slate-900 text-sm">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 hover:bg-slate-200 rounded-lg text-slate-700 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 py-3.5 px-6 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition ${
                  added
                    ? 'bg-emerald-600 text-white'
                    : isOutOfStock
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/30'
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
                <span>{added ? 'ADDED TO CART' : 'ADD TO CART'}</span>
              </button>

              <Link
                href="/cart"
                onClick={handleAddToCart}
                className="py-3.5 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-extrabold text-sm text-center shadow-md transition"
              >
                BUY NOW
              </Link>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Check out ${product.name} (₹${product.sellingPrice}) at Madhukar General Store!`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition"
                title="Share product on WhatsApp"
              >
                <MessageCircle className="w-4 h-4 fill-white text-emerald-500" />
                <span>Share</span>
              </a>
            </div>
          </div>

          {/* PIN Code Delivery Checker Widget */}
          <div className="border-t border-slate-200 pt-5 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-brand-600" />
              <span>Check Delivery Availability for Your Address</span>
            </h4>

            <form onSubmit={handlePinCheck} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit PIN code"
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ''))}
                className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:outline-none focus:border-brand-500"
              />
              <button type="submit" className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl">
                Check PIN
              </button>
            </form>

            {pinStatus && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${pinStatus.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                {pinStatus.message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Frequently Bought Together Combo Bundle Section */}
      {bundleItems.length > 1 && (
        <div className="bg-gradient-to-br from-amber-500/10 via-brand-50 to-emerald-50 rounded-3xl border border-amber-200/80 p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-black text-slate-900">Frequently Bought Together Combo</h3>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-4">
              {bundleItems.map((item, idx) => (
                <React.Fragment key={item.id}>
                  {idx > 0 && <span className="text-lg font-black text-slate-400">+</span>}
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-3 shadow-sm w-48">
                    <img src={item.images?.[0]?.url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500'} alt={item.name} className="w-12 h-12 object-cover rounded-xl" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                      <p className="text-xs font-black text-brand-700">₹{item.sellingPrice}</p>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-300 shadow-sm text-center space-y-2 w-full md:w-64">
              <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
                Combo Price
              </span>
              <p className="text-2xl font-black text-slate-900">₹{formattedBundlePrice}</p>
              <button
                onClick={handleAddBundle}
                className={`w-full py-2.5 rounded-xl text-xs font-extrabold transition shadow-md ${
                  bundleAdded ? 'bg-emerald-600 text-white' : 'bg-amber-500 hover:bg-amber-600 text-slate-900'
                }`}
              >
                {bundleAdded ? 'ADDED ALL 3 TO CART!' : 'ADD ALL 3 TO CART'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Reviews Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-4">
        <h3 className="text-lg font-black text-slate-900">Verified Buyer Reviews</h3>
        {product.reviews && product.reviews.length > 0 ? (
          <div className="space-y-3">
            {product.reviews.map((rev) => (
              <div key={rev.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{rev.user ? rev.user.name : 'Verified Purchaser'}</span>
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{rev.rating}/5</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600">{rev.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 font-medium">No customer reviews yet. Be the first to review this product after purchase!</p>
        )}
      </div>

      {/* Similar Products */}
      {product.similarProducts && product.similarProducts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-900">You May Also Like</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {product.similarProducts.map((sim) => (
              <ProductCard key={sim.id} product={sim} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}