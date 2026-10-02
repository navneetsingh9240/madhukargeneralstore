"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Plus, Minus, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

export default function ProductCard({ product }) {
  const { addToCart, updateQuantity, cartItems } = useCart();
  const { lang, t } = useLanguage();
  const [added, setAdded] = useState(false);

  const cartItem = cartItems.find((item) => item.id === product.id);
  const qtyInCart = cartItem ? Number(cartItem.quantity) : 0;

  // ------------------------------------------------------------
  // Get current available stock
  // ------------------------------------------------------------
  const availableStock = Number(
    product.inventory?.currentStock ?? 0
  );

  // Product is out of stock when stock is 0 or inventory status
  // explicitly says OUT_OF_STOCK.
  const isOutOfStock =
    availableStock <= 0 ||
    product.inventory?.status === 'OUT_OF_STOCK';

  // Disable + button when cart quantity reaches available stock.
  const isMaxStockReached =
    qtyInCart >= availableStock;

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Do not allow adding if there is no stock.
    if (availableStock <= 0) {
      return;
    }

    // Do not allow adding more than available stock.
    if (qtyInCart >= availableStock) {
      return;
    }

    addToCart(product, 1);

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1500);
  };

  const handleDecrease = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (qtyInCart > 0) {
      updateQuantity(product.id, qtyInCart - 1);
    }
  };

  const handleIncrease = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Never allow quantity to exceed available stock.
    if (qtyInCart >= availableStock) {
      return;
    }

    updateQuantity(product.id, qtyInCart + 1);
  };

  const primaryImage =
    product.images && product.images.length > 0
      ? product.images[0].url
      : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80';

  return (
    <div className="group bg-white rounded-xl border border-slate-200 p-2.5 sm:p-3 flex flex-col justify-between hover:shadow-lg hover:border-[#004d25] transition-all duration-200 relative">

      {/* Product Image Container */}
      <Link
        href={`/products/${product.slug}`}
        className="block relative aspect-square w-full rounded-lg overflow-hidden bg-slate-50 mb-2"
      >
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300"
        />

        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-red-600 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shadow-md">
              {t('outOfStock')}
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between">

        <div>
          <Link
            href={`/products/${product.slug}`}
            className="block"
          >
            <h3 className="font-extrabold text-xs text-slate-900 line-clamp-2 hover:text-[#004d25] transition-colors leading-snug">
              {product.name}
            </h3>
          </Link>

          {product.unit && (
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              {product.unit}
            </p>
          )}
        </div>

        {/* Pricing & Discount Row */}
        <div className="mt-2 pt-1">

          <div className="flex items-center justify-between gap-1">

            <div className="flex items-baseline gap-1.5">

              <span className="text-sm font-black text-[#004d25]">
                ₹{product.sellingPrice}
              </span>

              {product.mrp > product.sellingPrice && (
                <span className="text-[11px] text-slate-400 line-through">
                  ₹{product.mrp}
                </span>
              )}

            </div>

            {product.discountPercent > 0 && (
              <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-tight shrink-0 shadow-xs">
                {product.discountPercent}% OFF
              </span>
            )}

          </div>

          {/* Add To Cart / Quantity Controls */}
          <div className="mt-2">

            {qtyInCart > 0 ? (

              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 rounded-lg p-1">

                {/* Decrease Quantity */}
                <button
                  onClick={handleDecrease}
                  className="p-1 hover:bg-emerald-200 text-emerald-800 rounded transition"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3 h-3" />
                </button>

                {/* Current Quantity */}
                <span className="text-xs font-black px-2 text-emerald-900">
                  {qtyInCart}
                </span>

                {/* Increase Quantity */}
                <button
                  onClick={handleIncrease}
                  disabled={isMaxStockReached}
                  className={`p-1 rounded transition ${
                    isMaxStockReached
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'hover:bg-emerald-200 text-emerald-800'
                  }`}
                  aria-label="Increase quantity"
                  title={
                    isMaxStockReached
                      ? `Only ${availableStock} item(s) available`
                      : 'Increase quantity'
                  }
                >
                  <Plus className="w-3 h-3" />
                </button>

              </div>

            ) : (

              <button
                onClick={handleAdd}
                disabled={isOutOfStock}
                className={`w-full flex items-center justify-center gap-1 text-xs font-bold py-2 px-2 rounded-lg transition shadow-sm ${
                  added
                    ? 'bg-emerald-600 text-white'
                    : isOutOfStock
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-[#005c2a] hover:bg-[#004720] text-white'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />

                <span>
                  {added
                    ? (
                        lang === 'hi'
                          ? 'कार्ट में जोड़ा गया'
                          : 'Added'
                      )
                    : (
                        lang === 'hi'
                          ? 'कार्ट में डालें'
                          : 'Add to Cart'
                      )}
                </span>
              </button>

            )}

          </div>
        </div>
      </div>
    </div>
  );
}