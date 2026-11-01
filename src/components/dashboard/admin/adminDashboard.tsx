"use client";

import api from "@/lib/axios";
import { useAcademicInfo } from "@/lib/useAcademicInfo";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  HandCoins,
  HeartHandshake,
  Loader2,
  RefreshCw,
  Users,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type DashboardData = {
  generatedAt: string;
  people: {
    students: number;
    teachers: number;
    donors: number;
    borrowers: number;
    activeUsers: number;
  };
  academics: {
    classes: number;
    activeSessions: number;
    pendingAdmissions: number;
    upcomingExams: Array<{
      id: string;
      examName: string;
      startDate: string;
      status: string;
      class: { name: string };
    }>;
  };
  attendance: {
    studentsRecordedToday: number;
    teachersRecordedToday: number;
    present: number;
    absent: number;
    late: number;
  };
  finance: {
    currency: string;
    collection: number;
    studentCollections: number;
    donations: number;
    monthlyDonations: number;
    approvedIncome: number;
    approvedExpense: number;
    incomeMinusExpense: number;
    pendingIncome: { amount: number; count: number };
    pendingExpense: { amount: number; count: number };
    pendingSalaryDue: number;
  };
  loans: {
    total: number;
    active: number;
    totalInstallments: number;
    paidInstallments: number;
    outstanding: number;
  };
  monthlyDonors: number;
  pendingLeaves: number;
  pendingComplaints: number;
  recent: {
    transactions: Array<{
      id: string;
      totalAmount: number;
      method: string;
      receivedAt: string;
      roshidNo: string;
      source: string | null;
      student: { name: string; code: string } | null;
      monthlyDonor: {
        donor: { name: string; code: string };
      } | null;
    }>;
    income: Array<{
      id: string;
      date: string;
      amount: number;
      note: string | null;
      categoryName: string | null;
      status: string | null;
    }>;
    expenses: Array<{
      id: string;
      date: string;
      amount: number;
      note: string | null;
      categoryName: string | null;
      status: string | null;
    }>;
  };
};

type ChartMonth = {
  month: string;
  label: string;
  studentCollection: number;
  donations: number;
  income: number;
  expense: number;
  balance: number;
  newStudents: number;
  newTeachers: number;
};

const money = (value = 0) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(value);

const number = (value = 0) => new Intl.NumberFormat("en-BD").format(value);

