"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function DuePaymentsPage() {
  const [data, setData] = useState<any[]>([]);
  const router = useRouter();

  const fetchDuePayments = async () => {
    const res = await api.get("/paymentreport/due");
    setData(res.data.data);
  };

  useEffect(() => {
    fetchDuePayments();
  }, []);

  const receiveCash = async (paymentId: string) => {
    if (!confirm("Receive cash for this payment?")) return;

    await api.post(`/paymentreport/handcash/${paymentId}`);
    toast.success("Cash received");
    fetchDuePayments();
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Due Payments</h1>

      {data.map((p) => (
        <Card key={p.id}>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="font-medium">{p.student.name}</p>
              <p className="text-sm text-gray-500">
                {p.month} {p.year}
              </p>
            </div>

            <div className="flex gap-4 items-center">
              <p className="font-semibold">
                ৳{p.items.reduce((s: number, i: any) => s + i.amount, 0)}
              </p>

              <Button onClick={() => receiveCash(p.id)}>Receive Cash</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
