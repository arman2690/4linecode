"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
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
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Sparkles,
  Camera,
  Layers,
  ArrowRight,
  ShieldCheck,
  Tag,
  Calendar,
  CreditCard,
  Building,
  Hash
} from "lucide-react";

const STANDARD_CATEGORIES = [
  "Groceries",
  "Food & Dining",
  "Transportation",
  "Fuel",
  "Shopping",
  "Electronics",
  "Healthcare",
  "Entertainment",
  "Utilities",
  "Travel",
  "Other",
];

const SCAN_STAGES = [
  "Uploading receipt...",
  "Preprocessing image & correcting orientation...",
  "Extracting text via high-precision OCR...",
  "Analyzing purchase items & merchant data...",
  "Validating arithmetic & financial calculations...",
  "Scan completed!"
];

export default function UploadReceiptPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // File & Preview state
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Scanning Stages state
  const [processing, setProcessing] = useState(false);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  // Extracted Data in Strict Schema
  const [receiptData, setReceiptData] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Image Preview Controls (Zoom & Rotate)
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [mobileTab, setMobileTab] = useState<"extracted" | "preview">("extracted");

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
    setReceiptData(null);
    setZoomLevel(1);
    setRotationAngle(0);

    // Validate size (< 15MB)
    if (selectedFile.size > 15 * 1024 * 1024) {
      setErrorMsg("File exceeds 15 MB limit. Please select a smaller receipt image or PDF.");
      return;
    }

    setFile(selectedFile);
    const isFilePdf = selectedFile.type === "application/pdf" || selectedFile.name.toLowerCase().endsWith(".pdf");
    setIsPdf(isFilePdf);

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    runExtractionPipeline(selectedFile);
  };

  const runExtractionPipeline = async (uploadFile: File) => {
    setProcessing(true);
    setCurrentStageIdx(0);
    setErrorMsg("");

    try {
      // Stage 1
      setCurrentStageIdx(0);
      await new Promise((r) => setTimeout(r, 300));

      // Stage 2
      setCurrentStageIdx(1);
      await new Promise((r) => setTimeout(r, 400));

      // Stage 3
      setCurrentStageIdx(2);

      // Call API
      const result = await api.uploadReceipt(uploadFile);

      // Stage 4 & 5
      setCurrentStageIdx(3);
      await new Promise((r) => setTimeout(r, 300));
      setCurrentStageIdx(4);
      await new Promise((r) => setTimeout(r, 200));

      // Stage 6 Done
      setCurrentStageIdx(5);
      setReceiptData(result);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to scan receipt. Please check your image clarity or server connection.");
    } finally {
      setProcessing(false);
    }
  };

  // Field edit handlers
  const updateMerchantField = (field: string, val: any) => {
    setReceiptData((prev: any) => ({
      ...prev,
      merchant: {
        ...prev.merchant,
        [field]: val,
      },
    }));
  };

  const updateReceiptField = (field: string, val: any) => {
    setReceiptData((prev: any) => ({
      ...prev,
      receipt: {
        ...prev.receipt,
        [field]: val,
      },
    }));
  };

  const updateFinancialsField = (field: string, val: any) => {
    const numVal = parseFloat(val) || 0;
    setReceiptData((prev: any) => ({
      ...prev,
      financials: {
        ...prev.financials,
        [field]: numVal,
      },
    }));
  };

  const updateItemField = (index: number, key: string, val: any) => {
    const items = [...(receiptData.items || [])];
    items[index] = { ...items[index], [key]: val };

    // Auto-update total_price if quantity or unit_price changes
    if (key === "quantity" || key === "unit_price") {
      const q = parseFloat(items[index].quantity) || 0;
      const u = parseFloat(items[index].unit_price) || 0;
      items[index].total_price = Number((q * u).toFixed(2));
    }

    setReceiptData((prev: any) => ({
      ...prev,
      items,
    }));
  };

  const addItemRow = () => {
    const newItem = {
      name: "New Line Item",
      quantity: 1,
      unit_price: 0,
      total_price: 0,
    };
    setReceiptData((prev: any) => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));
  };

  const removeItemRow = (index: number) => {
    setReceiptData((prev: any) => ({
      ...prev,
      items: (prev.items || []).filter((_: any, i: number) => i !== index),
    }));
  };

  // Recalculate totals from items + tax
  const recalculateFromItems = () => {
    if (!receiptData) return;
    const itemsSum = (receiptData.items || []).reduce((acc: number, item: any) => acc + (parseFloat(item.total_price) || 0), 0);
    const subtotal = Number(itemsSum.toFixed(2));
    const tax = parseFloat(receiptData.financials?.tax) || 0;
    const charges = parseFloat(receiptData.financials?.additional_charges) || 0;
    const discount = parseFloat(receiptData.financials?.discount) || 0;
    const newTotal = Number((subtotal + tax + charges - discount).toFixed(2));

    setReceiptData((prev: any) => ({
      ...prev,
      financials: {
        ...prev.financials,
        subtotal,
        total: newTotal,
      },
    }));
  };

  const handleSaveReceipt = async () => {
    if (!receiptData) return;
    setSaving(true);
    setErrorMsg("");

    try {
      const payload = {
        merchant: receiptData.merchant,
        receipt: receiptData.receipt,
        items: receiptData.items,
        financials: receiptData.financials,
        confidence: receiptData.confidence,
        warnings: receiptData.warnings,
      };

      const saved = await api.createReceipt(payload);
      router.push(`/receipts/${saved.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save verified receipt to digital vault.");
      setSaving(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setPreviewUrl(null);
    setReceiptData(null);
    setErrorMsg("");
    setZoomLevel(1);
    setRotationAngle(0);
  };

  // Confidence traffic light color helper
  const getConfidenceLevel = (score: number) => {
    if (score >= 0.85) return { color: "emerald", label: "High Confidence", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (score >= 0.50) return { color: "amber", label: "Needs Verification", badgeClass: "bg-amber-50 text-amber-700 border-amber-200" };
    return { color: "rose", label: "Low Confidence", badgeClass: "bg-rose-50 text-rose-700 border-rose-200" };
  };

  const overallConf = receiptData?.confidence?.overall || 0;
  const statusInfo = getConfidenceLevel(overallConf);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
              Receipt & Invoice Scanner
            </h1>
            <p className="text-xs sm:text-sm text-brand-muted mt-0.5">
              Upload photos or digital documents. Our pipeline extracts line items, validates tax calculations, and organizes your records.
            </p>
          </div>

          {receiptData && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-subtle"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Scan Another</span>
              </button>

              <button
                type="button"
                onClick={handleSaveReceipt}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-brand-blue hover:bg-blue-600 text-white transition-all shadow-subtle disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save to Vault</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-semibold">Processing Notice</p>
              <p className="mt-0.5 text-xs opacity-90">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Initial Upload State / Dropzone */}
        {!receiptData && (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-14 text-center transition-all bg-white shadow-subtle ${
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
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
            />

            {processing ? (
              <div className="py-12 max-w-md mx-auto space-y-6">
                <div className="w-14 h-14 rounded-full border-4 border-brand-blue border-t-transparent animate-spin mx-auto" />
                <div>
                  <h3 className="text-base font-bold text-brand-navy">Processing Document</h3>
                  <p className="text-xs text-brand-blue font-medium mt-1">
                    {SCAN_STAGES[currentStageIdx]}
                  </p>
                </div>

                {/* Progressive Stage Stepper */}
                <div className="space-y-2 text-left bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  {SCAN_STAGES.slice(0, 5).map((stage, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs">
                      {idx < currentStageIdx ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : idx === currentStageIdx ? (
                        <div className="w-4 h-4 rounded-full border-2 border-brand-blue border-t-transparent animate-spin flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
                      )}
                      <span className={idx <= currentStageIdx ? "text-slate-800 font-medium" : "text-slate-400"}>
                        {stage}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-brand-blue flex items-center justify-center mx-auto shadow-subtle">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-brand-navy">
                    Upload your receipt or digital invoice
                  </h3>
                  <p className="text-xs sm:text-sm text-brand-muted mt-1 max-w-md mx-auto">
                    Supports JPG, PNG, WEBP, and PDF files up to 15 MB. Also supports mobile camera photos with automatic angle correction.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 bg-brand-navy hover:bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-xl shadow-subtle text-xs sm:text-sm transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Choose File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-brand-navy font-semibold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all"
                  >
                    <Camera className="w-4 h-4 text-brand-blue" />
                    <span>Capture Photo</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile View Toggle Switch */}
        {receiptData && (
          <div className="lg:hidden flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
            <button
              onClick={() => setMobileTab("extracted")}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mobileTab === "extracted" ? "bg-white text-brand-navy shadow-sm" : "text-slate-600"
              }`}
            >
              Extracted Data
            </button>
            <button
              onClick={() => setMobileTab("preview")}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mobileTab === "preview" ? "bg-white text-brand-navy shadow-sm" : "text-slate-600"
              }`}
            >
              Original Document
            </button>
          </div>
        )}

        {/* 2-Column Side-by-Side Results Layout */}
        {receiptData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* COLUMN LEFT: Section E - Original Receipt Viewer (5 cols) */}
            <div
              className={`lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-card p-5 space-y-4 lg:sticky lg:top-6 ${
                mobileTab === "extracted" ? "hidden lg:block" : "block"
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-blue" />
                  <h3 className="text-sm font-bold text-brand-navy">Original Receipt</h3>
                </div>

                {/* Image controls toolbar */}
                {!isPdf && previewUrl && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Zoom Out"
                      onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono font-medium text-slate-500 px-1">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      type="button"
                      title="Zoom In"
                      onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Rotate 90 deg"
                      onClick={() => setRotationAngle((r) => (r + 90) % 360)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors ml-1"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Viewport */}
              <div className="w-full h-[520px] rounded-2xl bg-slate-50 border border-slate-200 overflow-auto flex items-center justify-center p-2 relative">
                {previewUrl ? (
                  isPdf ? (
                    <iframe
                      src={previewUrl}
                      className="w-full h-full rounded-xl border-none"
                      title="PDF Preview"
                    />
                  ) : (
                    <div className="transition-transform duration-200 flex items-center justify-center min-w-full min-h-full">
                      <img
                        src={previewUrl}
                        alt="Receipt preview"
                        style={{
                          transform: `scale(${zoomLevel}) rotate(${rotationAngle}deg)`,
                          transformOrigin: "center center",
                        }}
                        className="max-w-full max-h-[500px] object-contain rounded-lg shadow-sm"
                      />
                    </div>
                  )
                ) : (
                  <div className="text-center text-xs text-brand-muted">
                    No preview available for this document
                  </div>
                )}
              </div>

              {file && (
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 px-1">
                  <span className="truncate max-w-[200px]">{file.name}</span>
                  <span>{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              )}
            </div>

            {/* COLUMN RIGHT: Sections A, B, C, D (7 cols) */}
            <div
              className={`lg:col-span-7 space-y-6 ${
                mobileTab === "preview" ? "hidden lg:block" : "block"
              }`}
            >
              {/* SECTION D: Scan Accuracy & Confidence Card */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.badgeClass}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${
                        statusInfo.color === "emerald" ? "bg-emerald-500" : statusInfo.color === "amber" ? "bg-amber-500" : "bg-rose-500"
                      }`} />
                      {statusInfo.label} ({(overallConf * 100).toFixed(0)}%)
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Document Assessment</span>
                  </div>

                  {/* Field scores mini badges */}
                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    <span className="text-slate-400">Scores:</span>
                    <span title="Merchant Name Accuracy" className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      Merch: {Math.round((receiptData.confidence?.merchant || 0) * 100)}%
                    </span>
                    <span title="Date Accuracy" className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      Date: {Math.round((receiptData.confidence?.date || 0) * 100)}%
                    </span>
                    <span title="Total Accuracy" className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      Total: {Math.round((receiptData.confidence?.total || 0) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Warnings List (if any) */}
                {receiptData.warnings && receiptData.warnings.length > 0 && (
                  <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3 space-y-1.5 text-xs text-amber-900">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>Items requiring attention:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-[11px] pl-1 opacity-90">
                      {receiptData.warnings.map((w: string, i: number) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* SECTION A: Receipt Overview */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-brand-blue" />
                    <h3 className="text-sm font-bold text-brand-navy">Receipt Overview</h3>
                  </div>
                  <span className="text-[11px] text-slate-400">Section A</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Merchant Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-brand-navy mb-1">
                      Merchant / Vendor Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={receiptData.merchant?.name || ""}
                      onChange={(e) => updateMerchantField("name", e.target.value)}
                      placeholder="e.g. Croma Electronics, Spencers, Fresh Mart"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:bg-white"
                    />
                  </div>

                  {/* Category Selector (11 standard categories) */}
                  <div>
                    <label className="block text-xs font-semibold text-brand-navy mb-1 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-brand-blue" />
                      <span>Category</span>
                    </label>
                    <select
                      value={receiptData.receipt?.category || "Other"}
                      onChange={(e) => updateReceiptField("category", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:bg-white"
                    >
                      {STANDARD_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Purchase Date */}
                  <div>
                    <label className="block text-xs font-semibold text-brand-navy mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-brand-blue" />
                      <span>Purchase Date *</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={receiptData.receipt?.date || ""}
                      onChange={(e) => updateReceiptField("date", e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:bg-white"
                    />
                  </div>

                  {/* Receipt Number */}
                  <div>
                    <label className="block text-xs font-semibold text-brand-navy mb-1 flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-brand-blue" />
                      <span>Receipt / Invoice #</span>
                    </label>
                    <input
                      type="text"
                      value={receiptData.receipt?.receipt_number || ""}
                      onChange={(e) => updateReceiptField("receipt_number", e.target.value)}
                      placeholder="e.g. INV-90412"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:bg-white"
                    />
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-xs font-semibold text-brand-navy mb-1 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-brand-blue" />
                      <span>Payment Method</span>
                    </label>
                    <input
                      type="text"
                      value={receiptData.financials?.payment_method || ""}
                      onChange={(e) => updateFinancialsField("payment_method", e.target.value)}
                      placeholder="UPI, Credit Card, Debit Card, Cash"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: Purchased Items Table */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-brand-blue" />
                    <h3 className="text-sm font-bold text-brand-navy">Purchased Items</h3>
                    <span className="text-xs text-brand-muted">
                      ({receiptData.items?.length || 0} line items)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={recalculateFromItems}
                      title="Sync Subtotal & Total from item lines"
                      className="text-[11px] font-semibold text-brand-blue hover:text-blue-700 px-2 py-1 rounded bg-blue-50 transition-colors"
                    >
                      Recalculate Total
                    </button>
                    <button
                      type="button"
                      onClick={addItemRow}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Item</span>
                    </button>
                  </div>
                </div>

                {(!receiptData.items || receiptData.items.length === 0) ? (
                  <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-500 font-medium">
                      No individual line items detected on this receipt.
                    </p>
                    <button
                      type="button"
                      onClick={addItemRow}
                      className="mt-2 text-xs font-semibold text-brand-blue hover:underline inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add line items manually</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                          <th className="py-2.5 px-3">Item Description</th>
                          <th className="py-2.5 px-2 w-20 text-center">Qty</th>
                          <th className="py-2.5 px-2 w-24 text-right">Unit Price</th>
                          <th className="py-2.5 px-2 w-28 text-right">Total</th>
                          <th className="py-2.5 px-2 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {receiptData.items.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                            {/* Item Name */}
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={item.name || ""}
                                onChange={(e) => updateItemField(idx, "name", e.target.value)}
                                className="w-full px-2 py-1 bg-transparent border border-transparent hover:border-slate-200 focus:border-brand-blue focus:bg-white rounded-md text-xs font-medium text-slate-800"
                              />
                            </td>

                            {/* Qty */}
                            <td className="py-2 px-2 text-center">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.quantity || 1}
                                onChange={(e) => updateItemField(idx, "quantity", e.target.value)}
                                className="w-16 px-1.5 py-1 text-center bg-transparent border border-transparent hover:border-slate-200 focus:border-brand-blue focus:bg-white rounded-md text-xs font-mono text-slate-800"
                              />
                            </td>

                            {/* Unit Price */}
                            <td className="py-2 px-2 text-right">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.unit_price ?? 0}
                                onChange={(e) => updateItemField(idx, "unit_price", e.target.value)}
                                className="w-20 px-1.5 py-1 text-right bg-transparent border border-transparent hover:border-slate-200 focus:border-brand-blue focus:bg-white rounded-md text-xs font-mono text-slate-800"
                              />
                            </td>

                            {/* Total Price */}
                            <td className="py-2 px-2 text-right font-semibold font-mono text-slate-900">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.total_price ?? 0}
                                onChange={(e) => updateItemField(idx, "total_price", e.target.value)}
                                className="w-24 px-1.5 py-1 text-right bg-transparent border border-transparent hover:border-slate-200 focus:border-brand-blue focus:bg-white rounded-md text-xs font-mono font-bold text-slate-900"
                              />
                            </td>

                            {/* Delete Button */}
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                title="Remove item"
                                onClick={() => removeItemRow(idx)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SECTION C: Financial Breakdown */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-blue" />
                    <h3 className="text-sm font-bold text-brand-navy">Financial Breakdown</h3>
                  </div>
                  <span className="text-[11px] text-slate-400">Section C</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Subtotal */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Subtotal
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={receiptData.financials?.subtotal ?? 0}
                      onChange={(e) => updateFinancialsField("subtotal", e.target.value)}
                      className="w-full bg-transparent font-mono font-bold text-sm text-slate-800 focus:outline-none"
                    />
                  </div>

                  {/* Discount */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Discount
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={receiptData.financials?.discount ?? 0}
                      onChange={(e) => updateFinancialsField("discount", e.target.value)}
                      className="w-full bg-transparent font-mono font-bold text-sm text-emerald-700 focus:outline-none"
                    />
                  </div>

                  {/* GST / Taxes */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      GST / Taxes
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={receiptData.financials?.tax ?? 0}
                      onChange={(e) => updateFinancialsField("tax", e.target.value)}
                      className="w-full bg-transparent font-mono font-bold text-sm text-slate-800 focus:outline-none"
                    />
                  </div>

                  {/* Additional Charges */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Addl. Charges
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={receiptData.financials?.additional_charges ?? 0}
                      onChange={(e) => updateFinancialsField("additional_charges", e.target.value)}
                      className="w-full bg-transparent font-mono font-bold text-sm text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Final Prominent Total */}
                <div className="p-5 rounded-2xl bg-brand-navy text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-300">
                      Final Amount Paid ({receiptData.receipt?.currency || "INR"})
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ensure this matches the final charge on your invoice
                    </p>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {receiptData.receipt?.currency === "USD" ? "$" : receiptData.receipt?.currency === "EUR" ? "€" : "₹"}
                    </span>
                    <input
                      type="number"
                      step="any"
                      value={receiptData.financials?.total ?? 0}
                      onChange={(e) => updateFinancialsField("total", e.target.value)}
                      className="bg-transparent text-3xl font-extrabold font-mono text-white text-right w-36 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded-md"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetAll}
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-subtle"
                >
                  Discard & Scan Another
                </button>

                <button
                  type="button"
                  onClick={handleSaveReceipt}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-brand-blue hover:bg-blue-600 text-white transition-all shadow-subtle disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving to Vault...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Confirm & Save Receipt</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
