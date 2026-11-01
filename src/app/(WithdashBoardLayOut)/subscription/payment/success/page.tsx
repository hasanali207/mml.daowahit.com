"use client";

import { Button } from "@/components/ui/button";
import { BadgeCheck, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SubscriptionPaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // This page is informational. The backend must already have verified
    // the payment before redirecting here.
    const timer = window.setTimeout(() => setChecking(false), 500);
    return () => window.clearTimeout(timer);
  }, []);

  const status = searchParams.get("status");
  const subscriptionId = searchParams.get("subscriptionId");

  if (status !== "success") {
    return (
      <main className="flex min-h-[70vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">
            Payment status unavailable
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Please return to your subscription page and refresh the status.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link href="/subscription">View subscription</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          {checking ? (
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          ) : (
            <BadgeCheck className="h-9 w-9 text-emerald-600" />
          )}
        </div>

        <h1 className="mt-5 text-2xl font-bold text-slate-900">
          Payment verified
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Your payment has been verified by the server. Refresh your
          subscription page to see the latest plan and capacity.
        </p>

        {subscriptionId && (
          <p className="mt-3 break-all text-xs text-slate-400">
            Subscription reference: {subscriptionId}
          </p>
        )}

        <div className="mt-6 grid gap-3">
          <Button
            onClick={() => router.replace("/subscription")}
            className="w-full gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            View subscription
          </Button>

          <Button variant="outline" asChild>
            <Link href="/">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
