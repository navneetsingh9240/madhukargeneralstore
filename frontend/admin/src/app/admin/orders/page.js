"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Filter, Printer, FileText, CheckCircle2, Truck, Package, Clock, XCircle, Navigation, Map, ExternalLink, ShieldCheck, Eye } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // UPI Payment Verification Modal State
  const [verifyModalOrder, setVerifyModalOrder] = useState(null);
  const [rejectModalOrder, setRejectModalOrder] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [viewScreenshotUrl, setViewScreenshotUrl] = useState('');

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

  const handleConfirmVerifyPayment = async () => {
    if (!verifyModalOrder || !token) return;
    setVerifying(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/admin/orders/${verifyModalOrder.id}/payment/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        setVerifyModalOrder(null);
        fetchOrders();
      } else {
        alert(data.message || 'Failed to verify payment');
      }
    } catch (err) {
      alert('Error verifying payment');
    } finally {
      setVerifying(false);
    }
  };

  const handleConfirmRejectPayment = async () => {
    if (!rejectModalOrder || !token) return;
    setVerifying(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/admin/orders/${rejectModalOrder.id}/payment/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        setRejectModalOrder(null);
        fetchOrders();
      } else {
        alert(data.message || 'Failed to reject payment');
      }
    } catch (err) {
      alert('Error rejecting payment');
    } finally {
      setVerifying(false);
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

                {/* UPI Verification Info Block */}
                {(ord.paymentMethod === 'UPI' || ord.payments?.[0]?.paymentMethod === 'UPI') && (
                  <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-700" />
                        <span className="text-xs font-black text-amber-900">UPI Payment Verification</span>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        ord.paymentStatus === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.paymentStatus === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-200 text-amber-900'
                      }`}>
                        {ord.paymentStatus === 'COMPLETED' ? 'VERIFIED & COMPLETED' : ord.paymentStatus === 'REJECTED' ? 'REJECTED' : 'VERIFICATION PENDING'}
                      </span>
                    </div>

                    {(() => {
                      const pay = ord.payments?.[0] || {};
                      const rawTx = pay.transactionId || '';
                      let utr = 'N/A';
                      let screenshotUrl = '';

                      if (rawTx.includes('UTR:')) {
                        const parts = rawTx.split('|');
                        utr = parts[0].replace('UTR:', '');
                        if (parts[1] && parts[1].startsWith('SCREENSHOT:')) {
                          screenshotUrl = parts[1].replace('SCREENSHOT:', '');
                        }
                      } else if (rawTx) {
                        utr = rawTx;
                      }

                      return (
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div>
                            <p className="text-slate-600">Expected Amount: <strong className="text-slate-900">₹{ord.totalAmount}</strong></p>
                            <p className="text-slate-600 font-mono">UTR / Transaction ID: <strong className="text-brand-800 font-bold">{utr}</strong></p>
                          </div>

                          <div className="flex items-center gap-2">
                            {screenshotUrl && (
                              <button
                                onClick={() => setViewScreenshotUrl(screenshotUrl)}
                                className="bg-white hover:bg-slate-100 text-slate-800 font-bold px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1 shadow-sm text-[11px]"
                              >
                                <Eye className="w-3.5 h-3.5" /> View Screenshot
                              </button>
                            )}

                            {ord.paymentStatus !== 'COMPLETED' && (
                              <>
                                <button
                                  onClick={() => setVerifyModalOrder(ord)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3.5 py-1.5 rounded-xl text-[11px] shadow-sm transition"
                                >
                                  ✓ VERIFY PAYMENT
                                </button>
                                <button
                                  onClick={() => setRejectModalOrder(ord)}
                                  className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-3 py-1.5 rounded-xl border border-red-200 text-[11px] transition"
                                >
                                  ✕ REJECT
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

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

      {/* Verify Payment Confirmation Modal */}
      {verifyModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 text-center">
            <h3 className="text-lg font-black text-slate-900">Verify Payment?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Please confirm that <strong className="text-slate-900">₹{verifyModalOrder.totalAmount}</strong> has actually been received in the store's merchant UPI or bank account for Order <strong className="text-slate-900">#{verifyModalOrder.orderNumber}</strong>.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                disabled={verifying}
                onClick={() => setVerifyModalOrder(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                disabled={verifying}
                onClick={handleConfirmVerifyPayment}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-xl transition shadow-md shadow-emerald-600/30"
              >
                {verifying ? 'Verifying...' : 'Verify Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Confirmation Modal */}
      {rejectModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 text-center">
            <h3 className="text-lg font-black text-slate-900">Reject Payment?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to reject the payment submission for Order <strong className="text-slate-900">#{rejectModalOrder.orderNumber}</strong>? The customer will be prompted to re-enter payment proof.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                disabled={verifying}
                onClick={() => setRejectModalOrder(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                disabled={verifying}
                onClick={handleConfirmRejectPayment}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black text-xs py-3 rounded-xl transition shadow-md shadow-red-600/20"
              >
                {verifying ? 'Rejecting...' : 'Reject Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Screenshot Modal */}
      {viewScreenshotUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 text-center">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900">Payment Proof Screenshot</span>
              <button onClick={() => setViewScreenshotUrl('')} className="text-slate-400 hover:text-slate-700 text-base font-bold">✕</button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-2xl border border-slate-200 p-2">
              <img src={viewScreenshotUrl} alt="Payment Proof" className="w-full h-auto object-contain rounded-xl" />
            </div>
            <button
              onClick={() => setViewScreenshotUrl('')}
              className="w-full bg-slate-900 text-white font-bold text-xs py-2.5 rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}