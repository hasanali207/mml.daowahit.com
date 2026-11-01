"use client";

import axios from "@/lib/axios";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  Clock,
  CreditCard,
  Crown,
  History,
  Loader2,
  Package,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

/* =========================================================
   TYPES
========================================================= */

type PlanType = "BASIC" | "STANDARD" | "PROFESSIONAL" | "ENTERPRISE";

type BillingCycle = "MONTHLY" | "YEARLY" | "TWO_YEARS";

type Plan = {
  id: string;
  name: string;
  type: PlanType;
  monthlyPrice: number;
  yearlyPrice: number;
  twoYearPrice: number;
  maxStudents: number;
  maxTeachers: number;
  maxDonors: number;
  maxTijarah: number;
  isActive: boolean;
};

type Subscription = {
  id: string;
  planId: string;
  plan: Plan;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  billingCycle: BillingCycle;
  startedAt: string;
  expiresAt: string | null;
  extraStudents: number;
};

type UsageItem = {
  current: number;
  limit: number;
  remaining: number;
};

type Usage = {
  student?: UsageItem;
  students?: UsageItem;
  teacher?: UsageItem;
  teachers?: UsageItem;
  donor?: UsageItem;
  donors?: UsageItem;
  tijarah?: UsageItem;
};

type Payment = {
  id: string;
  planType: PlanType;
  type: "SUBSCRIPTION" | "CAPACITY_ADDON";
  billingCycle: BillingCycle | null;
  extraStudents: number;
  amount: number;
  currency: string;
  status: "PENDING" | "PAID" | "FAILED" | "CANCELLED";
  transactionId: string | null;
  paymentMethod: string | null;
  provider?: string | null;
  paidAt: string | null;
  createdAt: string;
};

type CustomerInfo = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
};

const BILLING_OPTIONS: {
  value: BillingCycle;
  label: string;
  shortLabel: string;
}[] = [
  {
    value: "MONTHLY",
    label: "Monthly",
    shortLabel: "1 month",
  },
  {
    value: "YEARLY",
    label: "Yearly",
    shortLabel: "1 year",
  },
  {
    value: "TWO_YEARS",
    label: "2 Years",
    shortLabel: "2 years",
  },
];

const PLAN_DESCRIPTIONS: Record<PlanType, string> = {
  BASIC: "For small institutions getting started.",
  STANDARD: "For growing institutions and teams.",
  PROFESSIONAL: "For established institutions with more students.",
  ENTERPRISE: "For large institutions with higher capacity needs.",
};

const PLAN_STYLES: Record<
  PlanType,
  { icon: typeof Zap; color: string; button: string }
> = {
  BASIC: {
    icon: Zap,
    color: "border-slate-200",
    button: "bg-slate-900 hover:bg-slate-800",
  },
  STANDARD: {
    icon: Users,
    color: "border-blue-200",
    button: "bg-blue-600 hover:bg-blue-700",
  },
  PROFESSIONAL: {
    icon: Crown,
    color: "border-violet-300",
    button: "bg-violet-600 hover:bg-violet-700",
  },
  ENTERPRISE: {
    icon: Sparkles,
    color: "border-amber-300",
    button: "bg-amber-600 hover:bg-amber-700",
  },
};

/* =========================================================
   HELPERS
========================================================= */

function unwrap<T>(response: any): T {
  return response?.data?.data ?? response?.data;
}

