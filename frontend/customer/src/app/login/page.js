"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Lock, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function LoginPage() {
  const { lang, t } = useLanguage();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        body: JSON.stringify({ identifier, email: identifier, password }),
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
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-brand-100 text-brand-600 rounded-2xl flex items-center justify-center mx-auto font-bold">
            <User className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">{t('login')}</h1>
          <p className="text-xs text-slate-500 font-semibold">{lang === 'hi' ? 'मधुकर जनरल स्टोर खाते में साइन इन करें' : 'Sign in to Madhukar General Store Account'}</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {lang === 'hi' ? 'ईमेल या मोबाइल नंबर' : 'Email or Mobile Number'}
            </label>
            <div className="relative">
              <input
                type="text"
                autoComplete="username"
                required
                placeholder={lang === 'hi' ? 'ईमेल या मोबाइल नंबर दर्ज करें' : 'Enter email or mobile number'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:border-brand-500 focus:outline-none"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {lang === 'hi' ? 'पासवर्ड' : 'Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder={lang === 'hi' ? 'पासवर्ड दर्ज करें' : 'Enter password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 text-xs border border-slate-300 rounded-xl focus:border-brand-500 focus:outline-none"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs py-3 rounded-xl transition shadow-lg shadow-brand-600/30"
          >
            {loading ? (lang === 'hi' ? 'प्रमाणीकरण जारी है...' : 'AUTHENTICATING...') : (lang === 'hi' ? 'साइन इन करें' : 'SIGN IN TO ACCOUNT')}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 font-semibold">
          {lang === 'hi' ? 'खाता नहीं है?' : "Don't have an account?"}{' '}
          <Link href="/register" className="text-brand-600 font-extrabold hover:underline">
            {t('register')}
          </Link>
        </p>
      </div>
    </div>
  );
}