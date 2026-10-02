"use client";

import React from 'react';

export default function OffersPage() {
  const coupons = [
    { code: 'WELCOME50', desc: 'Flat ₹50 off on first grocery order above ₹299', badge: 'NEW USER' },
    { code: 'SAVE100', desc: 'Flat ₹100 off on order above ₹799', badge: 'POPULAR' },
    { code: 'FESTIVE20', desc: '20% off up to ₹150 on daily staples', badge: 'SPECIAL' },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Store Offers & Coupons</h1>
          <p className="text-xs text-slate-500 font-semibold">Apply these active coupon codes at checkout to save instantly!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {coupons.map((c) => (
            <div key={c.code} className="p-5 bg-gradient-to-br from-brand-50 to-emerald-50 rounded-2xl border border-brand-200 space-y-3">
              <span className="bg-brand-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">{c.badge}</span>
              <p className="font-mono text-xl font-black text-brand-900">{c.code}</p>
              <p className="text-xs font-semibold text-slate-600">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
