"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowLeft, Search, FileText, CheckCircle2, Clock, Truck, Package, XCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';

export default function OrdersPage() {
  const { token } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [reorderedId, setReorderedId] = useState(null);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const loadOrders = () => {
      fetch(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setOrders(data.data);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    };

    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, [token, router]);

  const handleReorder = (order) => {
    setReorderedId(order.id);
    order.items.forEach((item) => {
      addToCart({
        id: item.productId,
        name: item.productName,
        sellingPrice: item.price,
        unit: item.unit,
        images: [{ url: item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500' }],
      }, item.quantity);
    });

    setTimeout(() => {
      setReorderedId(null);
      router.push('/cart');
    }, 800);
  };

  const filteredOrders = orders.filter((o) =>
    o.orderNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
    o.items.some((i) => i.productName.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> DELIVERED</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="bg-amber-100 text-amber-800 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> OUT FOR DELIVERY</span>;
      case 'PACKING':
        return <span className="bg-blue-100 text-blue-800 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1"><Package className="w-3.5 h-3.5" /> PACKING</span>;
      case 'CANCELLED':
        return <span className="bg-red-100 text-red-800 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> CANCELLED</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">

        {/* Navigation Breadcrumb */}
        <Link href="/account" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> Back to My Account
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Order History</h1>
            <p className="text-xs text-slate-500 mt-0.5">Track your past and current grocery deliveries</p>
          </div>

          {/* Search Order Bar */}
          <div className="relative max-w-xs w-full">
            <input
              type="text"
              placeholder="Filter by Order # or Product..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        {/* Order List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading your orders...</div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md transition"
              >
                {/* Order Header */}
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Order Reference</span>
                      <span className="font-mono font-black text-slate-900 text-sm">#{order.orderNumber}</span>
                    </div>
                    <div className="border-l border-slate-200 h-8"></div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Date Placed</span>
                      <span className="text-xs font-semibold text-slate-700">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.orderStatus)}
                  </div>
                </div>

                {/* Items Summary */}
                <div className="p-4 space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                          {item.quantity}x
                        </span>
                        <span className="font-medium text-slate-800">{item.productName}</span>
                        <span className="text-slate-400">({item.unit})</span>
                      </div>
                      <span className="font-bold text-slate-900">₹{item.subtotal}</span>
                    </div>
                  ))}
                </div>

                {/* Order Footer & Actions */}
                <div className="bg-slate-50/50 px-4 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-slate-500 font-medium">
                      Payment: <span className="font-bold text-slate-800 uppercase">{order.paymentMethod}</span> ({order.paymentStatus})
                    </span>
                    <span className="text-xs text-slate-400 ml-3">Delivery PIN: <strong className="text-slate-700">{order.deliveryPincode}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-slate-900 mr-2">Total: ₹{order.totalAmount}</span>

                    <button
                      onClick={() => handleReorder(order)}
                      disabled={reorderedId === order.id}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${reorderedId === order.id ? 'animate-spin' : ''}`} />
                      <span>{reorderedId === order.id ? 'Adding to Cart...' : 'Reorder All'}</span>
                    </button>

                    <Link
                      href={`/account/orders/${order.id}`}
                      className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5" /> View Invoice
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 mb-1">No orders found</h3>
            <p className="text-xs text-slate-500 mb-6">You haven&apos;t placed any orders matching your criteria.</p>
            <Link
              href="/shop"
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition inline-block"
            >
              Browse Grocery Shop
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}