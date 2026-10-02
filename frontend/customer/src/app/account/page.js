"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, MapPin, Heart, LogOut, PackageCheck, User as UserIcon, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AccountPage() {
  const { user, token, logout } = useAuth();
  const router = useRouter();

  const [recentOrders, setRecentOrders] = useState([]);
  const [addressCount, setAddressCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    Promise.all([
      fetch(`${API_URL}/api/orders`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${API_URL}/api/addresses`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${API_URL}/api/wishlist`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ])
      .then(([ordersRes, addrsRes, wishRes]) => {
        if (ordersRes.success) setRecentOrders(ordersRes.data.slice(0, 3));
        if (addrsRes.success) setAddressCount(addrsRes.data.length);
        if (wishRes.success) setWishlistCount(wishRes.data.length);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [token, router]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4">
      <div className="container mx-auto max-w-5xl">

        {/* Profile Welcome Header */}
        <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 text-white rounded-3xl p-6 md:p-8 shadow-xl mb-8 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-2xl text-white shadow-inner">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight">{user.name}</h1>
                  <span className="bg-brand-500/30 text-brand-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-white/10">
                    {user.role}
                  </span>
                </div>
                <p className="text-xs text-brand-200 mt-1">{user.email} • {user.phone || 'No phone added'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              {['ADMIN', 'STAFF'].includes(user.role) && (
                <Link
                  href="/admin"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold px-4 py-2 rounded-xl text-xs transition shadow-md"
                >
                  Admin Portal
                </Link>
              )}
              <button
                onClick={logout}
                className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-xl text-xs backdrop-blur-md transition flex items-center gap-1.5 border border-white/20"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link
            href="/account/orders"
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-brand-500 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-1 transition" />
            </div>
            <p className="text-2xl font-black text-slate-900">{recentOrders.length}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Total Orders Placed</p>
          </Link>

          <Link
            href="/account/addresses"
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-brand-500 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <MapPin className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
            </div>
            <p className="text-2xl font-black text-slate-900">{addressCount}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Saved Delivery Addresses</p>
          </Link>

          <Link
            href="/account/wishlist"
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-brand-500 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                <Heart className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-red-600 group-hover:translate-x-1 transition" />
            </div>
            <p className="text-2xl font-black text-slate-900">{wishlistCount}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">Saved Wishlist Items</p>
          </Link>
        </div>

        {/* Recent Orders Overview */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Recent Orders</h2>
              <p className="text-xs text-slate-500">Track and view invoices for your recent grocery purchases</p>
            </div>
            <Link
              href="/account/orders"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View All Orders <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading order history...</div>
          ) : recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/50 transition gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">#{order.orderNumber}</span>
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          order.orderStatus === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      • {order.items.length} Items • PIN: {order.deliveryPincode}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span className="text-base font-black text-slate-900">₹{order.totalAmount}</span>
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm"
                    >
                      View Invoice
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <PackageCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No orders placed yet</p>
              <p className="text-xs text-slate-400 mb-4">Explore our fresh grocery collection and place your first order.</p>
              <Link
                href="/shop"
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-5 py-2 rounded-xl text-xs transition inline-block"
              >
                Start Shopping Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
