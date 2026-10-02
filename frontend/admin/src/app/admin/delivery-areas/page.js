"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, MapPin, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export default function AdminDeliveryAreasPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    pincode: '',
    area: '',
    city: 'Begusarai',
    state: 'Bihar',
    deliveryCharge: '30',
    minimumOrderAmount: '100',
    estimatedDeliveryTime: 'Same Day Delivery',
  });

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    fetchDeliveryAreas();
  }, [token, router]);

  const fetchDeliveryAreas = () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${API_URL}/api/admin/delivery-areas`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAreas(data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleAddArea = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!/^\d{6}$/.test(formData.pincode)) {
      setError('PIN code must be exactly 6 digits');
      return;
    }

    setSubmitLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/admin/delivery-areas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(`PIN code ${formData.pincode} added to delivery network!`);
        setShowAddModal(false);
        setFormData({
          pincode: '',
          area: '',
          city: 'Begusarai',
          state: 'Bihar',
          deliveryCharge: '30',
          minimumOrderAmount: '100',
          estimatedDeliveryTime: 'Same Day Delivery',
        });
        fetchDeliveryAreas();
      } else {
        setError(data.message || 'Failed to add delivery PIN code');
      }
    } catch (err) {
      setError('Error adding PIN code');
    } finally {
      setSubmitLoading(false);
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Delivery PIN Codes Network</h1>
            <p className="text-xs text-slate-500 mt-0.5">Configure serviceable 6-digit Indian PIN codes, delivery charges, and minimum order values</p>
          </div>

          <button
            onClick={() => setShowAddModal(!showAddModal)}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Serviceable PIN
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 text-xs font-semibold flex items-center gap-2 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-200 text-xs font-semibold flex items-center gap-2 mb-6">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* Add PIN Modal / Form */}
        {showAddModal && (
          <form onSubmit={handleAddArea} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg mb-8 space-y-4">
            <h3 className="text-sm font-black text-slate-900 mb-2">New Serviceable PIN Code Area</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-brand-700 uppercase mb-1">Mandatory 6-Digit PIN Code *</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="e.g. 800001"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3 py-2 border border-brand-300 rounded-xl font-mono text-sm tracking-widest text-slate-900 font-bold focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Area / Locality Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Station Road / Sector 4"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-medium focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-medium focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">State *</label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-medium focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Delivery Charge (₹) *</label>
                <input
                  type="number"
                  required
                  value={formData.deliveryCharge}
                  onChange={(e) => setFormData({ ...formData, deliveryCharge: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-medium focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Minimum Order Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={formData.minimumOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minimumOrderAmount: e.target.value })}
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
                disabled={submitLoading}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2 rounded-xl text-xs shadow-sm disabled:opacity-50"
              >
                {submitLoading ? 'Saving...' : 'Add Delivery Area'}
              </button>
            </div>
          </form>
        )}

        {/* PIN Code Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading delivery network...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <th className="py-3 px-4">PIN Code</th>
                    <th className="py-3 px-4">Area & City</th>
                    <th className="py-3 px-4">Delivery Fee</th>
                    <th className="py-3 px-4">Min. Order</th>
                    <th className="py-3 px-4">Est. Time</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {areas.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-black text-slate-900 text-sm">
                        {a.pincode}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800">{a.area}</span><br />
                        <span className="text-[10px] text-slate-400">{a.city}, {a.state}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {a.deliveryCharge === 0 ? 'FREE' : `₹${a.deliveryCharge}`}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">₹{a.minimumOrderAmount}</td>
                      <td className="py-3 px-4 text-slate-600">{a.estimatedDeliveryTime}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          a.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {a.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
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
