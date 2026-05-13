"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, loginVendor, saveSession } from "@/lib/vendorApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { token, user } = getSession();
    if (token && user) router.replace("/dashboard");
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await loginVendor({ email, password });
      saveSession(data);
      toast.success("Signed in");
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-2xl -translate-x-1/2 rounded-full bg-brand-200/60 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 h-72 w-2xl -translate-x-1/2 rounded-full bg-fuchsia-200/50 blur-3xl" />
      </div>

      <form onSubmit={handleSubmit} className="relative w-full max-w-md">
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-brand-700 text-white">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <CardTitle className="text-slate-900">Vendor sign in</CardTitle>
                <p className="mt-0.5 text-sm text-slate-500">Access quotations, KYC, onboarding.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error ? <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
            <div className="space-y-3">
              <Input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                type="password"
                required
                minLength={6}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading} className="mt-5 w-full">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            <div className="mt-4 flex items-center justify-between text-sm">
              <p className="text-slate-500">New vendor?</p>
              <Link href="/signup" className="font-medium text-brand-700 hover:underline">
                Create vendor account
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
