"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  ArrowRight,
  Sparkles,
  Camera,
  RefreshCw,
  Info
} from "lucide-react";

export default function UploadReceiptPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Extracted Result & Editable Form State
  const [extractionResult, setExtractionResult] = useState<any>(null);
  const [formData, setFormData] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (selectedFile: File) => {
    setErrorMsg("");
    setExtractionResult(null);
    setFormData(null);

    // Validate size (< 15MB)
    if (selectedFile.size > 15 * 1024 * 1024) {
      setErrorMsg("File exceeds 15 MB limit. Please select a smaller receipt or invoice.");
      return;
    }

    setFile(selectedFile);

    // Create preview if image
    if (selectedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    // Trigger processing
    runExtractionPipeline(selectedFile);
  };

  const runExtractionPipeline = async (uploadFile: File) => {
    setProcessing(true);
    setErrorMsg("");

    try {
      setProcessStep("Preprocessing image & enhancing contrast...");
      await new Promise((r) => setTimeout(r, 600));

      setProcessStep("Extracting text via OCR engine...");
      await new Promise((r) => setTimeout(r, 600));

      setProcessStep("Structuring purchase items & financial totals with AI...");
      const result = await api.uploadReceipt(uploadFile);

      setProcessStep("Assessing document quality...");
      await new Promise((r) => setTimeout(r, 400));

      setExtractionResult(result);
      setFormData(result.extracted_data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process receipt. Please try another image or verify server connection.");
    } finally {
      setProcessing(false);
      setProcessStep("");
    }
  };

  // Form field changes
  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Item changes
  const handleItemChange = (index: number, key: string, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index][key] = value;
    
    // Auto calculate line total if quantity or unit price changes
    if (key === "quantity" || key === "unit_price") {
      const q = parseFloat(updatedItems[index].quantity) || 0;
      const p = parseFloat(updatedItems[index].unit_price) || 0;
      updatedItems[index].total_price = Number((q * p).toFixed(2));
    }

    setFormData((prev: any) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const addItemRow = () => {
    setFormData((prev: any) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_name: "New Item",
          quantity: 1,
          unit_price: 0,
          total_price: 0,
          category: "Other",
        },
      ],
    }));
  };

  const removeItemRow = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      items: prev.items.filter((_: any, i: number) => i !== index),
    }));
  };

  const handleSaveReceipt = async () => {
    setSaving(true);
    setErrorMsg("");

    try {
      const saved = await api.createReceipt(formData);
      router.push(`/receipts/${saved.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save verified receipt to digital vault.");
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
            Smart Receipt Scanner
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted mt-1">
            Upload paper receipts, bills or PDF invoices. Our AI extracts line items and checks quality.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-semibold">Processing Notice</p>
              <p className="mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Dropzone Upload Section */}
        {!formData && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all bg-white shadow-subtle ${
              dragActive ? "border-brand-blue bg-blue-50/50" : "border-slate-300 hover:border-slate-400"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
            />

            {processing ? (
              <div className="py-12 space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-brand-blue border-t-transparent animate-spin mx-auto" />
                <h3 className="text-base font-bold text-brand-navy">Analyzing Document</h3>
                <p className="text-xs text-brand-blue font-medium animate-pulse">{processStep}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-brand-blue flex items-center justify-center mx-auto shadow-subtle">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-brand-navy">
                    Drag and drop your receipt or invoice
                  </h3>
                  <p className="text-xs sm:text-sm text-brand-muted mt-1">
                    Supports JPG, PNG, WEBP and digital or scanned PDF documents up to 15 MB
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 bg-brand-navy hover:bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-xl shadow-subtle text-sm transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Choose File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-brand-navy font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
                  >
                    <Camera className="w-4 h-4 text-brand-blue" />
                    <span>Use Camera</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Verification Form (Editable Before Saving) */}
        {formData && (
          <div className="space-y-6">
            {/* Traffic-Light Quality Banner */}
            <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              formData.document_status === "GREEN"
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                : formData.document_status === "YELLOW"
                ? "bg-amber-50/70 border-amber-200 text-amber-900"
                : "bg-rose-50/70 border-rose-200 text-rose-900"
            }`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <StatusBadge status={formData.document_status} showIcon={false} />
                </div>
                <div>
                  <h4 className="text-sm font-bold">
                    Document Assessment: {formData.document_status === "GREEN" ? "High Confidence" : formData.document_status === "YELLOW" ? "Minor Inconsistencies" : "Manual Verification Needed"}
                  </h4>
                  <p className="text-xs mt-0.5 opacity-90">{formData.document_status_reason}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setFormData(null);
                  setExtractionResult(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/80 border border-slate-200 hover:bg-white text-slate-700 transition-colors flex-shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Upload Another</span>
              </button>
            </div>

            {/* Editable Form Card */}
            <div className="bg-white rounded-3xl border border-brand-border shadow-card p-6 sm:p-8 space-y-8">
              {/* Section 1: Merchant & Document Details */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-brand-navy border-b border-brand-border pb-3 flex items-center justify-between">
                  <span>Merchant & Document Information</span>
                  <span className="text-xs text-brand-muted font-normal">Review and adjust if needed</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-navy mb-1">
                      Merchant Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.merchant_name || ""}
                      onChange={(e) => handleFieldChange("merchant_name", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-navy mb-1">
                      Purchase Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.purchase_date || ""}
                      onChange={(e) => handleFieldChange("purchase_date", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-navy mb-1">
                      Invoice / Receipt #
                    </label>
                    <input
                      type="text"
                      value={formData.invoice_number || ""}
                      onChange={(e) => handleFieldChange("invoice_number", e.target.value)}
                      placeholder="e.g. INV-90412"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-navy mb-1">
                      Merchant Address
                    </label>
                    <input
                      type="text"
                      value={formData.merchant_address || ""}
                      onChange={(e) => handleFieldChange("merchant_address", e.target.value)}
                      placeholder="City, Store location"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-navy mb-1">
                      Payment Method
                    </label>
                    <input
                      type="text"
                      value={formData.payment_method || ""}
                      onChange={(e) => handleFieldChange("payment_method", e.target.value)}
                      placeholder="e.g. UPI, Credit Card"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-navy mb-1">
                      Currency
                    </label>
                    <select
                      value={formData.currency || "INR"}
                      onChange={(e) => handleFieldChange("currency", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Line Items Breakdown */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-brand-border pb-3">
                  <h3 className="text-base font-bold text-brand-navy">Purchased Line Items</h3>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:text-brand-navy"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.items?.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 items-center text-xs"
                    >
                      <div className="col-span-12 sm:col-span-4">
                        <label className="text-[10px] text-brand-muted font-bold block mb-1">PRODUCT NAME</label>
                        <input
                          type="text"
                          value={item.product_name}
                          onChange={(e) => handleItemChange(idx, "product_name", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-2">
                        <label className="text-[10px] text-brand-muted font-bold block mb-1">CATEGORY</label>
                        <select
                          value={item.category}
                          onChange={(e) => handleItemChange(idx, "category", e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="Electronics">Electronics</option>
                          <option value="Groceries">Groceries</option>
                          <option value="Food and beverages">Food & Beverages</option>
                          <option value="Clothing">Clothing</option>
                          <option value="Healthcare">Healthcare</option>
                          <option value="Transportation">Transportation</option>
                          <option value="Education">Education</option>
                          <option value="Entertainment">Entertainment</option>
                          <option value="Household">Household</option>
                          <option value="Personal care">Personal Care</option>
                          <option value="Travel">Travel</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="col-span-4 sm:col-span-2">
                        <label className="text-[10px] text-brand-muted font-bold block mb-1">QUANTITY</label>
                        <input
                          type="number"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono"
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-3">
                        <label className="text-[10px] text-brand-muted font-bold block mb-1">TOTAL (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.total_price}
                          onChange={(e) => handleItemChange(idx, "total_price", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                        />
                      </div>

                      <div className="col-span-12 sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Financial Calculations & Taxes */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-brand-navy border-b border-brand-border pb-3">
                  Financial Breakdown & Taxes
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-navy mb-1">
                      Subtotal
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.subtotal || 0}
                      onChange={(e) => handleFieldChange("subtotal", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-navy mb-1">
                      Taxes / GST
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.tax || 0}
                      onChange={(e) => handleFieldChange("tax", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-navy mb-1">
                      Discount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.discount || 0}
                      onChange={(e) => handleFieldChange("discount", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-brand-navy mb-1">
                      Grand Total *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.grand_total || 0}
                      onChange={(e) => handleFieldChange("grand_total", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-blue-50/70 border border-brand-blue rounded-xl text-sm font-mono font-bold text-brand-navy"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Warranty & Policy */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-brand-navy border-b border-brand-border pb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-blue" />
                  <span>Warranty & Return Details</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-navy mb-1">
                      Warranty Duration (if specified)
                    </label>
                    <input
                      type="text"
                      value={formData.warranty_duration || ""}
                      onChange={(e) => handleFieldChange("warranty_duration", e.target.value)}
                      placeholder="e.g. 1 Year, 24 Months"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-navy mb-1">
                      Return Policy
                    </label>
                    <input
                      type="text"
                      value={formData.return_policy || ""}
                      onChange={(e) => handleFieldChange("return_policy", e.target.value)}
                      placeholder="e.g. 7 Days Replacement"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-navy mb-1">
                      Serial Number
                    </label>
                    <input
                      type="text"
                      value={formData.serial_number || ""}
                      onChange={(e) => handleFieldChange("serial_number", e.target.value)}
                      placeholder="e.g. SN-88219"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-brand-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(null);
                    setExtractionResult(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Discard
                </button>

                <button
                  type="button"
                  disabled={saving || !formData.merchant_name || formData.grand_total <= 0}
                  onClick={handleSaveReceipt}
                  className="inline-flex items-center gap-2 bg-brand-navy hover:bg-slate-800 text-white font-semibold px-6 py-2.5 rounded-xl shadow-subtle hover:shadow-card transition-all text-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-brand-green" />
                  <span>{saving ? "Saving to Vault..." : "Confirm & Save to Vault"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