const dateFormat = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  }).format(new Date(value));

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof Users;
  color: string;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </p>
        <h3 className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </h3>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      </div>
      <div className={`rounded-xl p-3 ${color}`}>
        <Icon size={22} />
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardData | null>(null);
  const [months, setMonths] = useState<ChartMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { info } = useAcademicInfo();
  const anyInfo = (info ?? {}) as Record<string, any>;
  const instituteName = anyInfo.name || "ইসলামী দাওয়াহ ইনস্টিটিউট";
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [summaryResponse, chartsResponse] = await Promise.all([
        api.get("/api/v1/dashboard/summary"),
        api.get("/api/v1/dashboard/charts"),
      ]);

      setSummary(summaryResponse.data.data);
      setMonths(chartsResponse.data.data.months ?? []);
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof err.message === "string"
          ? err.message
          : "Dashboard data could not be loaded.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const maxFinancialValue = Math.max(
    1,
    ...months.flatMap((month) => [month.income, month.expense]),
  );

  if (loading && !summary) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-blue-600" size={36} />
        <p className="text-sm text-slate-500">Loading dashboard data...</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center dark:border-red-900 dark:bg-slate-900">
        <AlertCircle className="mx-auto text-red-500" size={36} />
        <h2 className="mt-4 text-lg font-bold">Dashboard unavailable</h2>
        <p className="mt-2 text-sm text-slate-500">
          {error || "Please try again."}
        </p>
        <button
          onClick={() => void loadDashboard()}
          className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    );
  }

  const finance = summary.finance;

  return (
    <main className="min-h-screen space-y-7 bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">{instituteName}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Dashboard Overview
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            শিক্ষার্থী, একাডেমিক কার্যক্রম ও আর্থিক অবস্থার সারসংক্ষেপ।
          </p>
        </div>

        <button
          onClick={() => void loadDashboard()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-60 sm:self-auto dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Refresh failed. Showing the last successfully loaded data.
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Students"
          value={number(summary.people.students)}
          subtitle={`${number(summary.academics.pendingAdmissions)} pending admissions`}
          icon={GraduationCap}
          color="bg-blue-50 text-blue-600 dark:bg-blue-950"
        />
        <StatCard
          title="Active Teachers"
          value={number(summary.people.teachers)}
          subtitle={`${number(summary.academics.classes)} classes`}
          icon={Users}
          color="bg-violet-50 text-violet-600 dark:bg-violet-950"
        />
        <StatCard
          title="Total Donors"
          value={number(summary.people.donors)}
          subtitle={`${number(summary.monthlyDonors)} active monthly donors`}
          icon={HeartHandshake}
          color="bg-emerald-50 text-emerald-600 dark:bg-emerald-950"
        />
        <StatCard
          title="Monthly Collection"
          value={money(finance.collection)}
          subtitle="Current month receipts"
          icon={Wallet}
          color="bg-amber-50 text-amber-600 dark:bg-amber-950"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Financial Overview
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Approved income and expenses · Last 6 months
              </p>
            </div>
            <div className="flex gap-4 text-xs font-medium">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="h-2.5 w-2.5 rounded-sm bg-blue-600" />
                Income
              </span>
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="h-2.5 w-2.5 rounded-sm bg-rose-400" />
                Expense
              </span>
            </div>
          </div>

          <div className="mt-8 space-y-5">
            {months.map((month) => (
              <div key={month.month}>
                <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                  <span className="w-12 font-medium text-slate-600 dark:text-slate-300">
                    {month.label}
                  </span>
                  <span className="text-right text-slate-500">
                    {money(month.income)} / {money(month.expense)}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{
                        width: `${(month.income / maxFinancialValue) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-rose-400 transition-all"
                      style={{
                        width: `${(month.expense / maxFinancialValue) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {!months.length && (
              <p className="py-8 text-center text-sm text-slate-500">
                No chart data available.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Financial Summary
          </h2>
          <p className="mt-1 text-sm text-slate-500">Current month</p>

          <div className="mt-6 space-y-5">
            {[
              {
                title: "Student collections",
                value: finance.studentCollections,
                icon: BookOpen,
              },
              {
                title: "Donations",
                value: finance.donations,
                icon: HeartHandshake,
              },
              {
                title: "Monthly donations",
                value: finance.monthlyDonations,
                icon: HandCoins,
              },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <item.icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-500">{item.title}</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {money(item.value)}
                  </p>
                </div>
              </div>
            ))}

            <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
              <p className="text-sm text-slate-500">Approved income</p>
              <p className="mt-1 text-lg font-bold text-emerald-600">
                {money(finance.approvedIncome)}
              </p>
              <p className="mt-4 text-sm text-slate-500">Approved expenses</p>
              <p className="mt-1 text-lg font-bold text-rose-500">
                {money(finance.approvedExpense)}
              </p>
              <p className="mt-4 text-sm text-slate-500">
                Income minus expenses
              </p>
              <p
                className={`mt-1 text-lg font-bold ${
                  finance.incomeMinusExpense >= 0
                    ? "text-emerald-600"
                    : "text-rose-500"
                }`}
              >
                {money(finance.incomeMinusExpense)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today's Present"
          value={number(summary.attendance.present)}
          subtitle={`${number(summary.attendance.late)} late records`}
          icon={CheckCircle2}
          color="bg-emerald-50 text-emerald-600 dark:bg-emerald-950"
        />
        <StatCard
          title="Today's Absence"
          value={number(summary.attendance.absent)}
          subtitle={`${number(summary.attendance.studentsRecordedToday)} student attendance records`}
          icon={Activity}
          color="bg-rose-50 text-rose-600 dark:bg-rose-950"
        />
        <StatCard
          title="Loan Outstanding"
          value={money(summary.loans.outstanding)}
          subtitle={`${number(summary.loans.active)} active loans`}
          icon={HandCoins}
          color="bg-orange-50 text-orange-600 dark:bg-orange-950"
        />
        <StatCard
          title="Pending Tasks"
          value={number(summary.pendingLeaves + summary.pendingComplaints)}
          subtitle={`${number(summary.pendingLeaves)} leaves · ${number(summary.pendingComplaints)} complaints`}
          icon={CalendarDays}
          color="bg-violet-50 text-violet-600 dark:bg-violet-950"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">
                Recent Transactions
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Latest payment receipts
              </p>
            </div>
            <Wallet className="text-blue-600" size={21} />
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {summary.recent.transactions.map((transaction) => {
              const person =
                transaction.student?.name ??
                transaction.monthlyDonor?.donor?.name ??
                transaction.source?.replaceAll("_", " ") ??
                "Transaction";

              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {person}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Receipt: {transaction.roshidNo} ·{" "}
                      {dateFormat(transaction.receivedAt)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-emerald-600">
                    {money(transaction.totalAmount)}
                  </p>
                </div>
              );
            })}
            {!summary.recent.transactions.length && (
              <p className="p-8 text-center text-sm text-slate-500">
                No transactions found.
              </p>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">
                Upcoming Exams
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Scheduled academic activities
              </p>
            </div>
            <CalendarDays className="text-violet-600" size={21} />
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {summary.academics.upcomingExams.map((exam) => (
              <div key={exam.id} className="flex gap-3 p-4">
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                  <span className="text-lg font-bold leading-none">
                    {new Date(exam.startDate).toLocaleDateString("en-US", {
                      day: "2-digit",
                      timeZone: "Asia/Dhaka",
                    })}
                  </span>
                  <span className="mt-1 text-[10px]">
                    {new Date(exam.startDate).toLocaleDateString("en-US", {
                      month: "short",
                      timeZone: "Asia/Dhaka",
                    })}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {exam.examName}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Class: {exam.class.name}
                  </p>
                  <span className="mt-2 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {exam.status}
                  </span>
                </div>
              </div>
            ))}
            {!summary.academics.upcomingExams.length && (
              <p className="p-8 text-center text-sm text-slate-500">
                No upcoming exams.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-950">
              <ArrowDownRight size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pending income approvals</p>
              <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                {money(finance.pendingIncome.amount)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {number(finance.pendingIncome.count)} entries awaiting review
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-50 p-3 text-rose-600 dark:bg-rose-950">
              <ArrowUpRight size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">
                Pending expense approvals
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                {money(finance.pendingExpense.amount)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {number(finance.pendingExpense.count)} entries awaiting review
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="pb-2 text-center text-xs text-slate-400">
        Dashboard data · Asia/Dhaka
        {summary.generatedAt
          ? ` · Updated ${new Date(summary.generatedAt).toLocaleTimeString(
              "en-BD",
              {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Dhaka",
              },
            )}`
          : ""}
      </footer>
    </main>
  );
}