function money(value: number | string | null | undefined) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function dateLabel(value?: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getPlanPrice(plan: Plan, cycle: BillingCycle) {
  switch (cycle) {
    case "MONTHLY":
      return Number(plan.monthlyPrice ?? 0);
    case "YEARLY":
      return Number(plan.yearlyPrice ?? 0);
    case "TWO_YEARS":
      return Number(plan.twoYearPrice ?? 0);
    default:
      return 0;
  }
}

function getCycleLabel(cycle: BillingCycle) {
  return (
    BILLING_OPTIONS.find((option) => option.value === cycle)?.label ?? cycle
  );
}

function getUsageItem(
  usage: Usage | null,
  key: "student" | "teacher" | "donor" | "tijarah",
): UsageItem | undefined {
  if (!usage) return undefined;

  if (key === "student") return usage.student ?? usage.students;
  if (key === "teacher") return usage.teacher ?? usage.teachers;
  if (key === "donor") return usage.donor ?? usage.donors;

  return usage.tijarah;
}

function formatLimit(limit: number) {
  return limit === -1 ? "Unlimited" : limit.toLocaleString();
}

function usagePercentage(item?: UsageItem) {
  if (!item || item.limit === -1) return 0;
  if (item.limit <= 0) return item.current > 0 ? 100 : 0;

  return Math.min(100, Math.round((item.current / item.limit) * 100));
}

function getApiError(error: any) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errorMessages?.[0]?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

function getPaymentStatus(status: Payment["status"]) {
  switch (status) {
    case "PAID":
      return {
        label: "Paid",
        icon: BadgeCheck,
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "PENDING":
      return {
        label: "Pending",
        icon: Clock,
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    case "FAILED":
      return {
        label: "Failed",
        icon: XCircle,
        className: "bg-red-50 text-red-700 border-red-200",
      };
    default:
      return {
        label: "Cancelled",
        icon: XCircle,
        className: "bg-slate-100 text-slate-600 border-slate-200",
      };
  }
}

/* =========================================================
   PAGE
========================================================= */

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [billingCycle, setBillingCycle] = useState<BillingCycle>("YEARLY");

  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [extraStudents, setExtraStudents] = useState("0");

  const [customer, setCustomer] = useState<CustomerInfo>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<
    "SUBSCRIPTION" | "CAPACITY_ADDON"
  >("SUBSCRIPTION");

  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentLimit] = useState(10);
  const [paymentTotal, setPaymentTotal] = useState(0);

  const activeSubscription =
    subscription?.status === "ACTIVE" &&
    subscription.expiresAt &&
    new Date(subscription.expiresAt).getTime() > Date.now()
      ? subscription
      : null;

  const currentPlan = activeSubscription?.plan ?? null;

  const selectedPlanData = useMemo(
    () => plans.find((plan) => plan.type === selectedPlan) ?? null,
    [plans, selectedPlan],
  );

  const selectedPrice = selectedPlanData
    ? getPlanPrice(selectedPlanData, billingCycle)
    : 0;

  const parsedExtraStudents = Math.floor(Number(extraStudents));

  const safeExtraStudents =
    Number.isFinite(parsedExtraStudents) && parsedExtraStudents > 0
      ? Math.min(parsedExtraStudents, 100000)
      : 0;

  const addonCheckoutPrice = useMemo(() => {
    // The backend remains authoritative for the final amount.
    // Replace this with a server-returned add-on price if your
    // subscription usage/plans endpoint exposes one.
    return null as number | null;
  }, []);

  const loadData = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const [
          plansResponse,
          subscriptionResponse,
          usageResponse,
          historyResponse,
        ] = await Promise.allSettled([
          axios.get("/api/v1/subscription/plans"),
          axios.get("/api/v1/subscription/current"),
          axios.get("/api/v1/subscription/usage"),
          axios.get(
            `/api/v1/subscription/history?page=${paymentPage}&limit=${paymentLimit}`,
          ),
        ]);

        if (plansResponse.status === "fulfilled") {
          const data = unwrap<Plan[]>(plansResponse.value);
          setPlans(Array.isArray(data) ? data : []);
        } else {
          throw plansResponse.reason;
        }

        if (subscriptionResponse.status === "fulfilled") {
          const data = unwrap<Subscription | null>(subscriptionResponse.value);
          setSubscription(data ?? null);
        } else {
          // A user without a subscription may receive 403 from this endpoint.
          setSubscription(null);
        }

        if (usageResponse.status === "fulfilled") {
          const responseData = unwrap<any>(usageResponse.value);

          setUsage(responseData?.usage ?? null);
        } else {
          setUsage(null);
        }

        if (historyResponse.status === "fulfilled") {
          const raw = historyResponse.value?.data;
          const data = raw?.data ?? raw;

          setPayments(Array.isArray(data) ? data : []);
          setPaymentTotal(Number(raw?.meta?.total ?? data?.meta?.total ?? 0));
        } else {
          setPayments([]);
          setPaymentTotal(0);
        }
      } catch (error) {
        toast.error(getApiError(error));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [paymentPage, paymentLimit],
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!currentPlan) return;

    // Prefer the current plan when the user opens the add-on section.
    setExtraStudents((current) => current || "0");
  }, [currentPlan?.id]);

  const choosePlan = (plan: Plan) => {
    setCheckoutMode("SUBSCRIPTION");
    setSelectedPlan(plan.type);
    setBillingCycle((current) => current || "YEARLY");

    document
      .getElementById("checkout-section")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const startCheckout = async () => {
    if (!customer.customerName.trim()) {
      toast.error("Please enter the customer name.");
      return;
    }

    if (!customer.customerEmail.trim()) {
      toast.error("Please enter the customer email.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.customerEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (!customer.customerPhone.trim()) {
      toast.error("Please enter the customer phone number.");
      return;
    }

    if (checkoutMode === "SUBSCRIPTION" && !selectedPlanData) {
      toast.error("Please select a subscription plan.");
      return;
    }

    if (checkoutMode === "CAPACITY_ADDON") {
      if (!activeSubscription) {
        toast.error(
          "An active subscription is required for a capacity add-on.",
        );
        return;
      }

      if (safeExtraStudents < 1) {
        toast.error("Enter at least one additional student.");
        return;
      }
    }

    try {
      setCheckoutLoading(true);

      const payload = {
        planType:
          checkoutMode === "CAPACITY_ADDON"
            ? activeSubscription!.plan.type
            : selectedPlanData!.type,
        billingCycle:
          checkoutMode === "CAPACITY_ADDON"
            ? activeSubscription!.billingCycle
            : billingCycle,
        extraStudents:
          checkoutMode === "CAPACITY_ADDON" ? safeExtraStudents : 0,
        customerName: customer.customerName.trim(),
        customerEmail: customer.customerEmail.trim(),
        customerPhone: customer.customerPhone.trim(),
      };

      const response = await axios.post(
        "/api/v1/subscriptionPayment/checkout",
        payload,
      );

      const result = unwrap<{ checkoutUrl?: string }>(response);

      if (!result?.checkoutUrl) {
        throw new Error("Checkout URL was not returned by the server.");
      }

      // Redirect to the gateway URL returned by the backend.
      // Never activate a subscription from the frontend.
      window.location.assign(result.checkoutUrl);
    } catch (error) {
      toast.error(getApiError(error));
      setCheckoutLoading(false);
    }
  };

  const startAddonCheckout = () => {
    if (!activeSubscription) {
      toast.error("You need an active subscription first.");
      return;
    }

    setCheckoutMode("CAPACITY_ADDON");
    setSelectedPlan(activeSubscription.plan.type);

    document
      .getElementById("checkout-section")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const usageRows = [
    {
      key: "student" as const,
      label: "Students",
      icon: Users,
      description: "Student records",
    },
    {
      key: "teacher" as const,
      label: "Teachers",
      icon: Users,
      description: "Teacher accounts",
    },
    {
      key: "donor" as const,
      label: "Donors",
      icon: Wallet,
      description: "Donor records",
    },
    {
      key: "tijarah" as const,
      label: "Tijarah",
      icon: Package,
      description: "Tijarah / borrower records",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-36 animate-pulse rounded-2xl bg-white" />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50/80">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* PAGE HEADER */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
              <CreditCard className="h-4 w-4" />
              Account billing
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Subscription & Billing
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
              Manage your plan, monitor resource usage and review your payments.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => void loadData(true)}
            disabled={refreshing}
            className="w-full gap-2 sm:w-auto"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* CURRENT SUBSCRIPTION */}
        <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-blue-600 via-violet-500 to-indigo-500" />

          <CardContent className="p-5 sm:p-7">
            {activeSubscription && currentPlan ? (
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge className="border-0 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                      <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                      Active subscription
                    </Badge>

                    <Badge variant="outline">
                      {getCycleLabel(activeSubscription.billingCycle)}
                    </Badge>
                  </div>

                  <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                    {currentPlan.name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {PLAN_DESCRIPTIONS[currentPlan.type]}
                  </p>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                        <CalendarDays className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Started on</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {dateLabel(activeSubscription.startedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-violet-50 p-2.5 text-violet-600">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Expires on</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {dateLabel(activeSubscription.expiresAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 lg:min-w-56">
                  <p className="text-sm text-slate-500">
                    Current plan capacity
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {formatLimit(
                      currentPlan.maxStudents === -1
                        ? -1
                        : currentPlan.maxStudents +
                            (activeSubscription.extraStudents ?? 0),
                    )}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">Students</p>

                  <Button
                    onClick={startAddonCheckout}
                    className="mt-5 w-full gap-2"
                    variant="outline"
                  >
                    <Users className="h-4 w-4" />
                    Add capacity
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Badge className="border-0 bg-amber-50 text-amber-700 hover:bg-amber-50">
                    No active subscription
                  </Badge>

                  <h2 className="mt-3 text-xl font-bold text-slate-900">
                    Choose a plan to get started
                  </h2>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    Select a subscription below to unlock the resource capacity
                    your institution needs. Existing data remains intact when a
                    subscription expires.
                  </p>
                </div>

                <Button
                  onClick={() =>
                    document
                      .getElementById("plans-section")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="gap-2"
                >
                  View plans
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* USAGE */}
        <section className="space-y-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-slate-900">Resource usage</h2>
            <p className="text-sm text-slate-500">
              Track the resources used by your institution.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {usageRows.map((row) => {
              const item = getUsageItem(usage, row.key);
              const Icon = row.icon;
              const unlimited = item?.limit === -1;
              const percentage = usagePercentage(item);

              return (
                <Card
                  key={row.key}
                  className="rounded-2xl border-slate-200/80 shadow-sm"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                        <Icon className="h-5 w-5" />
                      </div>

                      <Badge variant="outline" className="font-normal">
                        {unlimited ? "Unlimited" : `${percentage}% used`}
                      </Badge>
                    </div>

                    <p className="mt-4 text-sm font-medium text-slate-500">
                      {row.label}
                    </p>

                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-slate-900">
                        {item?.current?.toLocaleString() ?? "—"}
                      </span>
                      <span className="text-sm text-slate-400">
                        / {item ? formatLimit(item.limit) : "—"}
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                      {item
                        ? unlimited
                          ? "No capacity limit"
                          : `${Math.max(
                              0,
                              item.remaining ?? item.limit - item.current,
                            ).toLocaleString()} remaining`
                        : "Usage information unavailable"}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* PLANS */}
        <section id="plans-section" className="scroll-mt-6 space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                Choose your plan
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Compare capacities and select a billing period.
              </p>
            </div>

            <div className="w-full sm:w-52">
              <Label className="mb-2 block text-xs text-slate-500">
                Billing period
              </Label>
              <Select
                value={billingCycle}
                onValueChange={(value) =>
                  setBillingCycle(value as BillingCycle)
                }
              >
                <SelectTrigger className="h-11 bg-white">
                  <SelectValue placeholder="Select billing period" />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {plans.length === 0 ? (
            <Card className="rounded-2xl border-dashed">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <Package className="h-10 w-10 text-slate-300" />
                <p className="mt-4 font-semibold text-slate-800">
                  No subscription plans available
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Please try refreshing or contact your administrator.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {plans.map((plan) => {
                const style = PLAN_STYLES[plan.type];
                const Icon = style.icon;
                const price = getPlanPrice(plan, billingCycle);
                const isCurrent = currentPlan?.type === plan.type;
                const isSelected = selectedPlan === plan.type;

                return (
                  <Card
                    key={plan.id}
                    className={`relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                      style.color
                    } ${isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
                  >
                    {plan.type === "PROFESSIONAL" && (
                      <div className="absolute right-3 top-3">
                        <Badge className="border-0 bg-violet-100 text-violet-700 hover:bg-violet-100">
                          Popular
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="pb-3">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <Icon className="h-5 w-5" />
                      </div>

                      <CardTitle className="text-lg">{plan.name}</CardTitle>

                      <CardDescription className="min-h-10 text-sm leading-5">
                        {PLAN_DESCRIPTIONS[plan.type]}
                      </CardDescription>

                      <div className="pt-3">
                        <div className="flex flex-wrap items-baseline gap-1">
                          <span className="text-3xl font-bold tracking-tight text-slate-900">
                            {money(price)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          per{" "}
                          {BILLING_OPTIONS.find(
                            (option) => option.value === billingCycle,
                          )?.shortLabel ?? "billing period"}
                        </p>
                      </div>
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col">
                      <Separator className="mb-4" />

                      <div className="space-y-3 text-sm">
                        {[
                          {
                            label: "Students",
                            value: formatLimit(plan.maxStudents),
                          },
                          {
                            label: "Teachers",
                            value: formatLimit(plan.maxTeachers),
                          },
                          {
                            label: "Donors",
                            value: formatLimit(plan.maxDonors),
                          },
                          {
                            label: "Tijarah",
                            value: formatLimit(plan.maxTijarah),
                          },
                        ].map((feature) => (
                          <div
                            key={feature.label}
                            className="flex items-center justify-between gap-2"
                          >
                            <span className="text-slate-500">
                              {feature.label}
                            </span>
                            <span className="font-semibold text-slate-800">
                              {feature.value}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-auto pt-6">
                        {isCurrent ? (
                          <Button
                            disabled
                            variant="outline"
                            className="w-full gap-2"
                          >
                            <Check className="h-4 w-4" />
                            Current plan
                          </Button>
                        ) : (
                          <Button
                            onClick={() => choosePlan(plan)}
                            disabled={!plan.isActive}
                            className={`w-full gap-2 text-white ${style.button}`}
                          >
                            {isSelected ? "Selected" : "Choose plan"}
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <p className="text-xs leading-5 text-slate-500">
            All prices are shown in BDT. The backend calculates the final
            payable amount. A subscription becomes active only after successful
            payment verification.
          </p>
        </section>

        {/* CHECKOUT */}
        <section id="checkout-section" className="scroll-mt-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Checkout</h2>
            <p className="mt-1 text-sm text-slate-500">
              Confirm your details before continuing to SSLCommerz.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Customer information</CardTitle>
                <CardDescription>
                  These details are sent to the backend to create the checkout
                  session.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="customerName">Full name *</Label>
                    <Input
                      id="customerName"
                      autoComplete="name"
                      placeholder="Enter customer name"
                      value={customer.customerName}
                      onChange={(event) =>
                        setCustomer((current) => ({
                          ...current,
                          customerName: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email address *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      autoComplete="email"
                      placeholder="name@example.com"
                      value={customer.customerEmail}
                      onChange={(event) =>
                        setCustomer((current) => ({
                          ...current,
                          customerEmail: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Phone number *</Label>
                    <Input
                      id="customerPhone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="01XXXXXXXXX"
                      value={customer.customerPhone}
                      onChange={(event) =>
                        setCustomer((current) => ({
                          ...current,
                          customerPhone: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label>Payment type</Label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCheckoutMode("SUBSCRIPTION");
                        setSelectedPlan(currentPlan?.type ?? selectedPlan);
                      }}
                      className={`rounded-xl border p-4 text-left transition ${
                        checkoutMode === "SUBSCRIPTION"
                          ? "border-blue-500 bg-blue-50/60 ring-1 ring-blue-500"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <CreditCard className="mb-2 h-5 w-5 text-blue-600" />
                      <p className="text-sm font-semibold text-slate-900">
                        Subscription plan
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Subscribe or change your plan.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={startAddonCheckout}
                      disabled={!activeSubscription}
                      className={`rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        checkoutMode === "CAPACITY_ADDON"
                          ? "border-violet-500 bg-violet-50/60 ring-1 ring-violet-500"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <Users className="mb-2 h-5 w-5 text-violet-600" />
                      <p className="text-sm font-semibold text-slate-900">
                        Student capacity add-on
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Increase your student limit.
                      </p>
                    </button>
                  </div>
                </div>

                {checkoutMode === "SUBSCRIPTION" ? (
                  <div className="space-y-4 rounded-xl border border-slate-200 p-4">
                    <div className="space-y-2">
                      <Label>Selected plan</Label>
                      <Select
                        value={selectedPlan ?? ""}
                        onValueChange={(value) =>
                          setSelectedPlan(value as PlanType)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {plans
                            .filter((plan) => plan.isActive)
                            .map((plan) => (
                              <SelectItem key={plan.id} value={plan.type}>
                                {plan.name} —{" "}
                                {money(getPlanPrice(plan, billingCycle))}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Billing period</Label>
                      <Select
                        value={billingCycle}
                        onValueChange={(value) =>
                          setBillingCycle(value as BillingCycle)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BILLING_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 rounded-xl border border-violet-200 bg-violet-50/30 p-4">
                    <div>
                      <Label htmlFor="extraStudents">
                        Additional students *
                      </Label>
                      <Input
                        id="extraStudents"
                        className="mt-2 bg-white"
                        type="number"
                        min={1}
                        max={100000}
                        step={1}
                        value={extraStudents}
                        onChange={(event) =>
                          setExtraStudents(event.target.value)
                        }
                        placeholder="Enter number of additional students"
                      />
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        Your server calculates the final add-on price. The
                        amount shown by the backend is authoritative.
                      </p>
                    </div>

                    <div className="rounded-lg border border-violet-100 bg-white p-3">
                      <p className="text-sm text-slate-500">
                        Additional capacity requested
                      </p>
                      <p className="mt-1 text-xl font-bold text-slate-900">
                        {safeExtraStudents.toLocaleString()} students
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Current plan: {currentPlan?.name ?? "No active plan"}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ORDER SUMMARY */}
            <Card className="h-fit rounded-2xl border-slate-200 shadow-sm lg:sticky lg:top-6">
              <CardHeader>
                <CardTitle className="text-lg">Order summary</CardTitle>
                <CardDescription>
                  Review your selection before payment.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                    {checkoutMode === "CAPACITY_ADDON" ? (
                      <Users className="h-5 w-5" />
                    ) : (
                      <Crown className="h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">
                      {checkoutMode === "CAPACITY_ADDON"
                        ? "Student capacity add-on"
                        : (selectedPlanData?.name ?? "Select a plan")}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {checkoutMode === "CAPACITY_ADDON"
                        ? `${safeExtraStudents.toLocaleString()} additional students`
                        : getCycleLabel(billingCycle)}
                    </p>
                  </div>
                </div>

                <Separator />

                {checkoutMode === "SUBSCRIPTION" ? (
                  <>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-500">Plan</span>
                      <span className="font-medium text-slate-800">
                        {selectedPlanData?.name ?? "Not selected"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-500">Billing period</span>
                      <span className="font-medium text-slate-800">
                        {getCycleLabel(billingCycle)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-500">Students included</span>
                      <span className="font-medium text-slate-800">
                        {selectedPlanData
                          ? formatLimit(selectedPlanData.maxStudents)
                          : "—"}
                      </span>
                    </div>

                    <Separator />

                    <div className="flex items-end justify-between gap-3">
                      <span className="text-sm text-slate-500">Plan price</span>
                      <span className="text-xl font-bold text-slate-900">
                        {selectedPlanData ? money(selectedPrice) : "—"}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-500">Current plan</span>
                      <span className="font-medium text-slate-800">
                        {currentPlan?.name ?? "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-500">Extra students</span>
                      <span className="font-medium text-slate-800">
                        {safeExtraStudents.toLocaleString()}
                      </span>
                    </div>

                    <Separator />

                    <div className="space-y-1">
                      <p className="text-sm text-slate-500">
                        Final add-on price
                      </p>
                      <p className="text-xl font-bold text-slate-900">
                        {addonCheckoutPrice === null
                          ? "Calculated at checkout"
                          : money(addonCheckoutPrice)}
                      </p>
                    </div>
                  </>
                )}

                <Button
                  onClick={startCheckout}
                  disabled={
                    checkoutLoading ||
                    (checkoutMode === "SUBSCRIPTION" && !selectedPlanData) ||
                    (checkoutMode === "CAPACITY_ADDON" &&
                      (!activeSubscription || safeExtraStudents < 1))
                  }
                  className="h-11 w-full gap-2"
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating checkout...
                    </>
                  ) : (
                    <>
                      Continue to payment
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-xs leading-5 text-slate-500">
                    Secure checkout through SSLCommerz. Your subscription
                    changes only after the server verifies payment.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* PAYMENT HISTORY */}
        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Payment history
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review your subscription and capacity add-on transactions.
              </p>
            </div>

            <Badge variant="outline" className="w-fit bg-white">
              {paymentTotal} total transactions
            </Badge>
          </div>

          <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
            {payments.length === 0 ? (
              <CardContent className="flex flex-col items-center py-12 text-center">
                <div className="rounded-2xl bg-slate-100 p-4">
                  <History className="h-8 w-8 text-slate-400" />
                </div>
                <p className="mt-4 font-semibold text-slate-800">
                  No payment history yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Completed and pending transactions will appear here.
                </p>
              </CardContent>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="border-b bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-4 font-medium">Transaction</th>
                        <th className="px-5 py-4 font-medium">Description</th>
                        <th className="px-5 py-4 font-medium">Date</th>
                        <th className="px-5 py-4 font-medium">Amount</th>
                        <th className="px-5 py-4 font-medium">Status</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {payments.map((payment) => {
                        const status = getPaymentStatus(payment.status);
                        const StatusIcon = status.icon;

                        return (
                          <tr key={payment.id} className="hover:bg-slate-50/70">
                            <td className="px-5 py-4">
                              <p className="font-medium text-slate-800">
                                {payment.transactionId || "—"}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {payment.provider || "SSLCommerz"}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <p className="font-medium text-slate-800">
                                {payment.type === "CAPACITY_ADDON"
                                  ? "Student capacity add-on"
                                  : `${payment.planType} subscription`}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {payment.type === "CAPACITY_ADDON"
                                  ? `${payment.extraStudents} extra students`
                                  : payment.billingCycle
                                    ? getCycleLabel(payment.billingCycle)
                                    : "Subscription"}
                              </p>
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                              {dateLabel(payment.createdAt)}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                              {money(payment.amount)}
                            </td>

                            <td className="px-5 py-4">
                              <Badge
                                variant="outline"
                                className={status.className}
                              >
                                <StatusIcon className="mr-1 h-3.5 w-3.5" />
                                {status.label}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="divide-y divide-slate-100 md:hidden">
                  {payments.map((payment) => {
                    const status = getPaymentStatus(payment.status);
                    const StatusIcon = status.icon;

                    return (
                      <div key={payment.id} className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="break-all text-sm font-semibold text-slate-900">
                              {payment.type === "CAPACITY_ADDON"
                                ? "Student capacity add-on"
                                : `${payment.planType} subscription`}
                            </p>
                            <p className="mt-1 break-all text-xs text-slate-500">
                              {payment.transactionId || "No transaction ID"}
                            </p>
                          </div>

                          <Badge
                            variant="outline"
                            className={`shrink-0 ${status.className}`}
                          >
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {status.label}
                          </Badge>
                        </div>

                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <p className="text-xs text-slate-500">Date</p>
                            <p className="mt-1 text-sm text-slate-700">
                              {dateLabel(payment.createdAt)}
                            </p>
                          </div>

                          <p className="text-lg font-bold text-slate-900">
                            {money(payment.amount)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-3 border-t bg-slate-50/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">
                    Page {paymentPage} · Showing {payments.length} transactions
                  </p>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={paymentPage <= 1}
                      onClick={() => setPaymentPage((page) => page - 1)}
                    >
                      Previous
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        payments.length < paymentLimit ||
                        paymentPage * paymentLimit >= paymentTotal
                      }
                      onClick={() => setPaymentPage((page) => page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </section>

        {/* FOOTER NOTICE */}
        <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
          <Activity className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Subscription and payment security
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              A successful browser redirect alone does not confirm payment. The
              backend must verify the transaction with SSLCommerz before
              granting access or increasing capacity. Expired subscriptions
              should retain existing data while the backend blocks restricted
              operations according to your subscription rules.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
