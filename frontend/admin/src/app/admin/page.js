"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  PackageCheck,
  AlertTriangle,
  Plus,
  ArrowRight,
  MapPin,
  Tag,
  FolderTree,
  FileText,
  ShieldAlert,
  Clock,
  Truck,
  CheckCircle2,
  Globe,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

export default function AdminDashboardPage() {
  const { user, token } = useAuth();
  const { lang, changeLanguage, t } = useLanguage();
  const router = useRouter();

  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // AUTH + DASHBOARD DATA
  // ============================================================

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    const API_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    fetch(`${API_URL}/api/admin/metrics`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMetrics(data.data);
        } else {
          router.push("/login");
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [token, router]);

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen p-12 text-center text-xs text-slate-400">
        Loading admin control panel...
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-100/60 pb-12">

      {/* ======================================================
          TOP ADMIN HEADER BAR
      ====================================================== */}

      <div className="bg-slate-900 text-white py-6 px-4 shadow-md">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

          {/* Admin Title */}
          <div>
            <div className="flex items-center gap-2">

              <span className="bg-amber-500 text-slate-900 font-extrabold text-[10px] px-2 py-0.5 rounded uppercase">
                {t("adminConsole")}
              </span>

              <h1 className="text-xl font-black tracking-tight">
                {lang === "hi"
                  ? "मधुकर जनरल स्टोर एडमिन"
                  : "Madhukar General Store Admin"}
              </h1>

            </div>

            <p className="text-xs text-slate-400 mt-1">
              {t("storeManager")}:{" "}
              <strong className="text-slate-200">
                {user?.name}
              </strong>{" "}
              ({user?.email})
            </p>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3">

            {/* Language Switcher */}
            <button
              onClick={() =>
                changeLanguage(lang === "en" ? "hi" : "en")
              }
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-2 rounded-xl border border-slate-700 text-xs transition shadow-sm"
            >
              <Globe className="w-3.5 h-3.5 text-amber-300" />

              <span>
                {lang === "en" ? "हिंदी" : "English"}
              </span>
            </button>

            {/* QR Scanner */}
            <Link
              href="/delivery"
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Truck className="w-4 h-4" />

              {t("openQrScanner")}
            </Link>

          </div>
        </div>
      </div>

      {/* ======================================================
          ADMIN NAVIGATION SUB-BAR
      ====================================================== */}

      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-sm">
        <div className="container mx-auto max-w-6xl px-4 flex items-center gap-2 overflow-x-auto py-2.5 text-xs font-bold">

          <Link
            href="/admin"
            className="bg-brand-600 text-white px-3.5 py-1.5 rounded-lg shadow-sm shrink-0"
          >
            {t("overview")}
          </Link>

          <Link
            href="/admin/products"
            className="text-slate-700 hover:bg-slate-100 px-3.5 py-1.5 rounded-lg shrink-0 transition"
          >
            {t("productsInventory")}
          </Link>

          <Link
            href="/admin/orders"
            className="text-slate-700 hover:bg-slate-100 px-3.5 py-1.5 rounded-lg shrink-0 transition"
          >
            {t("ordersStatus")}
          </Link>

          <Link
            href="/admin/delivery-areas"
            className="text-slate-700 hover:bg-slate-100 px-3.5 py-1.5 rounded-lg shrink-0 transition"
          >
            {t("deliveryPins")}
          </Link>

          <Link
            href="/admin/coupons"
            className="text-slate-700 hover:bg-slate-100 px-3.5 py-1.5 rounded-lg shrink-0 transition"
          >
            {t("couponsOffers")}
          </Link>

          <Link
            href="/admin/invoices"
            className="text-slate-700 hover:bg-slate-100 px-3.5 py-1.5 rounded-lg shrink-0 transition"
          >
            {t("invoicesBilling")}
          </Link>

        </div>
      </div>

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="container mx-auto max-w-6xl px-4 mt-8">

        {/* ====================================================
            METRIC CARDS
        ==================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          {/* Today's Revenue */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">

            <div className="flex items-center justify-between mb-2">

              <span className="text-[11px] font-extrabold uppercase text-slate-400">
                {t("todaysRevenue")}
              </span>

              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>

            </div>

            <p className="text-2xl font-black text-slate-900">
              ₹{metrics.todaySales}
            </p>

            <p className="text-[11px] text-slate-500 mt-1">
              {t("totalCompletedSales")}: ₹{metrics.totalSales}
            </p>

          </div>

          {/* Total Orders */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">

            <div className="flex items-center justify-between mb-2">

              <span className="text-[11px] font-extrabold uppercase text-slate-400">
                {t("totalOrders")}
              </span>

              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>

            </div>

            <p className="text-2xl font-black text-slate-900">
              {metrics.totalOrders}
            </p>

            <p className="text-[11px] text-amber-600 font-bold mt-1">
              {metrics.pendingOrders} {t("pendingFulfillment")}
            </p>

          </div>

          {/* Registered Customers */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">

            <div className="flex items-center justify-between mb-2">

              <span className="text-[11px] font-extrabold uppercase text-slate-400">
                {t("registeredCustomers")}
              </span>

              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>

            </div>

            <p className="text-2xl font-black text-slate-900">
              {metrics.totalCustomers}
            </p>

            <p className="text-[11px] text-slate-500 mt-1">
              {lang === "hi"
                ? "सक्रिय ग्राहक खाते"
                : "Active Customer Accounts"}
            </p>

          </div>

          {/* Low Stock Alert */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">

            <div className="flex items-center justify-between mb-2">

              <span className="text-[11px] font-extrabold uppercase text-slate-400">
                {t("lowStockAlert")}
              </span>

              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
                <AlertTriangle className="w-4 h-4" />
              </div>

            </div>

            <p className="text-2xl font-black text-slate-900">
              {metrics.lowStockProducts}
            </p>

            <p className="text-[11px] text-red-600 font-bold mt-1">
              {lang === "hi"
                ? "उत्पादों को पुन: स्टॉक करने की आवश्यकता है"
                : "Items Need Stock Replenishment"}
            </p>

          </div>

        </div>

        {/* ====================================================
            QUICK MANAGEMENT LINKS
        ==================================================== */}

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">

          {/* Manage Products */}
          <Link
            href="/admin/products"
            className="bg-brand-900 hover:bg-brand-800 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between transition group"
          >
            <div>
              <p className="text-xs font-bold text-brand-200">
                Catalog
              </p>

              <p className="text-sm font-black mt-0.5">
                Manage Products
              </p>
            </div>

            <Plus className="w-5 h-5 text-brand-400 group-hover:scale-110 transition-transform" />
          </Link>

          {/* Manage Categories - NEW */}
          <Link
            href="/admin/Categories"
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 p-4 rounded-2xl shadow-sm flex items-center justify-between transition group"
          >
            <div>
              <p className="text-xs font-bold text-amber-900">
                Catalog
              </p>

              <p className="text-sm font-black mt-0.5">
                Manage Categories
              </p>
            </div>

            <FolderTree className="w-5 h-5 text-slate-900 group-hover:scale-110 transition-transform" />
          </Link>

          {/* Manage Orders */}
          <Link
            href="/admin/orders"
            className="bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between transition group"
          >
            <div>
              <p className="text-xs font-bold text-slate-400">
                Fulfillment
              </p>

              <p className="text-sm font-black mt-0.5">
                Manage Orders
              </p>
            </div>

            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* PIN Codes */}
          <Link
            href="/admin/delivery-areas"
            className="bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between transition group"
          >
            <div>
              <p className="text-xs font-bold text-slate-400">
                Logistics
              </p>

              <p className="text-sm font-black mt-0.5">
                PIN Codes
              </p>
            </div>

            <MapPin className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
          </Link>

          {/* Coupons & Offers */}
          <Link
            href="/admin/coupons"
            className="bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between transition group"
          >
            <div>
              <p className="text-xs font-bold text-slate-400">
                Marketing
              </p>

              <p className="text-sm font-black mt-0.5">
                Coupons & Offers
              </p>
            </div>

            <Tag className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
          </Link>

        </div>

        {/* ====================================================
            RECENT ORDERS TABLE
        ==================================================== */}

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">

          <div className="flex justify-between items-center mb-6">

            <div>

              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {t("recentOrders")}
              </h2>

              <p className="text-xs text-slate-500">
                {lang === "hi"
                  ? "आने वाले ऑर्डर की निगरानी करें"
                  : "Monitor incoming store orders and change dispatch statuses"}
              </p>

            </div>

            <Link
              href="/admin/orders"
              className="text-xs font-bold text-brand-600 hover:underline"
            >
              {t("manageOrders")}
            </Link>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-left text-xs">

              <thead>

                <tr className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">

                  <th className="py-2.5 px-3">
                    {t("orderNo")}
                  </th>

                  <th className="py-2.5 px-3">
                    {t("customer")}
                  </th>

                  <th className="py-2.5 px-3">
                    {t("amount")}
                  </th>

                  <th className="py-2.5 px-3">
                    {t("payment")}
                  </th>

                  <th className="py-2.5 px-3">
                    {t("status")}
                  </th>

                  <th className="py-2.5 px-3">
                    {t("date")}
                  </th>

                  <th className="py-2.5 px-3 text-right">
                    {t("action")}
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {metrics.recentOrders.map((ord) => (

                  <tr
                    key={ord.id}
                    className="hover:bg-slate-50/50"
                  >

                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      #{ord.orderNumber}
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {ord.user?.name || "Customer"}
                      <br />

                      <span className="text-[10px] text-slate-400">
                        {ord.user?.phone || ""}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-black text-slate-900">
                      ₹{ord.totalAmount}
                    </td>

                    <td className="py-3 px-3 uppercase font-bold text-slate-600">
                      {ord.paymentMethod}
                    </td>

                    <td className="py-3 px-3">

                      <span className="bg-amber-100 text-amber-900 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full">
                        {ord.orderStatus}
                      </span>

                    </td>

                    <td className="py-3 px-3 text-slate-500">
                      {new Date(ord.createdAt).toLocaleDateString(
                        "en-IN"
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">

                      <Link
                        href={`/admin/invoices/${ord.id}`}
                        className="text-brand-600 hover:text-brand-700 font-bold"
                      >
                        View Invoice
                      </Link>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </div>
  );
}