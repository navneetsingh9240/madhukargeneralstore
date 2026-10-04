"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  MapPin,
  Search,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

export default function AdminDeliveryAreasPage() {
  const { token } = useAuth();
  const router = useRouter();

  // ============================================================
  // STATE
  // ============================================================

  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingArea, setEditingArea] = useState(null);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // ============================================================
  // ADD FORM DATA
  // ============================================================

  const [formData, setFormData] = useState({
    pincode: "",
    area: "",
    city: "Begusarai",
    state: "Bihar",
    deliveryCharge: "30",
    minimumOrderAmount: "100",
    estimatedDeliveryTime: "Same Day Delivery",
  });

  // ============================================================
  // EDIT FORM DATA
  // ============================================================

  const [editFormData, setEditFormData] = useState({
    pincode: "",
    area: "",
    city: "",
    state: "",
    deliveryCharge: "30",
    minimumOrderAmount: "100",
    estimatedDeliveryTime: "Same Day Delivery",
    isActive: true,
  });

  // ============================================================
  // AUTH + INITIAL FETCH
  // ============================================================

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    fetchDeliveryAreas();
  }, [token, router]);

  // ============================================================
  // API URL
  // ============================================================

  const getApiUrl = () => {
    return (
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:5000"
    );
  };

  // ============================================================
  // FETCH DELIVERY AREAS
  // ============================================================

  const fetchDeliveryAreas = async () => {
    try {
      setLoading(true);
      setError(null);

      const API_URL = getApiUrl();

      const res = await fetch(
        `${API_URL}/api/admin/delivery-areas`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (data.success) {
        setAreas(data.data || []);
      } else {
        setError(
          data.message ||
            "Failed to fetch delivery areas"
        );
      }
    } catch (err) {
      console.error(
        "Fetch delivery areas error:",
        err
      );

      setError(
        "Failed to load delivery PIN codes"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RESET ADD FORM
  // ============================================================

  const resetAddForm = () => {
    setFormData({
      pincode: "",
      area: "",
      city: "Begusarai",
      state: "Bihar",
      deliveryCharge: "30",
      minimumOrderAmount: "100",
      estimatedDeliveryTime: "Same Day Delivery",
    });
  };

  // ============================================================
  // CLOSE ADD MODAL
  // ============================================================

  const closeAddModal = () => {
    setShowAddModal(false);
    resetAddForm();
    setError(null);
  };

  // ============================================================
  // ADD DELIVERY AREA
  // ============================================================

  const handleAddArea = async (e) => {
    e.preventDefault();

    setError(null);
    setSuccess(null);

    // ----------------------------------------------------------
    // PIN validation
    // ----------------------------------------------------------

    if (!/^\d{6}$/.test(formData.pincode)) {
      setError(
        "PIN code must be exactly 6 digits"
      );
      return;
    }

    // ----------------------------------------------------------
    // Prevent duplicate PIN in current list
    // ----------------------------------------------------------

    const duplicatePin = areas.some(
      (area) =>
        area.pincode === formData.pincode
    );

    if (duplicatePin) {
      setError(
        `PIN code ${formData.pincode} already exists in the delivery network. Please edit the existing PIN instead.`
      );
      return;
    }

    setSubmitLoading(true);

    try {
      const API_URL = getApiUrl();

      const res = await fetch(
        `${API_URL}/api/admin/delivery-areas`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            ...formData,
            deliveryCharge:
              Number(formData.deliveryCharge) || 0,
            minimumOrderAmount:
              Number(formData.minimumOrderAmount) || 0,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setSuccess(
          `PIN code ${formData.pincode} added to delivery network!`
        );

        setShowAddModal(false);

        resetAddForm();

        await fetchDeliveryAreas();
      } else {
        setError(
          data.message ||
            "Failed to add delivery PIN code"
        );
      }
    } catch (err) {
      console.error(
        "Add delivery area error:",
        err
      );

      setError(
        "Error adding PIN code"
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  // ============================================================
  // OPEN EDIT MODAL
  // ============================================================

  const handleEditArea = (area) => {
    setError(null);
    setSuccess(null);

    setEditingArea(area);

    setEditFormData({
      pincode: area.pincode || "",
      area: area.area || "",
      city: area.city || "",
      state: area.state || "",
      deliveryCharge:
        area.deliveryCharge?.toString() || "0",
      minimumOrderAmount:
        area.minimumOrderAmount?.toString() || "0",
      estimatedDeliveryTime:
        area.estimatedDeliveryTime ||
        "Same Day Delivery",
      isActive:
        area.isActive !== false,
    });

    setShowEditModal(true);
  };

  // ============================================================
  // CLOSE EDIT MODAL
  // ============================================================

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingArea(null);

    setEditFormData({
      pincode: "",
      area: "",
      city: "",
      state: "",
      deliveryCharge: "30",
      minimumOrderAmount: "100",
      estimatedDeliveryTime:
        "Same Day Delivery",
      isActive: true,
    });

    setError(null);
  };

  // ============================================================
  // UPDATE DELIVERY AREA
  // ============================================================

  const handleUpdateArea = async (e) => {
    e.preventDefault();

    if (!editingArea?.id) {
      setError(
        "Unable to identify the delivery area"
      );
      return;
    }

    setError(null);
    setSuccess(null);

    // ----------------------------------------------------------
    // PIN validation
    // ----------------------------------------------------------

    if (
      !/^\d{6}$/.test(
        editFormData.pincode
      )
    ) {
      setError(
        "PIN code must be exactly 6 digits"
      );
      return;
    }

    // ----------------------------------------------------------
    // Duplicate PIN validation
    // ----------------------------------------------------------

    const duplicatePin = areas.some(
      (area) =>
        area.pincode ===
          editFormData.pincode &&
        area.id !== editingArea.id
    );

    if (duplicatePin) {
      setError(
        `PIN code ${editFormData.pincode} is already assigned to another delivery area.`
      );
      return;
    }

    setSubmitLoading(true);

    try {
      const API_URL = getApiUrl();

      const res = await fetch(
        `${API_URL}/api/admin/delivery-areas/${editingArea.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            pincode:
              editFormData.pincode,
            area:
              editFormData.area,
            city:
              editFormData.city,
            state:
              editFormData.state,
            deliveryCharge:
              Number(
                editFormData.deliveryCharge
              ) || 0,
            minimumOrderAmount:
              Number(
                editFormData.minimumOrderAmount
              ) || 0,
            estimatedDeliveryTime:
              editFormData.estimatedDeliveryTime,
            isActive:
              editFormData.isActive,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        setSuccess(
          `PIN code ${editFormData.pincode} updated successfully!`
        );

        closeEditModal();

        await fetchDeliveryAreas();
      } else {
        setError(
          data.message ||
            "Failed to update delivery PIN code"
        );
      }
    } catch (err) {
      console.error(
        "Update delivery area error:",
        err
      );

      setError(
        "Error updating delivery PIN code"
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  // ============================================================
  // DELETE DELIVERY AREA
  // ============================================================

  const handleDeleteArea = async (area) => {
    if (!area?.id) {
      setError(
        "Unable to identify the delivery area"
      );
      return;
    }

    // ----------------------------------------------------------
    // Confirmation
    // ----------------------------------------------------------

    const confirmed = window.confirm(
      `Are you sure you want to delete PIN code ${area.pincode}?\n\nArea: ${area.area}\nCity: ${area.city}\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setDeleteLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const API_URL = getApiUrl();

      const res = await fetch(
        `${API_URL}/api/admin/delivery-areas/${area.id}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (data.success) {
        setSuccess(
          `PIN code ${area.pincode} deleted successfully.`
        );

        await fetchDeliveryAreas();
      } else {
        setError(
          data.message ||
            "Failed to delete delivery PIN code"
        );
      }
    } catch (err) {
      console.error(
        "Delete delivery area error:",
        err
      );

      setError(
        "Error deleting delivery PIN code"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-100/60 pb-12">
      <div className="container mx-auto max-w-6xl px-4 pt-8">

        {/* ======================================================
            BACK TO ADMIN
        ====================================================== */}

        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin Overview
        </Link>

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Delivery PIN Codes Network
            </h1>

            <p className="text-xs text-slate-500 mt-0.5">
              Configure serviceable 6-digit Indian PIN codes,
              delivery charges, and minimum order values
            </p>
          </div>

          <button
            onClick={() => {
              setError(null);
              setSuccess(null);
              setShowAddModal(
                !showAddModal
              );
            }}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Serviceable PIN
          </button>
        </div>

        {/* ======================================================
            ERROR MESSAGE
        ====================================================== */}

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200 text-xs font-semibold flex items-center gap-2 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />

            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ======================================================
            SUCCESS MESSAGE
        ====================================================== */}

        {success && (
          <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-200 text-xs font-semibold flex items-center gap-2 mb-6">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />

            <span>{success}</span>

            <button
              type="button"
              onClick={() => setSuccess(null)}
              className="ml-auto text-emerald-600 hover:text-emerald-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ======================================================
            ADD PIN MODAL / FORM
        ====================================================== */}

        {showAddModal && (
          <form
            onSubmit={handleAddArea}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg mb-8 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">
                New Serviceable PIN Code Area
              </h3>

              <button
                type="button"
                onClick={closeAddModal}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">

              {/* PIN */}

              <div>
                <label className="block font-bold text-brand-700 uppercase mb-1">
                  Mandatory 6-Digit PIN Code *
                </label>

                <input
                  type="text"
                  maxLength={6}
                  required
                  inputMode="numeric"
                  placeholder="e.g. 800001"
                  value={formData.pincode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pincode:
                        e.target.value.replace(
                          /\D/g,
                          ""
                        ),
                    })
                  }
                  className="w-full px-3 py-2 border border-brand-300 rounded-xl font-mono text-sm tracking-widest text-slate-900 font-bold focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* AREA */}

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Area / Locality Name *
                </label>

                <input
                  type="text"
                  required
                  placeholder="e.g. Station Road / Sector 4"
                  value={formData.area}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      area: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl font-medium focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* CITY */}

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  City *
                </label>

                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      city: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl font-medium focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* STATE */}

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  State *
                </label>

                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      state: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl font-medium focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* DELIVERY CHARGE */}

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Delivery Charge (₹) *
                </label>

                <input
                  type="number"
                  min="0"
                  required
                  value={
                    formData.deliveryCharge
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deliveryCharge:
                        e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl font-medium focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* MINIMUM ORDER */}

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Minimum Order Amount (₹) *
                </label>

                <input
                  type="number"
                  min="0"
                  required
                  value={
                    formData.minimumOrderAmount
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minimumOrderAmount:
                        e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl font-medium focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* ESTIMATED DELIVERY */}

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Estimated Delivery Time *
                </label>

                <input
                  type="text"
                  required
                  value={
                    formData.estimatedDeliveryTime
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimatedDeliveryTime:
                        e.target.value,
                    })
                  }
                  placeholder="e.g. Same Day Delivery"
                  className="w-full px-3 py-2 border rounded-xl font-medium focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* BUTTONS */}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={closeAddModal}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl text-xs"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitLoading}
                className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2 rounded-xl text-xs shadow-sm disabled:opacity-50"
              >
                {submitLoading
                  ? "Saving..."
                  : "Add Delivery Area"}
              </button>
            </div>
          </form>
        )}

        {/* ======================================================
            PIN CODE TABLE
        ====================================================== */}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">
              Loading delivery network...
            </div>
          ) : areas.length === 0 ? (
            <div className="p-12 text-center">
              <MapPin className="w-10 h-10 mx-auto text-slate-300 mb-3" />

              <p className="text-sm font-bold text-slate-500">
                No delivery PIN codes configured
              </p>

              <p className="text-xs text-slate-400 mt-1">
                Add your first serviceable PIN code.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">

                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">

                    <th className="py-3 px-4">
                      PIN Code
                    </th>

                    <th className="py-3 px-4">
                      Area & City
                    </th>

                    <th className="py-3 px-4">
                      Delivery Fee
                    </th>

                    <th className="py-3 px-4">
                      Min. Order
                    </th>

                    <th className="py-3 px-4">
                      Est. Time
                    </th>

                    <th className="py-3 px-4">
                      Status
                    </th>

                    <th className="py-3 px-4 text-center">
                      Actions
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {areas.map((a) => (
                    <tr
                      key={a.id}
                      className="hover:bg-slate-50/50"
                    >

                      {/* PIN */}

                      <td className="py-3 px-4 font-mono font-black text-slate-900 text-sm">
                        {a.pincode}
                      </td>

                      {/* AREA */}

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800">
                          {a.area}
                        </span>

                        <br />

                        <span className="text-[10px] text-slate-400">
                          {a.city}, {a.state}
                        </span>
                      </td>

                      {/* DELIVERY FEE */}

                      <td className="py-3 px-4 font-bold text-slate-900">
                        {Number(a.deliveryCharge) === 0
                          ? "FREE"
                          : `₹${a.deliveryCharge}`}
                      </td>

                      {/* MIN ORDER */}

                      <td className="py-3 px-4 font-semibold text-slate-700">
                        ₹{a.minimumOrderAmount}
                      </td>

                      {/* EST TIME */}

                      <td className="py-3 px-4 text-slate-600">
                        {a.estimatedDeliveryTime}
                      </td>

                      {/* STATUS */}

                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                            a.isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {a.isActive
                            ? "ACTIVE"
                            : "INACTIVE"}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">

                          {/* EDIT */}

                          <button
                            type="button"
                            onClick={() =>
                              handleEditArea(a)
                            }
                            disabled={deleteLoading}
                            title="Edit PIN code"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition disabled:opacity-50"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* DELETE */}

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteArea(a)
                            }
                            disabled={deleteLoading}
                            title="Delete PIN code"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </div>

        {/* ======================================================
            EDIT MODAL
        ====================================================== */}

        {showEditModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">

            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">

              {/* MODAL HEADER */}

              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">

                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Edit Delivery PIN
                  </h2>

                  <p className="text-xs text-slate-500 mt-1">
                    Update serviceability, charges and
                    delivery information.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEditModal}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition"
                >
                  <X className="w-5 h-5" />
                </button>

              </div>

              {/* EDIT FORM */}

              <form
                onSubmit={handleUpdateArea}
                className="p-6 space-y-5"
              >

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">

                  {/* PIN */}

                  <div>
                    <label className="block font-bold text-brand-700 uppercase mb-1">
                      6-Digit PIN Code *
                    </label>

                    <input
                      type="text"
                      maxLength={6}
                      required
                      inputMode="numeric"
                      value={
                        editFormData.pincode
                      }
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          pincode:
                            e.target.value.replace(
                              /\D/g,
                              ""
                            ),
                        })
                      }
                      className="w-full px-3 py-2.5 border border-brand-300 rounded-xl font-mono text-sm tracking-widest text-slate-900 font-bold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  {/* AREA */}

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Area / Locality *
                    </label>

                    <input
                      type="text"
                      required
                      value={
                        editFormData.area
                      }
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          area: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 border rounded-xl font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  {/* CITY */}

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      City *
                    </label>

                    <input
                      type="text"
                      required
                      value={
                        editFormData.city
                      }
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          city: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 border rounded-xl font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  {/* STATE */}

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      State *
                    </label>

                    <input
                      type="text"
                      required
                      value={
                        editFormData.state
                      }
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          state: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 border rounded-xl font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  {/* DELIVERY CHARGE */}

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Delivery Charge (₹) *
                    </label>

                    <input
                      type="number"
                      min="0"
                      required
                      value={
                        editFormData.deliveryCharge
                      }
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          deliveryCharge:
                            e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 border rounded-xl font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  {/* MINIMUM ORDER */}

                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Minimum Order Amount (₹) *
                    </label>

                    <input
                      type="number"
                      min="0"
                      required
                      value={
                        editFormData.minimumOrderAmount
                      }
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          minimumOrderAmount:
                            e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 border rounded-xl font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                  {/* ESTIMATED DELIVERY */}

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Estimated Delivery Time *
                    </label>

                    <input
                      type="text"
                      required
                      value={
                        editFormData.estimatedDeliveryTime
                      }
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          estimatedDeliveryTime:
                            e.target.value,
                        })
                      }
                      placeholder="e.g. Same Day Delivery"
                      className="w-full px-3 py-2.5 border rounded-xl font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>

                </div>

                {/* ACTIVE TOGGLE */}

                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl p-4">

                  <div>
                    <p className="text-xs font-black text-slate-900">
                      Delivery Status
                    </p>

                    <p className="text-[11px] text-slate-500 mt-1">
                      Inactive PIN codes cannot be used
                      for new orders.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setEditFormData({
                        ...editFormData,
                        isActive:
                          !editFormData.isActive,
                      })
                    }
                    className={`relative w-12 h-6 rounded-full transition ${
                      editFormData.isActive
                        ? "bg-emerald-500"
                        : "bg-slate-300"
                    }`}
                    aria-label="Toggle delivery status"
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition ${
                        editFormData.isActive
                          ? "left-7"
                          : "left-1"
                      }`}
                    />
                  </button>

                </div>

                {/* FOOTER BUTTONS */}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">

                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={submitLoading}
                    className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl text-xs transition disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-sm transition disabled:opacity-50"
                  >
                    {submitLoading
                      ? "Updating..."
                      : "Save Changes"}
                  </button>

                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}