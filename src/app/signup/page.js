"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
import { registerVendor, getSession, uploadPublicFile } from "@/lib/vendorApi";
import { ShieldCheck, Percent } from "lucide-react";
import CityStateDropdown from "@/components/CityStateDropdown";

const WL_OPTIONS = [
  { value: "mss_full", label: "MSS white-label — sell under My Shaadi Store name & branding" },
  { value: "own_full", label: "Own brand only — all items under my business name" },
  { value: "partial", label: "Partial — some listings MSS-branded, some under my brand (details below)" },
];

export default function VendorSignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [kycUploading, setKycUploading] = useState(false);
  const [kycType, setKycType] = useState("gst");
  const [kycDocuments, setKycDocuments] = useState([]);
  const [form, setForm] = useState({
    businessName: "",
    email: "",
    password: "",
    contactPhone: "",
    city: "",
    state: "",
    gstNumber: "",
    udyamNumber: "",
    description: "",
    whiteLabelMode: "mss_full",
    whiteLabelNote: "",
    commissionPct: "15",
  });

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.onload = () => resolve(String(reader.result || ""));
      reader.readAsDataURL(file);
    });
  }

  async function uploadKyc(file) {
    if (!file) return;
    setKycUploading(true);
    setError("");
    try {
      const fileBase64 = await toBase64(file);
      const res = await uploadPublicFile({
        fileBase64,
        mimeType: file.type || "application/octet-stream",
        originalName: file.name || "document",
      });
      if (!res?.url) throw new Error("Upload failed");
      setKycDocuments((prev) => [...prev, { type: kycType, url: res.url, original_name: file.name || null }]);
      toast.success("KYC uploaded");
    } catch (e) {
      setError(e.message || "KYC upload failed");
      toast.error(e.message || "KYC upload failed");
    } finally {
      setKycUploading(false);
    }
  }

  useEffect(() => {
    const { token, user } = getSession();
    if (token && user) router.replace("/dashboard");
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const pct = Number(form.commissionPct);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      setError("Proposed commission must be between 0 and 100.");
      return;
    }
    if (form.whiteLabelMode === "partial" && !form.whiteLabelNote.trim()) {
      setError("Please describe how you want to split MSS vs your own branding.");
      return;
    }
    if (!Array.isArray(kycDocuments) || kycDocuments.length === 0) {
      setError("Please upload at least 1 KYC document (GST/Udyam/PAN/Bank).");
      return;
    }
    setLoading(true);
    try {
      await registerVendor({
        businessName: form.businessName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        contactPhone: form.contactPhone.trim(),
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        gstNumber: form.gstNumber.trim() || undefined,
        udyamNumber: form.udyamNumber.trim() || undefined,
        description: form.description.trim() || undefined,
        whiteLabelMode: form.whiteLabelMode,
        whiteLabelNote: form.whiteLabelMode === "partial" ? form.whiteLabelNote.trim() : undefined,
        commission_vendor_proposed_pct: pct,
        kycDocuments,
      });
      toast.success("Application submitted. We will email you after admin review.");
      router.push("/login");
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-slate-50 px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-2xl -translate-x-1/2 rounded-full bg-brand-200/60 blur-3xl" />
      </div>

      <form onSubmit={handleSubmit} className="relative mx-auto w-full max-w-2xl">
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-brand-700 text-white">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <CardTitle className="text-slate-900">Vendor signup</CardTitle>
                <p className="mt-0.5 text-sm text-slate-500">
                  Tell us how you want to sell, and your proposed commission. Admin may accept, counter, or decline.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">Business name *</label>
              <Input
                required
                value={form.businessName}
                onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">Email *</label>
                <Input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">Password *</label>
                <Input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">Contact phone *</label>
              <Input
                required
                value={form.contactPhone}
                onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">City / state</label>
              <CityStateDropdown
                cityValue={form.city}
                stateValue={form.state}
                onChange={(loc) => setForm((p) => ({ ...p, city: loc.city, state: loc.state }))}
                placeholderCity="Search city…"
                placeholderState="Select state"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">GST (optional)</label>
                <Input value={form.gstNumber} onChange={(e) => setForm((p) => ({ ...p, gstNumber: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">Udyam (optional)</label>
                <Input value={form.udyamNumber} onChange={(e) => setForm((p) => ({ ...p, udyamNumber: e.target.value }))} />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">KYC documents *</p>
                  <p className="mt-0.5 text-xs text-slate-500">Admin will verify your KYC before approving your account.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    className="w-[160px]"
                    value={kycType}
                    onValueChange={setKycType}
                    align="end"
                    options={[
                      { value: "gst", label: "GST" },
                      { value: "udyam", label: "Udyam" },
                      { value: "pan", label: "PAN" },
                      { value: "bank", label: "Bank" },
                      { value: "other", label: "Other" },
                    ]}
                  />
                  <input
                      type="file"
                      accept="image/*,application/pdf"
                      disabled={kycUploading || loading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadKyc(f);
                        e.target.value = "";
                      }}
                      className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-brand-700 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-800 disabled:opacity-60"
                    />
                </div>
              </div>

              {kycDocuments.length ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-slate-600">Uploaded ({kycDocuments.length})</p>
                  <div className="divide-y divide-slate-100 rounded-md border border-slate-100">
                    {[...kycDocuments].reverse().map((d, idx) => (
                      <div key={`${d.url}-${idx}`} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{String(d.type || "document").toUpperCase()}</p>
                          <p className="truncate text-xs text-slate-500">{d.original_name || d.url}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <a href={d.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand-700 hover:underline">
                            View
                          </a>
                          <button
                            type="button"
                            className="text-sm font-medium text-red-600 hover:underline"
                            onClick={() => setKycDocuments((prev) => prev.filter((x) => x.url !== d.url))}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-500">Please upload at least one document to continue.</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">Branding *</label>
              <Select
                className="w-full"
                value={form.whiteLabelMode}
                onValueChange={(v) => setForm((p) => ({ ...p, whiteLabelMode: v }))}
                options={WL_OPTIONS}
                align="start"
              />
            </div>

            {form.whiteLabelMode === "partial" ? (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">Partial white-label details *</label>
                <Textarea
                  value={form.whiteLabelNote}
                  onChange={(e) => setForm((p) => ({ ...p, whiteLabelNote: e.target.value }))}
                  placeholder="e.g. Venues sold as MSS; photography under my studio name"
                  rows={3}
                />
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <Percent className="size-3.5 text-slate-500" />
                Proposed commission % (you ↔ MSS) *
              </label>
              <Input
                inputMode="decimal"
                required
                value={form.commissionPct}
                onChange={(e) => setForm((p) => ({ ...p, commissionPct: e.target.value }))}
              />
              <p className="text-xs text-slate-500">
                Admin can accept this rate, send a different offer, or decline. You’ll respond from your profile once your account is active.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">Description</label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Submitting…" : "Submit application"}
            </Button>

            <p className="text-center text-sm text-slate-500">
              Already registered?{" "}
              <Link href="/login" className="font-medium text-brand-700 hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
