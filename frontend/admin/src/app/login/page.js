"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Lock, ArrowRight, ShieldCheck, AlertCircle, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function LoginPage() {
  const { lang, changeLanguage, t } = useLanguage();
  const [email, setEmail] = useState('customer@gmail.com');
  const [password, setPassword] = useState('Password123!');
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
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        login(data.data);
        if (['ADMIN', 'STAFF'].includes(data.data.user.role)) {
          router.push('/admin');
        } else if (data.data.user.role === 'DELIVERY') {
          router.push('/delivery');
        } else {
          router.push('/account');
        }
      } else {
        setError(data.message || 'Invalid credentials');
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
        <div className="flex justify-end">
          <button
            onClick={() => changeLanguage(lang === 'en' ? 'hi' : 'en')}
            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-2.5 py-1 rounded-full text-xs transition"
          >
            <Globe className="w-3.5 h-3.5 text-brand-600" />
            <span>{lang === 'en' ? 'हिंदी' : 'English'}</span>
          </button>
        </div>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mx-auto font-bold">
            <User className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">{t('loginTitle')}</h1>
          <p className="text-xs text-slate-500 font-semibold">{t('loginSubtitle')}</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('email')}</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:border-brand-500 focus:outline-none"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t('password')}</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:border-brand-500 focus:outline-none"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 border border-slate-100">
            <p className="font-bold text-slate-800">Test Quick Logins:</p>
            <p>Customer: customer@gmail.com / Password123!</p>
            <p>Admin: admin@madhukargeneralstore.com / Password123!</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs py-3 rounded-xl transition shadow-lg shadow-brand-600/30"
          >
            {loading ? (lang === 'hi' ? 'प्रमाणीकरण हो रहा है...' : 'AUTHENTICATING...') : t('signIn')}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 font-semibold">
          Don't have an account?{' '}
          <Link href="/register" className="text-brand-600 font-extrabold hover:underline">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}