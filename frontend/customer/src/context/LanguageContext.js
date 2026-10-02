"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    home: "Home",
    shop: "Shop All",
    categories: "Categories",
    offers: "Offers & Coupons",
    cart: "Cart",
    wishlist: "Wishlist",
    account: "Account",
    searchPlaceholder: "Search groceries, atta, milk, chips, spices...",
    voiceSearch: "Voice Search",
    checkDelivery: "Check Delivery Availability",
    addToCart: "ADD TO CART",
    buyNow: "BUY NOW",
    orderViaWhatsApp: "ORDER VIA WHATSAPP",
    deliverTo: "Deliver to PIN",
    enterPin: "Enter PIN Code",
    topBanner: "Madhukar General Store — Fresh Groceries Delivered Same Day",
    support: "Support",
    aboutStore: "About Store",
    myProfile: "My Profile",
    myOrders: "My Orders & Invoices",
    signOut: "Sign Out",
    login: "Login",
    register: "Register",
    // Hero & Home
    heroTitle: "Fresh Groceries & Daily Essentials Delivered Fast",
    heroSubtitle: "Order wheat flour, rice, pulses, dairy, snacks & household needs at lowest neighborhood prices with guaranteed express delivery.",
    shopNow: "SHOP NOW",
    featuredCategories: "Featured Categories",
    popularProducts: "Popular Daily Essentials",
    viewAll: "View All",
    whyChooseUs: "Why Shop With Madhukar General Store?",
    qualityAssured: "100% Quality Assured",
    qualityDesc: "Directly sourced fresh products and genuine brands.",
    sameDayDelivery: "Same Day Express Delivery",
    sameDayDesc: "Fast delivery right to your doorstep in serviced PIN areas.",
    bestPrices: "Best Neighborhood Prices",
    bestPricesDesc: "Unbeatable prices and discount offers every day.",
    codAvailable: "Cash on Delivery Available",
    codDesc: "Pay cash comfortably when your order arrives.",
    // Shop & Catalog
    allProducts: "All Products",
    filterByCategory: "Filter by Category",
    sortBy: "Sort By",
    priceLowHigh: "Price: Low to High",
    priceHighLow: "Price: High to Low",
    ratingHighLow: "Rating: High to Low",
    searchResults: "Search Results for",
    noProductsFound: "No products found matching your search.",
    outOfStock: "Out of Stock",
    inStock: "In Stock",
    off: "OFF",
    added: "ADDED",
    add: "ADD",
    // Cart & Checkout
    yourCart: "Your Shopping Cart",
    emptyCart: "Your cart is empty",
    continueShopping: "Continue Shopping",
    subtotal: "Subtotal",
    itemDiscount: "Product Discount",
    couponDiscount: "Coupon Discount",
    deliveryCharge: "Delivery Charge",
    freeDelivery: "FREE",
    grandTotal: "Total Amount",
    applyCoupon: "Apply Coupon",
    enterCouponCode: "Enter Coupon Code",
    apply: "Apply",
    remove: "Remove",
    proceedToCheckout: "Proceed to Checkout",
    checkoutTitle: "Complete Your Order",
    deliveryAddress: "Delivery Address",
    selectAddress: "Select Saved Address",
    addNewAddress: "Add New Address",
    paymentMethod: "Payment Method",
    cashOnDelivery: "Cash on Delivery (COD)",
    placeOrder: "PLACE ORDER (COD)",
    orderPlacedSuccess: "Order Placed Successfully!",
    orderNumber: "Order Number",
    viewInvoice: "View Invoice",
    // Account & Orders & Wishlist
    welcomeUser: "Welcome",
    profileDetails: "Profile Details",
    fullName: "Full Name",
    emailAddress: "Email Address",
    mobileNumber: "Mobile Number",
    saveChanges: "Save Changes",
    orderHistory: "Order History",
    orderDate: "Order Date",
    orderStatus: "Status",
    total: "Total",
    viewDetails: "View Details",
    myWishlist: "My Wishlist",
    emptyWishlist: "Your wishlist is empty",
    // Footer & Policies
    footerAbout: "Your trusted local neighborhood grocery store now online. High quality staples, dairy, snacks & daily essentials delivered straight to your home.",
    quickLinks: "Quick Links",
    customerCare: "Customer Care & Policies",
    verifiedDelivery: "Verified PIN Delivery",
    copyright: "© 2026 Madhukar General Store. All Rights Reserved."
  },
  hi: {
    home: "होम",
    shop: "सब उत्पाद देखें",
    categories: "श्रेणियां",
    offers: "ऑफ़र और कूपन",
    cart: "कार्ट",
    wishlist: "विशलिस्ट",
    account: "खाता",
    searchPlaceholder: "आटा, चावल, दूध, दाल, मसाले खोजें...",
    voiceSearch: "बोलकर खोजें",
    checkDelivery: "डिलीवरी की जांच करें",
    addToCart: "कार्ट में जोड़ें",
    buyNow: "अभी खरीदें",
    orderViaWhatsApp: "व्हाट्सएप द्वारा ऑर्डर करें",
    deliverTo: "डिलीवरी पिन",
    enterPin: "पिन कोड दर्ज करें",
    topBanner: "मधुकर जनरल स्टोर — ताजा राशन आज ही आपके घर पर",
    support: "सहायता",
    aboutStore: "स्टोर के बारे में",
    myProfile: "मेरी प्रोफाइल",
    myOrders: "मेरे ऑर्डर और बिल",
    signOut: "साइन आउट",
    login: "लॉग इन",
    register: "रजिस्टर करें",
    // Hero & Home
    heroTitle: "ताजा राशन और दैनिक सामान, आपके घर तक तेजी से",
    heroSubtitle: "सर्वोत्तम दामों पर गेहूं का आटा, चावल, दालें, दूध, स्नैक्स और घरेलू सामान ऑर्डर करें, गारंटीड होम डिलीवरी के साथ।",
    shopNow: "अभी खरीदारी करें",
    featuredCategories: "प्रमुख श्रेणियां",
    popularProducts: "लोकप्रिय दैनिक आवश्यकताएं",
    viewAll: "सभी देखें",
    whyChooseUs: "मधुकर जनरल स्टोर से क्यों खरीदें?",
    qualityAssured: "100% शुद्धता की गारंटी",
    qualityDesc: "सीधे विश्वसनीय स्रोतों से प्राप्त ताजा और शुद्ध उत्पाद।",
    sameDayDelivery: "उसी दिन एक्सप्रेस डिलीवरी",
    sameDayDesc: "आपके पिन कोड पर तुरंत आपके दरवाजे तक डिलीवरी।",
    bestPrices: "सबसे कम और किफायती दाम",
    bestPricesDesc: "प्रतिदिन विशेष छूट और सर्वोत्तम मूल्य।",
    codAvailable: "कैश ऑन डिलीवरी उपलब्ध",
    codDesc: "ऑर्डर मिलने पर आसानी से नकद भुगतान करें।",
    // Shop & Catalog
    allProducts: "सभी उत्पाद",
    filterByCategory: "श्रेणी अनुसार देखें",
    sortBy: "क्रमानुसार रखें",
    priceLowHigh: "कीमत: कम से ज्यादा",
    priceHighLow: "कीमत: ज्यादा से कम",
    ratingHighLow: "रेटिंग: ज्यादा से कम",
    searchResults: "खोज परिणाम",
    noProductsFound: "आपकी खोज के अनुसार कोई उत्पाद नहीं मिला।",
    outOfStock: "स्टॉक समाप्त",
    inStock: "स्टॉक उपलब्ध",
    off: "छूट",
    added: "जोड़ा गया",
    add: "जोड़ें",
    // Cart & Checkout
    yourCart: "आपकी शॉपिंग कार्ट",
    emptyCart: "आपकी कार्ट खाली है",
    continueShopping: "खरीदारी जारी रखें",
    subtotal: "सबटोटल",
    itemDiscount: "उत्पाद छूट",
    couponDiscount: "कूपन छूट",
    deliveryCharge: "डिलीवरी शुल्क",
    freeDelivery: "मुफ्त",
    grandTotal: "कुल राशि",
    applyCoupon: "कूपन लागू करें",
    enterCouponCode: "कूपन कोड दर्ज करें",
    apply: "लागू करें",
    remove: "हटाएं",
    proceedToCheckout: "चेकआउट के लिए आगे बढ़ें",
    checkoutTitle: "अपना ऑर्डर पूरा करें",
    deliveryAddress: "डिलीवरी का पता",
    selectAddress: "सहेजा गया पता चुनें",
    addNewAddress: "नया पता जोड़ें",
    paymentMethod: "भुगतान का तरीका",
    cashOnDelivery: "कैश ऑन डिलीवरी (नकद भुगतान)",
    placeOrder: "ऑर्डर कन्फर्म करें (COD)",
    orderPlacedSuccess: "ऑर्डर सफलतापूर्वक हो गया!",
    orderNumber: "ऑर्डर संख्या",
    viewInvoice: "बिल देखें",
    // Account & Orders & Wishlist
    welcomeUser: "स्वागत है",
    profileDetails: "प्रोफाइल विवरण",
    fullName: "पूरा नाम",
    emailAddress: "ईमेल पता",
    mobileNumber: "मोबाइल नंबर",
    saveChanges: "बदलाव सहेजें",
    orderHistory: "ऑर्डर का इतिहास",
    orderDate: "ऑर्डर की तारीख",
    orderStatus: "स्थिति",
    total: "कुल",
    viewDetails: "विवरण देखें",
    myWishlist: "मेरी विशलिस्ट",
    emptyWishlist: "आपकी विशलिस्ट खाली है",
    // Footer & Policies
    footerAbout: "आपका विश्वसनीय स्थानीय राशन स्टोर अब ऑनलाइन। गुणवत्तापूर्ण दालें, आटा, दूध, स्नैक्स और दैनिक आवश्यकताएं सीधे आपके घर तक।",
    quickLinks: "त्वरित लिंक्स",
    customerCare: "ग्राहक सेवा और नीतियां",
    verifiedDelivery: "सत्यापित पिन कोड डिलीवरी",
    copyright: "© 2026 मधुकर जनरल स्टोर। सर्वाधिकार सुरक्षित।"
  },
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('mgs_lang');
    if (saved && (saved === 'en' || saved === 'hi')) {
      setLang(saved);
    }
  }, []);

  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('mgs_lang', newLang);
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext) || { lang: 'en', changeLanguage: () => {}, t: (k) => k };
}