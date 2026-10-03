"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ShoppingBag,
  Search,
  User,
  Menu,
  X,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Mic,
  Globe,
  PhoneCall,
  Truck,
  Leaf,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";

export default function Header() {
  const { user, logout } = useAuth();

  const {
    cartItems,
    pincode,
    saveDeliveryPincode,
    subtotal,
  } = useCart();

  const {
    lang,
    changeLanguage,
    t,
  } = useLanguage();

  const router = useRouter();

  /* =========================================================
     STATES
  ========================================================= */

  const [searchQuery, setSearchQuery] = useState("");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [categoriesDropdownOpen, setCategoriesDropdownOpen] =
    useState(false);

  const [pinModalOpen, setPinModalOpen] = useState(false);

  const [inputPin, setInputPin] = useState(pincode || "");

  const [pinStatus, setPinStatus] = useState(null);

  const [pinLoading, setPinLoading] = useState(false);

  const [isListening, setIsListening] = useState(false);

  /* =========================================================
     DYNAMIC CATEGORIES
  ========================================================= */

  const [categories, setCategories] = useState([]);

  const categoriesDropdownRef = useRef(null);

  /* =========================================================
     CATEGORY FALLBACK ICONS
     
     These are only fallback icons.
     Category names/slugs/images come from Admin/database.
  ========================================================= */

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
     FETCH CATEGORIES FROM BACKEND
  ========================================================= */

  useEffect(() => {
    let isMounted = true;

    async function fetchCategories() {
      try {
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL ||
          "https://madhukargeneralstore.onrender.com";

        const response = await fetch(
          `${API_URL}/api/categories`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Category API returned ${response.status}`
          );
        }

        const data = await response.json();

        if (
          isMounted &&
          data.success &&
          Array.isArray(data.data)
        ) {
          setCategories(data.data);
        } else if (isMounted) {
          setCategories([]);
        }
      } catch (error) {
        console.error(
          "Error loading header categories:",
          error
        );

        if (isMounted) {
          setCategories([]);
        }
      }
    }

    // Initial category load.
    fetchCategories();

    // Automatically refresh categories.
    // Admin-created changes will appear without manually
    // refreshing the customer page.
    const interval = setInterval(fetchCategories, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  /* =========================================================
     FETCH LATEST CATEGORIES WHEN DROPDOWN OPENS
     
     This makes the dropdown show the latest Admin data
     immediately when the user opens it.
  ========================================================= */

  useEffect(() => {
    if (!categoriesDropdownOpen) {
      return;
    }

    let isMounted = true;

    async function refreshCategories() {
      try {
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL ||
          "https://madhukargeneralstore.onrender.com";

        const response = await fetch(
          `${API_URL}/api/categories`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Category API returned ${response.status}`
          );
        }

        const data = await response.json();

        if (
          isMounted &&
          data.success &&
          Array.isArray(data.data)
        ) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error(
          "Error refreshing categories:",
          error
        );
      }
    }

    refreshCategories();

    return () => {
      isMounted = false;
    };
  }, [categoriesDropdownOpen]);

  /* =========================================================
     CLOSE DROPDOWN ON OUTSIDE CLICK / ESC
  ========================================================= */

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        categoriesDropdownRef.current &&
        !categoriesDropdownRef.current.contains(event.target)
      ) {
        setCategoriesDropdownOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setCategoriesDropdownOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  /* =========================================================
     CART
  ========================================================= */

  const cartCount = cartItems.reduce(
    (acc, item) => acc + item.quantity,
    0
  );

  const cartTotal =
    subtotal ||
    cartItems.reduce(
      (acc, item) =>
        acc +
        ((item.sellingPrice || item.price || 0) *
          item.quantity),
      0
    );

  /* =========================================================
     SEARCH
  ========================================================= */

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      router.push(
        `/shop?search=${encodeURIComponent(
          searchQuery.trim()
        )}`
      );
    }
  };

  /* =========================================================
     VOICE SEARCH
  ========================================================= */

  const handleVoiceSearch = () => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert(
        "Voice search is not supported in this browser. Please type your search query."
      );

      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();

    recognition.lang =
      lang === "hi" ? "hi-IN" : "en-IN";

    recognition.continuous = false;

    recognition.onstart = () =>
      setIsListening(true);

    recognition.onend = () =>
      setIsListening(false);

    recognition.onerror = () =>
      setIsListening(false);

    recognition.onresult = (event) => {
      const transcript =
        event.results[0][0].transcript;

      setSearchQuery(transcript);

      if (transcript) {
        router.push(
          `/shop?search=${encodeURIComponent(
            transcript
          )}`
        );
      }
    };

    recognition.start();
  };

  /* =========================================================
     PIN CHECK
  ========================================================= */

  const handlePinCheck = async (e) => {
    e.preventDefault();

    if (!/^\d{6}$/.test(inputPin)) {
      setPinStatus({
        error: true,
        message:
          "Please enter a valid 6-digit Indian PIN code",
      });

      return;
    }

    setPinLoading(true);
    setPinStatus(null);

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL ||
        "https://madhukargeneralstore.onrender.com";

      const res = await fetch(
        `${API_URL}/api/delivery/check/${inputPin}`
      );

      const data = await res.json();

      if (data.isServiceable) {
        setPinStatus({
          error: false,
          message: data.message,
          data: data.data,
        });

        saveDeliveryPincode(
          inputPin,
          data.data
        );

        setTimeout(
          () => setPinModalOpen(false),
          1200
        );
      } else {
        setPinStatus({
          error: true,
          message:
            data.message ||
            "Delivery not available",
        });
      }
    } catch (err) {
      setPinStatus({
        error: true,
        message:
          "Could not connect to delivery server",
      });
    } finally {
      setPinLoading(false);
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <header className="w-full font-sans border-b border-slate-200">

      {/* =====================================================
          TOP BANNER BAR
      ===================================================== */}

      <div className="bg-[#004d25] text-white text-xs py-2 px-4 sm:px-6 lg:px-8 xl:px-10 shadow-inner">

        <div className="w-full max-w-[1920px] mx-auto flex flex-wrap justify-between items-center gap-2">

          {/* Left: Store Guarantee Tagline */}

          <div className="flex items-center gap-2 font-medium">

            <Truck className="w-4 h-4 text-emerald-300 animate-pulse shrink-0" />

            <span className="font-semibold text-xs sm:text-sm">

              {lang === "hi"
                ? "अब घर बैठे पाएं अपनी जरूरत का हर सामान"
                : "Get all your daily essential needs delivered right to your home"}

            </span>

          </div>

          {/* Right: Phone, Auth, Cart & Language */}

          <div className="flex items-center gap-3 sm:gap-5 text-xs font-semibold">

            {/* Phone Support */}

            <a
              href="tel:+919876543210"
              className="flex items-center gap-1.5 hover:text-emerald-300 transition"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400 shrink-0" />

              <span>
                +91 98765 43210
              </span>
            </a>

            {/* Login / Profile */}

            {user ? (

              <div className="relative group">

                <Link
                  href="/account"
                  className="flex items-center gap-1 hover:text-emerald-200"
                >
                  <User className="w-3.5 h-3.5 shrink-0" />

                  <span>
                    {user.name.split(" ")[0]}
                  </span>
                </Link>

                <div className="absolute right-0 top-full mt-1 w-48 bg-white text-slate-800 rounded-lg shadow-xl py-2 hidden group-hover:block z-50 border border-slate-200">

                  <div className="px-3 py-1.5 border-b border-slate-100 font-bold text-xs text-slate-900">
                    {user.name}
                  </div>

                  <Link
                    href="/account"
                    className="block px-3 py-1.5 hover:bg-slate-50 text-xs"
                  >
                    {lang === "hi"
                      ? "मेरी प्रोफाइल"
                      : "My Profile"}
                  </Link>

                  <Link
                    href="/account/orders"
                    className="block px-3 py-1.5 hover:bg-slate-50 text-xs"
                  >
                    {lang === "hi"
                      ? "मेरे ऑर्डर"
                      : "My Orders"}
                  </Link>

                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-1.5 text-red-600 hover:bg-red-50 text-xs font-bold border-t border-slate-100 mt-1"
                  >
                    {lang === "hi"
                      ? "साइन आउट"
                      : "Sign Out"}
                  </button>

                </div>

              </div>

            ) : (

              <Link
                href="/login"
                className="flex items-center gap-1 hover:text-emerald-300 transition"
              >
                <User className="w-3.5 h-3.5 shrink-0" />

                <span>
                  Login / Register
                </span>
              </Link>

            )}

            {/* Language Switcher */}

            <button
              onClick={() =>
                changeLanguage(
                  lang === "en" ? "hi" : "en"
                )
              }
              className="flex items-center gap-1 bg-emerald-800 hover:bg-emerald-700 px-2.5 py-1 rounded-full text-white transition border border-emerald-600"
              title="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5 text-amber-300 shrink-0" />

              <span>
                {lang === "en"
                  ? "हिंदी"
                  : "English"}
              </span>
            </button>

            {/* Cart */}

            <Link
              href="/cart"
              className="flex items-center gap-1.5 bg-[#00381a] hover:bg-[#002612] px-3 py-1 rounded-full text-white font-extrabold border border-emerald-700/60 transition shadow-sm"
            >

              <div className="relative flex items-center justify-center">

                <ShoppingBag className="w-4 h-4 text-emerald-200" />

                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {cartCount}
                </span>

              </div>

              <span className="text-white ml-1.5 font-black text-xs">
                ₹{cartTotal}
              </span>

            </Link>

          </div>

        </div>

      </div>

      {/* =====================================================
          MAIN WHITE HEADER
      ===================================================== */}

      <div className="bg-white py-3 px-4 sm:px-6 lg:px-8 xl:px-10 shadow-sm border-b border-slate-100">

        <div className="w-full max-w-[1920px] mx-auto flex items-center justify-between gap-4">

          {/* Logo */}

          <Link
            href="/"
            className="flex items-center gap-3 shrink-0"
          >

            <div className="w-12 h-12 rounded-full border-2 border-[#005c2a] bg-emerald-50 flex items-center justify-center p-0.5 shadow-sm">

              <div className="w-10 h-10 rounded-full bg-[#005c2a] text-white flex items-center justify-center font-black text-xl">
                🛒
              </div>

            </div>

            <div>

              <div className="flex items-center text-xl sm:text-2xl font-black tracking-tight leading-none">

                <span className="text-red-600">
                  {lang === "hi"
                    ? "मधुकर"
                    : "MADHUKAR"}
                </span>

                <span className="text-[#005c2a] ml-1.5">
                  {lang === "hi"
                    ? "किराना"
                    : "KIRANA"}
                </span>

              </div>

              <div className="text-xs sm:text-sm font-black text-[#005c2a] tracking-tight leading-snug">

                {lang === "hi"
                  ? "एंड जनरल स्टोर"
                  : "& GENERAL STORE"}

              </div>

              <div className="text-[10px] text-slate-500 font-semibold tracking-wider">

                {lang === "hi"
                  ? "आपका भरोसा | हमारी पहचान"
                  : "Your Trust | Our Identity"}

              </div>

            </div>

          </Link>

          {/* Search Bar */}

          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-xl relative hidden md:flex items-center"
          >

            <div className="relative flex-1 flex items-center border-2 border-[#005c2a] rounded-lg overflow-hidden bg-slate-50 focus-within:bg-white focus-within:shadow-md transition">

              <input
                type="text"
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                placeholder={
                  lang === "hi"
                    ? "कोई भी सामान खोजें... (जैसे - आटा, चावल, दाल, तेल, आदि)"
                    : "Search any product... (e.g. Atta, Rice, Dal, Oil, Milk)"
                }
                className="w-full px-4 py-2.5 text-xs sm:text-sm bg-transparent outline-none text-slate-800 placeholder-slate-400 font-medium"
              />

              <button
                type="button"
                onClick={handleVoiceSearch}
                title="Voice Search"
                className={`p-2 text-slate-400 hover:text-emerald-700 transition ${
                  isListening
                    ? "text-red-500 animate-pulse"
                    : ""
                }`}
              >
                <Mic className="w-4 h-4" />
              </button>

              <button
                type="submit"
                className="bg-[#005c2a] hover:bg-[#004720] text-white px-5 py-2.5 font-bold flex items-center justify-center transition"
              >
                <Search className="w-5 h-5" />
              </button>

            </div>

          </form>

          {/* Trust Badges */}

          <div className="hidden lg:flex items-center gap-6 shrink-0 text-slate-700">

            <div className="flex items-center gap-2">

              <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#005c2a] flex items-center justify-center font-extrabold text-sm">
                ✓
              </div>

              <div>
                <p className="text-xs font-extrabold text-slate-900 leading-tight">
                  {lang === "hi"
                    ? "सुरक्षित"
                    : "Secure"}
                </p>

                <p className="text-[11px] font-semibold text-slate-600 leading-tight">
                  {lang === "hi"
                    ? "खरीदारी"
                    : "Shopping"}
                </p>
              </div>

            </div>

            <div className="flex items-center gap-2">

              <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#005c2a] flex items-center justify-center text-sm">
                🚚
              </div>

              <div>
                <p className="text-xs font-extrabold text-slate-900 leading-tight">
                  {lang === "hi"
                    ? "तेज"
                    : "Fast"}
                </p>

                <p className="text-[11px] font-semibold text-slate-600 leading-tight">
                  {lang === "hi"
                    ? "डिलीवरी"
                    : "Delivery"}
                </p>
              </div>

            </div>

            <div className="flex items-center gap-2">

              <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#005c2a] flex items-center justify-center text-sm">
                🌿
              </div>

              <div>
                <p className="text-xs font-extrabold text-slate-900 leading-tight">
                  {lang === "hi"
                    ? "सही दाम"
                    : "Best Price"}
                </p>

                <p className="text-[11px] font-semibold text-slate-600 leading-tight">
                  {lang === "hi"
                    ? "हर दिन"
                    : "Every Day"}
                </p>
              </div>

            </div>

          </div>

          {/* Mobile Menu Toggle */}

          <button
            onClick={() =>
              setMobileMenuOpen(!mobileMenuOpen)
            }
            className="md:hidden text-slate-800 p-1"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

        </div>

        {/* Mobile Search */}

        <div className="md:hidden mt-2">

          <form
            onSubmit={handleSearchSubmit}
            className="flex border-2 border-[#005c2a] rounded-lg overflow-hidden"
          >

            <input
              type="text"
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
              placeholder={
                lang === "hi"
                  ? "सामान खोजें..."
                  : "Search groceries..."
              }
              className="w-full px-3 py-1.5 text-xs bg-slate-50 outline-none"
            />

            <button
              type="button"
              onClick={handleVoiceSearch}
              className="px-2 text-slate-500"
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              type="submit"
              className="bg-[#005c2a] text-white px-3 py-1.5"
            >
              <Search className="w-4 h-4" />
            </button>

          </form>

        </div>

      </div>

      {/* =====================================================
          MOBILE SLIDE-OUT DRAWER
      ===================================================== */}

      {mobileMenuOpen && (

        <div className="md:hidden bg-[#00381a] text-white px-4 py-3 space-y-3 border-b border-emerald-700 shadow-lg animate-in slide-in-from-top duration-200">

          <div className="flex items-center justify-between pb-2 border-b border-emerald-800">

            <button
              onClick={() => {
                setPinModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-1.5 text-xs text-amber-300 font-bold bg-emerald-900/80 px-3 py-1.5 rounded-full border border-emerald-700"
            >

              <MapPin className="w-3.5 h-3.5 animate-bounce" />

              <span>
                {pincode
                  ? `PIN: ${pincode}`
                  : lang === "hi"
                  ? "पिन दर्ज करें"
                  : "Deliver To PIN"}
              </span>

            </button>

            <button
              onClick={() =>
                changeLanguage(
                  lang === "en" ? "hi" : "en"
                )
              }
              className="flex items-center gap-1 text-xs bg-emerald-800 px-2.5 py-1 rounded-full text-white font-bold border border-emerald-600"
            >

              <Globe className="w-3.5 h-3.5 text-amber-300" />

              <span>
                {lang === "en"
                  ? "हिंदी"
                  : "English"}
              </span>

            </button>

          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-1">

            <Link
              href="/"
              onClick={() =>
                setMobileMenuOpen(false)
              }
              className="bg-amber-400 text-slate-900 px-3 py-2 rounded-lg text-center font-black"
            >
              {lang === "hi" ? "होम" : "Home"}
            </Link>

            <Link
              href="/shop"
              onClick={() =>
                setMobileMenuOpen(false)
              }
              className="bg-emerald-800 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-center"
            >
              {lang === "hi"
                ? "सभी सामान"
                : "All Shop"}
            </Link>

            <Link
              href="/offers"
              onClick={() =>
                setMobileMenuOpen(false)
              }
              className="bg-emerald-800 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-center"
            >
              {lang === "hi"
                ? "ऑफ़र्स"
                : "Offers"}
            </Link>

            <Link
              href="/account/orders"
              onClick={() =>
                setMobileMenuOpen(false)
              }
              className="bg-emerald-800 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-center"
            >
              {lang === "hi"
                ? "मेरे ऑर्डर"
                : "My Orders"}
            </Link>

          </div>

        </div>

      )}

      {/* =====================================================
          MAIN NAVIGATION BAR
      ===================================================== */}

      <nav className="bg-[#004d25] text-white text-sm font-bold shadow-md hidden sm:block">

        <div className="w-full max-w-[1920px] mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-10">

          {/* =================================================
              DYNAMIC ALL CATEGORIES DROPDOWN
          ================================================= */}

          <div
            className="relative"
            ref={categoriesDropdownRef}
          >

            <button
              type="button"
              onClick={() =>
                setCategoriesDropdownOpen(
                  !categoriesDropdownOpen
                )
              }
              className="
                flex
                items-center
                gap-2
                bg-[#00381a]
                hover:bg-[#002812]
                px-4
                py-2.5
                text-white
                font-black
                transition
                text-xs
                sm:text-sm
                cursor-pointer
                select-none
                rounded-t-md
              "
            >

              <Menu className="w-4 h-4 text-emerald-300" />

              <span>
                {lang === "hi"
                  ? "सभी कैटेगरी"
                  : "All Categories"}
              </span>

              <ChevronDown
                className={`
                  w-4
                  h-4
                  transition-transform
                  duration-200
                  ${
                    categoriesDropdownOpen
                      ? "rotate-180 text-amber-300"
                      : "text-emerald-300"
                  }
                `}
              />

            </button>

            {/* =================================================
                DYNAMIC DROPDOWN
            ================================================= */}

            {categoriesDropdownOpen && (

              <div
                className="
                  absolute
                  top-full
                  left-0
                  w-72
                  max-h-[70vh]
                  overflow-y-auto
                  bg-white
                  rounded-b-xl
                  shadow-2xl
                  border
                  border-slate-200
                  py-2
                  z-50
                  animate-in
                  fade-in
                  slide-in-from-top-2
                  duration-200
                "
              >

                <div className="divide-y divide-slate-100">

                  {categories.length > 0 ? (

                    categories.map((cat) => (

                      <Link
                        key={cat.id}
                        href={`/shop?category=${encodeURIComponent(
                          cat.slug
                        )}`}
                        onClick={() =>
                          setCategoriesDropdownOpen(false)
                        }
                        className="
                          flex
                          items-center
                          justify-between
                          px-4
                          py-2.5
                          hover:bg-emerald-50
                          transition
                          group
                          text-slate-800
                        "
                      >

                        <div className="flex items-center gap-3 min-w-0">

                          {/* Category Image */}

                          <div
                            className="
                              w-8
                              h-8
                              rounded-lg
                              bg-emerald-50
                              border
                              border-emerald-100
                              flex
                              items-center
                              justify-center
                              overflow-hidden
                              shrink-0
                            "
                          >

                            {cat.imageUrl ? (

                              <img
                                src={cat.imageUrl}
                                alt={cat.name}
                                className="
                                  w-full
                                  h-full
                                  object-cover
                                "
                              />

                            ) : (

                              <span className="text-base">
                                {categoryIcons[
                                  cat.slug
                                ] || "🛒"}
                              </span>

                            )}

                          </div>

                          {/* Category Name */}

                          <span
                            className="
                              text-xs
                              font-bold
                              text-slate-800
                              group-hover:text-[#004d25]
                              transition
                              truncate
                            "
                          >
                            {cat.name}
                          </span>

                        </div>

                        <ChevronRight
                          className="
                            w-3.5
                            h-3.5
                            text-slate-400
                            group-hover:text-[#004d25]
                            transition
                            shrink-0
                          "
                        />

                      </Link>

                    ))

                  ) : (

                    <div className="px-4 py-6 text-center">

                      <div className="text-2xl mb-2">
                        🛒
                      </div>

                      <p className="text-xs font-semibold text-slate-500">
                        {lang === "hi"
                          ? "अभी कोई कैटेगरी उपलब्ध नहीं है"
                          : "No categories available yet"}
                      </p>

                    </div>

                  )}

                </div>

              </div>

            )}

          </div>

          {/* =================================================
              CENTER NAVIGATION LINKS
          ================================================= */}

          <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto py-2">

            <Link
              href="/"
              className="
                px-4
                py-1
                bg-amber-400
                text-slate-900
                rounded-full
                font-black
                hover:bg-amber-300
                transition
                shrink-0
                text-xs
                sm:text-sm
                shadow-sm
              "
            >
              {lang === "hi"
                ? "होम"
                : "Home"}
            </Link>

            <Link
              href="/offers"
              className="hover:text-amber-300 transition shrink-0 text-xs sm:text-sm font-bold"
            >
              {lang === "hi"
                ? "ऑफ़र्स"
                : "Offers"}
            </Link>

            <Link
              href="/account/orders"
              className="hover:text-amber-300 transition shrink-0 text-xs sm:text-sm font-bold"
            >
              {lang === "hi"
                ? "मेरे ऑर्डर"
                : "My Orders"}
            </Link>

            <Link
              href="/contact"
              className="hover:text-amber-300 transition shrink-0 text-xs sm:text-sm font-bold"
            >
              {lang === "hi"
                ? "संपर्क करें"
                : "Contact Us"}
            </Link>

          </div>

          {/* =================================================
              DELIVERY PIN CODE BADGE
          ================================================= */}

          <button
            onClick={() => setPinModalOpen(true)}
            className="
              hidden
              sm:flex
              items-center
              gap-1.5
              text-xs
              text-emerald-200
              hover:text-white
              bg-emerald-900/80
              px-3
              py-1
              rounded-full
              border
              border-emerald-700
              transition
            "
          >

            <MapPin className="w-3.5 h-3.5 text-amber-300 animate-bounce" />

            <span>
              {pincode
                ? `PIN: ${pincode}`
                : lang === "hi"
                ? "पिन दर्ज करें"
                : "Deliver To"}
            </span>

          </button>

        </div>

      </nav>

      {/* =====================================================
          PIN CODE MODAL
      ===================================================== */}

      {pinModalOpen && (

        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100 text-slate-800">

            <button
              onClick={() =>
                setPinModalOpen(false)
              }
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">

              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">

                <MapPin className="w-5 h-5" />

              </div>

              <div>

                <h3 className="text-base font-bold text-slate-900">

                  {lang === "hi"
                    ? "डिलीवरी की उपलब्धता"
                    : "Delivery Availability"}

                </h3>

                <p className="text-xs text-slate-500">

                  {lang === "hi"
                    ? "अपना 6-अंकीय पिन कोड दर्ज करें"
                    : "Enter your 6-digit Indian PIN code to check delivery"}

                </p>

              </div>

            </div>

            <form
              onSubmit={handlePinCheck}
              className="space-y-3"
            >

              <div>

                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g.851129 , 851101"
                  value={inputPin}
                  onChange={(e) =>
                    setInputPin(
                      e.target.value.replace(
                        /\D/g,
                        ""
                      )
                    )
                  }
                  className="
                    w-full
                    px-4
                    py-2.5
                    border
                    border-slate-300
                    rounded-xl
                    font-mono
                    text-center
                    text-lg
                    tracking-widest
                    focus:ring-2
                    focus:ring-emerald-600
                    focus:border-emerald-600
                    outline-none
                  "
                />

              </div>

              {pinStatus && (

                <div
                  className={`
                    p-3
                    rounded-xl
                    text-xs
                    font-semibold
                    flex
                    items-start
                    gap-2
                    ${
                      pinStatus.error
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    }
                  `}
                >

                  {pinStatus.error ? (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  )}

                  <div>

                    <p>
                      {pinStatus.message}
                    </p>

                    {pinStatus.data && (

                      <p className="text-[11px] font-normal mt-0.5 text-emerald-700">

                        {pinStatus.data.area},{" "}
                        {pinStatus.data.city} • Est:{" "}
                        {
                          pinStatus.data
                            .estimatedDeliveryTime
                        }

                      </p>

                    )}

                  </div>

                </div>

              )}

              <button
                type="submit"
                disabled={pinLoading}
                className="
                  w-full
                  bg-[#005c2a]
                  hover:bg-[#004720]
                  text-white
                  font-bold
                  text-sm
                  py-2.5
                  rounded-xl
                  shadow-md
                  transition
                  disabled:opacity-50
                "
              >

                {pinLoading
                  ? lang === "hi"
                    ? "जांच हो रही है..."
                    : "Checking Availability..."
                  : lang === "hi"
                  ? "डिलीवरी जांचें"
                  : "CHECK DELIVERY"}

              </button>

            </form>

          </div>

        </div>

      )}

    </header>
  );
}