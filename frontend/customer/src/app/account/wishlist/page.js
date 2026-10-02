"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';

export default function WishlistPage() {
  const { token } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();

  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    fetchWishlist();
    const interval = setInterval(fetchWishlist, 5000);
    return () => clearInterval(interval);
  }, [token, router]);

  const fetchWishlist = () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${API_URL}/api/wishlist`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setWishlistProducts(data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleRemove = async (productId) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/wishlist/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setWishlistProducts(wishlistProducts.filter((p) => p.id !== productId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveToCart = (product) => {
    addToCart(product, 1);
    handleRemove(product.id);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4">
      <div className="container mx-auto max-w-5xl">

        {/* Navigation Breadcrumb */}
        <Link href="/account" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> Back to My Account
        </Link>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Wishlist</h1>
            <p className="text-xs text-slate-500 mt-0.5">Saved favorite grocery items for fast re-ordering</p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-200 px-3 py-1 rounded-full">
            {wishlistProducts.length} Saved
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading wishlist...</div>
        ) : wishlistProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {wishlistProducts.map((product) => {
              const image = product.images && product.images.length > 0 ? product.images[0].url : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80';
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-square rounded-xl bg-slate-50 mb-3 overflow-hidden flex items-center justify-center p-2">
                      <img src={image} alt={product.name} className="max-h-full object-contain" />
                      <button
                        onClick={() => handleRemove(product.id)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 shadow-sm text-slate-400 hover:text-red-500 flex items-center justify-center transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider block">
                      {product.unit}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 line-clamp-2 mt-0.5">{product.name}</h3>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm font-black text-slate-900">₹{product.sellingPrice}</span>
                      <span className="text-xs text-slate-400 line-through">₹{product.mrp}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleMoveToCart(product)}
                    className="w-full mt-4 bg-brand-600 hover:bg-brand-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Move to Cart
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto">
            <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 mb-1">Your wishlist is empty</h3>
            <p className="text-xs text-slate-500 mb-6">Explore our grocery store and tap the heart icon on any product to save it here.</p>
            <Link
              href="/shop"
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition inline-block"
            >
              Explore Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}