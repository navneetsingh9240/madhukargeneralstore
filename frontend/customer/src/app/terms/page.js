"use client";

import React from 'react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-4">
        <h1 className="text-3xl font-black text-slate-900">Terms & Conditions</h1>
        <p className="text-xs text-slate-600 leading-relaxed">
          By placing an order on Madhukar General Store, you agree to comply with our store terms. Delivery checkout requires a valid 6-digit Indian PIN code matching our active serviceable zones.
        </p>
      </div>
    </div>
  );
}
