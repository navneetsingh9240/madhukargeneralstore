"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Filter, SlidersHorizontal, Search, X } from 'lucide-react';
import ProductCard from '../../components/ProductCard';
import { useLanguage } from '../../context/LanguageContext';

function ShopContent() {
  const { lang, t } = useLanguage();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('search') || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortOption, setSortOption] = useState('recommended');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/api/categories`);
        const data = await res.json();
        if (data.success) setCategories(data.data);
      } catch (e) {}
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        let url = `${API_URL}/api/products?limit=40`;

        if (selectedCategory) url += `&category=${selectedCategory}`;
        if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
        if (sortOption) url += `&sort=${sortOption}`;

        const res = await fetch(url);
        const data = await res.json();
        if (data.success) setProducts(data.data);
      } catch (e) {
        console.error('Fetch products error:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
    const interval = setInterval(fetchProducts, 5000);
    return () => clearInterval(interval);
  }, [selectedCategory, searchQuery, sortOption]);

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('allProducts')}</h1>
          <p className="text-xs text-slate-500 font-medium">{lang === 'hi' ? 'ताजा राशन, दाल, चावल और दैनिक आवश्यकताओं को ब्राउज़ करें' : 'Browse fresh items, staples & everyday store essentials'}</p>
        </div>

        {/* Search & Sort Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Filter products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-brand-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="recommended">{lang === 'hi' ? 'अनुशंसित' : 'Sort: Recommended'}</option>
            <option value="price_low">{t('priceLowHigh')}</option>
            <option value="price_high">{t('priceHighLow')}</option>
            <option value="popular">{lang === 'hi' ? 'लोकप्रियता' : 'Most Popular'}</option>
            <option value="rating">{t('ratingHighLow')}</option>
          </select>

          <button
            onClick={() => setMobileFilterOpen(true)}
            className="md:hidden flex items-center gap-1 bg-brand-600 text-white px-3 py-2 rounded-xl text-xs font-bold"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sidebar Filter (Desktop) */}
        <aside className="hidden md:block md:col-span-3 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-brand-600" />
                <span>{t('categories')}</span>
              </h3>
              {selectedCategory && (
                <button onClick={() => setSelectedCategory('')} className="text-[11px] font-bold text-red-600 hover:underline">
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition ${
                  selectedCategory === '' ? 'bg-brand-50 text-brand-700 font-black' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                All Categories
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    selectedCategory === cat.slug ? 'bg-brand-50 text-brand-700 font-black' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-500">
                    {cat._count ? cat._count.products : ''}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="md:col-span-9 space-y-4">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-slate-100 animate-pulse h-72 rounded-2xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <p className="text-4xl">🔍</p>
              <h3 className="text-lg font-bold text-slate-900">{lang === 'hi' ? 'कोई उत्पाद नहीं मिला' : 'No Products Found'}</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {t('noProductsFound')}
              </p>
              <button
                onClick={() => { setSelectedCategory(''); setSearchQuery(''); }}
                className="bg-brand-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-brand-700 transition"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading catalog...</div>}>
      <ShopContent />
    </Suspense>
  );
}