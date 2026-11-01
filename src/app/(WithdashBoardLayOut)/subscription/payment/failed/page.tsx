import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import Link from "next/link";

export default function SubscriptionPaymentFailedPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <XCircle className="h-9 w-9 text-red-600" />
        </div>

        <h1 className="mt-5 text-2xl font-bold text-slate-900">
          Payment unsuccessful
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Your payment could not be completed. Check your payment method or try
          again. Your subscription should only change after a verified
          successful payment.
        </p>

        <Button asChild className="mt-6 w-full">
          <Link href="/subscription">Return to subscription</Link>
        </Button>
      </div>
    </main>
  );
}
