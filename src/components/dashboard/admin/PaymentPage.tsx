"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import toast from "react-hot-toast";

interface Payment {
  id: string;
  studentId: string;
  admissionId: string;
  sessionId: string;
  month: number;
  year: number;
  paidAmount: number;
  status: string;
}

export default function PaymentPage() {
  const [paymentId, setPaymentId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // 1️⃣ Generate Payment
  const handleGeneratePayment = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/payment/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            admissionId: "1c9fca09-b986-492d-9047-129ab4c88aac",
            sessionId: "880f133b-b603-4500-af50-b84a3a1ce37e",
            month: 1,
            year: 2025,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        toast.success("Payment generated!");
        setPaymentId(data.data.id);
      } else {
        toast.error(data.message);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2️⃣ Pay via SSLCommerz
  // frontend PaymentPage.tsx
  const handlePay = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/payment/pay`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: "0c61128d-6a7c-4add-bf98-3786a2e59458",
        }),
      }
    );
    const data = await res.json();

    if (data.success && data.data.paymentUrl) {
      window.location.href = data.data.paymentUrl; // <-- Redirect to SSLCommerz
    } else {
      console.error("Payment initiation failed", data);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-bold">Payment</h2>
      <Button onClick={handleGeneratePayment} disabled={loading}>
        Generate Payment
      </Button>
      {paymentId && (
        <div className="space-y-2">
          <p>Payment ID: {paymentId}</p>
          <Button onClick={handlePay} disabled={loading}>
            Pay via SSLCommerz
          </Button>
        </div>
      )}
    </div>
  );
}
