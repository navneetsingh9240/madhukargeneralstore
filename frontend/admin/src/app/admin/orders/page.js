"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Filter, Printer, FileText, CheckCircle2, Truck, Package, Clock, XCircle, Navigation, Map, ExternalLink } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, [token, router]);

  const fetchOrders = () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${API_URL}/api/admin/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setOrders(data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderStatus: newStatus }),
      });

      const data = await res.json();
      if (data.success) {
        fetchOrders();
      } else {
        alert(data.message || 'Failed to update order status');
      }
    } catch (err) {
      alert('Error updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'ALL' || o.orderStatus === statusFilter;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.user?.name.toLowerCase().includes(search.toLowerCase()) ||
      o.deliveryPincode.includes(search);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-100/60 pb-12">
      <div className="container mx-auto max-w-6xl px-4 pt-8">

        <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Admin Overview
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Order Fulfillment & Dispatch</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage incoming orders, update delivery pipeline status, and print digital bills</p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            <span className="text-xs font-bold text-slate-400 uppercase shrink-0">Status:</span>
            {['ALL', 'PENDING', 'CONFIRMED', 'PACKING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                  statusFilter === st
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Filter by Order #, Name, or PIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading orders...</div>
          ) : filteredOrders.length > 0 ? (
            filteredOrders.map((ord) => (
              <div key={ord.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-slate-900 text-base">#{ord.orderNumber}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(ord.createdAt).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500">Update Status:</span>
                    <select
                      disabled={updatingId === ord.id}
                      value={ord.orderStatus}
                      onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                      className="bg-slate-100 border border-slate-300 font-extrabold text-xs text-slate-900 px-3 py-1.5 rounded-xl focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PACKING">PACKING</option>
                      <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer</span>
                    <p className="font-bold text-slate-900">{ord.address?.fullName || ord.user?.name}</p>
                    <p className="text-slate-600">Phone: {ord.address?.mobileNumber || ord.user?.phone}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Delivery Address</span>
                    <p className="text-slate-700">
                      {ord.address?.houseFlat}, {ord.address?.streetArea}<br />
                      {ord.address?.city}, {ord.address?.state} — <strong className="font-mono text-slate-900">PIN: {ord.deliveryPincode}</strong>
                    </p>
                    <a
                      href={ord.address?.mapUrl || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${ord.address?.houseFlat || ''}, ${ord.address?.streetArea || ''}, ${ord.address?.city || ''}, ${ord.address?.state || ''} ${ord.deliveryPincode}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-md mt-1.5"
                    >
                      <Navigation className="w-3 h-3 text-brand-600" />
                      <span>Google Maps Directions</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Bill & Payment</span>
                    <p className="font-black text-slate-900 text-sm">₹{ord.totalAmount}</p>
                    <p className="text-slate-600 uppercase font-semibold">
                      Method: {ord.paymentMethod} ({ord.paymentStatus})
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-wrap items-center justify-between gap-3 pt-3">
                  <div className="text-xs text-slate-600">
                    <span className="font-bold text-slate-800">{ord.items.length} Items:</span>{' '}
                    {ord.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                  </div>

                  <Link
                    href={`/admin/invoices/${ord.id}`}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5" /> View / Print A4 Bill
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center text-xs text-slate-400 border border-slate-200">
              No orders found matching status filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}