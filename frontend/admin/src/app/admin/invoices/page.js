"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Printer, Download, FileText, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export default function AdminInvoicesPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    fetchInvoices();
  }, [token, router]);

  const fetchInvoices = () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${API_URL}/api/admin/invoices`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setInvoices(data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleDownloadPdf = (orderId) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    window.open(`${API_URL}/api/invoices/pdf/${orderId}`, '_blank');
  };

  const filteredInvoices = invoices.filter((inv) => {
    const term = search.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(term) ||
      inv.order?.orderNumber.toLowerCase().includes(term) ||
      inv.order?.address?.fullName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-slate-100/60 pb-12">
      <div className="container mx-auto max-w-6xl px-4 pt-8">

        <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Admin Overview
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Digital Tax Invoices & Billing</h1>
            <p className="text-xs text-slate-500 mt-0.5">Search all store tax invoices, print A4 bills, and download generated PDFs</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by Invoice #, Order #, or Customer Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-xl">
            {filteredInvoices.length} Invoices Found
          </span>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading billing records...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Billed To</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-black text-brand-700">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        #{inv.order?.orderNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800">{inv.order?.address?.fullName || inv.order?.user?.name}</span><br />
                        <span className="text-[10px] text-slate-400">PIN: {inv.order?.deliveryPincode}</span>
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900">₹{inv.order?.totalAmount}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold uppercase text-slate-700">{inv.order?.paymentMethod}</span> ({inv.order?.paymentStatus})
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(inv.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/invoices/${inv.orderId}`}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 transition"
                          >
                            <Printer className="w-3.5 h-3.5" /> View / Print
                          </Link>
                          <button
                            onClick={() => handleDownloadPdf(inv.orderId)}
                            className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 transition shadow-sm"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
