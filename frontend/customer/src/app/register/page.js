"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Lock, Phone, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function RegisterPage() {
  const { lang, t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const data = await res.json();

      if (data.success) {
        login(data.data);
        router.push('/account');
      } else {
        setError(data.message || 'Failed to create account');
      }
    } catch (err) {
      setError('Could not connect to authentication server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mx-auto font-bold">
            <User className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">{t('register')}</h1>
          <p className="text-xs text-slate-500 font-semibold">{lang === 'hi' ? 'ताज़ा राशन ऑर्डर करने के लिए खाता बनाएं' : 'Join Madhukar General Store for fast grocery shopping'}</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('fullName')} *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('emailAddress')} *</label>
            <input
              type="email"
              required
              placeholder="name@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('mobileNumber')}</label>
            <input
              type="text"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
            <input
              type="password"
              required
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:border-brand-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs py-3 rounded-xl transition shadow-lg shadow-brand-600/30"
          >
            {loading ? (lang === 'hi' ? 'खाता बनाया जा रहा है...' : 'CREATING ACCOUNT...') : (lang === 'hi' ? 'रजिस्टर करें' : 'REGISTER ACCOUNT')}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 font-semibold">
          {lang === 'hi' ? 'पहले से खाता है?' : 'Already have an account?'}{' '}
          <Link href="/login" className="text-brand-600 font-extrabold hover:underline">
            {t('login')}
          </Link>
        </p>
      </div>
    </div>
  );
}