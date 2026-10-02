"use client";

import React from 'react';
import Link from 'next/link';
import {
  PhoneCall,
  Mail,
  Clock3,
  Instagram,
  Facebook,
  Youtube,
  MessageCircle,
  MapPin,
  ShoppingBag
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { lang } = useLanguage();

  return (
    <footer className="bg-[#00381a] text-white text-xs border-t border-emerald-900/80 pt-8 pb-5 font-sans">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">

        {/* 5-Column Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8 mb-8">

          {/* Column 1: Brand Info, Address & Social Icons */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#10b981]/20 border border-emerald-400/60 text-emerald-300 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-black text-white tracking-tight leading-none uppercase">
                  MADHUKAR KIRANA
                </div>
                <div className="text-xs font-black text-amber-400 tracking-tight leading-tight uppercase">
                  & GENERAL STORE
                </div>
              </div>
            </div>

            <p className="text-[11px] text-emerald-100/80 leading-relaxed">
              {lang === 'hi'
                ? 'आपका भरोसेमंद स्थानीय किराना स्टोर अब ऑनलाइन। गुणवत्तापूर्ण राशन, डेयरी, स्नैक्स और दैनिक जरूरत का सामान सीधे आपके घर पर।'
                : 'Your trusted local neighborhood grocery store now online. High quality staples, dairy, snacks & daily essentials delivered straight to your home.'}
            </p>

            <div className="flex items-start gap-2 text-[11px] text-emerald-100/90 font-medium leading-tight">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                {lang === 'hi'
                  ? 'मटिहानी शाम्हो रोड, मुख्य मार्ग मटिहानी, बेगूसराय, बिहार - 851129'
                  : 'Matihani Samho Road, Main Road Matihani, Begusarai, Bihar - 851129'}
              </span>
            </div>

            <div className="pt-1">
              <h5 className="text-[11px] font-black text-amber-400 uppercase tracking-wider mb-2">
                {lang === 'hi' ? 'हमसे जुड़ें:' : 'CONNECT WITH US:'}
              </h5>
              <div className="flex items-center gap-2">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-full bg-[#004d25] border border-emerald-600/50 hover:bg-emerald-600 text-white flex items-center justify-center transition shadow-xs"
                  title="Instagram"
                >
                  <Instagram className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-full bg-[#004d25] border border-emerald-600/50 hover:bg-emerald-600 text-white flex items-center justify-center transition shadow-xs"
                  title="Facebook"
                >
                  <Facebook className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-full bg-[#004d25] border border-emerald-600/50 hover:bg-emerald-600 text-white flex items-center justify-center transition shadow-xs"
                  title="YouTube"
                >
                  <Youtube className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-full bg-[#004d25] border border-emerald-600/50 hover:bg-emerald-600 text-white flex items-center justify-center transition shadow-xs"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: QUICK LINKS */}
          <div>
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-3">
              {lang === 'hi' ? 'त्वरित लिंक्स' : 'QUICK LINKS'}
            </h4>
            <ul className="space-y-2 text-[11px] font-medium text-emerald-100">
              <li>
                <Link href="/" className="hover:text-amber-300 transition flex items-center gap-1">
                  <span>•</span> <span>{lang === 'hi' ? 'होम' : 'Home'}</span>
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-amber-300 transition flex items-center gap-1">
                  <span>•</span> <span>{lang === 'hi' ? 'सभी उत्पाद' : 'Shop All'}</span>
                </Link>
              </li>
              <li>
                <Link href="/offers" className="hover:text-amber-300 transition flex items-center gap-1">
                  <span>•</span> <span>{lang === 'hi' ? 'ऑफ़र्स और कूपन' : 'Offers & Coupons'}</span>
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-amber-300 transition flex items-center gap-1">
                  <span>•</span> <span>{lang === 'hi' ? 'स्टोर के बारे में' : 'About Store'}</span>
                </Link>
              </li>
              <li>
                <Link href="/account/orders" className="hover:text-amber-300 transition flex items-center gap-1">
                  <span>•</span> <span>{lang === 'hi' ? 'मेरे ऑर्डर और इनवॉइस' : 'My Orders & Invoices'}</span>
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-amber-300 transition flex items-center gap-1">
                  <span>•</span> <span>{lang === 'hi' ? 'संपर्क करें' : 'Contact Us'}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: CUSTOMER CARE & POLICIES */}
          <div>
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-3">
              {lang === 'hi' ? 'ग्राहक सेवा और नीतियां' : 'CUSTOMER CARE & POLICIES'}
            </h4>
            <ul className="space-y-2 text-[11px] font-medium text-emerald-100">
              <li>
                <Link href="/privacy-policy" className="hover:text-amber-300 transition flex items-center gap-1">
                  <span>•</span> <span>{lang === 'hi' ? 'गोपनीयता नीति' : 'Privacy Policy'}</span>
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-amber-300 transition flex items-center gap-1">
                  <span>•</span> <span>{lang === 'hi' ? 'नियम और शर्तें' : 'Terms & Conditions'}</span>
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="hover:text-amber-300 transition flex items-center gap-1">
                  <span>•</span> <span>{lang === 'hi' ? 'शिपिंग और डिलीवरी नीति' : 'Shipping & Delivery Policy'}</span>
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-amber-300 transition flex items-center gap-1">
                  <span>•</span> <span>{lang === 'hi' ? 'रद्द करने और रिफंड नीति' : 'Cancellation & Refund Policy'}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: CONTACT US */}
          <div>
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-3">
              {lang === 'hi' ? 'संपर्क करें' : 'CONTACT US'}
            </h4>
            <div className="space-y-2 text-[11px] font-medium text-emerald-100">
              <p className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <a href="tel:+919876543210" className="hover:text-amber-300 transition font-bold">
                  +91 98765 43210
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <a href="mailto:madhukar.kirana@gmail.com" className="hover:text-amber-300 transition">
                  madhukar.kirana@gmail.com
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Clock3 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{lang === 'hi' ? 'सुबह 8:00 - रात 10:00' : '8:00 AM - 10:00 PM'}</span>
              </p>
            </div>
          </div>

          {/* Column 5: SECURE PAYMENT */}
          <div>
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-3">
              {lang === 'hi' ? 'सुरक्षित भुगतान' : 'SECURE PAYMENT'}
            </h4>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-[#002e15] border border-emerald-600/60 text-emerald-200 font-bold px-2.5 py-1 rounded text-[11px]">
                {lang === 'hi' ? 'यूपीआई (UPI)' : 'UPI'}
              </span>
              <span className="bg-[#002e15] border border-emerald-600/60 text-emerald-200 font-bold px-2.5 py-1 rounded text-[11px]">
                {lang === 'hi' ? 'कैश ऑन डिलीवरी' : 'Cash on Delivery'}
              </span>
            </div>
            <p className="text-[10px] text-emerald-200/70 font-medium leading-tight">
              {lang === 'hi'
                ? '100% सुरक्षित और भरोसेमंद भुगतान विकल्प।'
                : '100% safe and secure doorstep payment option.'}
            </p>
          </div>

        </div>

        {/* Bottom Copyright Strip */}
        <div className="border-t border-emerald-900/80 pt-4 text-center text-emerald-200/80 text-[11px] font-medium">
          {lang === 'hi'
            ? '© 2026 मधुकर किराना और जनरल स्टोर। सर्वाधिकार सुरक्षित।'
            : '© 2026 Madhukar Kirana & General Store. All rights reserved.'}
        </div>

      </div>
    </footer>
  );
}