"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { Copy, ImageIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
// লোকাল স্ট্যাটিক ডেটা — কোনো npm package বা API call নেই, build-এ bundle হয়ে যায়
import districtsData from "@/data/bd-districts.json";
import divisionsData from "@/data/bd-divisions.json";
import upazilasData from "@/data/bd-upazilas.json";
import api from "@/lib/axios";

// পদবি — কওমি মাদরাসার প্রচলিত দায়িত্ব/পদসমূহ
const DESIGNATIONS = [
  "মুহতামিম",
  "নায়েবে মুহতামিম",
  "শিক্ষা সচিব (নাযেমে তালীমাত)",
  "মুহাদ্দিস",
  "মুফতি",
  "মুফাসসিরে কুরআন",
  "কারী সাহেব (তাজবীদ শিক্ষক)",
  "হিফজ বিভাগের শিক্ষক",
  "নাজেরা বিভাগের শিক্ষক",
  "নূরানী বিভাগের শিক্ষক",
  "কিতাব বিভাগের উস্তাদ",
  "মুয়াল্লিম",
  "নিরাপত্তা প্রহরী/খাদেম",
];

// যোগ্যতা — দরসিয়াত স্তর অনুযায়ী
const QUALIFICATIONS = [
  "নূরানী উত্তীর্ণ",
  "নাজেরা সম্পন্ন",
  "হিফজুল কুরআন সম্পন্ন",
  "ইবতেদায়ী পাস",
  "মুতাওয়াসসিতা পাস",
  "সানাবিয়া উলইয়া পাস (দাখিল সমমান)",
  "ফযীলত পাস (স্নাতক সমমান)",
  "তাকমীল/দাওরায়ে হাদীস পাস (স্নাতকোত্তর সমমান)",
  "ইফতা সম্পন্ন",
  "সাধারণ শিক্ষা (এসএসসি/এইচএসসি/স্নাতক)",
];

// দায়িত্বপ্রাপ্ত শ্রেণি — মাদরাসার জামাতসমূহ
const MADRASA_CLASSES = [
  "নূরানী প্লে",
  "নূরানী নার্সারি",
  "নূরানী প্রথম",
  "নূরানী দ্বিতীয়",
  "নূরানী তৃতীয়",
  "নূরানী চতুর্থ",
  "নূরানী পঞ্চম",
  "মক্তব",
  "নাজেরা",
  "হিফজ বিভাগ",
  "বিশেষ জামাত (দরসিয়াত)",
  "মিজান জামাত",
  "নাহবেমীর জামাত (দরসিয়াত)",
];

// শিক্ষাগত যোগ্যতা এন্ট্রির "পরীক্ষার নাম" এর জন্য
const EDUCATION_LEVELS = [
  "নূরানী",
  "নাজেরা",
  "হিফজুল কুরআন",
  "ইবতেদায়ী",
  "মুতাওয়াসসিতা",
  "সানাবিয়া উলইয়া (দাখিল সমমান)",
  "ফযীলত (স্নাতক সমমান)",
  "তাকমীল/দাওরায়ে হাদীস (স্নাতকোত্তর সমমান)",
  "ইফতা",
  "এসএসসি",
  "এইচএসসি",
  "স্নাতক",
  "স্নাতকোত্তর",
];

// বোর্ড ফিল্ডের জন্য সাজেশন (datalist) — কওমি ও সাধারণ উভয় বোর্ড
const MADRASA_BOARDS = [
  "আল-হাইআতুল উলয়া লিল-জামিয়াতিল কওমিয়া বাংলাদেশ",
  "বেফাকুল মাদারিসিল আরাবিয়া বাংলাদেশ",
  "আঞ্জুমানে ইত্তেহাদুল মাদারিস বাংলাদেশ",
  "তানজীমুল মাদারিসিল কওমিয়া বাংলাদেশ",
  "গওহরডাঙ্গা মাদরাসা শিক্ষা বোর্ড",
  "জাতীয় দ্বীনি মাদরাসা শিক্ষা বোর্ড বাংলাদেশ",
  "মাদরাসা শিক্ষা বোর্ড, বাংলাদেশ (আলিয়া)",
  "বাংলাদেশ মাদরাসা শিক্ষা বোর্ড (আলিয়া)",
  "বাংলাদেশ কারিগরি শিক্ষা বোর্ড",
  "বাংলাদেশ বিশ্ববিদ্যালয়",
  "জাতীয় বিশ্ববিদ্যালয়",
];

