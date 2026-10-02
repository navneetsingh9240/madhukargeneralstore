"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

import {
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Truck,
  Tag,
  ChevronRight,
} from "lucide-react";

import ProductCard from "../components/ProductCard";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";

export default function HomePage() {
  const { pincode } = useCart();
  const { lang } = useLanguage();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =========================================================
     FETCH PRODUCTS + CATEGORIES
  ========================================================= */

  useEffect(() => {
    async function fetchData() {
      try {
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

        const [prodRes, catRes] = await Promise.all([
          fetch(`${API_URL}/api/products?limit=12`),
          fetch(`${API_URL}/api/categories`),
        ]);

        const prodData = await prodRes.json();
        const catData = await catRes.json();

        // Products come only from the backend/database.
        if (prodData.success && Array.isArray(prodData.data)) {
          setProducts(prodData.data);
        } else {
          setProducts([]);
        }

        // Categories come only from the backend/database.
        if (catData.success && Array.isArray(catData.data)) {
          setCategories(catData.data);
        } else {
          setCategories([]);
        }
      } catch (e) {
        console.error("Error loading home data:", e);

        setProducts([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Refresh products/categories automatically.
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, []);

  /* =========================================================
     CATEGORY ICONS
  ========================================================= */

  // Category icons are only visual fallbacks.
  // Category names and images come from the Admin Console/database.
  const categoryIcons = {
    grocery: "🧺",
    snacks: "🍪",
    beverages: "🥤",
    "personal-care": "🧴",
    household: "🧹",
    dairy: "🥛",
    "baby-care": "👶",
    stationery: "💬",
  };

  /* =========================================================
     CATEGORY SIDEBAR DATA
  ========================================================= */

  const categorySidebar = categories.map((cat) => ({
    ...cat,
    nameEn: cat.name,
    nameHi: cat.name,
    icon: categoryIcons[cat.slug] || "🛒",
  }));

  /* =========================================================
     POPULAR CATEGORY DATA
  ========================================================= */

  const popularCategoriesList = categories.map((cat) => ({
    ...cat,
    nameEn: cat.name,
    nameHi: cat.name,
    slug: cat.slug,
    icon: categoryIcons[cat.slug] || "🛒",
  }));

  /* =========================================================
     DISPLAYED PRODUCTS
  ========================================================= */

  // Only products from the database are displayed.
  const displayedProducts = products.slice(0, 6);

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="space-y-6 pb-12 font-sans bg-slate-50 min-h-screen">

      {/* =======================================================
          SECTION 1: FULL-WIDTH CINEMATIC HERO
      ======================================================= */}

      <section className="w-full max-w-[1920px] mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 pt-3 sm:pt-4">

        <div
          className="
            relative
            w-full
            min-h-[430px]
            sm:min-h-[470px]
            lg:min-h-[500px]
            rounded-2xl
            overflow-hidden
            shadow-lg
            border
            border-emerald-100
            bg-cover
            bg-center
            lg:bg-right
          "
          style={{
            backgroundImage: "url('/images/madhukar-store-hero.png')",
          }}
        >

          {/* =====================================================
              HERO BACKGROUND OVERLAY

              This makes the left-side HTML content readable
              while keeping the grocery image visible across
              the complete hero section.
          ====================================================== */}

          <div
            className="
              absolute
              inset-0
              bg-gradient-to-r
              from-white/95
              via-white/75
              to-transparent
              lg:from-white/95
              lg:via-white/65
              lg:to-transparent
            "
          />

          {/* =====================================================
              TOP-RIGHT OFFER BADGE
          ====================================================== */}

          <div
            className="
              absolute
              top-3
              right-3
              sm:top-5
              sm:right-5
              lg:top-6
              lg:right-6
              z-20
              bg-[#004d25]
              text-white
              rounded-full
              w-20
              h-20
              sm:w-24
              sm:h-24
              lg:w-28
              lg:h-28
              flex
              flex-col
              items-center
              justify-center
              text-center
              shadow-xl
              border-2
              border-emerald-300/50
              p-2
            "
          >

            <span className="text-[8px] sm:text-[10px] lg:text-xs font-extrabold tracking-tight text-emerald-200">
              {lang === "hi" ? "ताजा सामान" : "FRESH ITEMS"}
            </span>

            <span className="text-[10px] sm:text-xs lg:text-sm font-black text-amber-300 leading-tight">
              {lang === "hi" ? "सही दाम" : "BEST PRICES"}
            </span>

            <span className="text-[8px] sm:text-[10px] lg:text-xs font-bold text-white">
              {lang === "hi" ? "हर दिन" : "EVERY DAY"}
            </span>

          </div>

          {/* =====================================================
              HERO CONTENT
          ====================================================== */}

          <div
            className="
              relative
              z-10
              flex
              items-center
              min-h-[430px]
              sm:min-h-[470px]
              lg:min-h-[500px]
              px-5
              py-8
              sm:px-8
              sm:py-10
              lg:px-10
              xl:px-14
            "
          >

            <div className="w-full lg:w-[55%] max-w-2xl">

              {/* =================================================
                  STORE TITLE
              ================================================= */}

              <div className="space-y-2 sm:space-y-3">

                <h1
                  className="
                    text-3xl
                    sm:text-4xl
                    md:text-5xl
                    lg:text-5xl
                    xl:text-6xl
                    font-black
                    text-[#004d25]
                    leading-[0.95]
                    tracking-tight
                    drop-shadow-sm
                  "
                >

                  {lang === "hi" ? (
                    <>
                      मधुकर किराना
                      <br />

                      <span className="text-[#004d25]">
                        एंड जनरल स्टोर
                      </span>
                    </>
                  ) : (
                    <>
                      MADHUKAR KIRANA
                      <br />

                      <span className="text-[#004d25]">
                        & GENERAL STORE
                      </span>
                    </>
                  )}

                </h1>

                {/* =================================================
                    TAGLINE
                ================================================= */}

                <div
                  className="
                    inline-block
                    bg-[#004d25]
                    text-white
                    text-xs
                    sm:text-sm
                    lg:text-base
                    font-bold
                    px-4
                    sm:px-5
                    py-2
                    rounded-full
                    shadow-md
                  "
                >
                  {lang === "hi"
                    ? "हर घर की जरूरत, अब ऑनलाइन!"
                    : "Every Household Need, Now Online!"}
                </div>

              </div>

              {/* =================================================
                  TRUST BADGES
              ================================================= */}

              <div
                className="
                  grid
                  grid-cols-3
                  gap-2
                  sm:gap-4
                  mt-6
                  sm:mt-7
                  max-w-xl
                "
              >

                {/* QUALITY */}

                <div className="flex items-center gap-1.5 sm:gap-2 text-slate-900 font-bold">

                  <div
                    className="
                      w-7
                      h-7
                      sm:w-9
                      sm:h-9
                      rounded-full
                      bg-[#004d25]
                      text-white
                      flex
                      items-center
                      justify-center
                      text-xs
                      sm:text-sm
                      shrink-0
                      font-extrabold
                      shadow-sm
                    "
                  >
                    ✓
                  </div>

                  <span className="text-[9px] sm:text-[11px] lg:text-xs leading-tight">
                    {lang === "hi"
                      ? "उत्तम क्वालिटी का सामान"
                      : "Best Quality Products"}
                  </span>

                </div>

                {/* PRICE */}

                <div className="flex items-center gap-1.5 sm:gap-2 text-slate-900 font-bold">

                  <div
                    className="
                      w-7
                      h-7
                      sm:w-9
                      sm:h-9
                      rounded-full
                      bg-[#004d25]
                      text-white
                      flex
                      items-center
                      justify-center
                      text-xs
                      sm:text-sm
                      shrink-0
                      font-extrabold
                      shadow-sm
                    "
                  >
                    ₹
                  </div>

                  <span className="text-[9px] sm:text-[11px] lg:text-xs leading-tight">
                    {lang === "hi"
                      ? "वाजिब दाम"
                      : "Reasonable Price"}
                  </span>

                </div>

                {/* DELIVERY */}

                <div className="flex items-center gap-1.5 sm:gap-2 text-slate-900 font-bold">

                  <div
                    className="
                      w-7
                      h-7
                      sm:w-9
                      sm:h-9
                      rounded-full
                      bg-[#004d25]
                      text-white
                      flex
                      items-center
                      justify-center
                      text-xs
                      sm:text-sm
                      shrink-0
                      font-extrabold
                      shadow-sm
                    "
                  >
                    🚚
                  </div>

                  <span className="text-[9px] sm:text-[11px] lg:text-xs leading-tight">
                    {lang === "hi"
                      ? "तेज डिलीवरी"
                      : "Fast Delivery"}
                  </span>

                </div>

              </div>

              {/* =================================================
                  SHOP NOW BUTTON

                  This is a real clickable Next.js Link.
                  It opens the existing /shop page.
              ================================================= */}

              <div className="pt-6 sm:pt-7">

                <Link
                  href="/shop"
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    bg-[#d30815]
                    hover:bg-red-700
                    text-white
                    font-black
                    text-sm
                    sm:text-base
                    lg:text-lg
                    px-6
                    sm:px-8
                    py-3
                    sm:py-3.5
                    rounded-full
                    shadow-lg
                    hover:shadow-xl
                    hover:scale-105
                    active:scale-95
                    transition
                    duration-200
                  "
                >

                  <span>
                    {lang === "hi"
                      ? "अभी खरीदें"
                      : "Shop Now"}
                  </span>

                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />

                </Link>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =========================================================
          SECTION 2: POPULAR CATEGORIES
      ========================================================= */}

      <section className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm">

          <div className="flex items-center justify-between mb-3.5">

            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {lang === "hi"
                ? "लोकप्रिय श्रेणियां"
                : "Popular Categories"}
            </h2>

            <Link
              href="/shop"
              className="text-xs font-extrabold text-[#004d25] hover:text-[#00381a] flex items-center gap-1"
            >
              <span>
                {lang === "hi"
                  ? "सभी देखें"
                  : "View All"}
              </span>

              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

          </div>

          {popularCategoriesList.length > 0 ? (

            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2.5">

              {popularCategoriesList.map((cat) => (

                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}`}
                  className="
                    group
                    flex
                    flex-col
                    items-center
                    bg-slate-50
                    hover:bg-emerald-50/70
                    p-2.5
                    rounded-xl
                    border
                    border-slate-200
                    hover:border-[#004d25]
                    transition
                    text-center
                  "
                >

                  {/* =================================================
                      CATEGORY IMAGE / FALLBACK ICON
                  ================================================= */}

                  <div
                    className="
                      w-14
                      h-14
                      sm:w-16
                      sm:h-16
                      rounded-xl
                      overflow-hidden
                      bg-white
                      mb-1.5
                      p-1
                      border
                      border-slate-100
                      flex
                      items-center
                      justify-center
                    "
                  >

                    {cat.imageUrl ? (

                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="
                          w-full
                          h-full
                          rounded-lg
                          object-cover
                          group-hover:scale-110
                          transition
                          duration-200
                        "
                      />

                    ) : (

                      <div
                        className="
                          w-full
                          h-full
                          rounded-lg
                          bg-emerald-100
                          text-[#004d25]
                          flex
                          items-center
                          justify-center
                          text-2xl
                          font-black
                          group-hover:scale-110
                          transition
                          duration-200
                        "
                      >
                        {cat.icon}
                      </div>

                    )}

                  </div>

                  <span
                    className="
                      text-[11px]
                      font-bold
                      text-slate-800
                      group-hover:text-[#004d25]
                      line-clamp-2
                      leading-tight
                    "
                  >
                    {lang === "hi"
                      ? cat.nameHi
                      : cat.nameEn}
                  </span>

                </Link>

              ))}

            </div>

          ) : (

            <div className="py-8 text-center text-sm font-semibold text-slate-500">

              {lang === "hi"
                ? "अभी कोई श्रेणी उपलब्ध नहीं है।"
                : "No categories available yet."}

            </div>

          )}

        </div>

      </section>

      {/* =========================================================
          SECTION 3: POPULAR PRODUCTS
      ========================================================= */}

      <section className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm">

          <div className="flex items-center justify-between mb-3.5">

            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {lang === "hi"
                ? "लोकप्रिय उत्पाद"
                : "Popular Products"}
            </h2>

            <Link
              href="/shop"
              className="
                text-xs
                font-extrabold
                text-[#004d25]
                hover:text-[#00381a]
                flex
                items-center
                gap-1
              "
            >
              <span>
                {lang === "hi"
                  ? "सभी देखें"
                  : "View All"}
              </span>

              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

          </div>

          {displayedProducts.length > 0 ? (

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">

              {displayedProducts.map((product) => (

                <ProductCard
                  key={product.id}
                  product={product}
                />

              ))}

            </div>

          ) : (

            <div className="py-10 text-center">

              <ShoppingBag className="w-10 h-10 mx-auto mb-3 text-slate-300" />

              <p className="text-sm font-semibold text-slate-500">

                {lang === "hi"
                  ? "अभी कोई उत्पाद उपलब्ध नहीं है।"
                  : "No products available yet."}

              </p>

              <p className="text-xs text-slate-400 mt-1">

                {lang === "hi"
                  ? "एडमिन पैनल से उत्पाद जोड़ें।"
                  : "Products added from the Admin Console will appear here."}

              </p>

            </div>

          )}

        </div>

      </section>

      {/* =========================================================
          SECTION 4: THREE PROMO BANNERS
      ========================================================= */}

      <section className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* =====================================================
              BANNER 1: OFFERS
          ====================================================== */}

          <div
            className="
              bg-amber-400
              rounded-xl
              p-4
              text-slate-900
              flex
              items-center
              justify-between
              shadow-sm
              relative
              overflow-hidden
              border
              border-amber-500/30
            "
          >

            <div className="space-y-1 z-10">

              <h3 className="font-black text-base leading-tight">
                {lang === "hi"
                  ? "खास ऑफ़र्स और छूट"
                  : "Special Offers & Discounts"}
              </h3>

              <p className="text-xs font-bold text-slate-800">
                {lang === "hi"
                  ? "आज ही खरीदें, सीमित समय के लिए!"
                  : "Shop today, limited time offer!"}
              </p>

            </div>

            <div
              className="
                bg-red-600
                text-white
                font-black
                text-xs
                px-3
                py-2
                rounded-xl
                text-center
                shadow-md
                shrink-0
                flex
                flex-col
                items-center
                justify-center
                z-10
              "
            >

              <span className="text-[10px] leading-tight">
                UP TO
              </span>

              <span className="text-lg leading-none font-black">
                30%
              </span>

              <span className="text-[10px] leading-tight">
                OFF
              </span>

            </div>

          </div>

          {/* =====================================================
              BANNER 2: FRESH FRUITS
          ====================================================== */}

          <div
            className="
              bg-[#004d25]
              rounded-xl
              p-4
              text-white
              flex
              items-center
              justify-between
              shadow-sm
              relative
              overflow-hidden
            "
          >

            <div className="space-y-1 z-10">

              <h3 className="font-black text-base leading-tight">
                {lang === "hi"
                  ? "ताजा और स्वस्थ सब्जियां एवं फल"
                  : "Fresh & Healthy Fruits & Vegetables"}
              </h3>

              <p className="text-xs font-medium text-emerald-200">
                {lang === "hi"
                  ? "ताजगी की गारंटी, हर दिन!"
                  : "Freshness guaranteed, every day!"}
              </p>

            </div>

            <div className="text-3xl shrink-0 z-10">
              🥦🍎
            </div>

          </div>

          {/* =====================================================
              BANNER 3: DAILY ESSENTIALS
          ====================================================== */}

          <div
            className="
              bg-sky-600
              rounded-xl
              p-4
              text-white
              flex
              items-center
              justify-between
              shadow-sm
              relative
              overflow-hidden
            "
          >

            <div className="space-y-1 z-10">

              <h3 className="font-black text-base leading-tight">
                {lang === "hi"
                  ? "रोजमर्रा की जरूरी चीजें एक ही जगह"
                  : "Daily Essentials All in One Place"}
              </h3>

              <p className="text-xs font-medium text-sky-100">
                {lang === "hi"
                  ? "सफाई, देखभाल और सुविधा"
                  : "Cleaning, Care & Convenience"}
              </p>

            </div>

            <div className="text-3xl shrink-0 z-10">
              🧴🧼
            </div>

          </div>

        </div>

      </section>

    </div>
  );
}