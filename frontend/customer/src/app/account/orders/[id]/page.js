"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Download, CheckCircle2, Clock, Truck, Package, ShieldCheck, MapPin, QrCode } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

export default function OrderDetailsPage({ params }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const { token } = useAuth();
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${API_URL}/api/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOrder(data.data);
        } else {
          setError(data.message || 'Failed to load order');
        }
      })
      .catch((err) => setError('Could not connect to server'))
      .finally(() => setLoading(false));
  }, [id, token, router]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    window.open(`${API_URL}/api/invoices/pdf/${id}`, '_blank');
  };

  if (loading) {
    return <div className="min-h-screen p-12 text-center text-xs text-slate-400">Loading invoice details...</div>;
  }

  if (error || !order) {
    return (
      <div className="min-h-screen p-12 text-center">
        <p className="text-red-600 font-bold mb-4">{error || 'Order not found'}</p>
        <Link href="/account/orders" className="text-xs font-bold text-brand-600 hover:underline">
          Return to Orders
        </Link>
      </div>
    );
  }

  const statuses = ['CONFIRMED', 'PACKING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const currentIdx = statuses.indexOf(order.orderStatus);

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 print:p-0 print:bg-white">
      <div className="container mx-auto max-w-3xl">

        {/* Navigation & Action Buttons (Hidden when printing) */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 print:hidden">
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Orders
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Printer className="w-4 h-4 text-slate-600" /> Print Invoice
            </button>
            <button
              onClick={handleDownloadPdf}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>
        </div>


        {/* Order Status Timeline Tracker (Hidden when printing) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm mb-6 print:hidden">
          <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
            <Truck className="w-4 h-4 text-brand-600" /> Order Tracking & Status Timeline
          </h3>

          <div className="grid grid-cols-4 gap-2 relative">
            {statuses.map((st, idx) => {
              const isDone = currentIdx >= idx;
              const isCurrent = currentIdx === idx;

              return (
                <div key={st} className="text-center relative z-10">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-2 text-xs font-black transition ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}
                  >
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] font-bold block ${
                      isDone ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {st.replace(/_/g, ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Printable Official Digital Tax Invoice Box */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl print:shadow-none print:border-none print:p-0">

          {/* Header Store Info */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-6 mb-6 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center font-black text-base print:hidden">
                  M
                </div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">MADHUKAR GENERAL STORE</h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">Main Market Road, Sector 4, City Center</p>
              <p className="text-xs text-slate-500">Phone: +91 9876543210 | Email: support@madhukargeneralstore.com</p>
              <p className="text-[11px] font-bold text-brand-700 mt-0.5">GSTIN: 10AAAAA0000A1Z5</p>
            </div>

            <div className="text-left sm:text-right bg-brand-50/50 p-4 rounded-2xl border border-brand-100 print:bg-transparent print:border-none print:p-0">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-brand-700 block">TAX INVOICE</span>
              <p className="font-mono font-black text-slate-900 text-base">
                {order.invoice ? order.invoice.invoiceNumber : `MGS-INV-${order.orderNumber}`}
              </p>
              <p className="text-xs font-semibold text-slate-600 mt-1">
                Order #{order.orderNumber}
              </p>
              <p className="text-[11px] text-slate-500">
                Date: {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Customer & Address Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6 print:bg-transparent print:border-slate-200">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1">
                BILLED TO / CUSTOMER DETAILS
              </span>
              <p className="text-sm font-extrabold text-slate-900">{order.address?.fullName || order.user?.name}</p>
              <p className="text-xs text-slate-600 mt-0.5">Phone: {order.address?.mobileNumber || order.user?.phone}</p>
              <p className="text-xs text-slate-600 mt-0.5">
                {order.address?.houseFlat}, {order.address?.streetArea}
              </p>
              <p className="text-xs font-bold text-slate-800">
                {order.address?.city}, {order.address?.state} — PIN: {order.deliveryPincode}
              </p>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1">
                PAYMENT & FULFILLMENT
              </span>
              <p className="text-xs text-slate-700">
                Payment Method: <span className="font-bold uppercase text-slate-900">{order.paymentMethod}</span>
              </p>
              <p className="text-xs text-slate-700 mt-0.5">
                Payment Status: <span className="font-bold text-emerald-700 uppercase">{order.paymentStatus}</span>
              </p>
              <p className="text-xs text-slate-700 mt-0.5">
                Order Status: <span className="font-bold text-brand-700 uppercase">{order.orderStatus}</span>
              </p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3">Unit</th>
                  <th className="py-2.5 px-3">MRP</th>
                  <th className="py-2.5 px-3">Selling Price</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{item.productName}</p>
                      <p className="text-[10px] font-mono text-slate-400">SKU: {item.sku}</p>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-600">{item.unit}</td>
                    <td className="py-3 px-3 font-medium text-slate-400 line-through">₹{item.mrp}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">₹{item.sellingPrice}</td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900">{item.quantity}</td>
                    <td className="py-3 px-3 text-right font-black text-slate-900">₹{item.subtotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Summary & QR Code Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t border-slate-200">

            {/* Real Scannable QR Code & Unique QR ID */}
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 max-w-sm print:border-none">
              <div className="w-20 h-20 bg-white p-1 rounded-xl border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                    `http://localhost:3002/delivery?token=${order.invoice?.qrToken || `mgs_qr_tok_${order.orderNumber}`}`
                  )}`}
                  alt="Order QR Verification Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-slate-900 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-600" /> Digital Verified Bill
                </p>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Scan QR with camera to open delivery portal, or enter Unique QR ID manually:
                </p>
                <div className="bg-slate-200/80 px-2 py-0.5 rounded font-mono font-bold text-[10px] text-slate-900 tracking-wider truncate max-w-[180px]">
                  {order.invoice?.qrToken || `mgs_qr_tok_${order.orderNumber}`}
                </div>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-800">₹{order.subtotal}</span>
              </div>
              {order.couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Coupon Discount:</span>
                  <span className="font-bold">-₹{order.couponDiscount}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Delivery Fee:</span>
                <span className="font-semibold text-slate-800">
                  {order.deliveryCharge === 0 ? <strong className="text-emerald-600">FREE</strong> : `₹${order.deliveryCharge}`}
                </span>
              </div>
              {order.taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>GST / Tax (5%):</span>
                  <span className="font-semibold text-slate-800">
                    {Number(order.taxAmount || 0).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                <span>Grand Total:</span>
                <span className="text-brand-700 text-base">₹{order.totalAmount}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-4">
            Thank you for shopping at Madhukar General Store! For support or inquiries, contact +91 9876543210.
          </div>
        </div>
      </div>
    </div>
  );
}