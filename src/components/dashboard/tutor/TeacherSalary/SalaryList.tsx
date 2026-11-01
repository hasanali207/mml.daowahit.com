"use client";

import {
  Award,
  Baby,
  Briefcase,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  GraduationCap,
  Heart,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Fragment, useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// ─── Types (mirrors teacher.service.ts response shapes) ───────────────────────

type SalaryStatus = "PAID" | "UNPAID" | "PARTIAL";
type AdjType = "BONUS" | "DEDUCTION";
type UserStatus = "ACTIVE" | "BLOCKED" | "DELETED";

type SalaryDetail = {
  id: string;
  month: number;
  year: number;
  baseSalary: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: SalaryStatus;
  createdAt: string;
};

type Address = {
  id: number;
  division: string;
  district: string;
  thana: string;
  postOffice: string;
  village: string;
};

type Education = {
  id: string;
  degree: string;
  institute: string;
  board?: string | null;
  passingYear?: string | null;
  result?: string | null;
};

type Experience = {
  id: string;
  institute: string;
  designation: string;
  fromDate?: string | null;
  toDate?: string | null;
  description?: string | null;
};

type Certificate = {
  id: string;
  title: string;
  fileUrl: string;
  createdAt: string;
};

type SalaryDeduction = {
  id: string;
  title: string;
  amount: number;
};

// Minimal shape — what the search list (getAllTeacherfromDb) returns
type TeacherBasic = {
  id: string;
  code: string;
  name: string;
  designation?: string | null;
  mobile1?: string | null;
  email?: string | null;
  profilePicture?: string | null;
  TeacherSalary: SalaryDetail[];
};

// Full shape — what getByIdFromDB returns
type TeacherProfile = TeacherBasic & {
  mobile2?: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  NIDNO?: string | null;
  qualification?: string | null;
  jimmadarClass?: string | null;
  joinDate?: string | null;
  dateOfBirth?: string | null;
  maritalStatus?: string | null;
  spouseName?: string | null;
  childrenCount?: number | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  annualLeaveDays?: number | null;
  presentAddress?: Address | null;
  permanentAddress?: Address | null;
  user: { username: string; role: string; userStatus: UserStatus };
  education: Education[];
  experience: Experience[];
  certificates: Certificate[];
  salaryDeductions: SalaryDeduction[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_API}/api/v1`;

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

const STATUS_CFG: Record<SalaryStatus, { label: string; className: string }> = {
  PAID: { label: "সম্পূর্ণ", className: "bg-primary text-white" },
  PARTIAL: { label: "আংশিক", className: "bg-gray-600 text-white" },
  UNPAID: { label: "বাকি", className: "bg-red-600 text-white" },
};

const USER_STATUS_CFG: Record<
  UserStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "সক্রিয়",
    className: "bg-green-100 text-green-700 border-green-300",
  },
  BLOCKED: {
    label: "ব্লকড",
    className: "bg-amber-100 text-amber-700 border-amber-300",
  },
  DELETED: {
    label: "নিষ্ক্রিয়",
    className: "bg-red-100 text-red-700 border-red-300",
  },
};

// ─── Formatters ─────────────────────────────────────────────────────────────

const money = (n?: number | null) =>
  `৳ ${Number(n || 0).toLocaleString("bn-BD")}`;
const bn = (n?: number | null) => Number(n || 0).toLocaleString("bn-BD");
const fmtDate = (d?: string | null) =>
  d
    ? new Date(d).toLocaleDateString("bn-BD", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";
const fmtAddress = (a?: Address | null) =>
  a
    ? [a.village, a.postOffice, a.thana, a.district, a.division]
        .filter(Boolean)
        .join(", ")
    : "যোগ করা হয়নি";

// ─── Small building blocks ─────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white dark:bg-zinc-900 shadow-sm p-5 ${className}`}
    >
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}

