"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Camera,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

export default function AdminProductsPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Delete modal state
  const [deleteProductTarget, setDeleteProductTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    mrp: "",
    sellingPrice: "",
    unit: "1 kg",
    stock: "20",
    description: "",
    imageUrl: "",
    isFeatured: false,
  });

  // Camera state
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [targetImageField, setTargetImageField] = useState("add");

  const videoRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const editFileInputRef = React.useRef(null);

  // ============================================================
  // IMAGE UPLOAD
  // ============================================================

  const handleFileSelect = (e, fieldType) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (uploadEvent) => {
      const base64Url = uploadEvent.target.result;

      if (fieldType === "add") {
        setFormData((prev) => ({
          ...prev,
          imageUrl: base64Url,
        }));
      } else {
        setEditProduct((prev) => ({
          ...prev,
          images: [
            {
              url: base64Url,
              isPrimary: true,
            },
          ],
        }));
      }
    };

    reader.readAsDataURL(file);
  };

  // ============================================================
  // CAMERA
  // ============================================================

  const startCameraStream = async () => {
    setShowCameraModal(true);
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError(
        "Unable to access camera. Please verify device permissions."
      );
    }
  };

  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();

      tracks.forEach((track) => track.stop());

      videoRef.current.srcObject = null;
    }

    setShowCameraModal(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const base64Photo = canvas.toDataURL(
      "image/jpeg",
      0.85
    );

    if (targetImageField === "add") {
      setFormData((prev) => ({
        ...prev,
        imageUrl: base64Photo,
      }));
    } else {
      setEditProduct((prev) => ({
        ...prev,
        images: [
          {
            url: base64Photo,
            isPrimary: true,
          },
        ],
      }));
    }

    stopCameraStream();
  };

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

    fetchProductsAndCategories();

    const interval = setInterval(() => {
      fetchProductsAndCategories();
    }, 5000);

    return () => clearInterval(interval);
  }, [token, authLoading, router]);

  // ============================================================
  // FETCH PRODUCTS + CATEGORIES
  // ============================================================

  const fetchProductsAndCategories = async () => {
    const API_URL =
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:5000";

    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(`${API_URL}/api/products?limit=100`),

        fetch(`${API_URL}/api/admin/categories`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const prodData = await prodRes.json();
      const catData = await catRes.json();

      if (prodData.success) {
        setProducts(prodData.data);
      }

      if (catData.success) {
        setCategories(catData.data);

        if (catData.data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            categoryId:
              prev.categoryId ||
              catData.data[0].id,
          }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // CREATE PRODUCT
  // ============================================================

  const handleCreateProduct = async (e) => {
    e.preventDefault();

    setModalLoading(true);

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5000";

      const res = await fetch(
        `${API_URL}/api/admin/products`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await res.json();

      if (data.success && data.data) {
        const createdProduct = data.data;

        setProducts((prev) => [
          createdProduct,
          ...prev,
        ]);

        setShowAddModal(false);

        setFormData({
          name: "",
          categoryId:
            categories[0]?.id || "",
          mrp: "",
          sellingPrice: "",
          unit: "1 kg",
          stock: "20",
          description: "",
          imageUrl: "",
          isFeatured: false,
        });

        fetchProductsAndCategories();
      } else {
        alert(
          data.message ||
            "Failed to create product"
        );
      }
    } catch (err) {
      console.error(
        "Create product error:",
        err
      );

      alert("Error creating product");
    } finally {
      setModalLoading(false);
    }
  };

  // ============================================================
  // UPDATE PRODUCT
  // ============================================================

  // ============================================================
  // DELETE PRODUCT
  // ============================================================

  const handleConfirmDelete = async () => {
    if (!deleteProductTarget || deleteLoading) return;

    setDeleteLoading(true);
    setDeleteError("");

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5000";

      const res = await fetch(
        `${API_URL}/api/admin/products/${deleteProductTarget.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (data.success) {
        setProducts((prev) =>
          prev.filter((p) => p.id !== deleteProductTarget.id)
        );
        setToastMessage(`Product "${deleteProductTarget.name}" deleted successfully.`);
        setTimeout(() => setToastMessage(""), 5000);
        setDeleteProductTarget(null);
        fetchProductsAndCategories();
      } else {
        setDeleteError(
          data.message || "Failed to delete product."
        );
      }
    } catch (err) {
      console.error("Delete product error:", err);
      setDeleteError("Failed to delete product. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();

    if (!editProduct) return;

    setModalLoading(true);

    const imageUrlToSend =
      editProduct.images &&
      editProduct.images.length > 0
        ? editProduct.images[0].url
        : editProduct.imageUrl || "";

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5000";

      const res = await fetch(
        `${API_URL}/api/admin/products/${editProduct.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editProduct.name,
            mrp: editProduct.mrp,
            sellingPrice:
              editProduct.sellingPrice,
            unit: editProduct.unit,

            // IMPORTANT:
            // Send the edited stock value.
            stock: Number(
              editProduct.stock ??
                editProduct.inventory
                  ?.currentStock ??
                0
            ),

            isActive:
              editProduct.isActive,

            imageUrl: imageUrlToSend,
          }),
        }
      );

      const data = await res.json();

      if (data.success && data.data) {
        const updatedProduct =
          data.data;

        setProducts((prev) =>
          prev.map((p) =>
            p.id === updatedProduct.id
              ? updatedProduct
              : p
          )
        );

        setEditProduct(null);

        fetchProductsAndCategories();
      } else {
        alert(
          data.message ||
            "Failed to update product"
        );
      }
    } catch (err) {
      console.error(
        "Update product error:",
        err
      );

      alert("Error updating product");
    } finally {
      setModalLoading(false);
    }
  };

  // ============================================================
  // FILTER PRODUCTS
  // ============================================================

  const filteredProducts =
    products.filter((p) => {
      const searchValue =
        search.toLowerCase();

      return (
        p.name
          ?.toLowerCase()
          .includes(searchValue) ||
        p.sku
          ?.toLowerCase()
          .includes(searchValue) ||
        p.category?.name
          ?.toLowerCase()
          .includes(searchValue)
      );
    });

  // ============================================================
  // AUTH LOADING
  // ============================================================

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mx-auto mb-4" />

          <p className="text-slate-600 font-medium">
            Checking admin authentication...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ========================================================
          HEADER
      ======================================================== */}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">

            <div className="flex items-center gap-3 min-w-0">

              <Link
                href="/admin"
                className="p-2 rounded-xl hover:bg-slate-100 transition shrink-0"
              >
                <ArrowLeft size={20} />
              </Link>

              <div className="min-w-0">
                <h1 className="text-xl font-black text-slate-900 truncate">
                  Products & Inventory
                </h1>

                <p className="text-xs text-slate-500">
                  Manage products, prices and stock
                </p>
              </div>

            </div>

            <button
              onClick={() =>
                setShowAddModal(true)
              }
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition shrink-0"
            >
              <Plus size={18} />
              Add Product
            </button>

          </div>
        </div>
      </header>

      {/* ========================================================
          MAIN
      ======================================================== */}

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Toast Alert */}
        {toastMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-extrabold flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage("")} className="text-emerald-600 hover:text-emerald-900 font-bold text-sm">×</button>
          </div>
        )}

        {/* Search + Summary */}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 mb-6">

          <div className="relative">
            <Search
              size={19}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search by product, SKU or category..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <CheckCircle2
                size={20}
                className="text-slate-700"
              />
            </div>

            <div>
              <p className="text-xs text-slate-500 font-semibold">
                Total Products
              </p>

              <p className="text-xl font-black text-slate-900">
                {products.length}
              </p>
            </div>

          </div>
        </div>

        {/* ======================================================
            PRODUCT TABLE
        ====================================================== */}

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

          {loading ? (
            <div className="p-12 text-center text-slate-500">
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center">

              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search
                  size={24}
                  className="text-slate-400"
                />
              </div>

              <h3 className="font-black text-slate-900 mb-1">
                No products found
              </h3>

              <p className="text-sm text-slate-500">
                Add a product or change your search.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1000px]">

                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>

                    <th className="text-left px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-wide">
                      Product
                    </th>

                    <th className="text-left px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-wide">
                      Category
                    </th>

                    <th className="text-left px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-wide">
                      Price
                    </th>

                    <th className="text-left px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-wide">
                      Stock
                    </th>

                    <th className="text-left px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-wide">
                      Status
                    </th>

                    <th className="text-right px-5 py-4 text-xs font-black text-slate-500 uppercase tracking-wide">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredProducts.map((p) => {

                    const stock = p.inventory
                      ? p.inventory.currentStock
                      : 0;

                    const image =
                      p.images &&
                      p.images.length > 0
                        ? p.images[0].url
                        : "";

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50 transition"
                      >

                        {/* Product */}

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">

                            <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">

                              {image ? (
                                <img
                                  src={image}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon
                                  size={22}
                                  className="text-slate-400"
                                />
                              )}

                            </div>

                            <div className="min-w-0">

                              <p className="font-black text-slate-900 truncate max-w-[260px]">
                                {p.name}
                              </p>

                              <p className="text-xs text-slate-500 mt-1">
                                SKU: {p.sku}
                              </p>

                              <p className="text-xs text-slate-400">
                                Unit: {p.unit}
                              </p>

                            </div>

                          </div>
                        </td>

                        {/* Category */}

                        <td className="px-5 py-4">
                          <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                            {p.category?.name ||
                              "Uncategorized"}
                          </span>
                        </td>

                        {/* Price */}

                        <td className="px-5 py-4">
                          <div>

                            <p className="font-black text-slate-900">
                              ₹
                              {Number(
                                p.sellingPrice || 0
                              ).toFixed(2)}
                            </p>

                            {Number(
                              p.mrp || 0
                            ) >
                              Number(
                                p.sellingPrice || 0
                              ) && (
                              <p className="text-xs text-slate-400 line-through mt-1">
                                ₹
                                {Number(
                                  p.mrp || 0
                                ).toFixed(2)}
                              </p>
                            )}

                          </div>
                        </td>

                        {/* Stock */}

                        <td className="px-5 py-4">

                          <p className="font-black text-slate-900">
                            {stock}
                          </p>

                          <p className="text-xs text-slate-400">
                            {p.unit}
                          </p>

                        </td>

                        {/* Status */}

                        <td className="px-5 py-4">

                          {stock <= 5 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-black">
                              <AlertTriangle size={13} />
                              LOW
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-black">
                              <CheckCircle2 size={13} />
                              IN STOCK
                            </span>
                          )}

                        </td>

                        {/* Action */}

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                setEditProduct({
                                  ...p,

                                  // IMPORTANT:
                                  // Load current DB inventory
                                  // into editable stock field.
                                  stock: Number(
                                    p.inventory
                                      ?.currentStock ??
                                      p.stock ??
                                      0
                                  ),
                                })
                              }
                              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition"
                            >
                              <Edit3 size={14} />
                              Edit
                            </button>

                            <button
                              onClick={() => {
                                setDeleteProductTarget(p);
                                setDeleteError("");
                              }}
                              className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition border border-red-200"
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}

                </tbody>
              </table>

            </div>
          )}

        </div>

      </main>

      {/* ========================================================
          ADD PRODUCT MODAL
      ======================================================== */}

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">

              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Add Product
                </h2>

                <p className="text-sm text-slate-500">
                  Create a new product for your store.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowAddModal(false)
                }
                className="p-2 rounded-xl hover:bg-slate-100"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={handleCreateProduct}
              className="p-6 space-y-5"
            >

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Name */}

                <div className="md:col-span-2">

                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Product Name
                  </label>

                  <input
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="Enter product name"
                  />

                </div>

                {/* Category */}

                <div>

                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Category
                  </label>

                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        categoryId:
                          e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none"
                  >

                    <option value="">
                      Select category
                    </option>

                    {categories.map(
                      (category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      )
                    )}

                  </select>

                </div>

                {/* Unit */}

                <div>

                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Unit
                  </label>

                  <input
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unit: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none"
                    placeholder="1 kg"
                  />

                </div>

                {/* MRP */}

                <div>

                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    MRP
                  </label>

                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.mrp}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mrp: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none"
                    placeholder="0"
                  />

                </div>

                {/* Selling Price */}

                <div>

                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Selling Price
                  </label>

                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.sellingPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sellingPrice:
                          e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none"
                    placeholder="0"
                  />

                </div>

                {/* Initial Stock */}

                <div>

                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Initial Stock
                  </label>

                  <input
                    required
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none"
                    placeholder="20"
                  />

                </div>

              </div>

              {/* Description */}

              <div>

                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Description
                </label>

                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description:
                        e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none resize-none"
                  placeholder="Product description..."
                />

              </div>

              {/* Image */}

              <div>

                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Product Image
                </label>

                {formData.imageUrl ? (
                  <div className="relative w-40 h-40 rounded-2xl overflow-hidden border border-slate-200 mb-3">

                    <img
                      src={formData.imageUrl}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          imageUrl: "",
                        })
                      }
                      className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded-lg"
                    >
                      <X size={14} />
                    </button>

                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center">

                    <ImageIcon
                      size={30}
                      className="mx-auto text-slate-400 mb-2"
                    />

                    <p className="text-sm text-slate-500 mb-4">
                      Upload or capture product image
                    </p>

                  </div>
                )}

                <div className="flex flex-wrap gap-2">

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleFileSelect(
                        e,
                        "add"
                      )
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-sm flex items-center gap-2"
                  >
                    <Upload size={16} />
                    Upload Image
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetImageField(
                        "add"
                      );
                      startCameraStream();
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-sm flex items-center gap-2"
                  >
                    <Camera size={16} />
                    Camera
                  </button>

                </div>

              </div>

              {/* Featured */}

              <label className="flex items-center gap-3 cursor-pointer">

                <input
                  type="checkbox"
                  checked={
                    formData.isFeatured
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isFeatured:
                        e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />

                <span className="text-sm font-bold text-slate-700">
                  Featured Product
                </span>

              </label>

              {/* Buttons */}

              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={() =>
                    setShowAddModal(false)
                  }
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  disabled={modalLoading}
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {modalLoading
                    ? "Creating..."
                    : "Create Product"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          EDIT PRODUCT MODAL
      ======================================================== */}

      {editProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">

              <div>

                <h2 className="text-xl font-black text-slate-900">
                  Edit Product
                </h2>

                <p className="text-sm text-slate-500">
                  Update product details and inventory.
                </p>

              </div>

              <button
                onClick={() =>
                  setEditProduct(null)
                }
                className="p-2 rounded-xl hover:bg-slate-100"
              >
                <X size={20} />
              </button>

            </div>

            <form
              onSubmit={handleUpdateProduct}
              className="p-6 space-y-5"
            >

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Product Name */}

                <div className="md:col-span-2">

                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Product Name
                  </label>

                  <input
                    required
                    value={
                      editProduct.name || ""
                    }
                    onChange={(e) =>
                      setEditProduct({
                        ...editProduct,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-200"
                  />

                </div>

                {/* MRP */}

                <div>

                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    MRP
                  </label>

                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      editProduct.mrp || ""
                    }
                    onChange={(e) =>
                      setEditProduct({
                        ...editProduct,
                        mrp: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none"
                  />

                </div>

                {/* Selling Price */}

                <div>

                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Selling Price
                  </label>

                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      editProduct.sellingPrice ||
                      ""
                    }
                    onChange={(e) =>
                      setEditProduct({
                        ...editProduct,
                        sellingPrice:
                          e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none"
                  />

                </div>

                {/* Unit */}

                <div>

                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Unit
                  </label>

                  <input
                    value={
                      editProduct.unit || ""
                    }
                    onChange={(e) =>
                      setEditProduct({
                        ...editProduct,
                        unit: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none"
                  />

                </div>

                {/* STOCK */}

                <div>

                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Stock
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      editProduct.stock ?? 0
                    }
                    onChange={(e) =>
                      setEditProduct({
                        ...editProduct,
                        stock: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-medium"
                  />

                </div>

                {/* Status */}

                <div>

                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Status
                  </label>

                  <select
                    value={String(
                      editProduct.isActive ??
                        true
                    )}
                    onChange={(e) =>
                      setEditProduct({
                        ...editProduct,
                        isActive:
                          e.target.value ===
                          "true",
                      })
                    }
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none"
                  >

                    <option value="true">
                      Active
                    </option>

                    <option value="false">
                      Inactive
                    </option>

                  </select>

                </div>

              </div>

              {/* Edit Image */}

              <div>

                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Product Image
                </label>

                <div className="flex flex-wrap gap-4 items-start">

                  <div className="w-40 h-40 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">

                    {editProduct.images &&
                    editProduct.images.length >
                      0 ? (
                      <img
                        src={
                          editProduct.images[0]
                            .url
                        }
                        alt={
                          editProduct.name
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon
                        size={30}
                        className="text-slate-400"
                      />
                    )}

                  </div>

                  <div className="space-y-2">

                    <input
                      ref={
                        editFileInputRef
                      }
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFileSelect(
                          e,
                          "edit"
                        )
                      }
                    />

                    <button
                      type="button"
                      onClick={() =>
                        editFileInputRef.current?.click()
                      }
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-sm flex items-center gap-2"
                    >
                      <Upload size={16} />
                      Upload Image
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTargetImageField(
                          "edit"
                        );
                        startCameraStream();
                      }}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-sm flex items-center gap-2"
                    >
                      <Camera size={16} />
                      Camera
                    </button>

                  </div>

                </div>

                {/* Image URL */}

                <div className="mt-4">

                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Image URL
                  </label>

                  <input
                    value={
                      editProduct.images &&
                      editProduct.images.length >
                        0
                        ? editProduct
                            .images[0].url
                        : ""
                    }
                    onChange={(e) => {
                      const newUrl =
                        e.target.value;

                      setEditProduct(
                        (prev) => ({
                          ...prev,

                          images: [
                            {
                              url: newUrl,
                              isPrimary:
                                true,
                            },
                          ],
                        })
                      );
                    }}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none"
                    placeholder="https://..."
                  />

                </div>

              </div>

              {/* Buttons */}

              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={() =>
                    setEditProduct(null)
                  }
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>

                <button
                  disabled={modalLoading}
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {modalLoading
                    ? "Updating..."
                    : "Update Product"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          CAMERA MODAL
      ======================================================== */}

      {showCameraModal && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">

            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">

              <div>

                <h2 className="font-black text-slate-900">
                  Capture Product Image
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Use your camera to capture the product.
                </p>

              </div>

              <button
                onClick={stopCameraStream}
                className="p-2 rounded-xl hover:bg-slate-100"
              >
                <X size={20} />
              </button>

            </div>

            <div className="p-5">

              {cameraError ? (
                <div className="p-6 bg-red-50 text-red-700 rounded-xl text-center font-semibold">
                  {cameraError}
                </div>
              ) : (
                <div className="bg-black rounded-2xl overflow-hidden aspect-video flex items-center justify-center">

                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />

                </div>
              )}

              <div className="flex justify-end gap-3 mt-4">

                <button
                  type="button"
                  onClick={stopCameraStream}
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>

                {!cameraError && (
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2"
                  >
                    <Camera size={17} />
                    Capture
                  </button>
                )}

              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          DELETE PRODUCT CONFIRMATION MODAL
      ======================================================== */}

      {deleteProductTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-900">Delete Product?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete:
              </p>
              <p className="text-sm font-black text-slate-900 bg-slate-50 py-2 px-3 rounded-xl border border-slate-200">
                "{deleteProductTarget.name}"
              </p>
              <p className="text-[11px] text-red-500 font-semibold">
                This action cannot be undone.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold">
                {deleteError}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => {
                  setDeleteProductTarget(null);
                  setDeleteError("");
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs py-3 rounded-xl transition"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-3 rounded-xl transition shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deleteLoading ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Delete Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}