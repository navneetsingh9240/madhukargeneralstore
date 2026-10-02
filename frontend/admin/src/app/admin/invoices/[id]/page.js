"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Download, CheckCircle2, MapPin, Phone, ShieldCheck, Clock, FileText } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

export default function AdminInvoiceDetailPage({ params }) {
  const unwrappedParams = use(params);
  const orderId = unwrappedParams.id;
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push('/login');
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${API_URL}/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setOrder(data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [orderId, token, router]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    window.open(`${API_URL}/api/invoices/pdf/${orderId}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-center text-xs font-bold text-slate-500">Loading invoice details...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center max-w-sm">
          <h2 className="text-sm font-extrabold text-slate-900 mb-2">Invoice Not Found</h2>
          <Link href="/admin/invoices" className="text-xs font-bold text-brand-600 hover:underline">
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  const couponDiscountVal = order.couponDiscount ?? order.discount ?? 0;

  return (
    <div className="min-h-screen bg-slate-100/60 pb-12 print:p-0 print:bg-white">
      <div className="container mx-auto max-w-4xl px-4 pt-8 print:p-0 print:max-w-none">

        {/* Action Header - Hidden when printing */}
        <div className="no-print flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link href="/admin/invoices" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 transition">
            <ArrowLeft className="w-4 h-4" /> Back to Invoices
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition"
            >
              <Printer className="w-4 h-4" /> PRINT INVOICE
            </button>
            <button
              onClick={handleDownloadPdf}
              className="bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition"
            >
              <Download className="w-4 h-4" /> DOWNLOAD PDF
            </button>
          </div>
        </div>

        {/* PRINTABLE A4 INVOICE SHEET */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xl space-y-8 print:shadow-none print:border-none print:p-0">

          {/* Top Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-brand-700 font-extrabold text-xl tracking-tight">
                <ShieldCheck className="w-6 h-6 text-brand-600" />
                <span>MADHUKAR GENERAL STORE</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Main Market Road, Sector 4, City Center, Patna, Bihar - 800001</p>
              <p className="text-xs text-slate-500 font-medium">Support: +91 9876543210 | Email: support@madhukargeneralstore.com</p>
              <p className="text-[11px] font-bold text-brand-700">GSTIN: 10AAAAA0000A1Z5</p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="inline-block px-3 py-1 rounded-full bg-brand-100 text-brand-800 font-extrabold text-xs uppercase tracking-wider mb-1">
                TAX INVOICE
              </span>
              <p className="font-mono text-sm font-black text-slate-900">
                {order.invoice?.invoiceNumber || `MGS-INV-${order.orderNumber || order.id}`}
              </p>
              <p className="text-xs font-semibold text-slate-600">
                Order #{order.orderNumber}
              </p>
              <p className="text-xs text-slate-500">
                Date: {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Billed Customer & Shipping Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/80 p-6 rounded-2xl border border-slate-100 text-xs">
            <div className="space-y-1">
              <span className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider">Customer Details</span>
              <p className="font-extrabold text-slate-900 text-sm">{order.address?.fullName || order.user?.name}</p>
              <p className="text-slate-600">Phone: {order.address?.mobileNumber || order.user?.phone}</p>
              <p className="text-slate-600">{order.user?.email}</p>
            </div>

            <div className="space-y-1">
              <span className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider">Delivery Address</span>
              <p className="text-slate-800 font-semibold">
                {order.address?.houseFlat}, {order.address?.streetArea}<br />
                {order.address?.city}, {order.address?.state} — <strong className="font-mono text-slate-900">PIN: {order.deliveryPincode}</strong>
              </p>
              <p className="text-slate-600 mt-1">
                Payment: <span className="font-bold uppercase text-slate-900">{order.paymentMethod}</span> ({order.paymentStatus})
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 text-slate-400 uppercase font-extrabold text-[10px] tracking-wider bg-slate-50">
                  <th className="py-3 px-3">Item Description</th>
                  <th className="py-3 px-3">Unit</th>
                  <th className="py-3 px-3">MRP</th>
                  <th className="py-3 px-3">Selling Price</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {order.items.map((item) => {
                  const sellingPrice = item.sellingPrice ?? item.price ?? 0;
                  const mrp = item.mrp ?? sellingPrice;
                  const itemSubtotal = item.subtotal ?? (sellingPrice * item.quantity);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900">{item.productName}</p>
                        {item.sku && <p className="text-[10px] font-mono text-slate-400">SKU: {item.sku}</p>}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-600">{item.unit || '-'}</td>
                      <td className="py-3 px-3 font-medium text-slate-400 line-through">₹{mrp}</td>
                      <td className="py-3 px-3 font-bold text-slate-800">₹{sellingPrice}</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-700">{item.quantity}</td>
                      <td className="py-3 px-3 text-right font-black text-slate-900">₹{itemSubtotal}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Total Breakdown & QR Stamp */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t border-slate-200 pt-6">
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 max-w-sm print:border-none">
              <div className="w-20 h-20 bg-white p-1 rounded-xl border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                    `http://localhost:3002/delivery?token=${order.invoice?.qrToken || `mgs_qr_tok_${order.orderNumber}`}`
                  )}`}
                  alt="Order Verification QR"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-slate-900 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-600" /> Digital Verified Bill
                </p>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Delivery Verification Unique QR ID:
                </p>
                <div className="bg-slate-200/80 px-2 py-0.5 rounded font-mono font-bold text-[10px] text-slate-900 tracking-wider truncate max-w-[180px]">
                  {order.invoice?.qrToken || `mgs_qr_tok_${order.orderNumber}`}
                </div>
              </div>
            </div>

            <div className="w-full sm:w-64 space-y-2 text-xs border-t sm:border-t-0 pt-4 sm:pt-0">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">₹{order.subtotal}</span>
              </div>
              {couponDiscountVal > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon Discount</span>
                  <span className="font-bold">-₹{couponDiscountVal}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charge</span>
                <span className="font-bold text-slate-900">
                  {order.deliveryCharge === 0 ? <strong className="text-emerald-600">FREE</strong> : `₹${order.deliveryCharge}`}
                </span>
              </div>
              {order.taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>GST / Tax (5%)</span>
                  <span className="font-bold text-slate-900">₹{Number(order.taxAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-200 pt-2">
                <span>Grand Total</span>
                <span className="text-brand-700">₹{order.totalAmount}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-4">
            Madhukar General Store Tax Invoice • Thank you for your business!
          </div>

        </div>
      </div>
    </div>
  );
}