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

type TeacherFormType = {
  username: string;
  password: string;

  code: string;
  name: string;
  designation: string;
  donorType: string;

  fatherName: string;
  motherName: string;
  mobile1: string;
  mobile2: string;

  presentAddress: AddressType;
  permanentAddress: AddressType;
};

type AddressFieldProps = {
  base: "presentAddress" | "permanentAddress";
  form: TeacherFormType;
  handleChange: (path: string, value: string) => void;
};

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

/* ================= MAIN COMPONENT ================= */

export default function DonorForm() {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("ছবি যুক্ত করুন");
  const [form, setForm] = useState<TeacherFormType>({
    username: "",
    password: "123456",

    code: "",
    name: "",
    designation: "",
    donorType: "",

    fatherName: "",
    motherName: "",

    mobile1: "",
    mobile2: "",

    presentAddress: { ...emptyAddress },
    permanentAddress: { ...emptyAddress },
  });

  /* ================= HELPERS ================= */

  const handleChange = (path: string, value: string) => {
    if (path.includes(".")) {
      const [parent, key] = path.split(".");
      setForm((prev) => ({
        ...prev,
        [parent]: { ...(prev as any)[parent], [key]: value },
      }));
    } else {
      setForm((prev) => ({ ...prev, [path]: value }));
    }
  };

  const [stats, setStats] = useState<any>(null);

  console.log(stats);
  useEffect(() => {
    const fetchStats = async () => {
      const res = await api.get("/api/v1/monthlydonations/all/donorstats");

      setStats(res.data.data);

      setForm((prev) => ({
        ...prev,
        code: res.data.data.nextCode,
        username: res.data.data.nextCode,
      }));
    };

    fetchStats();
  }, []);

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

      formData.append(
        "data",
        JSON.stringify({
          username: form.username,
          password: form.password,
          donor: {
            ...form,
            presentAddress: cleanAddress(form.presentAddress, "PRESENT"),
            permanentAddress: cleanAddress(form.permanentAddress, "PERMANENT"),
          },
        }),
      );

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/monthlydonations`,
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

      toast.success("🎉 দাতা সদস্য সফলভাবে যুক্ত হয়েছে");

      const newNextCode = String(Number(stats.nextCode) + 1);
      setForm({
        username: newNextCode,
        password: "123456",
        code: newNextCode,
        name: "",
        designation: "",
        donorType: "",
        fatherName: "",
        motherName: "",
        mobile1: "",
        mobile2: "",
        presentAddress: { ...emptyAddress },
        permanentAddress: { ...emptyAddress },
      });

      setFileName("ছবি যুক্ত করুন");
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
            <h2 className="text-2xl font-bold">দাতা সদস্য নিবন্ধন ফর্ম</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LEFT */}
                <div className="space-y-4">
                  <InputField
                    label="দানকারীর নাম"
                    value={form.name}
                    onChange={(v) => handleChange("name", v)}
                  />

                  <InputField
                    label="পেশা"
                    value={form.designation}
                    onChange={(v) => handleChange("designation", v)}
                  />
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">সদস্যের ধরন</label>

                    <Select
                      value={form.donorType}
                      onValueChange={(v) => handleChange("donorType", v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="নির্বাচন করুন" />
                      </SelectTrigger>
                      <SelectContent className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-lg z-50">
                        <SelectItem value="ASHARAYE">
                          আশারায়ে মুবোশশারা সদস্য - প্রতি মাস 1000
                        </SelectItem>
                        <SelectItem value="BODORI">
                          বদরি ৩১৩ সদস্য - প্রতি মাস 500
                        </SelectItem>
                        <SelectItem value="LIFETIME">
                          আজীবন দাতা সদস্য - ঐচ্ছিক অর্থ দান
                        </SelectItem>
                        <SelectItem value="LIFETIME2">
                          আজীবন দাতা সদস্য - ঐচ্ছিক খাদ্য সমগ্রী দান
                        </SelectItem>
                        <SelectItem value="MOSQUE">
                          দাওয়াহ্ মাদরাসা মসজিদ নির্মান - ঐচ্ছিক দান
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <InputField
                    label="আইডি"
                    value={form.code}
                    onChange={(v) => handleChange("code", v)}
                    readOnly={true}
                  />

                  <InputField
                    label="পাসওয়ার্ড"
                    type="password"
                    value={form.password}
                    onChange={(v) => handleChange("password", v)}
                  />
                </div>

                {/* RIGHT */}
                <div className="space-y-4">
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
                    label="মোবাইল ১"
                    value={form.mobile1}
                    onChange={(v) => handleChange("mobile1", v)}
                  />
                  <InputField
                    label="মোবাইল ২(WhatsApp)"
                    value={form.mobile2}
                    onChange={(v) => handleChange("mobile2", v)}
                  />
                  <InputField
                    label="ইউজারনেম"
                    value={form.username}
                    onChange={(v) => handleChange("username", v)}
                  />
                </div>
              </div>
              {/* ADDRESS */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <AddressFields
                    base="presentAddress"
                    form={form}
                    handleChange={handleChange}
                  />
                </div>
                <div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={copyPresentToPermanent}
                  >
                    <Copy size={16} /> বর্তমান ঠিকানা অনুলিপি
                  </Button>
                  <AddressFields
                    base="permanentAddress"
                    form={form}
                    handleChange={handleChange}
                  />
                </div>
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
                    else setFileName("কোনো ছবি নির্বাচিত হয়নি ছবি যুক্ত করুন");
                  }}
                />
                <div className="flex items-center justify-between px-4 py-2 border rounded-lg bg-gray-50 dark:bg-zinc-700 border-gray-300 dark:border-zinc-600 hover:border-blue-500 transition-colors cursor-pointer">
                  <span className="text-gray-500 dark:text-gray-300 truncate">
                    {fileName}
                  </span>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "সংরক্ষণ হচ্ছে..." : "দাতা সংরক্ষণ করুন"}
            </Button>
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
  type = "text",
  readOnly = false,
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