const OTHER = "__other__";

/* ================= TYPES ================= */

type GeoItem = { id: string; name: string; bn_name: string };
type DistrictItem = GeoItem & { division_id: string };
type UpazilaItem = GeoItem & { district_id: string };

type AddressType = {
  divisionId: string;
  division: string;
  districtId: string;
  district: string;
  thanaId: string;
  thana: string;
  postOffice: string;
  village: string;
};

const emptyAddress: AddressType = {
  divisionId: "",
  division: "",
  districtId: "",
  district: "",
  thanaId: "",
  thana: "",
  postOffice: "",
  village: "",
};

type EducationEntry = {
  id: string;
  degree: string;
  institute: string;
  board: string;
  passingYear: string;
  result: string;
};

type ExperienceEntry = {
  id: string;
  institute: string;
  designation: string;
  fromDate: string;
  toDate: string;
  description: string;
};

type CertificateEntry = {
  id: string;
  title: string;
  file: File | null;
  preview: string | null;
};

type DeductionEntry = {
  id: string;
  title: string;
  amount: number;
};

type TeacherFormType = {
  username: string;
  password: string;

  code: string;
  name: string;
  designation: string;
  qualification: string;
  jimmadarClass: string;

  joinDate: string;
  dateOfBirth: string;

  fatherName: string;
  motherName: string;
  NIDNO: string;

  email: string;
  mobile1: string;
  mobile2: string;
  basicSalary?: number;

  presentAddress: AddressType;
  permanentAddress: AddressType;

  // ================= পারিবারিক জীবন =================
  maritalStatus: string;
  spouseName: string;
  childrenCount: number;
  emergencyContactName: string;
  emergencyContactPhone: string;

  // ================= শিক্ষাগত যোগ্যতা =================
  education: EducationEntry[];

  // ================= অভিজ্ঞতা =================
  experience: ExperienceEntry[];

  // ================= সনদ =================
  certificates: CertificateEntry[];

  // ================= বেতন কর্তন =================
  deductions: DeductionEntry[];

  // ================= ছুটি (শুরুর ব্যালেন্স) =================
  annualLeaveDays: number;
};

type AddressFieldProps = {
  base: "presentAddress" | "permanentAddress";
  form: TeacherFormType;
  handleChange: (path: string, value: string) => void;
};

/* ================= পুনর্ব্যবহারযোগ্য: তালিকা থেকে নির্বাচন অথবা নিজে লিখুন ================= */

