"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Plus,
  Pencil,
  Trash2,
  FolderTree,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Package,
  ShoppingBag,
  MapPin,
  Tag,
  FileText,
  Camera,
  Image as ImageIcon,
  Upload,
  RotateCcw,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";

// ============================================================
// PAGE
// ============================================================

export default function CategoriesPage() {
  const router = useRouter();

  // ============================================================
  // AUTH
  // ============================================================

  const {
    token,
    loading: authLoading,
    user,
  } = useAuth();

  // ============================================================
  // STATE
  // ============================================================

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    imageUrl: "",
  });

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  // ============================================================
  // IMAGE / CAMERA STATE
  // ============================================================

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraStreamRef = useRef(null);

  // ============================================================
  // API
  // ============================================================

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // ============================================================
  // FETCH CATEGORIES
  // ============================================================

  const fetchCategories = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);

      setMessage({
        type: "",
        text: "",
      });

      const response = await fetch(
        `${API_URL}/api/admin/categories`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to fetch categories"
        );
      }

      setCategories(data.data || []);
    } catch (error) {
      console.error("Fetch categories error:", error);

      setMessage({
        type: "error",
        text: error.message || "Failed to load categories",
      });
    } finally {
      setLoading(false);
    }
  }, [API_URL, token]);

  // ============================================================
  // AUTH + INITIAL LOAD
  // ============================================================

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!token) {
      router.push("/login");
      return;
    }

    fetchCategories();
  }, [
    token,
    authLoading,
    router,
    fetchCategories,
  ]);

  // ============================================================
  // CAMERA CLEANUP
  // ============================================================

  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      cameraStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOpen(false);
    setCameraLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        cameraStreamRef.current = null;
      }
    };
  }, []);

  // ============================================================
  // AUTO SLUG GENERATOR
  // ============================================================

  const generateSlug = (value) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  // ============================================================
  // FORM HANDLERS
  // ============================================================

  const handleNameChange = (e) => {
    const value = e.target.value;

    setForm((previous) => ({
      ...previous,
      name: value,

      // Automatically generate slug while creating.
      // During editing, keep existing slug unless changed manually.
      slug: editingCategory
        ? previous.slug
        : generateSlug(value),
    }));
  };

  const handleSlugChange = (e) => {
    setForm((previous) => ({
      ...previous,
      slug: generateSlug(e.target.value),
    }));
  };

  // ============================================================
  // IMAGE FILE VALIDATION
  // ============================================================

  const validateImageFile = (file) => {
    if (!file) {
      return false;
    }

    if (!file.type.startsWith("image/")) {
      setMessage({
        type: "error",
        text: "Please select a valid image file.",
      });

      return false;
    }

    // Keep base64 image size reasonable.
    // 5 MB original file limit.
    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setMessage({
        type: "error",
        text: "Image size must be less than 5 MB.",
      });

      return false;
    }

    return true;
  };

  // ============================================================
  // FILE IMAGE SELECT
  // ============================================================

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!validateImageFile(file)) {
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        setMessage({
          type: "error",
          text: "Unable to read selected image.",
        });

        return;
      }

      setForm((previous) => ({
        ...previous,
        imageUrl: result,
      }));

      setMessage({
        type: "",
        text: "",
      });
    };

    reader.onerror = () => {
      setMessage({
        type: "error",
        text: "Failed to read image file.",
      });
    };

    reader.readAsDataURL(file);

    // Allow selecting the same file again later.
    e.target.value = "";
  };

  // ============================================================
  // REMOVE IMAGE
  // ============================================================

  const handleRemoveImage = () => {
    setForm((previous) => ({
      ...previous,
      imageUrl: "",
    }));
  };

  // ============================================================
  // OPEN FILE PICKER
  // ============================================================

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // ============================================================
  // OPEN CAMERA
  // ============================================================

  const openCamera = async () => {
    setMessage({
      type: "",
      text: "",
    });

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setMessage({
        type: "error",
        text:
          "Camera is not supported by this browser. Please choose an image file instead.",
      });

      return;
    }

    try {
      setCameraLoading(true);
      setCameraOpen(true);

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: "environment",
            },
          },
          audio: false,
        });

      cameraStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        try {
          await videoRef.current.play();
        } catch (playError) {
          console.warn(
            "Camera autoplay warning:",
            playError
          );
        }
      }

      setCameraLoading(false);
    } catch (error) {
      console.error("Camera access error:", error);

      setCameraOpen(false);
      setCameraLoading(false);

      let errorMessage =
        "Unable to access camera.";

      if (error?.name === "NotAllowedError") {
        errorMessage =
          "Camera permission was denied. Please allow camera access and try again.";
      } else if (error?.name === "NotFoundError") {
        errorMessage =
          "No camera was found on this device.";
      } else if (error?.name === "NotReadableError") {
        errorMessage =
          "Camera is already being used by another application.";
      }

      setMessage({
        type: "error",
        text: errorMessage,
      });
    }
  };

  // ============================================================
  // CAPTURE CAMERA IMAGE
  // ============================================================

  const captureCameraImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return;
    }

    if (!video.videoWidth || !video.videoHeight) {
      setMessage({
        type: "error",
        text: "Camera is not ready yet. Please wait a moment.",
      });

      return;
    }

    const maxWidth = 1200;

    const scale = Math.min(
      1,
      maxWidth / video.videoWidth
    );

    const width = Math.round(
      video.videoWidth * scale
    );

    const height = Math.round(
      video.videoHeight * scale
    );

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      setMessage({
        type: "error",
        text: "Unable to capture camera image.",
      });

      return;
    }

    context.drawImage(
      video,
      0,
      0,
      width,
      height
    );

    const imageData = canvas.toDataURL(
      "image/jpeg",
      0.82
    );

    setForm((previous) => ({
      ...previous,
      imageUrl: imageData,
    }));

    setMessage({
      type: "",
      text: "",
    });

    stopCamera();
  };

  // ============================================================
  // OPEN ADD CATEGORY FORM
  // ============================================================

  const openAddForm = () => {
    stopCamera();

    setEditingCategory(null);

    setForm({
      name: "",
      slug: "",
      imageUrl: "",
    });

    setMessage({
      type: "",
      text: "",
    });

    setShowForm(true);
  };

  // ============================================================
  // OPEN EDIT CATEGORY FORM
  // ============================================================

  const openEditForm = (category) => {
    stopCamera();

    setEditingCategory(category);

    setForm({
      name: category.name || "",
      slug: category.slug || "",
      imageUrl: category.imageUrl || "",
    });

    setMessage({
      type: "",
      text: "",
    });

    setShowForm(true);
  };

  // ============================================================
  // CLOSE FORM
  // ============================================================

  const closeForm = () => {
    if (saving) return;

    stopCamera();

    setShowForm(false);
    setEditingCategory(null);

    setForm({
      name: "",
      slug: "",
      imageUrl: "",
    });
  };

  // ============================================================
  // CREATE / UPDATE CATEGORY
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setMessage({
        type: "error",
        text: "Category name is required.",
      });

      return;
    }

    try {
      setSaving(true);

      setMessage({
        type: "",
        text: "",
      });

      const isEditing = Boolean(editingCategory);

      const url = isEditing
        ? `${API_URL}/api/admin/categories/${editingCategory.id}`
        : `${API_URL}/api/admin/categories`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim(),
          imageUrl: form.imageUrl || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to save category"
        );
      }

      setMessage({
        type: "success",
        text: isEditing
          ? "Category updated successfully."
          : "Category created successfully.",
      });

      stopCamera();

      setShowForm(false);
      setEditingCategory(null);

      setForm({
        name: "",
        slug: "",
        imageUrl: "",
      });

      await fetchCategories();
    } catch (error) {
      console.error("Save category error:", error);

      setMessage({
        type: "error",
        text:
          error.message || "Failed to save category",
      });
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE CATEGORY
  // ============================================================

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${category.name}"?`
    );

    if (!confirmed) return;

    try {
      setMessage({
        type: "",
        text: "",
      });

      const response = await fetch(
        `${API_URL}/api/admin/categories/${category.id}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to delete category"
        );
      }

      setMessage({
        type: "success",
        text: "Category deleted successfully.",
      });

      await fetchCategories();
    } catch (error) {
      console.error("Delete category error:", error);

      setMessage({
        type: "error",
        text:
          error.message || "Failed to delete category",
      });
    }
  };

  // ============================================================
  // AUTH LOADING
  // ============================================================

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100/60 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-7 h-7 text-brand-600 animate-spin mx-auto mb-3" />

          <p className="text-sm font-semibold text-slate-600">
            Checking admin authentication...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // CATEGORY LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100/60 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-7 h-7 text-brand-600 animate-spin mx-auto mb-3" />

          <p className="text-sm font-semibold text-slate-600">
            Loading categories...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-100/60 pb-12">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="bg-slate-900 text-white py-6 px-4 shadow-md">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Page Title */}
            <div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-900 flex items-center justify-center">
                  <FolderTree className="w-5 h-5" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500 text-slate-900 font-extrabold text-[10px] px-2 py-0.5 rounded uppercase">
                      Admin Console
                    </span>
                  </div>

                  <h1 className="text-xl font-black tracking-tight mt-1">
                    Manage Categories
                  </h1>

                  <p className="text-xs text-slate-400 mt-1">
                    Organize products into store categories
                  </p>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={fetchCategories}
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-700 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>

              <button
                onClick={openAddForm}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-xl text-xs font-extrabold transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          ADMIN NAVIGATION
      ====================================================== */}

      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex items-center gap-2 overflow-x-auto py-2.5 text-xs font-bold">
            <Link
              href="/admin"
              className="text-slate-700 hover:bg-slate-100 px-3.5 py-1.5 rounded-lg shrink-0 transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Dashboard
            </Link>

            <Link
              href="/admin/products"
              className="text-slate-700 hover:bg-slate-100 px-3.5 py-1.5 rounded-lg shrink-0 transition flex items-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5" />
              Products
            </Link>

            <Link
              href="/admin/Categories"
              className="bg-brand-600 text-white px-3.5 py-1.5 rounded-lg shadow-sm shrink-0 flex items-center gap-1.5"
            >
              <FolderTree className="w-3.5 h-3.5" />
              Categories
            </Link>

            <Link
              href="/admin/orders"
              className="text-slate-700 hover:bg-slate-100 px-3.5 py-1.5 rounded-lg shrink-0 transition flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Orders
            </Link>

            <Link
              href="/admin/delivery-areas"
              className="text-slate-700 hover:bg-slate-100 px-3.5 py-1.5 rounded-lg shrink-0 transition flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5" />
              PIN Codes
            </Link>

            <Link
              href="/admin/coupons"
              className="text-slate-700 hover:bg-slate-100 px-3.5 py-1.5 rounded-lg shrink-0 transition flex items-center gap-1.5"
            >
              <Tag className="w-3.5 h-3.5" />
              Coupons
            </Link>

            <Link
              href="/admin/invoices"
              className="text-slate-700 hover:bg-slate-100 px-3.5 py-1.5 rounded-lg shrink-0 transition flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              Invoices
            </Link>
          </div>
        </div>
      </div>

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="container mx-auto max-w-6xl px-4 mt-8">
        {/* Page Intro */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-brand-600">
              Catalog Management
            </p>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Product Categories
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              Create, edit and manage categories used across
              your store.
            </p>
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            Logged in as{" "}
            <span className="text-slate-900 font-bold">
              {user?.name || "Admin"}
            </span>
          </div>
        </div>

        {/* ====================================================
            MESSAGE
        ==================================================== */}

        {message.text && (
          <div
            className={`mb-5 rounded-xl border px-4 py-3 flex items-start gap-3 ${
              message.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}

            <p className="text-sm font-semibold">
              {message.text}
            </p>
          </div>
        )}

        {/* ====================================================
            CATEGORY SUMMARY CARDS
        ==================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Total Categories */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                  Total Categories
                </p>

                <p className="text-3xl font-black text-slate-900 mt-1">
                  {categories.length}
                </p>

                <p className="text-[11px] text-slate-500 mt-1">
                  Active product organization
                </p>
              </div>

              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <FolderTree className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Catalog Status */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-400">
                  Catalog Status
                </p>

                <p className="text-lg font-black text-slate-900 mt-2">
                  {categories.length > 0
                    ? "Ready"
                    : "Empty"}
                </p>

                <p className="text-[11px] text-slate-500 mt-1">
                  {categories.length > 0
                    ? "Categories are available for products"
                    : "Create a category to start"}
                </p>
              </div>

              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  categories.length > 0
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Quick Add */}
          <button
            onClick={openAddForm}
            className="bg-brand-900 hover:bg-brand-800 text-white rounded-2xl shadow-sm p-5 text-left flex items-center justify-between transition group"
          >
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-brand-200">
                Catalog
              </p>

              <p className="text-lg font-black mt-1">
                Add New Category
              </p>

              <p className="text-[11px] text-brand-200 mt-1">
                Create a category for your products
              </p>
            </div>

            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-brand-300 group-hover:scale-110 transition-transform" />
            </div>
          </button>
        </div>

        {/* ====================================================
            EMPTY STATE
        ==================================================== */}

        {categories.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
              <FolderTree className="w-8 h-8 text-slate-400" />
            </div>

            <h2 className="text-lg font-black text-slate-900">
              No categories yet
            </h2>

            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
              Create your first product category.
              Categories will appear in the product
              creation form and on the customer website.
            </p>

            <button
              onClick={openAddForm}
              className="mt-6 inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition"
            >
              <Plus className="w-4 h-4" />
              Create First Category
            </button>
          </div>
        ) : (
          /* ==================================================
             CATEGORY TABLE
          ================================================== */

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  All Categories
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Categories used to organize products in your
                  store.
                </p>
              </div>

              <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                {categories.length}{" "}
                {categories.length === 1
                  ? "Category"
                  : "Categories"}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-extrabold text-slate-500">
                    <th className="px-6 py-3">
                      Category
                    </th>

                    <th className="px-6 py-3">
                      Slug
                    </th>

                    <th className="px-6 py-3">
                      Created
                    </th>

                    <th className="px-6 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {categories.map((category) => (
                    <tr
                      key={category.id}
                      className="hover:bg-slate-50 transition"
                    >
                      {/* Category */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* Category Image */}
                          <div className="w-11 h-11 rounded-xl overflow-hidden bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-slate-200">
                            {category.imageUrl ? (
                              <img
                                src={category.imageUrl}
                                alt={category.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FolderTree className="w-4 h-4" />
                            )}
                          </div>

                          <div>
                            <p className="font-bold text-slate-900">
                              {category.name}
                            </p>

                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              ID: {category.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="px-6 py-4">
                        <span className="inline-flex bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-mono">
                          {category.slug}
                        </span>
                      </td>

                      {/* Created */}
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {category.createdAt
                          ? new Date(
                              category.createdAt
                            ).toLocaleDateString("en-IN")
                          : "-"}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Edit */}
                          <button
                            onClick={() =>
                              openEditForm(category)
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() =>
                              handleDelete(category)
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================
          ADD / EDIT MODAL
      ====================================================== */}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-900 flex items-center justify-center">
                  <FolderTree className="w-5 h-5" />
                </div>

                <div>
                  <h2 className="text-lg font-black">
                    {editingCategory
                      ? "Edit Category"
                      : "Add Category"}
                  </h2>

                  <p className="text-xs text-slate-400 mt-1">
                    {editingCategory
                      ? "Update category information and image"
                      : "Create a new product category"}
                  </p>
                </div>
              </div>

              <button
                onClick={closeForm}
                disabled={saving}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-5">
                {/* ==================================================
                    CATEGORY IMAGE
                ================================================== */}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-extrabold text-slate-700">
                      Category Picture
                    </label>

                    <span className="text-[10px] text-slate-400 font-semibold">
                      Optional
                    </span>
                  </div>

                  {/* Image Preview */}
                  <div className="border border-dashed border-slate-300 rounded-2xl bg-slate-50 p-4">
                    {form.imageUrl ? (
                      <div className="space-y-4">
                        <div className="relative w-full h-48 rounded-xl overflow-hidden bg-white border border-slate-200">
                          <img
                            src={form.imageUrl}
                            alt="Category preview"
                            className="w-full h-full object-cover"
                          />

                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            disabled={saving}
                            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition"
                            title="Remove image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            type="button"
                            onClick={openFilePicker}
                            disabled={saving}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                          >
                            <Upload className="w-4 h-4" />
                            Change Image
                          </button>

                          <button
                            type="button"
                            onClick={openCamera}
                            disabled={saving}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
                          >
                            <Camera className="w-4 h-4" />
                            Take New Photo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-3">
                          <ImageIcon className="w-7 h-7 text-slate-400" />
                        </div>

                        <p className="text-sm font-bold text-slate-700">
                          Add Category Picture
                        </p>

                        <p className="text-xs text-slate-400 mt-1 mb-4">
                          Choose an image from your computer
                          or use your camera
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={openFilePicker}
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition"
                          >
                            <Upload className="w-4 h-4" />
                            Choose File
                          </button>

                          <button
                            type="button"
                            onClick={openCamera}
                            disabled={saving}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
                          >
                            <Camera className="w-4 h-4" />
                            Open Camera
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Hidden File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />

                    {/* Hidden Canvas */}
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />
                  </div>

                  <p className="text-[10px] text-slate-400 mt-2">
                    Supported: JPG, JPEG, PNG, WEBP and other
                    browser-supported image formats. Maximum 5 MB.
                  </p>
                </div>

                {/* ==================================================
                    CATEGORY NAME
                ================================================== */}

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-2">
                    Category Name
                  </label>

                  <input
                    type="text"
                    value={form.name}
                    onChange={handleNameChange}
                    placeholder="e.g. Fruits & Vegetables"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
                    disabled={saving}
                    autoFocus
                  />
                </div>

                {/* ==================================================
                    SLUG
                ================================================== */}

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-2">
                    Slug
                  </label>

                  <input
                    type="text"
                    value={form.slug}
                    onChange={handleSlugChange}
                    placeholder="fruits-vegetables"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm font-mono"
                    disabled={saving}
                  />

                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Used for URLs and category identification.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-100 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-bold transition"
                >
                  {saving && (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  )}

                  {saving
                    ? "Saving..."
                    : editingCategory
                      ? "Update Category"
                      : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================
          CAMERA MODAL
      ====================================================== */}

      {cameraOpen && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
            {/* Camera Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-900 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>

                <div>
                  <h3 className="text-white font-black">
                    Take Category Photo
                  </h3>

                  <p className="text-xs text-slate-400">
                    Position the category image inside the frame
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={stopCamera}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Camera View */}
            <div className="relative bg-black aspect-video">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain"
              />

              {cameraLoading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-white animate-spin mx-auto mb-3" />

                    <p className="text-sm font-semibold text-white">
                      Starting camera...
                    </p>
                  </div>
                </div>
              )}

              {/* Camera Frame Guide */}
              {!cameraLoading && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-[75%] h-[70%] border-2 border-white/70 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="px-5 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-400 text-center sm:text-left">
                Make sure the category product is clearly visible.
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={captureCameraImage}
                  disabled={cameraLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 text-xs font-black transition"
                >
                  <Camera className="w-4 h-4" />
                  Capture Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}