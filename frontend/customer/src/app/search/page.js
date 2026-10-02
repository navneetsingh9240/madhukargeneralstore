"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search as SearchIcon, Filter, ArrowUpDown, X, Sparkles, History, ShoppingBag } from 'lucide-react';
import ProductCard from '../../components/ProductCard';

const POPULAR_SEARCHES = ['Atta', 'Amul Milk', 'Fortune Mustard Oil', 'Tata Salt', 'Maggi', 'Surf Excel', 'Basmati Rice', 'Cashews'];

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get('q') || searchParams.get('search') || '';
  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    // Load recent searches
    try {
      const saved = JSON.parse(localStorage.getItem('mgs_recent_searches') || '[]');
      setRecentSearches(saved);
    } catch (e) {}

    // Fetch categories
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${API_URL}/api/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCategories(data.data);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery, selectedCategory, sortBy);
    } else {
      performSearch('', selectedCategory, sortBy);
    }
  }, [initialQuery, selectedCategory, sortBy]);

  const saveRecentSearch = (term) => {
    if (!term.trim()) return;
    try {
      const existing = JSON.parse(localStorage.getItem('mgs_recent_searches') || '[]');
      const updated = [term, ...existing.filter((item) => item.toLowerCase() !== term.toLowerCase())].slice(0, 6);
      localStorage.setItem('mgs_recent_searches', JSON.stringify(updated));
      setRecentSearches(updated);
    } catch (e) {}
  };

  const performSearch = async (searchTerm, cat, sort) => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      let url = `${API_URL}/api/products?search=${encodeURIComponent(searchTerm)}`;
      if (cat) url += `&category=${encodeURIComponent(cat)}`;
      if (sort && sort !== 'recommended') url += `&sort=${encodeURIComponent(sort)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Search fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handlePillClick = (term) => {
    setQuery(term);
    saveRecentSearch(term);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const clearRecentSearches = () => {
    localStorage.removeItem('mgs_recent_searches');
    setRecentSearches([]);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4">
      <div className="container mx-auto max-w-6xl">

        {/* Search Header Bar */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search by product name, category, or SKU (e.g. Atta, Oil, Soap)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-28 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition text-base"
            />
            <SearchIcon className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 rounded-xl text-sm transition shadow-sm"
            >
              Search
            </button>
          </form>

          {/* Recent & Popular Tags */}
          <div className="mt-5 space-y-3">
            {recentSearches.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="font-bold text-slate-500 flex items-center gap-1 shrink-0">
                  <History className="w-3.5 h-3.5 text-slate-400" /> Recent:
                </span>
                {recentSearches.map((term, i) => (
                  <button
                    key={i}
                    onClick={() => handlePillClick(term)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-1 rounded-lg transition"
                  >
                    {term}
                  </button>
                ))}
                <button
                  onClick={clearRecentSearches}
                  className="text-slate-400 hover:text-red-500 ml-auto font-medium text-[11px]"
                >
                  Clear History
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-amber-600 flex items-center gap-1 shrink-0">
                <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Popular:
              </span>
              {POPULAR_SEARCHES.map((term, i) => (
                <button
                  key={i}
                  onClick={() => handlePillClick(term)}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold px-3 py-1 rounded-lg border border-amber-200/60 transition"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters & Sorting Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-brand-600" /> Category:
            </span>
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                selectedCategory === ''
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                  selectedCategory === cat.slug
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="recommended">Recommended</option>
              <option value="popular">Popularity</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="rating">Customer Rating</option>
            </select>
          </div>
        </div>

        {/* Results Title */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            {initialQuery ? (
              <>
                Search Results for <span className="text-brand-600 font-extrabold">&ldquo;{initialQuery}&rdquo;</span>
              </>
            ) : (
              'All Grocery Products'
            )}
          </h1>
          <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2.5 py-1 rounded-full">
            {products.length} Products Found
          </span>
        </div>

        {/* Results Grid / Loading / Empty State */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse border border-slate-200 h-64">
                <div className="bg-slate-200 h-32 rounded-xl mb-3"></div>
                <div className="bg-slate-200 h-4 rounded w-3/4 mb-2"></div>
                <div className="bg-slate-200 h-4 rounded w-1/2 mb-4"></div>
                <div className="bg-slate-200 h-8 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No products found</h3>
            <p className="text-xs text-slate-500 mb-6">
              We couldn&apos;t find any grocery items matching &ldquo;{query}&rdquo;. Try checking for spelling errors or searching another item like &ldquo;Atta&rdquo; or &ldquo;Milk&rdquo;.
            </p>
            <button
              onClick={() => {
                setQuery('');
                setSelectedCategory('');
                router.push('/search');
              }}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition"
            >
              View All Products
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