function SelectOrCustomField({
  label,
  value,
  options,
  onChange,
  required = false,
  placeholder = "নির্বাচন করুন",
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  const isKnown = options.includes(value);
  const [customMode, setCustomMode] = useState(!isKnown && value !== "");

  return (
    <div className="flex flex-col">
      <label className="mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {!customMode ? (
        <Select
          value={isKnown ? value : ""}
          onValueChange={(v) => {
            if (v === OTHER) {
              setCustomMode(true);
              onChange("");
            } else {
              onChange(v);
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-lg z-50">
            {options.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
            <SelectItem value={OTHER}>অন্যান্য (নিজে লিখুন)</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="লিখুন"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setCustomMode(false);
              onChange("");
            }}
          >
            তালিকা থেকে
          </Button>
        </div>
      )}
    </div>
  );
}

/* ================= ADDRESS FIELDS (local data, no fetch) ================= */

const AddressFields = ({ base, form, handleChange }: AddressFieldProps) => {
  const addressObj = form[base];
  const fieldClass = "w-full border rounded px-3 py-2 text-lg";

  const divisions = useMemo(
    () => (divisionsData as { divisions: GeoItem[] }).divisions,
    [],
  );

  const districts = useMemo(() => {
    if (!addressObj.divisionId) return [];
    return (districtsData as { districts: DistrictItem[] }).districts.filter(
      (d) => d.division_id === addressObj.divisionId,
    );
  }, [addressObj.divisionId]);

  const thanas = useMemo(() => {
    if (!addressObj.districtId) return [];
    return (upazilasData as { upazilas: UpazilaItem[] }).upazilas.filter(
      (t) => t.district_id === addressObj.districtId,
    );
  }, [addressObj.districtId]);

  return (
    <div className="mt-2 grid grid-cols-1 gap-4 bangla">
      {/* ================= DIVISION ================= */}
      <div className="flex flex-col">
        <label className="mb-1">
          বিভাগ <span className="text-red-500">*</span>
        </label>
        <Select
          value={addressObj.divisionId}
          onValueChange={(id) => {
            const name = divisions.find((d) => d.id === id)?.bn_name || "";
            handleChange(`${base}.divisionId`, id);
            handleChange(`${base}.division`, name);
            handleChange(`${base}.districtId`, "");
            handleChange(`${base}.district`, "");
            handleChange(`${base}.thanaId`, "");
            handleChange(`${base}.thana`, "");
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="বিভাগ নির্বাচন করুন" />
          </SelectTrigger>
          <SelectContent className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-lg z-50">
            {divisions.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.bn_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ================= DISTRICT ================= */}
      <div className="flex flex-col bangla">
        <label className="mb-1">
          জেলা <span className="text-red-500">*</span>
        </label>
        <Select
          value={addressObj.districtId}
          onValueChange={(id) => {
            const name = districts.find((d) => d.id === id)?.bn_name || "";
            handleChange(`${base}.districtId`, id);
            handleChange(`${base}.district`, name);
            handleChange(`${base}.thanaId`, "");
            handleChange(`${base}.thana`, "");
          }}
          disabled={!districts.length}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="জেলা নির্বাচন করুন" />
          </SelectTrigger>
          <SelectContent className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-lg z-50">
            {districts.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.bn_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ================= THANA ================= */}
      <div className="flex flex-col bangla">
        <label className="mb-1">
          থানা/উপজেলা <span className="text-red-500">*</span>
        </label>
        <Select
          value={addressObj.thanaId}
          onValueChange={(id) => {
            const name = thanas.find((t) => t.id === id)?.bn_name || "";
            handleChange(`${base}.thanaId`, id);
            handleChange(`${base}.thana`, name);
          }}
          disabled={!thanas.length}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="থানা/উপজেলা নির্বাচন করুন" />
          </SelectTrigger>
          <SelectContent className="w-full text-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-lg z-50">
            {thanas.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.bn_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ================= POST OFFICE ================= */}
      <div className="flex flex-col bangla">
        <label className="mb-1">
          পোস্ট অফিস <span className="text-red-500">*</span>
        </label>
        <Input
          className={fieldClass}
          value={addressObj.postOffice}
          onChange={(e) => handleChange(`${base}.postOffice`, e.target.value)}
        />
      </div>

      {/* ================= VILLAGE ================= */}
      <div className="flex flex-col bangla">
        <label className="mb-1">
          গ্রাম/মহল্লা <span className="text-red-500">*</span>
        </label>
        <Input
          className={fieldClass}
          value={addressObj.village}
          onChange={(e) => handleChange(`${base}.village`, e.target.value)}
        />
      </div>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */

export default function TeacherForm() {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("ছবি যুক্ত করুন");

  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const [form, setForm] = useState<TeacherFormType>({
    username: "",
    password: "123456",

    code: "",
    name: "",
    designation: "",
    qualification: "",
    jimmadarClass: "",

    joinDate: "",
    dateOfBirth: "",

    fatherName: "",
    motherName: "",
    NIDNO: "",

    email: "",
    mobile1: "",
    mobile2: "",
    basicSalary: 0,

    presentAddress: { ...emptyAddress },
    permanentAddress: { ...emptyAddress },

    maritalStatus: "",
    spouseName: "",
    childrenCount: 0,
    emergencyContactName: "",
    emergencyContactPhone: "",

    education: [],
    experience: [],
    certificates: [],
    deductions: [],
    annualLeaveDays: 20,
  });

  /* ================= STATS / NEXT CODE ================= */

  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const res = await api.get("/api/v1/teacher/teacherstats");

      setStats(res.data.data);

      setForm((prev) => ({
        ...prev,
        code: res.data.data.nextCode,
        username: res.data.data.nextCode,
      }));
    };

    fetchStats();
  }, []);

  /* ================= GENERIC CHANGE HANDLER ================= */

  const handleChange = (path: string, value: any) => {
    if (path.includes(".")) {
      const [parent, key] = path.split(".");
      setForm((prev) => ({
        ...prev,
        [parent]: { ...(prev as any)[parent], [key]: value },
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [path]: value,
      }));
    }
  };

  const copyPresentToPermanent = () =>
    setForm((prev) => ({
      ...prev,
      permanentAddress: { ...prev.presentAddress },
    }));

  // backend-এ শুধু আসল ফিল্ডগুলো (divisionId/districtId/thanaId বাদে) পাঠানোর জন্য
  const cleanAddress = (addr: AddressType, type: "PRESENT" | "PERMANENT") => {
    const { divisionId, districtId, thanaId, ...rest } = addr;
    return { ...rest, type };
  };

  const generateId = () => {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  };
  /* ================= EDUCATION HELPERS ================= */

  const addEducation = () =>
    setForm((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          id: generateId(),
          degree: "",
          institute: "",
          board: "",
          passingYear: "",
          result: "",
        },
      ],
    }));

  const updateEducation = (
    id: string,
    key: keyof EducationEntry,
    value: string,
  ) =>
    setForm((prev) => ({
      ...prev,
      education: prev.education.map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
    }));

  const removeEducation = (id: string) =>
    setForm((prev) => ({
      ...prev,
      education: prev.education.filter((item) => item.id !== id),
    }));

  /* ================= EXPERIENCE HELPERS ================= */

  const addExperience = () =>
    setForm((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          id: generateId(),
          institute: "",
          designation: "",
          fromDate: "",
          toDate: "",
          description: "",
        },
      ],
    }));

  const updateExperience = (
    id: string,
    key: keyof ExperienceEntry,
    value: string,
  ) =>
    setForm((prev) => ({
      ...prev,
      experience: prev.experience.map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
    }));

  const removeExperience = (id: string) =>
    setForm((prev) => ({
      ...prev,
      experience: prev.experience.filter((item) => item.id !== id),
    }));

  /* ================= CERTIFICATE HELPERS ================= */

  const addCertificate = () =>
    setForm((prev) => ({
      ...prev,
      certificates: [
        ...prev.certificates,
        { id: generateId(), title: "", file: null, preview: null },
      ],
    }));

  const updateCertificateTitle = (id: string, title: string) =>
    setForm((prev) => ({
      ...prev,
      certificates: prev.certificates.map((item) =>
        item.id === id ? { ...item, title } : item,
      ),
    }));

  const updateCertificateFile = (id: string, file: File) =>
    setForm((prev) => ({
      ...prev,
      certificates: prev.certificates.map((item) =>
        item.id === id
          ? { ...item, file, preview: URL.createObjectURL(file) }
          : item,
      ),
    }));

  const removeCertificate = (id: string) =>
    setForm((prev) => {
      const target = prev.certificates.find((c) => c.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return {
        ...prev,
        certificates: prev.certificates.filter((item) => item.id !== id),
      };
    });

  /* ================= DEDUCTION HELPERS ================= */

  const addDeduction = () =>
    setForm((prev) => ({
      ...prev,
      deductions: [
        ...prev.deductions,
        { id: generateId(), title: "", amount: 0 },
      ],
    }));

  const updateDeduction = (
    id: string,
    key: keyof DeductionEntry,
    value: string | number,
  ) =>
    setForm((prev) => ({
      ...prev,
      deductions: prev.deductions.map((item) =>
        item.id === id ? { ...item, [key]: value } : item,
      ),
    }));

  const removeDeduction = (id: string) =>
    setForm((prev) => ({
      ...prev,
      deductions: prev.deductions.filter((item) => item.id !== id),
    }));

  const totalDeductions = useMemo(
    () => form.deductions.reduce((sum, d) => sum + Number(d.amount || 0), 0),
    [form.deductions],
  );

  const netSalary = useMemo(
    () => Number(form.basicSalary || 0) - totalDeductions,
    [form.basicSalary, totalDeductions],
  );

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.username || !form.password || !form.name || !form.code) {
      toast.error("ইউজারনেম, পাসওয়ার্ড, নাম ও কোড আবশ্যক");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      const fileInput = document.getElementById(
        "profilePicture",
      ) as HTMLInputElement;

      if (fileInput?.files?.[0]) {
        formData.append("file", fileInput.files[0]);
      }

      // প্রতিটা certificate ফাইল আলাদা key তে যোগ হবে
      form.certificates.forEach((cert) => {
        if (cert.file) {
          formData.append("certificateFiles", cert.file, cert.file.name);
        }
      });

      formData.append(
        "data",
        JSON.stringify({
          username: form.username,
          password: form.password,
          teacher: {
            ...form,
            presentAddress: cleanAddress(form.presentAddress, "PRESENT"),
            permanentAddress: cleanAddress(form.permanentAddress, "PERMANENT"),
            // ফাইল object JSON-এ পাঠানো যাবে না, শুধু title পাঠাও
            certificates: form.certificates.map((c) => ({ title: c.title })),
          },
        }),
      );

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/teacher`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.message || "সার্ভার ত্রুটি");
        return;
      }

      toast.success("🎉 শিক্ষক সফলভাবে যুক্ত হয়েছে");

      const newNextCode = String(Number(stats.nextCode) + 1);

      setForm({
        username: newNextCode,
        password: "123456",
        code: newNextCode,
        name: "",
        designation: "",
        qualification: "",
        jimmadarClass: "",
        joinDate: "",
        dateOfBirth: "",
        fatherName: "",
        motherName: "",
        NIDNO: "",
        email: "",
        mobile1: "",
        mobile2: "",
        basicSalary: 0,
        presentAddress: { ...emptyAddress },
        permanentAddress: { ...emptyAddress },
        maritalStatus: "",
        spouseName: "",
        childrenCount: 0,
        emergencyContactName: "",
        emergencyContactPhone: "",
        education: [],
        experience: [],
        certificates: [],
        deductions: [],
        annualLeaveDays: 20,
      });

      setFileName("ছবি যুক্ত করুন");
      setPreview(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6"
    >
      <Card className="max-w-7xl mx-auto">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 bangla">
            <div>
              <h1 className="text-3xl font-bold">শিক্ষক নিবন্ধন</h1>
              <p className="text-muted-foreground mt-1">
                নতুন শিক্ষক নিবন্ধনের জন্য নিচের তথ্যগুলো পূরণ করুন
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle>ব্যক্তিগত তথ্য</CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="নাম"
                      value={form.name}
                      onChange={(v) => handleChange("name", v)}
                    />

                    <InputField
                      label="পিতার নাম"
                      value={form.fatherName}
                      onChange={(v) => handleChange("fatherName", v)}
                    />

                    <InputField
                      label="মাতার নাম"
                      value={form.motherName}
                      onChange={(v) => handleChange("motherName", v)}
                    />

                    <InputField
                      label="জন্ম তারিখ"
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(v) => handleChange("dateOfBirth", v)}
                    />

                    <InputField
                      label="NID"
                      value={form.NIDNO}
                      onChange={(v) => handleChange("NIDNO", v)}
                    />

                    <InputField
                      label="ইমেইল"
                      value={form.email}
                      onChange={(v) => handleChange("email", v)}
                    />

                    <InputField
                      label="মোবাইল ১"
                      value={form.mobile1}
                      onChange={(v) => handleChange("mobile1", v)}
                    />

                    <InputField
                      label="মোবাইল ২"
                      value={form.mobile2}
                      onChange={(v) => handleChange("mobile2", v)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Teacher Information */}
              <Card>
                <CardHeader>
                  <CardTitle>শিক্ষক সংক্রান্ত তথ্য</CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="আইডি"
                      value={form.code}
                      onChange={(v) => handleChange("code", v)}
                      readOnly={true}
                    />

                    <InputField
                      label="ইউজারনেম"
                      value={form.username}
                      onChange={(v) => handleChange("username", v)}
                    />

                    <InputField
                      label="পাসওয়ার্ড"
                      type="password"
                      value={form.password}
                      onChange={(v) => handleChange("password", v)}
                    />

                    <SelectOrCustomField
                      label="পদবি"
                      value={form.designation}
                      options={DESIGNATIONS}
                      onChange={(v) => handleChange("designation", v)}
                    />

                    <SelectOrCustomField
                      label="যোগ্যতা"
                      value={form.qualification}
                      options={QUALIFICATIONS}
                      onChange={(v) => handleChange("qualification", v)}
                    />

                    <SelectOrCustomField
                      label="দায়িত্বপ্রাপ্ত শ্রেণি"
                      value={form.jimmadarClass}
                      options={MADRASA_CLASSES}
                      onChange={(v) => handleChange("jimmadarClass", v)}
                    />

                    <InputField
                      label="যোগদানের তারিখ"
                      type="date"
                      value={form.joinDate}
                      onChange={(v) => handleChange("joinDate", v)}
                    />

                    <NumberField
                      label="বেসিক স্যালারি"
                      value={form.basicSalary ?? 0}
                      onChange={(v) => handleChange("basicSalary", v)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle>ঠিকানা</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold mb-4">বর্তমান ঠিকানা</h3>

                    <AddressFields
                      base="presentAddress"
                      form={form}
                      handleChange={handleChange}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">স্থায়ী ঠিকানা</h3>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={copyPresentToPermanent}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        বর্তমান ঠিকানা কপি করুন
                      </Button>
                    </div>

                    <AddressFields
                      base="permanentAddress"
                      form={form}
                      handleChange={handleChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ================= পারিবারিক জীবন ================= */}
            <Card>
              <CardHeader>
                <CardTitle>পারিবারিক জীবন</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="mb-1">বৈবাহিক অবস্থা</label>
                    <Select
                      value={form.maritalStatus}
                      onValueChange={(v) => handleChange("maritalStatus", v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="নির্বাচন করুন" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="অবিবাহিত">অবিবাহিত</SelectItem>
                        <SelectItem value="বিবাহিত">বিবাহিত</SelectItem>
                        <SelectItem value="বিধবা/বিপত্নীক">
                          বিধবা/বিপত্নীক
                        </SelectItem>
                        <SelectItem value="তালাকপ্রাপ্ত">
                          তালাকপ্রাপ্ত
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <InputField
                    label="স্বামী/স্ত্রীর নাম"
                    value={form.spouseName}
                    onChange={(v) => handleChange("spouseName", v)}
                  />

                  <NumberField
                    label="সন্তান সংখ্যা"
                    value={form.childrenCount}
                    onChange={(v) => handleChange("childrenCount", v)}
                  />

                  <InputField
                    label="জরুরি যোগাযোগ (নাম)"
                    value={form.emergencyContactName}
                    onChange={(v) => handleChange("emergencyContactName", v)}
                  />

                  <InputField
                    label="জরুরি যোগাযোগ (মোবাইল)"
                    value={form.emergencyContactPhone}
                    onChange={(v) => handleChange("emergencyContactPhone", v)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* ================= শিক্ষাগত যোগ্যতা ================= */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>শিক্ষাগত যোগ্যতা (দরসিয়াত)</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEducation}
                >
                  + যোগ করুন
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.education.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    কোনো তথ্য যোগ করা হয়নি।
                  </p>
                )}

                {form.education.map((edu, idx) => (
                  <div key={edu.id} className="rounded-lg border p-4 relative">
                    <button
                      type="button"
                      onClick={() => removeEducation(edu.id)}
                      className="absolute top-2 right-2 text-red-500 text-xs hover:underline"
                    >
                      মুছুন
                    </button>
                    <p className="text-xs text-muted-foreground mb-2">
                      যোগ্যতা #{idx + 1}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <SelectOrCustomField
                        label="দরসিয়াত স্তর/পরীক্ষার নাম"
                        value={edu.degree}
                        options={EDUCATION_LEVELS}
                        onChange={(v) => updateEducation(edu.id, "degree", v)}
                      />
                      <InputField
                        label="প্রতিষ্ঠান (মাদরাসার নাম)"
                        value={edu.institute}
                        onChange={(v) =>
                          updateEducation(edu.id, "institute", v)
                        }
                      />
                      <div className="flex flex-col">
                        <label className="mb-1">বোর্ড/মারকায</label>
                        <Input
                          list="madrasa-board-suggestions"
                          value={edu.board}
                          placeholder="যেমনঃ বেফাকুল মাদারিসিল আরাবিয়া বাংলাদেশ"
                          onChange={(e) =>
                            updateEducation(edu.id, "board", e.target.value)
                          }
                        />
                      </div>
                      <InputField
                        label="পাসের সাল"
                        value={edu.passingYear}
                        onChange={(v) =>
                          updateEducation(edu.id, "passingYear", v)
                        }
                      />
                      <InputField
                        label="ফলাফল (মুমতায/জায়্যিদ জিদ্দান/জায়্যিদ)"
                        value={edu.result}
                        onChange={(v) => updateEducation(edu.id, "result", v)}
                      />
                    </div>
                  </div>
                ))}

                {/* সব education row একসাথে ব্যবহার করার জন্য একটাই datalist */}
                <datalist id="madrasa-board-suggestions">
                  {MADRASA_BOARDS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </CardContent>
            </Card>

            {/* ================= অভিজ্ঞতা ================= */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>কর্ম অভিজ্ঞতা</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addExperience}
                >
                  + যোগ করুন
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.experience.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    কোনো অভিজ্ঞতা যোগ করা হয়নি।
                  </p>
                )}

                {form.experience.map((exp, idx) => (
                  <div key={exp.id} className="rounded-lg border p-4 relative">
                    <button
                      type="button"
                      onClick={() => removeExperience(exp.id)}
                      className="absolute top-2 right-2 text-red-500 text-xs hover:underline"
                    >
                      মুছুন
                    </button>
                    <p className="text-xs text-muted-foreground mb-2">
                      অভিজ্ঞতা #{idx + 1}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <InputField
                        label="প্রতিষ্ঠানের নাম (মাদরাসা/মসজিদ)"
                        value={exp.institute}
                        onChange={(v) =>
                          updateExperience(exp.id, "institute", v)
                        }
                      />
                      <SelectOrCustomField
                        label="পদবি"
                        value={exp.designation}
                        options={DESIGNATIONS}
                        onChange={(v) =>
                          updateExperience(exp.id, "designation", v)
                        }
                      />
                      <InputField
                        label="যোগদানের তারিখ"
                        type="date"
                        value={exp.fromDate}
                        onChange={(v) =>
                          updateExperience(exp.id, "fromDate", v)
                        }
                      />
                      <InputField
                        label="ছাড়ার তারিখ (চলমান হলে খালি রাখুন)"
                        type="date"
                        value={exp.toDate}
                        onChange={(v) => updateExperience(exp.id, "toDate", v)}
                      />
                    </div>
                    <div className="mt-3">
                      <label className="mb-1 block text-sm">বিবরণ</label>
                      <Input
                        value={exp.description}
                        onChange={(e) =>
                          updateExperience(
                            exp.id,
                            "description",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* ================= সনদ ================= */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>সনদপত্র সংযুক্তি</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCertificate}
                >
                  + সনদ যুক্ত করুন
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.certificates.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    কোনো সনদ যুক্ত করা হয়নি।
                  </p>
                )}

                {form.certificates.map((cert, idx) => (
                  <div
                    key={cert.id}
                    className="rounded-lg border p-4 flex items-center gap-4"
                  >
                    {cert.preview ? (
                      <img
                        src={cert.preview}
                        alt=""
                        className="h-16 w-16 object-cover rounded border"
                      />
                    ) : (
                      <div className="h-16 w-16 flex items-center justify-center rounded border bg-muted">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1">
                      <Input
                        placeholder={`সনদের নাম (যেমনঃ তাকমীল/দাওরায়ে হাদীস সনদ #${idx + 1})`}
                        value={cert.title}
                        onChange={(e) =>
                          updateCertificateTitle(cert.id, e.target.value)
                        }
                        className="mb-2"
                      />
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) updateCertificateFile(cert.id, file);
                        }}
                        className="text-sm"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeCertificate(cert.id)}
                      className="text-red-500 text-xs hover:underline"
                    >
                      মুছুন
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* ================= বেতন কর্তন ================= */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>বেতন কর্তন</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDeduction}
                >
                  + কর্তন যোগ করুন
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {form.deductions.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    কোনো কর্তন যোগ করা হয়নি।
                  </p>
                )}

                {form.deductions.map((ded) => (
                  <div key={ded.id} className="flex items-center gap-3">
                    <Input
                      placeholder="কর্তনের নাম (যেমনঃ লিল্লাহ বোর্ডিং চাঁদা)"
                      value={ded.title}
                      onChange={(e) =>
                        updateDeduction(ded.id, "title", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="পরিমাণ"
                      value={ded.amount === 0 ? "" : ded.amount}
                      onChange={(e) =>
                        updateDeduction(
                          ded.id,
                          "amount",
                          Number(e.target.value || 0),
                        )
                      }
                      className="w-32"
                    />
                    <button
                      type="button"
                      onClick={() => removeDeduction(ded.id)}
                      className="text-red-500 text-xs hover:underline"
                    >
                      মুছুন
                    </button>
                  </div>
                ))}

                {form.deductions.length > 0 && (
                  <div className="border-t pt-3 mt-3 flex justify-between text-sm">
                    <span className="text-muted-foreground">মূল বেতন</span>
                    <span className="font-medium">
                      {Number(form.basicSalary || 0).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">মোট কর্তন</span>
                  <span className="font-medium text-red-500">
                    - {totalDeductions.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-semibold border-t pt-2">
                  <span>নীট বেতন</span>
                  <span>{netSalary.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* ================= ছুটি (শুরুর ব্যালেন্স) ================= */}
            <Card>
              <CardHeader>
                <CardTitle>ছুটি</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-xs">
                  <NumberField
                    label="বার্ষিক ছুটির পরিমাণ (দিন)"
                    value={form.annualLeaveDays}
                    onChange={(v) => handleChange("annualLeaveDays", v)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    দৈনিক হাজিরা ও ছুটি আবেদন যোগদানের পর "Teacher Profile" পেজ
                    থেকে ব্যবস্থাপনা করা হবে।
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Upload */}
            <Card>
              <CardHeader>
                <CardTitle>প্রোফাইল ছবি</CardTitle>
              </CardHeader>

              <CardContent>
                <label
                  htmlFor="profilePicture"
                  className="border-2 border-dashed rounded-xl p-8 block cursor-pointer hover:bg-muted/50 transition"
                >
                  <div className="text-center">
                    {preview ? (
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-32 h-32 rounded-full object-cover border mx-auto"
                      />
                    ) : (
                      <ImageIcon className="mx-auto mb-3 h-8 w-8" />
                    )}
                    <p className="font-medium">ছবি নির্বাচন করুন</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      JPG, PNG
                    </p>
                    <p className="text-sm mt-3 truncate">{fileName}</p>
                  </div>

                  <input
                    id="profilePicture"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];

                      if (!file) return;

                      setFileName(file.name);
                      setPreview(URL.createObjectURL(file));
                    }}
                  />
                </label>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="sticky bottom-4 flex justify-end">
              <Button size="lg" disabled={loading} className="min-w-[220px]">
                {loading ? "সংরক্ষণ হচ্ছে..." : "শিক্ষক সংরক্ষণ করুন"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ================= SMALL INPUT ================= */

function InputField({
  label,
  value,
  onChange,
  readOnly = false,
  type = "text",
}: {
  label: string;
  value: string;
  type?: string;
  readOnly?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col">
      <label className="mb-1">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col">
      <label className="mb-1">{label}</label>

      <Input
        type="number"
        step="0.01"
        value={value === 0 ? "" : value}
        onChange={(e) => {
          const val = e.target.value;

          if (val === "") {
            onChange(0);
            return;
          }

          const num = Number(val);

          if (!isNaN(num)) {
            onChange(num);
          }
        }}
      />
    </div>
  );
}
