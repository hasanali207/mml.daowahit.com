"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { Copy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
// লোকাল স্ট্যাটিক ডেটা — কোনো npm package বা API call নেই, build-এ bundle হয়ে যায়
// ফাইল তিনটা src/data/ ফোল্ডারে রাখুন (দেখুন: bangladesh-geojson GitHub repo)
import districtsData from "@/data/bd-districts.json";
import divisionsData from "@/data/bd-divisions.json";
import upazilasData from "@/data/bd-upazilas.json";
import api from "@/lib/axios";

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

type StudentFormType = {
  name: string;
  code: string;
  username: string;
  fatherName: string;
  motherName: string;
  currentClass: string;
  gender: string;
  dob: string;
  nid: string;
  mobile1: string;
  mobile2: string;
  presentAddress: AddressType;
  permanentAddress: AddressType;
  password: string;
  profilePicture: string;
};

type AddressFieldProps = {
  base: "presentAddress" | "permanentAddress";
  form: StudentFormType;
  handleChange: (path: string, value: string) => void;
};

const AddressFields = ({ base, form, handleChange }: AddressFieldProps) => {
  const addressObj = form[base];
  const fieldClass = "w-full border rounded px-3 py-2 text-lg";

  /* ================= DIVISIONS (static, loaded once, instant) ================= */
  const divisions = useMemo(
    () => (divisionsData as { divisions: GeoItem[] }).divisions,
    [],
  );

  /* ================= DISTRICTS (derived synchronously, no fetch) ================= */
  const districts = useMemo(() => {
    if (!addressObj.divisionId) return [];
    return (districtsData as { districts: DistrictItem[] }).districts.filter(
      (d) => d.division_id === addressObj.divisionId,
    );
  }, [addressObj.divisionId]);

  /* ================= UPAZILAS (derived synchronously, no fetch) ================= */
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
            // division পাল্টালে নিচের সব child field reset — synchronous, কোনো race condition নেই
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

export default function StudentForm() {
  const [fileName, setFileName] = useState<string>("ছবি যুক্ত করুন");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<StudentFormType>({
    name: "",
    code: "",
    username: "",
    fatherName: "",
    motherName: "",
    currentClass: "",
    gender: "MALE",
    dob: "",
    nid: "",
    mobile1: "",
    mobile2: "",
    presentAddress: { ...emptyAddress },
    permanentAddress: { ...emptyAddress },
    password: "123456",
    profilePicture: "",
  });

  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const res = await api.get("/api/v1/student/all/studentstats");

      setStats(res.data.data);

      setForm((prev) => ({
        ...prev,
        code: res.data.data.nextCode,
        username: res.data.data.nextCode,
      }));
    };

    fetchStats();
  }, []);

  const handleChange = (path: string, value: string) => {
    if (path.includes(".")) {
      const [parent, key] = path.split(".");
      setForm((prev) => ({
        ...prev,
        [parent]: { ...(prev as any)[parent], [key]: value },
      }));
    } else setForm((prev) => ({ ...prev, [path]: value }));
  };

  const copyPresentToPermanent = () =>
    setForm((prev) => ({
      ...prev,
      permanentAddress: { ...prev.presentAddress },
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    if (
      !form.name ||
      !form.fatherName ||
      !form.currentClass ||
      !form.password
    ) {
      alert(
        "নাম, পিতার নাম, বর্তমান ক্লাস এবং পাসওয়ার্ড অবশ্যই পূরণ করতে হবে।",
      );
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      const fileInput = document.getElementById(
        "profilePicture",
      ) as HTMLInputElement;
      if (fileInput.files && fileInput.files[0]) {
        formData.append("file", fileInput.files[0]);
      }
      formData.append(
        "data",
        JSON.stringify({
          password: form.password,
          username: form.username,
          role: "STUDENT",
          student: {
            ...form,
            presentAddress: { ...form.presentAddress, type: "PRESENT" },
            permanentAddress: { ...form.permanentAddress, type: "PERMANENT" },
          },
        }),
      );

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/user/student`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.message || "সার্ভার ত্রুটি");
        setLoading(false);
        return;
      }

      toast.success("শিক্ষার্থী সফলভাবে তৈরী হয়েছে।");
      const newNextCode = String(Number(stats.nextCode) + 1);

      setForm({
        name: "",
        code: newNextCode,
        username: newNextCode,
        fatherName: "",
        motherName: "",
        currentClass: "",
        gender: "MALE",
        profilePicture: "",
        dob: "",
        nid: "",
        mobile1: "",
        mobile2: "",
        presentAddress: { ...emptyAddress },
        permanentAddress: { ...emptyAddress },
        password: "123456",
      });
      setFileName("কোনো ছবি নির্বাচিত হয়নি");
    } catch (err) {
      toast.error("❌ কিছু সমস্যা হয়েছে: " + (err as Error).message);
    }

    setLoading(false);
  };

  const fieldLabel = {
    name: "নাম",
    code: "আইডি",
    fatherName: "পিতার নাম",
    motherName: "মাতার নাম",
    currentClass: "ভর্তি ক্লাস",
    dob: "জন্মতারিখ",
    nid: "এনআইডি",
    mobile1: "মোবাইল ১",
    mobile2: "মোবাইল ২",
    username: "ইউজার নেম",
    password: "পাসওয়ার্ড",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 bangla"
    >
      <Card className="shadow-sm p-6 space-y-6">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl">
            <h2 className="font-bold text-2xl mb-4">ছাত্র নিবন্ধন ফর্ম</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(fieldLabel).map((f: string) => (
                  <div className="flex flex-col" key={f}>
                    <label className="mb-1">
                      {fieldLabel[f as keyof typeof fieldLabel]}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      className="w-full border rounded px-3 py-2 text-lg"
                      type={
                        f === "dob"
                          ? "date"
                          : f === "password"
                            ? "password"
                            : "text"
                      }
                      value={(form as any)[f]}
                      onChange={(e) => handleChange(f, e.target.value)}
                      readOnly={f === "code"}
                    />
                  </div>
                ))}

                <div className="flex flex-col">
                  <label className="mb-1">
                    লিঙ্গ <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={form.gender}
                    onValueChange={(v) => handleChange("gender", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="লিঙ্গ" />
                    </SelectTrigger>
                    <SelectContent className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-lg z-50">
                      <SelectItem value="MALE">পুরুষ</SelectItem>
                      <SelectItem value="FEMALE">মহিলা</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="font-semibold text-lg mb-2">বর্তমান ঠিকানা</p>
                  <AddressFields
                    base="presentAddress"
                    form={form}
                    handleChange={handleChange}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-lg">স্থায়ী ঠিকানা</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={copyPresentToPermanent}
                    >
                      <Copy size={16} /> বর্তমান ঠিকানা অনুলিপি
                    </Button>
                  </div>
                  <AddressFields
                    base="permanentAddress"
                    form={form}
                    handleChange={handleChange}
                  />
                </div>
              </div>

              {/* Profile Picture Upload */}
              <div className="flex flex-col mb-4">
                <label
                  htmlFor="profilePicture"
                  className="mb-2 font-medium text-gray-700 dark:text-gray-200"
                >
                  প্রোফাইল ছবি
                </label>
                <div className="relative w-[270px]">
                  <input
                    id="profilePicture"
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0])
                        setFileName(e.target.files[0].name);
                      else
                        setFileName("কোনো ছবি নির্বাচিত হয়নি ছবি যুক্ত করুন");
                    }}
                  />
                  <div className="flex items-center justify-between px-4 py-2 border rounded-lg bg-gray-50 dark:bg-zinc-700 border-gray-300 dark:border-zinc-600 hover:border-blue-500 transition-colors cursor-pointer">
                    <span className="text-gray-500 dark:text-gray-300 truncate">
                      {fileName}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Button disabled={loading} type="submit">
              {loading ? "সংরক্ষণ হচ্ছে..." : "ছাত্র সংরক্ষণ করুন"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
