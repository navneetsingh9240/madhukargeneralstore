"use client";

import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { LanguageProvider } from '../context/LanguageContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function LayoutClient({ children }) {
  return (
    <AuthProvider>
      <CartProvider>
        <LanguageProvider>
          <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-4">
              {children}
            </main>
            <Footer />
          </div>
        </LanguageProvider>
      </CartProvider>
    </AuthProvider>
  );
}