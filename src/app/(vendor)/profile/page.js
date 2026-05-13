"use client";

import { useEffect, useState } from "react";
import {
  clearSession,
  fetchVendorMe,
  getSession,
  isAuthError,
  postVendorCommissionNegotiation,
  submitVendorOnboarding,
  updateVendorMe,
  uploadVendorKycDocument,
} from "@/lib/vendorApi";
import { useVendorPageHeader } from "@/components/vendorPageHeader";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, Pencil, Save, X, Upload } from "lucide-react";
import { Select } from "@/components/ui/select";
import CityStateDropdown from "@/components/CityStateDropdown";

function statusVariant(status) {
  const s = String(status || "").toLowerCase();
  if (s === "active") return "success";
  if (s.includes("reject")) return "danger";
  if (s.includes("resubmission")) return "warning";
  if (s.includes("pending")) return "warning";
  if (s.includes("suspend")) return "danger";
  return "neutral";
}

function whiteLabelLabel(mode) {
  const m = String(mode || "");
  if (m === "mss_full") return "MSS white-label (MSS name & branding)";
  if (m === "own_full") return "Own brand only";
  if (m === "partial") return "Partial white-label";
  return m || "—";
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  useVendorPageHeader({
    title: "Profile",
    subtitle: "Manage your business info and onboarding.",
  });

  const [tab, setTab] = useState("business");
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    business_name: "",
    contact_phone: "",
    city: "",
    state: "",
    gst_number: "",
    udyam_number: "",
    description: "",
    min_budget: "",
    max_budget: "",
  });
  const [kycType, setKycType] = useState("gst");
  const [commissionBusy, setCommissionBusy] = useState(false);
  const [vendorCounterPct, setVendorCounterPct] = useState("");

  useEffect(() => {
    const { token } = getSession();
    if (!token) return;
    (async () => {
      try {
        const res = await fetchVendorMe(token);
        const v = res?.vendor || null;
        setData(v);
        setForm({
          business_name: v?.business_name || "",
          contact_phone: v?.contact_phone || "",
          city: v?.city || "",
          state: v?.state || "",
          gst_number: v?.gst_number || "",
          udyam_number: v?.udyam_number || "",
          description: v?.description || "",
          min_budget: v?.min_budget != null ? String(v.min_budget) : "",
          max_budget: v?.max_budget != null ? String(v.max_budget) : "",
        });
      } catch (err) {
        if (isAuthError(err)) {
          clearSession();
          window.location.href = "/login";
          return;
        }
        setError(err.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSaveProfile() {
    const { token } = getSession();
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        business_name: form.business_name,
        contact_phone: form.contact_phone,
        city: form.city,
        state: form.state,
        gst_number: form.gst_number,
        udyam_number: form.udyam_number,
        description: form.description,
        min_budget: form.min_budget === "" ? undefined : Number(form.min_budget),
        max_budget: form.max_budget === "" ? undefined : Number(form.max_budget),
      };
      const res = await updateVendorMe(token, payload);
      setData(res.vendor);
      setEditing(false);
      toast.success("Profile saved");
    } catch (err) {
      if (isAuthError(err)) {
        clearSession();
        window.location.href = "/login";
        return;
      }
      setError(err.message || "Save failed");
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadKyc(file) {
    const { token } = getSession();
    if (!token || !file) return;
    setUploading(true);
    setError("");
    try {
      const fileBase64 = await toBase64(file);
      const res = await uploadVendorKycDocument(token, {
        type: kycType,
        fileBase64,
        mimeType: file.type || "application/octet-stream",
        originalName: file.name || "document",
      });
      toast.success("KYC uploaded");
      setData((prev) => ({
        ...(prev || {}),
        kyc_documents: [...((prev?.kyc_documents || []) ?? []), res.document],
      }));
    } catch (err) {
      if (isAuthError(err)) {
        clearSession();
        window.location.href = "/login";
        return;
      }
      setError(err.message || "Upload failed");
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function commissionVendorAction(action) {
    const { token } = getSession();
    if (!token) return;
    setCommissionBusy(true);
    setError("");
    try {
      const body = { action };
      if (action === "counter") {
        const n = Number(vendorCounterPct);
        if (!Number.isFinite(n) || n < 0 || n > 100) {
          toast.error("Enter a valid percentage between 0 and 100");
          return;
        }
        body.commission_vendor_proposed_pct = n;
      }
      const res = await postVendorCommissionNegotiation(token, body);
      setData(res.vendor);
      setVendorCounterPct("");
      toast.success(res.message || "Updated");
    } catch (err) {
      if (isAuthError(err)) {
        clearSession();
        window.location.href = "/login";
        return;
      }
      setError(err.message || "Request failed");
      toast.error(err.message || "Request failed");
    } finally {
      setCommissionBusy(false);
    }
  }

  async function handleSubmitOnboarding() {
    const { token } = getSession();
    if (!token) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await submitVendorOnboarding(token);
      setData(res.vendor);
      toast.success("Onboarding submitted");
    } catch (err) {
      if (isAuthError(err)) {
        clearSession();
        window.location.href = "/login";
        return;
      }
      setError(err.message || "Submit failed");
      toast.error(err.message || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant(data?.status)}>{data?.status || "Unknown"}</Badge>
          {String(data?.status || "") === "KycResubmissionRequired" ? (
            <Button variant="outline" size="sm" disabled={submitting || loading} onClick={handleSubmitOnboarding}>
              {submitting ? "Submitting..." : "Resubmit onboarding"}
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      {loading ? (
        <Card>
          <CardContent className="text-sm text-slate-500">Loading...</CardContent>
        </Card>
      ) : !data ? (
        <Card>
          <CardContent className="text-sm text-slate-500">No vendor record.</CardContent>
        </Card>
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="business" currentValue={tab} onValueChange={setTab}>
              Business
            </TabsTrigger>
            <TabsTrigger value="kyc" currentValue={tab} onValueChange={setTab}>
              KYC
            </TabsTrigger>
            <TabsTrigger value="onboarding" currentValue={tab} onValueChange={setTab}>
              Onboarding
            </TabsTrigger>
            <TabsTrigger value="terms" currentValue={tab} onValueChange={setTab}>
              Branding & commission
            </TabsTrigger>
          </TabsList>

          {tab === "business" ? (
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle>Business details</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">Your public vendor profile information.</p>
                  </div>
                  <div className="flex gap-2">
                    {editing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={saving}
                        onClick={() => {
                          setEditing(false);
                          setForm({
                            business_name: data?.business_name || "",
                            contact_phone: data?.contact_phone || "",
                            city: data?.city || "",
                            state: data?.state || "",
                            gst_number: data?.gst_number || "",
                            udyam_number: data?.udyam_number || "",
                            description: data?.description || "",
                            min_budget: data?.min_budget != null ? String(data.min_budget) : "",
                            max_budget: data?.max_budget != null ? String(data.max_budget) : "",
                          });
                        }}
                      >
                        <X className="size-4" />
                        Cancel
                      </Button>
                    ) : null}
                    <Button
                      variant={editing ? "default" : "outline"}
                      size="sm"
                      disabled={saving}
                      onClick={() => {
                        if (editing) handleSaveProfile();
                        else setEditing(true);
                      }}
                    >
                      {editing ? <Save className="size-4" /> : <Pencil className="size-4" />}
                      {editing ? (saving ? "Saving..." : "Save changes") : "Edit profile"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!editing ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Info label="Business name" value={data.business_name || "—"} />
                    <Info label="Email" value={data.email || data.contact_email || "—"} />
                    <Info label="Phone" value={data.contact_phone || "—"} />
                    <Info label="City / State" value={[data.city, data.state].filter(Boolean).join(", ") || "—"} />
                    <Info label="GST number" value={data.gst_number || "—"} />
                    <Info label="Udyam number" value={data.udyam_number || "—"} />
                    <Info label="Budget range" value={`${data.min_budget != null ? `₹${data.min_budget}` : "—"} - ${data.max_budget != null ? `₹${data.max_budget}` : "—"}`} />
                    <div className="md:col-span-2">
                      <Info label="Description" value={data.description || "—"} />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Business name">
                      <Input value={form.business_name} onChange={(e) => setForm((p) => ({ ...p, business_name: e.target.value }))} />
                    </Field>
                    <Field label="Phone">
                      <Input value={form.contact_phone} onChange={(e) => setForm((p) => ({ ...p, contact_phone: e.target.value }))} />
                    </Field>
                    <Field label="City">
                      <CityStateDropdown
                        cityValue={form.city}
                        stateValue={form.state}
                        onChange={(loc) => setForm((p) => ({ ...p, city: loc.city, state: loc.state }))}
                        placeholderCity="Search city…"
                        placeholderState="Select state"
                      />
                    </Field>
                    <div className="hidden" aria-hidden="true" />
                    <Field label="GST number">
                      <Input value={form.gst_number} onChange={(e) => setForm((p) => ({ ...p, gst_number: e.target.value }))} />
                    </Field>
                    <Field label="Udyam number">
                      <Input value={form.udyam_number} onChange={(e) => setForm((p) => ({ ...p, udyam_number: e.target.value }))} />
                    </Field>
                    <Field label="Min budget (₹)">
                      <Input inputMode="numeric" value={form.min_budget} onChange={(e) => setForm((p) => ({ ...p, min_budget: e.target.value }))} />
                    </Field>
                    <Field label="Max budget (₹)">
                      <Input inputMode="numeric" value={form.max_budget} onChange={(e) => setForm((p) => ({ ...p, max_budget: e.target.value }))} />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Description">
                        <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                      </Field>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {tab === "kyc" ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Upload documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-3">
                    <Field label="Document type">
                      <Select
                        className="w-full"
                        value={kycType}
                        onValueChange={setKycType}
                        options={[
                          { value: "gst", label: "GST" },
                          { value: "udyam", label: "Udyam" },
                          { value: "pan", label: "PAN" },
                          { value: "bank", label: "Bank" },
                          { value: "other", label: "Other" },
                        ]}
                        align="start"
                      />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="File">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          disabled={uploading}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadKyc(f);
                            e.target.value = "";
                          }}
                          className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-brand-700 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-800 disabled:opacity-60"
                        />
                        <p className="mt-1 text-xs text-slate-500">Accepted: images, PDF.</p>
                        <p className="mt-2 inline-flex items-center gap-2 text-xs text-slate-500">
                          <Upload className="size-4" />
                          Upload will attach to your KYC record.
                        </p>
                      </Field>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Uploaded KYC</CardTitle>
                </CardHeader>
                <CardContent>
                  {Array.isArray(data.kyc_documents) && data.kyc_documents.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {[...data.kyc_documents].reverse().map((d, idx) => (
                        <div key={`${d.url}-${idx}`} className="flex flex-wrap items-center justify-between gap-2 py-2">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{d.type || "document"}</p>
                            <p className="text-xs text-slate-500">{d.original_name || d.url}</p>
                          </div>
                          <a
                            href={d.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
                          >
                            View
                            <ArrowUpRight className="size-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No documents uploaded yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}

          {tab === "onboarding" ? (
            <Card>
              <CardHeader>
                <CardTitle>Onboarding status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Row label="Current status" value={<Badge variant={statusVariant(data.status)}>{data.status || "-"}</Badge>} />
                <Row label="Submitted at" value={data.onboarding_submitted_at ? new Date(data.onboarding_submitted_at).toLocaleString("en-IN") : "-"} />
                <Row label="Reviewed at" value={data.onboarding_reviewed_at ? new Date(data.onboarding_reviewed_at).toLocaleString("en-IN") : "-"} />
                <Row label="Review note" value={data.onboarding_review_note || "-"} />
                {String(data?.status || "") === "KycResubmissionRequired" ? (
                  <div className="pt-2">
                    <Button disabled={submitting} onClick={handleSubmitOnboarding}>
                      {submitting ? "Submitting..." : "Resubmit onboarding"}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Onboarding is submitted during signup. If admin requests resubmission, you’ll see an action here.
                  </p>
                )}
              </CardContent>
            </Card>
          ) : null}

          {tab === "terms" ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Branding choice</CardTitle>
                  <p className="text-sm text-slate-500">Set at signup. Contact admin if you need this changed.</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Info label="Mode" value={whiteLabelLabel(data.white_label_mode)} />
                  {data.white_label_mode === "partial" ? (
                    <Info label="Your note" value={data.white_label_note || "—"} />
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Commission negotiation</CardTitle>
                  <p className="text-sm text-slate-500">
                    Status: <span className="font-medium text-slate-800">{data.commission_negotiation_status || "—"}</span>
                    {data.commission_vendor_proposed_pct != null ? (
                      <>
                        {" "}
                        · You proposed: <span className="font-medium">{data.commission_vendor_proposed_pct}%</span>
                      </>
                    ) : null}
                    {data.commission_admin_offered_pct != null ? (
                      <>
                        {" "}
                        · Admin offer: <span className="font-medium">{data.commission_admin_offered_pct}%</span>
                      </>
                    ) : null}
                    {data.commission_agreed_pct != null || data.commission_percentage != null ? (
                      <>
                        {" "}
                        · Agreed:{" "}
                        <span className="font-medium">
                          {data.commission_agreed_pct ?? data.commission_percentage}%
                        </span>
                      </>
                    ) : null}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                  <Button
                    type="button"
                    disabled={
                      commissionBusy ||
                      data.commission_negotiation_status !== "awaiting_vendor" ||
                      data.commission_admin_offered_pct == null
                    }
                    onClick={() => commissionVendorAction("accept_admin_offer")}
                  >
                    Accept admin offer
                  </Button>
                  <div className="flex flex-wrap items-end gap-2">
                    <Field label="Your counter-offer %">
                      <Input
                        inputMode="decimal"
                        className="w-28"
                        value={vendorCounterPct}
                        onChange={(e) => setVendorCounterPct(e.target.value)}
                      />
                    </Field>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={commissionBusy || String(data.commission_negotiation_status || "") === "agreed"}
                      onClick={() => commissionVendorAction("counter")}
                    >
                      Send counter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </Tabs>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-md border border-border bg-muted px-3 py-2">
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900 wrap-break-word">{String(value)}</p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-slate-600">{label}</p>
      <div className="text-sm text-slate-900">{value}</div>
    </div>
  );
}

