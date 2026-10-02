"use client";

import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';

export default function LayoutClient({ children }) {
  return (
    <AuthProvider>
      <LanguageProvider>
        <div className="min-h-screen flex flex-col bg-slate-100 font-sans text-slate-900">
          <main className="flex-1">
            {children}
          </main>
        </div>
      </LanguageProvider>
    </AuthProvider>
  );
}