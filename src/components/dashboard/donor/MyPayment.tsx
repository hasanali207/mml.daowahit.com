"use client";

import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";

type PaymentItem = {
  id: string;
  studentId: string;
  admissionId: string;
  sessionId: string;
  month: number;
  year: number;
  status: string;
  paidAmount: number;
  amount: number;
  transactionId: string;
  items: {
    id: string;
    feeCategoryId: string;
    amount: number;
    status: string;
    feeCategory: { name: string };
  }[];
  session: { id: string; name: string };
};

export default function DonorMyPaymentPage() {
  const token = useSelector((state: any) => state.auth.token);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/v1/payment/donor/me/payments`);
        setPayments(Array.isArray(res.data.data) ? res.data.data : []);
      } catch (err) {
        toast.error("Failed to fetch payments");
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [token]);

  const handlePay = async (id: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/payment/pay`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${token}`,
          },
          body: JSON.stringify({ id }),
        },
      );
      const json = await res.json();
      if (json.success && json.data?.paymentUrl) {
        window.location.href = json.data.paymentUrl;
      } else {
        toast.error(
          "অনলাইন পেমেন্ট নিয়ে কাজ চলমান অপেক্ষা করুন। বর্তমানে অফিসে এসে পেমেন্ট করতে হবে।",
        );
      }
    } catch {
      toast.error(
        "অনলাইন পেমেন্ট নিয়ে কাজ চলমান অপেক্ষা করুন। বর্তমানে অফিসে এসে পেমেন্ট করতে হবে",
      );
    }
  };

  const getMonthName = (month: number, year: number) =>
    new Date(year, month - 1).toLocaleString("bn-BD", { month: "long" });

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-xl font-semibold mb-5">My Payments</h2>

      {loading && (
        <div className="text-center py-10 text-muted-foreground">
          Loading payments...
        </div>
      )}

      {!loading && payments.length === 0 && (
        <div className="text-center py-10 border rounded-lg text-muted-foreground">
          No pending payments found.
        </div>
      )}

      {!loading && payments.length > 0 && (
        <>
          {/* Desktop Table — hidden on mobile */}
          <div className="hidden lg:block overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[620px] border-collapse text-center text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="border px-3 py-3 font-medium">#</th>
                  <th className="border px-3 py-3 font-medium">মাস/বছর</th>
                  <th className="border px-3 py-3 font-medium">টাকা</th>
                  <th className="border px-3 py-3 font-medium">পরিশোধিত</th>
                  <th className="border px-3 py-3 font-medium">Status</th>
                  <th className="border px-3 py-3 font-medium">পেমেন্ট</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, idx) => (
                  <tr
                    key={p.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="border px-3 py-3">{idx + 1}</td>
                    <td className="border px-3 py-3 whitespace-nowrap">
                      {getMonthName(p.month, p.year)} {p.year}
                    </td>
                    <td className="border px-3 py-3">৳ {p.amount}</td>
                    <td className="border px-3 py-3">৳ {p.paidAmount}</td>
                    <td className="border px-3 py-3">
                      <span
                        className={
                          p.status === "PAID"
                            ? "text-green-600 font-medium"
                            : "text-orange-500 font-medium"
                        }
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="border px-3 py-3">
                      {p.status === "UNPAID" ? (
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary text-white"
                          onClick={() => handlePay(p.id)}
                        >
                          Pay
                        </Button>
                      ) : (
                        <span className="text-green-600 font-medium">
                          Paid ✓
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards — hidden on desktop */}
          <div className="flex flex-col gap-3 lg:hidden">
            {payments.map((p, idx) => (
              <div
                key={p.id}
                className="border rounded-xl p-4 bg-white dark:bg-zinc-900"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    #{idx + 1}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      p.status === "PAID" ? "text-green-600" : "text-orange-500"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">মাস/বছর</span>
                    <span className="font-medium">
                      {getMonthName(p.month, p.year)} {p.year}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">টাকা</span>
                    <span className="font-medium">৳ {p.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">পরিশোধিত</span>
                    <span className="font-medium">৳ {p.paidAmount}</span>
                  </div>
                </div>

                {p.status === "UNPAID" && (
                  <Button
                    size="sm"
                    className="mt-3 bg-primary hover:bg-primary text-white"
                    onClick={() => handlePay(p.id)}
                  >
                    Pay
                  </Button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
