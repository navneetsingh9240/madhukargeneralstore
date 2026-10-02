"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    adminConsole: "Admin Console",
    deliveryConsole: "Delivery Portal",
    storeManager: "Store Manager",
    overview: "Overview",
    productsInventory: "Products & Inventory",
    ordersStatus: "Orders & Status",
    deliveryPins: "Delivery PIN Codes",
    couponsOffers: "Coupons & Offers",
    invoicesBilling: "Invoices & Billing",
    openQrScanner: "Open QR Scanner",
    todaysRevenue: "Today's Revenue",
    totalCompletedSales: "Total Completed Sales",
    totalOrders: "Total Orders",
    pendingFulfillment: "Orders Pending Fulfillment",
    registeredCustomers: "Registered Customers",
    lowStockAlert: "Low Stock Alert",
    catalog: "Catalog",
    manageProducts: "Manage Products",
    fulfillment: "Fulfillment",
    manageOrders: "Manage Orders",
    logistics: "Logistics",
    pinCodes: "PIN Codes",
    marketing: "Marketing",
    recentOrders: "Recent Live Orders",
    orderNo: "Order #",
    customer: "Customer",
    amount: "Amount",
    payment: "Payment",
    status: "Status",
    date: "Date",
    action: "Action",
    viewInvoice: "View Invoice",
    addProduct: "Add New Product",
    searchProducts: "Search products...",
    productName: "Product Name",
    price: "Price",
    stock: "Stock",
    scanQrCode: "Scan Order QR Code",
    deliveryVerification: "Order Delivery Verification Portal",
    loginTitle: "Madhukar Store Admin & Staff Portal",
    loginSubtitle: "Sign in with your admin or delivery credentials",
    email: "Email Address",
    password: "Password",
    signIn: "Sign In to Portal",
    signOut: "Sign Out",
  },
  hi: {
    adminConsole: "एडमिन कंसोल",
    deliveryConsole: "डिलीवरी पोर्टल",
    storeManager: "स्टोर प्रबंधक",
    overview: "अवलोकन",
    productsInventory: "उत्पाद और स्टॉक",
    ordersStatus: "ऑर्डर एवं स्थिति",
    deliveryPins: "डिलीवरी पिन कोड",
    couponsOffers: "कूपन और ऑफ़र",
    invoicesBilling: "बिलिंग एवं इनवॉइस",
    openQrScanner: "क्यूआर स्कैनर खोलें",
    todaysRevenue: "आज की कमाई",
    totalCompletedSales: "कुल पूर्ण बिक्री",
    totalOrders: "कुल ऑर्डर",
    pendingFulfillment: "लंबित ऑर्डर",
    registeredCustomers: "पंजीकृत ग्राहक",
    lowStockAlert: "कम स्टॉक चेतावनी",
    catalog: "उत्पाद सूची",
    manageProducts: "उत्पाद प्रबंधित करें",
    fulfillment: "आपूर्तियां",
    manageOrders: "ऑर्डर प्रबंधित करें",
    logistics: "लॉजिस्टिक्स",
    pinCodes: "पिन कोड",
    marketing: "मार्केटिंग",
    recentOrders: "हाल के लाइव ऑर्डर",
    orderNo: "ऑर्डर संख्या",
    customer: "ग्राहक",
    amount: "राशि",
    payment: "भुगतान",
    status: "स्थिति",
    date: "तारीख",
    action: "कार्रवाई",
    viewInvoice: "बिल देखें",
    addProduct: "नया उत्पाद जोड़ें",
    searchProducts: "उत्पाद खोजें...",
    productName: "उत्पाद का नाम",
    price: "कीमत",
    stock: "स्टॉक",
    scanQrCode: "ऑर्डर क्यूआर कोड स्कैन करें",
    deliveryVerification: "ऑर्डर डिलीवरी सत्यापन पोर्टल",
    loginTitle: "मधुकर स्टोर एडमिन एवं स्टाफ पोर्टल",
    loginSubtitle: "अपने एडमिन या डिलीवरी क्रेडेंशियल के साथ साइन इन करें",
    email: "ईमेल पता",
    password: "पासवर्ड",
    signIn: "पोर्टल में साइन इन करें",
    signOut: "साइन आउट",
  },
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('mgs_admin_lang');
    if (saved && (saved === 'en' || saved === 'hi')) {
      setLang(saved);
    }
  }, []);

  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('mgs_admin_lang', newLang);
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