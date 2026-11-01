"use client";

import {
  ArrowLeft,
  CreditCard,
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// ─── Types ─────────────────────────
type SalaryStatus = "PAID" | "UNPAID" | "PARTIAL";
type AdjType = "BONUS" | "DEDUCTION";

type SalaryDetail = {
  id: string;
  month: number;
  year: number;
  baseSalary: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: SalaryStatus;
  teacher: {
    name: string;
    code: string;
    designation: string;
  };
};

// ─── Constants ─────────────────────
const BASE_URL = "http://localhost:5000/api/v1";

const MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

const STATUS = {
  PAID: { label: "পরিশোধিত", color: "bg-emerald-500" },
  PARTIAL: { label: "আংশিক", color: "bg-amber-500" },
  UNPAID: { label: "বকেয়া", color: "bg-red-500" },
};

// ─── Component ─────────────────────
export default function SalaryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [salary, setSalary] = useState<SalaryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [payAmount, setPayAmount] = useState("");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjType, setAdjType] = useState<AdjType>("BONUS");

  const [payLoading, setPayLoading] = useState(false);
  const [adjLoading, setAdjLoading] = useState(false);

  // ── Fetch ────────────────────────
  async function fetchSalary() {
    setLoading(true);
    const res = await fetch(`${BASE_URL}/teachersalary/${id}`);
    const json = await res.json();
    setSalary(json.data);
    setLoading(false);
  }

  useEffect(() => {
    fetchSalary();
  }, [id]);

  const percent = useMemo(() => {
    if (!salary) return 0;
    return Math.round((salary.paidAmount / salary.totalAmount) * 100);
  }, [salary]);

  // ── Payment ──────────────────────
  async function handlePay(e: any) {
    e.preventDefault();
    setPayLoading(true);

    await fetch(`${BASE_URL}/teachersalary/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salaryId: id, amount: Number(payAmount) }),
    });

    setPayAmount("");
    fetchSalary();
    setPayLoading(false);
  }

  // ── Adjustment ───────────────────
  async function handleAdjustment(e: any) {
    e.preventDefault();
    setAdjLoading(true);

    await fetch(`${BASE_URL}/teachersalary/adjustment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salaryId: id,
        type: adjType,
        amount: Number(adjAmount),
      }),
    });

    setAdjAmount("");
    fetchSalary();
    setAdjLoading(false);
  }

  if (loading || !salary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <Button variant="outline" onClick={fetchSalary}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Teacher Card */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold">
              {salary.teacher.name[0]}
            </div>

            <div>
              <p className="font-semibold text-lg">{salary.teacher.name}</p>
              <p className="text-xs text-muted-foreground">
                {salary.teacher.designation}
              </p>
              <p className="text-xs">
                {MONTHS[salary.month - 1]}, {salary.year}
              </p>
            </div>

            <Badge className="ml-auto">{STATUS[salary.status].label}</Badge>
          </div>

          <Separator />

          {/* Amount Boxes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Box label="মূল" value={salary.baseSalary} />
            <Box label="মোট" value={salary.totalAmount} bold />
            <Box label="পরিশোধিত" value={salary.paidAmount} />
            <Box label="বকেয়া" value={salary.dueAmount} color="text-red-500" />
          </div>

          {/* Progress */}
          <div className="h-2 bg-muted rounded">
            <div
              className={`${STATUS[salary.status].color} h-full`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Adjustment */}
      <Card>
        <CardHeader>
          <CardTitle>বোনাস / কর্তন</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <form onSubmit={handleAdjustment} className="space-y-3">
            {/* Type */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={adjType === "BONUS" ? "default" : "outline"}
                onClick={() => setAdjType("BONUS")}
              >
                <TrendingUp className="h-4 w-4" /> বোনাস
              </Button>

              <Button
                type="button"
                variant={adjType === "DEDUCTION" ? "default" : "outline"}
                onClick={() => setAdjType("DEDUCTION")}
              >
                <TrendingDown className="h-4 w-4" /> কর্তন
              </Button>
            </div>

            {/* Amount */}
            <div>
              <Label>পরিমাণ</Label>
              <Input
                type="number"
                value={adjAmount}
                onChange={(e) => setAdjAmount(e.target.value)}
              />
            </div>

            <Button disabled={adjLoading} className="w-full">
              {adjLoading ? "..." : "যোগ করুন"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Payment */}
      <Card>
        <CardHeader>
          <CardTitle>পেমেন্ট</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <form onSubmit={handlePay} className="space-y-3">
            <Label>পরিমাণ</Label>
            <Input
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
            />

            <Button
              type="button"
              variant="outline"
              onClick={() => setPayAmount(String(salary.dueAmount))}
            >
              পুরো বকেয়া দিন
            </Button>

            <Button disabled={payLoading} className="w-full">
              <CreditCard className="h-4 w-4" />
              {payLoading ? "..." : "পেমেন্ট করুন"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Small Component ─────────────────

function Box({ label, value, bold, color }: any) {
  return (
    <div className="border rounded-lg p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm ${bold ? "font-bold" : ""} ${color || ""}`}>
        ৳ {value}
      </p>
    </div>
  );
}