function Avatar({ src, name }: { src?: string | null; name: string }) {
  const initials = name?.trim()?.slice(0, 2) || "?";
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        className="h-20 w-20 rounded-full object-cover border"
      />
    );
  }
  return (
    <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold border">
      {initials}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function TeacherProfilePage() {
  const [code, setCode] = useState("");
  const [teacher, setTeacher] = useState<TeacherBasic | null>(null);
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [searchErr, setSearchErr] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [payModal, setPayModal] = useState<SalaryDetail | null>(null);
  const [adjModal, setAdjModal] = useState<SalaryDetail | null>(null);

  // ── Search teacher by code (matches getAllTeacherfromDb) ───────────────────
  async function searchTeacher(searchCode = code) {
    const trimmed = searchCode.trim();
    if (!trimmed) return;
    setLoading(true);
    setSearchErr("");
    setTeacher(null);
    setProfile(null);

    try {
      const res = await fetch(
        `${BASE_URL}/teacher/?code=${encodeURIComponent(trimmed)}`,
      );
      if (!res.ok) throw new Error("সার্ভার থেকে সাড়া পাওয়া যায়নি");

      const json = await res.json();
      let found: TeacherBasic | null = null;

      if (Array.isArray(json)) {
        found =
          json.find(
            (t: TeacherBasic) =>
              t.code?.toLowerCase() === trimmed.toLowerCase(),
          ) ?? null;
      } else if (json?.data && Array.isArray(json.data)) {
        found =
          json.data.find(
            (t: TeacherBasic) =>
              t.code?.toLowerCase() === trimmed.toLowerCase(),
          ) ?? null;
      } else if (json?.id) {
        found = json as TeacherBasic;
      }

      if (!found) {
        setSearchErr(`"${trimmed}" কোডের কোনো শিক্ষক পাওয়া যায়নি`);
      } else {
        setTeacher(found);
        setExpanded(null);
        setRecent((prev) =>
          [trimmed, ...prev.filter((r) => r !== trimmed)].slice(0, 5),
        );
        fetchProfile(found.id);
      }
    } catch (err: unknown) {
      setSearchErr(
        err instanceof Error ? err.message : "সার্ভার থেকে সাড়া পাওয়া যায়নি",
      );
    } finally {
      setLoading(false);
    }
  }

  // ── Fetch full profile (matches getByIdFromDB) ─────────────────────────────
  async function fetchProfile(id: string) {
    setProfileLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/teacher/${id}`);
      if (!res.ok) throw new Error("প্রোফাইল লোড করা যায়নি");
      const json = await res.json();
      const data: TeacherProfile = json?.data ?? json;
      setProfile(data);
    } catch {
      // প্রোফাইল লোড ব্যর্থ হলে বেসিক তথ্য ও বেতন টেবিল দিয়েই কাজ চালানো হবে
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }

  async function refreshTeacher() {
    if (!teacher) return;
    await searchTeacher(teacher.code);
  }

  const person = profile ?? teacher; // header info can render before full profile arrives
  const salaryList = (profile ?? teacher)?.TeacherSalary ?? [];
  const latestSalary = [...salaryList].sort(
    (a, b) => b.year - a.year || b.month - a.month,
  )[0];
  const totalDeductions =
    profile?.salaryDeductions?.reduce((s, d) => s + d.amount, 0) ?? 0;

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4 bangla">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* ── Page Header ── */}
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            শিক্ষক প্রোফাইল ও বেতন
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            কোড দিয়ে শিক্ষক খুঁজুন — সম্পূর্ণ প্রোফাইল, ছুটি, শিক্ষাগত তথ্য ও
            বেতন পরিচালনা করুন
          </p>
        </div>

        {/* ── Search Bar ── */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                className="pl-9 h-10"
                placeholder="শিক্ষক কোড লিখুন (যেমন: 112235)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchTeacher()}
              />
            </div>
            <Button
              className="h-10 px-5 gap-2"
              onClick={() => searchTeacher()}
              disabled={loading || !code.trim()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {loading ? "খোঁজা হচ্ছে" : "খুঁজুন"}
            </Button>
          </div>

          {searchErr && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="text-sm">
                {searchErr}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {person && (
          <>
            {/* ── Profile Header ── */}
            <div className="bg-white dark:bg-zinc-900 border rounded-xl p-6 flex flex-col md:flex-row md:items-center gap-5 justify-between">
              <div className="flex items-center gap-4">
                <Avatar src={person.profilePicture} name={person.name} />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {person.name}
                    </p>
                    {profile?.user?.userStatus && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border font-medium ${USER_STATUS_CFG[profile.user.userStatus].className}`}
                      >
                        {USER_STATUS_CFG[profile.user.userStatus].label}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-800">
                      {person.designation || "পদবি নেই"}
                    </span>
                    <span className="font-mono text-gray-400">
                      #{person.code}
                    </span>
                    {person.mobile1 && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} /> {person.mobile1}
                      </span>
                    )}
                    {person.email && (
                      <span className="flex items-center gap-1">
                        <Mail size={12} /> {person.email}
                      </span>
                    )}
                    {profile?.joinDate && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> যোগদান{" "}
                        {fmtDate(profile.joinDate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Latest salary snapshot */}
              {latestSalary && (
                <div className="flex items-center gap-6 md:border-l md:pl-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      সর্বশেষ বেতন ({MONTHS[latestSalary.month - 1]},{" "}
                      {latestSalary.year})
                    </p>
                    <p className="text-xl font-bold text-blue-600">
                      {money(latestSalary.totalAmount)}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_CFG[latestSalary.status].className}`}
                  >
                    {STATUS_CFG[latestSalary.status].label}
                  </span>
                </div>
              )}
            </div>

            {profileLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" /> প্রোফাইলের
                বিস্তারিত তথ্য লোড হচ্ছে...
              </div>
            )}

            {profile && (
              <>
                {/* ── Family / Personal + Leave ── */}
                <div className="grid md:grid-cols-3 gap-5">
                  <SectionCard
                    title="পারিবারিক তথ্য"
                    icon={<Heart size={16} className="text-primary" />}
                    className="md:col-span-2"
                  >
                    <div className="grid sm:grid-cols-2 gap-x-6">
                      <InfoRow label="পিতার নাম" value={profile.fatherName} />
                      <InfoRow label="মাতার নাম" value={profile.motherName} />
                      <InfoRow
                        label="বৈবাহিক অবস্থা"
                        value={profile.maritalStatus}
                      />
                      <InfoRow label="স্ত্রীর নাম" value={profile.spouseName} />
                      <InfoRow
                        label="সন্তান সংখ্যা"
                        value={
                          profile.childrenCount != null
                            ? bn(profile.childrenCount)
                            : "—"
                        }
                      />
                      <InfoRow label="NID নম্বর" value={profile.NIDNO} />
                      <InfoRow
                        label="জন্ম তারিখ"
                        value={fmtDate(profile.dateOfBirth)}
                      />
                      <InfoRow
                        label="শিক্ষাগত সনদ"
                        value={profile.qualification}
                      />
                    </div>
                    {(profile.emergencyContactName ||
                      profile.emergencyContactPhone) && (
                      <>
                        <Separator className="my-3" />
                        <div className="flex items-center gap-2 text-sm">
                          <ShieldAlert size={14} className="text-amber-600" />
                          <span className="text-muted-foreground">
                            জরুরি যোগাযোগ:
                          </span>
                          <span className="font-medium">
                            {profile.emergencyContactName || "—"}
                            {profile.emergencyContactPhone
                              ? ` · ${profile.emergencyContactPhone}`
                              : ""}
                          </span>
                        </div>
                      </>
                    )}
                  </SectionCard>

                  <SectionCard
                    title="ছুটির কোটা"
                    icon={<Baby size={16} className="text-primary" />}
                  >
                    <div className="flex flex-col items-center justify-center h-full py-2">
                      <p className="text-3xl font-bold text-primary">
                        {bn(profile.annualLeaveDays ?? 20)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        বার্ষিক অনুমোদিত ছুটির দিন
                      </p>
                    </div>
                  </SectionCard>
                </div>

                {/* ── Address ── */}
                <div className="grid md:grid-cols-2 gap-5">
                  <SectionCard
                    title="বর্তমান ঠিকানা"
                    icon={<MapPin size={16} className="text-primary" />}
                  >
                    <p className="text-sm">
                      {fmtAddress(profile.presentAddress)}
                    </p>
                  </SectionCard>
                  <SectionCard
                    title="স্থায়ী ঠিকানা"
                    icon={<MapPin size={16} className="text-primary" />}
                  >
                    <p className="text-sm">
                      {fmtAddress(profile.permanentAddress)}
                    </p>
                  </SectionCard>
                </div>

                {/* ── Education & Experience ── */}
                <div className="grid md:grid-cols-2 gap-5">
                  <SectionCard
                    title="শিক্ষাগত যোগ্যতা"
                    icon={<GraduationCap size={16} className="text-primary" />}
                  >
                    {profile.education.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        কোনো তথ্য যোগ করা হয়নি
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {profile.education.map((e) => (
                          <li
                            key={e.id}
                            className="text-sm border-b last:border-0 pb-2 last:pb-0"
                          >
                            <p className="font-medium">{e.degree}</p>
                            <p className="text-xs text-muted-foreground">
                              {e.institute}
                              {e.board ? ` · ${e.board}` : ""}
                              {e.passingYear ? ` · ${e.passingYear}` : ""}
                              {e.result ? ` · ফলাফল: ${e.result}` : ""}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </SectionCard>

                  <SectionCard
                    title="কর্ম অভিজ্ঞতা"
                    icon={<Briefcase size={16} className="text-primary" />}
                  >
                    {profile.experience.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        কোনো তথ্য যোগ করা হয়নি
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {profile.experience.map((e) => (
                          <li
                            key={e.id}
                            className="text-sm border-b last:border-0 pb-2 last:pb-0"
                          >
                            <p className="font-medium">
                              {e.designation} — {e.institute}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {fmtDate(e.fromDate)} –{" "}
                              {e.toDate ? fmtDate(e.toDate) : "বর্তমান"}
                            </p>
                            {e.description && (
                              <p className="text-xs mt-0.5">{e.description}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </SectionCard>
                </div>

                {/* ── Certificates & Recurring Deductions ── */}
                <div className="grid md:grid-cols-2 gap-5">
                  <SectionCard
                    title="সনদপত্র"
                    icon={<Award size={16} className="text-primary" />}
                  >
                    {profile.certificates.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        কোনো সনদ আপলোড করা হয়নি
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {profile.certificates.map((c) => (
                          <a
                            key={c.id}
                            href={c.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border bg-muted/40 hover:bg-muted"
                          >
                            <FileText size={12} /> {c.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </SectionCard>

                  <SectionCard
                    title="স্থায়ী বেতন কর্তন"
                    icon={<TrendingDown size={16} className="text-red-500" />}
                  >
                    {profile.salaryDeductions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        কোনো নির্ধারিত কর্তন নেই
                      </p>
                    ) : (
                      <>
                        <ul className="space-y-1.5">
                          {profile.salaryDeductions.map((d) => (
                            <li
                              key={d.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-muted-foreground">
                                {d.title}
                              </span>
                              <span className="font-medium text-red-500">
                                − {money(d.amount)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <Separator className="my-2" />
                        <div className="flex items-center justify-between text-sm font-semibold">
                          <span>মোট কর্তন</span>
                          <span className="text-red-600">
                            − {money(totalDeductions)}
                          </span>
                        </div>
                      </>
                    )}
                  </SectionCard>
                </div>
              </>
            )}

            {/* ── Salary Ledger ── */}
            <SectionCard
              title="মাসিক বেতন কাঠামো"
              icon={<Wallet size={16} className="text-primary" />}
            >
              {salaryList.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  কোনো বেতন এন্ট্রি পাওয়া যায়নি
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-gray-100 dark:bg-zinc-800 text-xs text-gray-600 dark:text-gray-300 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left border-r">মাস</th>
                        <th className="px-4 py-3 text-right border-r">
                          মূল বেতন
                        </th>
                        <th className="px-4 py-3 text-right border-r">
                          সমন্বয়
                        </th>
                        <th className="px-4 py-3 text-right border-r">
                          মোট বেতন
                        </th>
                        <th className="px-4 py-3 text-right border-r">
                          পরিশোধিত
                        </th>
                        <th className="px-4 py-3 text-right border-r">
                          বকেয়া
                        </th>
                        <th className="px-4 py-3 text-center border-r">
                          স্ট্যাটাস
                        </th>
                        <th className="px-4 py-3 text-right">একশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[...salaryList]
                        .sort((a, b) => b.year - a.year || b.month - a.month)
                        .map((s, i) => {
                          const cfg = STATUS_CFG[s.status];
                          const isExpanded = expanded === s.id;
                          const adjustment = s.totalAmount - s.baseSalary;

                          return (
                            <Fragment key={s.id}>
                              <tr
                                className={`border-b transition ${i % 2 === 0 ? "bg-white dark:bg-zinc-900" : "bg-gray-50 dark:bg-zinc-800/50"} hover:bg-blue-50 dark:hover:bg-zinc-800`}
                              >
                                <td className="px-4 py-3 border-r">
                                  {MONTHS[s.month - 1]}, {s.year}
                                </td>
                                <td className="px-4 py-3 text-right border-r">
                                  {money(s.baseSalary)}
                                </td>
                                <td
                                  className={`px-4 py-3 text-right border-r font-medium ${adjustment > 0 ? "text-green-600" : adjustment < 0 ? "text-red-500" : "text-muted-foreground"}`}
                                >
                                  {adjustment === 0
                                    ? "—"
                                    : `${adjustment > 0 ? "+" : "−"} ${money(Math.abs(adjustment))}`}
                                </td>
                                <td className="px-4 py-3 text-right border-r font-semibold">
                                  {money(s.totalAmount)}
                                </td>
                                <td className="px-4 py-3 text-right border-r text-green-600">
                                  {money(s.paidAmount)}
                                </td>
                                <td className="px-4 py-3 text-right border-r text-red-500">
                                  {money(s.dueAmount)}
                                </td>
                                <td className="px-4 py-3 text-center border-r">
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${cfg.className}`}
                                  >
                                    {cfg.label}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex justify-end gap-2">
                                    {s.status !== "PAID" && (
                                      <button
                                        onClick={() => setPayModal(s)}
                                        className="px-3 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
                                      >
                                        Pay
                                      </button>
                                    )}
                                    <button
                                      onClick={() => setAdjModal(s)}
                                      className="px-3 py-1 text-xs rounded-md border hover:bg-gray-100 dark:hover:bg-zinc-700"
                                    >
                                      Adjust
                                    </button>
                                    <button
                                      onClick={() =>
                                        setExpanded(isExpanded ? null : s.id)
                                      }
                                      className="p-1.5 border rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700"
                                    >
                                      {isExpanded ? (
                                        <ChevronUp size={16} />
                                      ) : (
                                        <ChevronDown size={16} />
                                      )}
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {isExpanded && (
                                <tr className="bg-gray-50 dark:bg-zinc-800">
                                  <td
                                    colSpan={8}
                                    className="px-4 py-4 border-t"
                                  >
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                                      <div className="border rounded-lg p-3 bg-white dark:bg-zinc-900">
                                        <p className="text-xs text-gray-400">
                                          মূল বেতন
                                        </p>
                                        <p className="font-semibold">
                                          {money(s.baseSalary)}
                                        </p>
                                      </div>
                                      <div className="border rounded-lg p-3 bg-white dark:bg-zinc-900">
                                        <p className="text-xs text-gray-400 flex items-center gap-1">
                                          {adjustment >= 0 ? (
                                            <TrendingUp size={12} />
                                          ) : (
                                            <TrendingDown size={12} />
                                          )}{" "}
                                          সমন্বয়
                                        </p>
                                        <p
                                          className={`font-semibold ${adjustment > 0 ? "text-green-600" : adjustment < 0 ? "text-red-500" : ""}`}
                                        >
                                          {adjustment === 0
                                            ? "নেই"
                                            : money(Math.abs(adjustment))}
                                        </p>
                                      </div>
                                      <div className="border rounded-lg p-3 bg-white dark:bg-zinc-900">
                                        <p className="text-xs text-gray-400">
                                          মোট বেতন
                                        </p>
                                        <p className="font-semibold text-blue-600">
                                          {money(s.totalAmount)}
                                        </p>
                                      </div>
                                      <div className="border rounded-lg p-3 bg-white dark:bg-zinc-900">
                                        <p className="text-xs text-gray-400">
                                          পরিশোধিত
                                        </p>
                                        <p className="font-semibold text-green-600">
                                          {money(s.paidAmount)}
                                        </p>
                                      </div>
                                      <div className="border rounded-lg p-3 bg-white dark:bg-zinc-900">
                                        <p className="text-xs text-gray-400">
                                          বকেয়া
                                        </p>
                                        <p className="font-semibold text-red-500">
                                          {money(s.dueAmount)}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </>
        )}
      </div>

      <PaymentModal
        salary={payModal}
        teacherName={person?.name}
        onClose={() => setPayModal(null)}
        onSuccess={async () => {
          setPayModal(null);
          await refreshTeacher();
        }}
      />

      <AdjustmentModal
        salary={adjModal}
        teacherName={person?.name}
        baseSalary={adjModal?.baseSalary}
        onClose={() => setAdjModal(null)}
        onSuccess={async () => {
          setAdjModal(null);
          await refreshTeacher();
        }}
      />
    </div>
  );
}

