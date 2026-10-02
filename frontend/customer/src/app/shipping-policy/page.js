"use client";

import React from 'react';

export default function ShippingPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-4">
        <h1 className="text-3xl font-black text-slate-900">Shipping & Delivery Policy</h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          Orders are delivered via local express delivery partners. Delivery charges and minimum order limits depend on your 6-digit PIN code. Orders above ₹499 qualify for FREE delivery.
        </p>
      </div>
    </div>
  );
}
