"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, ChevronRight } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/categories`);
        const data = await res.json();
        if (data.success) setCategories(data.data);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">All Grocery Departments</h1>
        <p className="text-xs text-slate-500 font-medium">Browse products by category</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/shop?category=${cat.slug}`}
            className="group bg-white p-4 rounded-3xl border border-slate-200 hover:border-brand-500 hover:shadow-md transition text-center space-y-2"
          >
            <div className="w-20 h-20 mx-auto rounded-2xl overflow-hidden bg-slate-100 relative">
              <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-brand-600">{cat.name}</h3>
            <p className="text-[11px] text-slate-500 line-clamp-2">{cat.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
