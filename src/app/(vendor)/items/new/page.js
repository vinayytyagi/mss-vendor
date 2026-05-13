"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { clearSession, createVendorItem, getSession, isAuthError, uploadPublicFile } from "@/lib/vendorApi";
import { useVendorPageHeader } from "@/components/vendorPageHeader";
import { ArrowLeft, Save } from "lucide-react";
import { Select } from "@/components/ui/select";
import CityStateDropdown from "@/components/CityStateDropdown";

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });
}

export default function NewItemPage() {
  useVendorPageHeader({
    title: "Add Listing",
    subtitle: "Create a product / venue.",
  });

  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    price: "",
    item_type: "Venue",
    location_city: "",
    description: "",
    journey_step_id: "",
    category_id: "",
    images: [],
  });

  async function uploadImage(file) {
    setUploading(true);
    try {
      const fileBase64 = await toBase64(file);
      const res = await uploadPublicFile({
        fileBase64,
        mimeType: file.type || "application/octet-stream",
        originalName: file.name || "image",
      });
      setForm((p) => ({ ...p, images: [...p.images, res.url] }));
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    const { token } = getSession();
    if (!token) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        price: Number(form.price) || 0,
        item_type: form.item_type,
        location_city: form.location_city || null,
        description: form.description || null,
        journey_step_id: form.journey_step_id,
        category_id: form.category_id,
        images: form.images,
        status: "Active",
      };
      await createVendorItem(token, payload);
      toast.success("Listing submitted for admin approval. It will appear on the store after approval.");
      router.push("/items");
    } catch (err) {
      if (isAuthError(err)) {
        clearSession();
        window.location.href = "/login";
        return;
      }
      toast.error(err.message || "Create failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-between w-full gap-2">
          <Button variant="outline" asChild>
            <Link href="/items" className="inline-flex items-center gap-2">
              <ArrowLeft className="size-4" />
              Back
            </Link>
          </Button>

          <Button type="submit" form="new-item-form" disabled={saving} className="gap-2">
            <Save className="size-4" />
            {saving ? "Creating..." : "Create listing"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form id="new-item-form" onSubmit={submit} className="grid gap-3 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-xs font-medium text-slate-600">Name</span>
              <div className="mt-1">
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Price (₹)</span>
              <div className="mt-1">
                <Input inputMode="numeric" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} required />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Type</span>
              <div className="mt-1">
                <Select
                  className="w-full"
                  value={form.item_type}
                  onValueChange={(v) => setForm((p) => ({ ...p, item_type: v }))}
                  options={[
                    { value: "Venue", label: "Venue" },
                    { value: "Product", label: "Product" },
                    { value: "Service", label: "Service" },
                  ]}
                  align="start"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Journey step id</span>
              <div className="mt-1">
                <Input value={form.journey_step_id} onChange={(e) => setForm((p) => ({ ...p, journey_step_id: e.target.value }))} required />
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Category id</span>
              <div className="mt-1">
                <Input value={form.category_id} onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))} required />
              </div>
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs font-medium text-slate-600">City</span>
              <div className="mt-1">
                <CityStateDropdown
                  value={form.location_city}
                  onChange={(loc) => setForm((p) => ({ ...p, location_city: loc.label }))}
                  placeholderCity="Search city…"
                  placeholderState="Select state"
                />
              </div>
            </label>
            <label className="block md:col-span-2">
              <span className="text-xs font-medium text-slate-600">Description</span>
              <div className="mt-1">
                <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
            </label>

            <div className="md:col-span-2">
              <span className="text-xs font-medium text-slate-600">Images</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {form.images.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="text-sm text-brand-700 hover:underline">
                    {url.split("/").slice(-1)[0]}
                  </a>
                ))}
              </div>
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadImage(f);
                    e.target.value = "";
                  }}
                  className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-brand-700 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-800 disabled:opacity-60"
                />
              </div>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}

