"use client";

import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-4">
        <h1 className="text-3xl font-black text-slate-900">Privacy Policy</h1>
        <p className="text-xs text-slate-500">Effective Date: January 1, 2026</p>
        <p className="text-xs text-slate-600 leading-relaxed">
          At Madhukar General Store, we value your trust and privacy. This policy explains how we collect, store, and safeguard your personal details during checkout and delivery.
        </p>
        <h3 className="font-bold text-sm text-slate-900 pt-2">1. Information Collection</h3>
        <p className="text-xs text-slate-600">We collect your name, delivery address, phone number, and mandatory 6-digit PIN code solely for order fulfillment and digital invoice generation.</p>
        <h3 className="font-bold text-sm text-slate-900 pt-2">2. QR Billing Security</h3>
        <p className="text-xs text-slate-600">QR codes generated on invoices encode an opaque secure token and never expose personal passwords, payment card numbers, or full private credentials.</p>
      </div>
    </div>
  );
}