// ─── Payment Modal ────────────────────────────────────────────────────────────

function PaymentModal({
  salary,
  teacherName,
  onClose,
  onSuccess,
}: {
  salary: SalaryDetail | null;
  teacherName?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!salary) {
      setAmount("");
      setNote("");
      setError("");
    }
  }, [salary]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!salary) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("সঠিক পরিমাণ লিখুন");
      return;
    }
    if (parsedAmount > salary.dueAmount) {
      setError(`বকেয়ার বেশি দেওয়া যাবে না (সর্বোচ্চ ৳${salary.dueAmount})`);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/teachersalary/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salaryId: salary.id,
          amount: parsedAmount,
          ...(note.trim() && { note: note.trim() }),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { message?: string })?.message || "পেমেন্ট ব্যর্থ হয়েছে",
        );
      }
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "পেমেন্ট ব্যর্থ হয়েছে");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={!!salary} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">Receive Payment</DialogTitle>
        </DialogHeader>

        {salary && (
          <form onSubmit={submit} className="space-y-5 pt-1">
            <div className="rounded-lg bg-muted/50 border px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Due</span>
              <span className="text-lg font-bold text-primary">
                {money(salary.dueAmount)}
              </span>
            </div>

            <div className="rounded-lg bg-muted/50 border px-4 py-3 flex items-center gap-3">
              <div>
                <p className="text-sm font-medium">{teacherName}</p>
                <p className="text-xs text-muted-foreground">
                  {MONTHS[salary.month - 1]}, {salary.year}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Label className="text-sm">
                Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min={1}
                max={salary.dueAmount}
                step="any"
                placeholder="0.00"
                className="h-10"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              {salary.dueAmount > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(salary.dueAmount))}
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  + সম্পূর্ণ বকেয়া পরিশোধ ({money(salary.dueAmount)})
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Note</Label>
              <textarea
                rows={2}
                placeholder="কোনো নোট থাকলে লিখুন..."
                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {error && (
              <Alert variant="destructive" className="py-2">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1 cursor-pointer"
                onClick={onClose}
                disabled={loading}
              >
                Close
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-500 cursor-pointer"
                disabled={loading || !amount}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {loading ? "Processing..." : "Save Changes"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Adjustment Modal ─────────────────────────────────────────────────────────

function AdjustmentModal({
  salary,
  teacherName,
  baseSalary,
  onClose,
  onSuccess,
}: {
  salary: SalaryDetail | null;
  teacherName?: string;
  baseSalary?: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [adjType, setAdjType] = useState<AdjType>("BONUS");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!salary) {
      setAmount("");
      setNote("");
      setError("");
      setAdjType("BONUS");
    }
  }, [salary]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!salary) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("সঠিক পরিমাণ লিখুন");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/teachersalary/adjustment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salaryId: salary.id,
          type: adjType,
          amount: parsedAmount,
          ...(note.trim() && { note: note.trim() }),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { message?: string })?.message || "Adjustment ব্যর্থ হয়েছে",
        );
      }
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Adjustment ব্যর্থ হয়েছে");
    } finally {
      setLoading(false);
    }
  }

  const TYPE_STYLE = {
    BONUS: {
      active: "border-green-700 bg-primary text-white shadow-md",
      inactive: "border-gray-300 text-gray-700 hover:bg-secondary",
    },
    DEDUCTION: {
      active: "border-red-700 bg-red-500 text-white shadow-md",
      inactive: "border-gray-300 text-gray-700 hover:bg-red-100",
    },
  };

  return (
    <Dialog open={!!salary} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">Salary Adjustment</DialogTitle>
        </DialogHeader>

        {salary && (
          <form onSubmit={submit} className="space-y-5 pt-1">
            <div className="rounded-lg border px-4 py-3">
              <p className="font-medium text-sm">{teacherName}</p>
              <p className="text-xs text-muted-foreground">
                {MONTHS[salary.month - 1]}, {salary.year} · মূল বেতন{" "}
                {money(baseSalary ?? salary.baseSalary)}
              </p>
            </div>

            <div>
              <Label className="text-sm mb-1 block">
                ধরন <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjType("BONUS")}
                  className={`flex items-center justify-center gap-2 rounded-lg border p-2 text-sm font-medium transition-all cursor-pointer ${
                    adjType === "BONUS"
                      ? TYPE_STYLE.BONUS.active
                      : TYPE_STYLE.BONUS.inactive
                  }`}
                >
                  <TrendingUp className="h-4 w-4" /> বোনাস
                </button>
                <button
                  type="button"
                  onClick={() => setAdjType("DEDUCTION")}
                  className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-all cursor-pointer ${
                    adjType === "DEDUCTION"
                      ? TYPE_STYLE.DEDUCTION.active
                      : TYPE_STYLE.DEDUCTION.inactive
                  }`}
                >
                  <TrendingDown className="h-4 w-4" /> কর্তন
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">
                Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min={1}
                step="any"
                placeholder="0.00"
                className="h-10 w-full"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Note</Label>
              <textarea
                rows={2}
                placeholder="কারণ লিখুন (ঐচ্ছিক)..."
                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {error && (
              <Alert variant="destructive" className="py-2">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1 cursor-pointer"
                onClick={onClose}
                disabled={loading}
              >
                Close
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-500 cursor-pointer"
                disabled={loading || !amount}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {loading ? "Processing..." : "Save Changes"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
