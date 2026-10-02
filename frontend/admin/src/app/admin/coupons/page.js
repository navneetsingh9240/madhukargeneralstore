"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Tag, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export default function AdminCouponsPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'FIXED',
    discountAmount: '50',
    minOrderAmount: '200',
    maxDiscount: '',
    expiresAt: '',
  });

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    fetchCoupons();
    const interval = setInterval(() => {
      fetchCoupons();
    }, 5000);

    return () => clearInterval(interval);
  }, [token, router]);

  const fetchCoupons = () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${API_URL}/api/admin/coupons`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCoupons(data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setModalLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/admin/coupons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setFormData({
          code: '',
          description: '',
          discountType: 'FIXED',
          discountAmount: '50',
          minOrderAmount: '200',
          maxDiscount: '',
          expiresAt: '',
        });
        fetchCoupons();
      } else {
        alert(data.message || 'Failed to create coupon');
      }
    } catch (err) {
      alert('Error creating coupon');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleCoupon = async (id) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/admin/coupons/${id}/toggle`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchCoupons();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/60 pb-12">
      <div className="container mx-auto max-w-5xl px-4 pt-8">

        <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Admin Overview
        </Link>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Coupons & Promotional Offers</h1>
            <p className="text-xs text-slate-500 mt-0.5">Create discount codes for customer checkout</p>
          </div>

          <button
            onClick={() => setShowAddModal(!showAddModal)}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create New Coupon
          </button>
        </div>

        {/* Add Coupon Modal */}
        {showAddModal && (
          <form onSubmit={handleCreateCoupon} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg mb-8 space-y-4">
            <h3 className="text-sm font-black text-slate-900 mb-2">New Store Coupon Code</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-brand-700 uppercase mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WELCOME100"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-brand-300 rounded-xl font-mono text-sm uppercase tracking-wider text-slate-900 font-bold focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Discount Type *</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-medium focus:ring-2 focus:ring-brand-500"
                >
                  <option value="FIXED">Fixed Amount (₹ Off)</option>
                  <option value="PERCENTAGE">Percentage (% Off)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Discount Value *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 50 or 15"
                  value={formData.discountAmount}
                  onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-medium focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Min Order Amount (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 299"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-medium focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 uppercase mb-1">Description / Title</label>
                <input
                  type="text"
                  placeholder="e.g. ₹50 Instant Discount on orders above ₹200"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-medium focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={modalLoading}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2 rounded-xl text-xs shadow-sm disabled:opacity-50"
              >
                {modalLoading ? 'Creating...' : 'Save Coupon'}
              </button>
            </div>
          </form>
        )}

        {/* Coupons Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading coupons...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <th className="py-3 px-4">Coupon Code</th>
                    <th className="py-3 px-4">Discount</th>
                    <th className="py-3 px-4">Min. Order</th>
                    <th className="py-3 px-4">Times Used</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coupons.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <span className="font-mono font-black text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-lg text-xs">
                          {c.code}
                        </span>
                        {c.description && <p className="text-[10px] text-slate-400 mt-1">{c.description}</p>}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {c.discountType === 'PERCENTAGE' ? `${c.discountAmount}% OFF` : `₹${c.discountAmount} OFF`}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">₹{c.minOrderAmount}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{c.usedCount}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleCoupon(c.id)}
                          className="text-xs font-bold text-slate-700 hover:text-brand-600 transition"
                        >
                          {c.isActive ? <ToggleRight className="w-6 h-6 text-emerald-600 inline" /> : <ToggleLeft className="w-6 h-6 text-slate-400 inline" />}
                        </button>
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