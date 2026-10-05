"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Plus, Trash2, CheckCircle2, AlertCircle, LocateFixed, Map, ExternalLink } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export default function AddressesPage() {
  const { token } = useAuth();
  const router = useRouter();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteAddress, setConfirmDeleteAddress] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [geoLoading, setGeoLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    houseFlat: '',
    streetArea: '',
    city: 'Patna',
    state: 'Bihar',
    pincode: '',
    isDefault: false,
  });

  // GPS Location fetch handler with Google Maps redirection
  const handleFetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // Open Google Maps in new tab pointing to detected coordinates
          window.open(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`, '_blank');

          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
          const data = await res.json();

          if (data && data.address) {
            const addr = data.address;
            const extractedStreet = addr.road || addr.street || addr.suburb || addr.neighbourhood || addr.residential || addr.pedestrian || addr.subdistrict || [addr.road, addr.suburb].filter(Boolean).join(', ') || addr.display_name?.slice(0, 40) || '';
            const extractedCity = addr.city || addr.town || addr.village || addr.district || addr.subdistrict || addr.county || 'Patna';
            const extractedState = addr.state || 'Bihar';
            const extractedPin = (addr.postcode || '').replace(/\D/g, '').slice(0, 6);

            const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

            setFormData(prev => ({
              ...prev,
              streetArea: extractedStreet || prev.streetArea,
              city: extractedCity,
              state: extractedState,
              pincode: /^\d{6}$/.test(extractedPin) ? extractedPin : prev.pincode,
              latitude,
              longitude,
              mapUrl,
            }));

            if (/^\d{6}$/.test(extractedPin)) {
              handlePincodeChange(extractedPin);
            }
          }
        } catch (err) {
          setError('Failed to fetch location address details.');
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        setGeoLoading(false);
        setError('Location permission denied or unavailable.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Auto-fill City & State when 6-digit PIN code is typed
  const handlePincodeChange = async (pinValue) => {
    const cleanPin = pinValue.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, pincode: cleanPin }));

    if (cleanPin.length === 6) {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/delivery/check/${cleanPin}`);
        const data = await res.json();
        if (data.isServiceable && data.data) {
          setFormData(prev => ({
            ...prev,
            city: data.data.city || prev.city,
            state: data.data.state || prev.state,
            streetArea: prev.streetArea || data.data.area || '',
          }));
        } else {
          // Fallback lookup via India Post PIN API if not in local store table
          const postRes = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
          const postData = await postRes.json();
          if (postData && postData[0] && postData[0].Status === 'Success' && postData[0].PostOffice?.length > 0) {
            const po = postData[0].PostOffice[0];
            setFormData(prev => ({
              ...prev,
              city: po.District || po.Division || prev.city,
              state: po.State || prev.state,
              streetArea: prev.streetArea || po.Name || '',
            }));
          }
        }
      } catch (err) {
        console.error('PIN lookup error:', err);
      }
    }
  };

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    fetchAddresses();
  }, [token, router]);

  const fetchAddresses = () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${API_URL}/api/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAddresses(data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleAddAddress = async (e) => {
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
      const res = await fetch(`${API_URL}/api/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('Address saved successfully!');
        setShowForm(false);
        setFormData({
          fullName: '',
          mobileNumber: '',
          houseFlat: '',
          streetArea: '',
          city: 'Patna',
          state: 'Bihar',
          pincode: '',
          isDefault: false,
        });
        fetchAddresses();
      } else {
        setError(data.message || 'Failed to save address');
      }
    } catch (err) {
      setError('Could not connect to server');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    setDeletingId(id);
    setError(null);
    setSuccess(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/addresses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setConfirmDeleteAddress(null);
        setSuccess('Address deleted successfully.');
        setAddresses((prev) => prev.filter((a) => a.id !== id));
        fetchAddresses();
      } else {
        setConfirmDeleteAddress(null);
        setError(data.message || 'Failed to delete address.');
      }
    } catch (err) {
      setConfirmDeleteAddress(null);
      setError('Could not connect to server.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">

        {/* Navigation Breadcrumb */}
        <Link href="/account" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> Back to My Account
        </Link>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Saved Delivery Addresses</h1>
            <p className="text-xs text-slate-500 mt-0.5">Manage your delivery locations and mandatory 6-digit PIN codes</p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add New Address
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

        {/* Add Address Form Modal / Box */}
        {showForm && (
          <form onSubmit={handleAddAddress} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg mb-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-brand-50 p-3 rounded-2xl border border-brand-200">
              <span className="text-xs font-bold text-brand-900">Auto-fill address with device GPS location?</span>
              <button
                type="button"
                onClick={handleFetchCurrentLocation}
                disabled={geoLoading}
                className="bg-brand-600 hover:bg-brand-700 text-white font-black text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow transition disabled:opacity-50 shrink-0"
              >
                <LocateFixed className={`w-3.5 h-3.5 ${geoLoading ? 'animate-spin' : ''}`} />
                <span>{geoLoading ? 'Detecting Location...' : 'Use My Current Location'}</span>
              </button>
            </div>

            <h3 className="text-sm font-black text-slate-900 mb-2">New Delivery Location</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Receiver's name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Mobile Number *</label>
                <input
                  type="text"
                  required
                  placeholder="10-digit phone number"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">House / Flat / Building *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 402, Shivam Apartments"
                  value={formData.houseFlat}
                  onChange={(e) => setFormData({ ...formData, houseFlat: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Street / Area / Colony *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Station Road, Sector 4"
                  value={formData.streetArea}
                  onChange={(e) => setFormData({ ...formData, streetArea: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">State *</label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-brand-700 uppercase mb-1">Mandatory 6-Digit PIN Code *</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="e.g. 800001"
                  value={formData.pincode}
                  onChange={(e) => handlePincodeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-300 rounded-xl font-mono text-sm tracking-widest text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="rounded text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="isDefault" className="text-xs font-semibold text-slate-700">Set as default delivery address</label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2 rounded-xl text-xs transition shadow-sm disabled:opacity-50"
              >
                {submitLoading ? 'Saving Address...' : 'Save Delivery Address'}
              </button>
            </div>
          </form>
        )}

        {/* Address List */}
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading saved addresses...</div>
        ) : addresses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`bg-white rounded-2xl p-5 border shadow-sm relative flex flex-col justify-between ${
                  addr.isDefault ? 'border-brand-500 ring-2 ring-brand-500/10' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-brand-600" /> {addr.fullName}
                    </span>
                    {addr.isDefault && (
                      <span className="bg-brand-100 text-brand-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {addr.houseFlat}, {addr.streetArea}<br />
                    {addr.city}, {addr.state} — <strong className="text-slate-900 font-mono">PIN: {addr.pincode}</strong>
                  </p>
                  <p className="text-xs font-semibold text-slate-500 mt-2">Phone: {addr.mobileNumber}</p>

                  {(addr.mapUrl || (addr.latitude && addr.longitude)) && (
                    <a
                      href={addr.mapUrl || `https://www.google.com/maps/dir/?api=1&destination=${addr.latitude},${addr.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-md mt-2"
                    >
                      <Map className="w-3 h-3" />
                      <span>Google Maps Location</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
                  <button
                    disabled={deletingId === addr.id}
                    onClick={() => setConfirmDeleteAddress(addr)}
                    className="text-slate-400 hover:text-red-600 font-bold text-xs flex items-center gap-1 transition disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deletingId === addr.id ? 'Deleting...' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
            <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900 mb-1">No saved delivery addresses yet.</h3>
            <p className="text-xs text-slate-500 mb-4">Add your home or office delivery address to speed up checkout.</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition inline-block"
            >
              Add New Address
            </button>
          </div>
        )}
      </div>

      {/* Delete Address Confirmation Modal */}
      {confirmDeleteAddress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900">Delete Address?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to delete this saved address?
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs font-medium text-slate-700 mt-2">
                <p className="font-bold text-slate-900">{confirmDeleteAddress.fullName}</p>
                <p>{confirmDeleteAddress.houseFlat}, {confirmDeleteAddress.streetArea}</p>
                <p>{confirmDeleteAddress.city}, {confirmDeleteAddress.state} - {confirmDeleteAddress.pincode}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                disabled={deletingId === confirmDeleteAddress.id}
                onClick={() => setConfirmDeleteAddress(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                disabled={deletingId === confirmDeleteAddress.id}
                onClick={() => handleDeleteAddress(confirmDeleteAddress.id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black text-xs py-3 rounded-xl transition shadow-lg shadow-red-600/20"
              >
                {deletingId === confirmDeleteAddress.id ? 'Deleting...' : 'Delete Address'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}