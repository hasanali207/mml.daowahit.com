"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import api from "@/lib/axios";
import { AcademicInfo, useAcademicInfo } from "@/lib/useAcademicInfo";
import {
  AlertCircle,
  Building2,
  ImageIcon,
  Loader2,
  PenLine,
  Phone,
  Quote,
  RotateCcw,
  Save,
  UploadCloud,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

// ========================================
// TYPES
// ========================================

type TextFieldKey =
  | "name"
  | "shortName"
  | "tagline"
  | "establishedYear"
  | "eiinNumber"
  | "description"
  | "mission"
  | "vision"
  | "phone"
  | "secondaryPhone"
  | "email"
  | "website"
  | "address"
  | "city"
  | "country"
  | "mapEmbedUrl"
  | "facebookUrl"
  | "youtubeUrl"
  | "principalName"
  | "signature2Name"
  | "signature2Designation"
  | "signature3Name"
  | "signature3Designation"
  | "signature4Name"
  | "signature4Designation"
  | "principalMessage";

type ImageFieldKey =
  | "logo"
  | "banner"
  | "favicon"
  | "principalSignature"
  | "signature2Image"
  | "signature3Image"
  | "signature4Image";

type AcademicInfoFormValues = Record<TextFieldKey, string>;

type AcademicInfoField = {
  name: TextFieldKey;
  label: string;
  type?: string;
  placeholder?: string;
  hint?: string;
  textarea?: boolean;
  rows?: number;
};

type SignatureBlock = {
  title: string;
  nameKey: TextFieldKey;
  designationKey?: TextFieldKey;
  imageKey: ImageFieldKey;
};

// ========================================
// FIELD DEFINITIONS
// ========================================

const basicFields: AcademicInfoField[] = [
  {
    name: "name",
    label: "প্রতিষ্ঠানের নাম",
    placeholder: "প্রতিষ্ঠানের পূর্ণ নাম লিখুন",
  },
  {
    name: "shortName",
    label: "সংক্ষিপ্ত নাম",
    placeholder: "সংক্ষিপ্ত নাম লিখুন",
  },
  {
    name: "tagline",
    label: "ট্যাগলাইন / স্লোগান",
    placeholder: "ট্যাগলাইন লিখুন",
  },
  {
    name: "establishedYear",
    label: "প্রতিষ্ঠার সাল",
    type: "number",
    placeholder: "যেমন: ২০১০",
  },
  {
    name: "eiinNumber",
    label: "ইআইআইএন (EIIN) নম্বর",
    placeholder: "ইআইআইএন নম্বর লিখুন",
  },
  {
    name: "description",
    label: "প্রতিষ্ঠান পরিচিতি",
    placeholder: "প্রতিষ্ঠান সম্পর্কে সংক্ষেপে লিখুন",
    hint: "ওয়েবসাইটের পরিচিতি অংশে এবং সার্চ ইঞ্জিনে এই লেখা দেখানো হবে।",
    textarea: true,
  },
  {
    name: "mission",
    label: "মিশন (লক্ষ্য)",
    placeholder: "প্রতিষ্ঠানের লক্ষ্য লিখুন",
    textarea: true,
    rows: 3,
  },
  {
    name: "vision",
    label: "ভিশন (ভবিষ্যৎ পরিকল্পনা)",
    placeholder: "প্রতিষ্ঠানের ভিশন লিখুন",
    textarea: true,
    rows: 3,
  },
];

const contactFields: AcademicInfoField[] = [
  {
    name: "phone",
    label: "মোবাইল নম্বর",
    placeholder: "০১XXXXXXXXX",
  },
  {
    name: "secondaryPhone",
    label: "বিকল্প মোবাইল নম্বর",
    placeholder: "০১XXXXXXXXX",
  },
  {
    name: "email",
    label: "ইমেইল",
    type: "email",
    placeholder: "example@gmail.com",
  },
  {
    name: "website",
    label: "ওয়েবসাইট",
    placeholder: "https://",
  },
  {
    name: "address",
    label: "ঠিকানা",
    placeholder: "গ্রাম/মহল্লা, ডাকঘর, উপজেলা",
    textarea: true,
    rows: 3,
  },
  {
    name: "city",
    label: "শহর / জেলা",
    placeholder: "শহর বা জেলার নাম",
  },
  {
    name: "country",
    label: "দেশ",
    placeholder: "বাংলাদেশ",
  },
  {
    name: "facebookUrl",
    label: "ফেসবুক পেজের লিংক",
    placeholder: "https://facebook.com/...",
  },
  {
    name: "youtubeUrl",
    label: "ইউটিউব চ্যানেলের লিংক",
    placeholder: "https://youtube.com/...",
  },
  {
    name: "mapEmbedUrl",
    label: "গুগল ম্যাপ এম্বেড লিংক",
    placeholder: "https://www.google.com/maps/embed?...",
    hint: "গুগল ম্যাপে শেয়ার → ম্যাপ এম্বেড করুন থেকে src এর ভেতরের লিংকটি দিন।",
  },
];

const imageFields: { name: ImageFieldKey; label: string; hint: string }[] = [
  {
    name: "logo",
    label: "প্রতিষ্ঠানের লোগো",
    hint: "বর্গাকার ছবি ভালো দেখায়",
  },
  {
    name: "banner",
    label: "প্রতিষ্ঠানের ব্যানার",
    hint: "চওড়া ছবি, যেমন ১৮০০×৩০০",
  },
  {
    name: "favicon",
    label: "ফেভিকন",
    hint: "ব্রাউজার ট্যাবের ছোট আইকন",
  },
];

const signatureBlocks: SignatureBlock[] = [
  {
    title: "প্রধান শিক্ষকের স্বাক্ষর",
    nameKey: "principalName",
    imageKey: "principalSignature",
  },
  {
    title: "দ্বিতীয় স্বাক্ষর",
    nameKey: "signature2Name",
    designationKey: "signature2Designation",
    imageKey: "signature2Image",
  },
  {
    title: "তৃতীয় স্বাক্ষর",
    nameKey: "signature3Name",
    designationKey: "signature3Designation",
    imageKey: "signature3Image",
  },
  {
    title: "চতুর্থ স্বাক্ষর",
    nameKey: "signature4Name",
    designationKey: "signature4Designation",
    imageKey: "signature4Image",
  },
];

const initialFormValues: AcademicInfoFormValues = {
  name: "",
  shortName: "",
  tagline: "",
  establishedYear: "",
  eiinNumber: "",
  description: "",
  mission: "",
  vision: "",
  phone: "",
  secondaryPhone: "",
  email: "",
  website: "",
  address: "",
  city: "",
  country: "",
  mapEmbedUrl: "",
  facebookUrl: "",
  youtubeUrl: "",
  principalName: "",
  signature2Name: "",
  signature2Designation: "",
  signature3Name: "",
  signature3Designation: "",
  signature4Name: "",
  signature4Designation: "",
  principalMessage: "",
};

// ========================================
// STYLES
// ========================================

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-[15px] text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/25 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500";

const cardClass =
  "rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900";

// ========================================
// SMALL PRESENTATIONAL PIECES
// ========================================

function Section({
  icon,
  title,
  hint,
  children,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className={cardClass}>
      <header className="flex items-start gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          {icon}
        </span>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          {hint && (
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {hint}
            </p>
          )}
        </div>
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

// ========================================
// COMPONENT
// ========================================

export default function AcademicInfoUI() {
  const { info, loading: fetching, error, refetch } = useAcademicInfo();

  const [form, setForm] = useState<AcademicInfoFormValues>(initialFormValues);
  const [baseline, setBaseline] =
    useState<AcademicInfoFormValues>(initialFormValues);
  const [existing, setExisting] = useState<AcademicInfo | null>(null);
  const [files, setFiles] = useState<Partial<Record<ImageFieldKey, File>>>({});
  const [previewUrls, setPreviewUrls] = useState<
    Partial<Record<ImageFieldKey, string>>
  >({});
  const [saving, setSaving] = useState(false);

  // ========================================
  // LOAD DATA INTO FORM
  // ========================================

  useEffect(() => {
    if (!info) return;

    setExisting(info);

    const textValues: AcademicInfoFormValues = { ...initialFormValues };

    [...basicFields, ...contactFields].forEach((field) => {
      textValues[field.name] = String(info[field.name] ?? "");
    });

    signatureBlocks.forEach((signature) => {
      textValues[signature.nameKey] = String(info[signature.nameKey] ?? "");

      if (signature.designationKey) {
        textValues[signature.designationKey] = String(
          info[signature.designationKey] ?? "",
        );
      }
    });

    textValues.principalMessage = info.principalMessage ?? "";

    setForm(textValues);
    setBaseline(textValues);
  }, [info]);

  // ========================================
  // FILE PREVIEW
  // ========================================

  useEffect(() => {
    const urls: Partial<Record<ImageFieldKey, string>> = {};

    Object.entries(files).forEach(([key, file]) => {
      if (file) {
        urls[key as ImageFieldKey] = URL.createObjectURL(file);
      }
    });

    setPreviewUrls(urls);

    return () => {
      Object.values(urls).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [files]);

  const isDirty = useMemo(
    () =>
      Object.keys(files).length > 0 ||
      JSON.stringify(form) !== JSON.stringify(baseline),
    [files, form, baseline],
  );

  // ========================================
  // HANDLERS
  // ========================================

  const handleInputChange = (name: TextFieldKey, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (name: ImageFieldKey, file?: File) => {
    setFiles((prev) => {
      const updated = { ...prev };

      if (file) {
        updated[name] = file;
      } else {
        delete updated[name];
      }

      return updated;
    });
  };

  const handleReset = () => {
    setForm(baseline);
    setFiles({});
  };

  const getPreview = (name: ImageFieldKey) => {
    return (
      previewUrls[name] || (existing?.[name] as string | null | undefined) || ""
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setSaving(true);

      const formData = new FormData();

      const payload = {
        ...form,
        establishedYear: form.establishedYear
          ? Number(form.establishedYear)
          : null,
      };

      formData.append("data", JSON.stringify(payload));

      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          formData.append(key, file);
        }
      });

      await api.put("/api/v1/academic-info", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("একাডেমিক তথ্য সফলভাবে হালনাগাদ হয়েছে!");

      setFiles({});

      await refetch();
    } catch (error: any) {
      console.error("Academic info update error:", error);

      toast.error(
        error?.response?.data?.message || "একাডেমিক তথ্য হালনাগাদ করা যায়নি",
      );
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // RENDER HELPERS
  // ========================================

  const renderTextField = (field: AcademicInfoField) => {
    const id = `field-${field.name}`;

    return (
      <div
        key={field.name}
        className={field.textarea ? "space-y-1.5 md:col-span-2" : "space-y-1.5"}
      >
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {field.label}
        </label>

        {field.textarea ? (
          <textarea
            id={id}
            value={form[field.name]}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder || field.label}
            rows={field.rows ?? 4}
            className={`${inputClass} resize-y leading-relaxed`}
          />
        ) : (
          <input
            id={id}
            type={field.type || "text"}
            value={form[field.name]}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder || field.label}
            className={inputClass}
          />
        )}

        {field.hint && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {field.hint}
          </p>
        )}
      </div>
    );
  };

  const renderFileInput = (
    name: ImageFieldKey,
    label: string,
    options?: { hint?: string; height?: string },
  ) => {
    const preview = getPreview(name);
    const picked = files[name];

    return (
      <div key={name} className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
          {picked && (
            <button
              type="button"
              onClick={() => handleFileChange(name, undefined)}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <X size={13} /> বাতিল
            </button>
          )}
        </div>

        <label
          className={`group relative flex ${
            options?.height ?? "h-36"
          } cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition focus-within:ring-2 focus-within:ring-emerald-600/40 ${
            picked
              ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10"
              : "border-gray-300 bg-gray-50 hover:border-emerald-500 hover:bg-emerald-50/40 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-emerald-900/10"
          }`}
        >
          {preview ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt={label}
                className="h-full w-full object-contain p-2"
              />
              <span className="absolute inset-0 grid place-items-center bg-black/55 text-sm font-medium text-white opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                ছবি পরিবর্তন করুন
              </span>
            </>
          ) : (
            <span className="flex flex-col items-center gap-1.5 px-3 text-center text-gray-500 dark:text-gray-400">
              <UploadCloud size={26} />
              <span className="text-sm">ছবি নির্বাচন করুন</span>
            </span>
          )}

          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              handleFileChange(name, e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>

        {picked ? (
          <p className="truncate text-xs text-emerald-700 dark:text-emerald-400">
            নতুন ছবি: {picked.name}
          </p>
        ) : (
          options?.hint && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {options.hint}
            </p>
          )
        )}
      </div>
    );
  };

  // ========================================
  // LOADING / ERROR
  // ========================================

  if (fetching && !info) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="h-56 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800/60"
          />
        ))}
        <p className="text-center text-sm text-gray-500">
          একাডেমিক তথ্য লোড হচ্ছে...
        </p>
      </div>
    );
  }

  if (error && !info) {
    return (
      <div
        className={`${cardClass} flex flex-col items-center gap-3 p-8 text-center`}
      >
        <AlertCircle className="text-red-500" size={32} />
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg bg-emerald-700 px-5 py-2 font-medium text-white transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          আবার চেষ্টা করুন
        </button>
      </div>
    );
  }

  // ========================================
  // MAIN UI
  // ========================================

  const bannerPreview = getPreview("banner");
  const logoPreview = getPreview("logo");

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-6">
      {/* LIVE HEADER PREVIEW */}
      <div className={`${cardClass} overflow-hidden`}>
        <div className="relative h-40 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 sm:h-52">
          {bannerPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bannerPreview}
              alt="ব্যানার"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <p className="absolute right-3 top-3 rounded-full bg-black/40 px-3 py-1 text-xs text-white backdrop-blur">
            লাইভ প্রিভিউ
          </p>
        </div>

        <div className="relative flex items-end gap-4 px-5 pb-5 sm:px-6">
          <div className="-mt-10 grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md dark:border-gray-900 sm:-mt-12 sm:size-24">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoPreview}
                alt="লোগো"
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <Building2 className="text-gray-300" size={34} />
            )}
          </div>

          <div className="min-w-0 pt-3">
            <h1 className="truncate text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
              {form.name || "প্রতিষ্ঠানের নাম"}
            </h1>
            <p className="truncate text-sm text-gray-500 dark:text-gray-400">
              {form.tagline ||
                [form.address, form.city].filter(Boolean).join(", ") ||
                "ট্যাগলাইন বা ঠিকানা এখানে দেখাবে"}
            </p>
          </div>
        </div>
      </div>

      {/* BASIC INFORMATION */}
      <Section
        icon={<Building2 size={20} />}
        title="মৌলিক তথ্য"
        hint="প্রতিষ্ঠানের নাম, পরিচিতি ও লক্ষ্য-উদ্দেশ্য"
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {basicFields.map(renderTextField)}
        </div>
      </Section>

      {/* CONTACT INFORMATION */}
      <Section
        icon={<Phone size={20} />}
        title="যোগাযোগের তথ্য"
        hint="ওয়েবসাইটের উপরের বার ও যোগাযোগ পেজে এই তথ্য দেখানো হবে"
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {contactFields.map(renderTextField)}
        </div>
      </Section>

      {/* IMAGES */}
      <Section
        icon={<ImageIcon size={20} />}
        title="প্রতিষ্ঠানের ছবি"
        hint="লোগো, ব্যানার ও ফেভিকন আপলোড করুন"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {imageFields.map((field) =>
            renderFileInput(field.name, field.label, { hint: field.hint }),
          )}
        </div>
      </Section>

      {/* SIGNATURES */}
      <Section
        icon={<PenLine size={20} />}
        title="স্বাক্ষরের তথ্য"
        hint="সনদ, মার্কশিট ও প্রবেশপত্রে এই স্বাক্ষর ব্যবহার হবে"
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {signatureBlocks.map((signature) => (
            <div
              key={signature.nameKey}
              className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-800/30"
            >
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {signature.title}
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {renderTextField({
                  name: signature.nameKey,
                  label: "নাম",
                  placeholder: "নাম লিখুন",
                })}

                {signature.designationKey &&
                  renderTextField({
                    name: signature.designationKey,
                    label: "পদবি",
                    placeholder: "পদবি লিখুন",
                  })}
              </div>

              {renderFileInput(signature.imageKey, "স্বাক্ষরের ছবি", {
                height: "h-28",
              })}
            </div>
          ))}
        </div>
      </Section>

      {/* PRINCIPAL MESSAGE */}
      <Section
        icon={<Quote size={20} />}
        title="প্রধান শিক্ষকের বাণী"
        hint="ওয়েবসাইটের পরিচিতি পেজে প্রদর্শিত হবে"
      >
        <div className="grid grid-cols-1 gap-5">
          {renderTextField({
            name: "principalMessage",
            label: "বাণী",
            placeholder: "প্রধান শিক্ষকের বাণী লিখুন",
            textarea: true,
            rows: 7,
          })}
        </div>
      </Section>

      {/* STICKY SAVE BAR */}
      <div className="sticky bottom-4 z-10">
        <div
          className={`flex flex-col gap-3 rounded-xl border bg-white/90 px-4 py-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between dark:bg-gray-900/90 ${
            isDirty
              ? "border-amber-300 dark:border-amber-700"
              : "border-gray-200 dark:border-gray-800"
          }`}
        >
          <p
            className={`flex items-center gap-2 text-sm ${
              isDirty
                ? "text-amber-700 dark:text-amber-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
            aria-live="polite"
          >
            <span
              className={`size-2 rounded-full ${
                isDirty ? "bg-amber-500" : "bg-emerald-500"
              }`}
            />
            {isDirty
              ? "কিছু পরিবর্তন এখনও সংরক্ষণ করা হয়নি"
              : "সব তথ্য সংরক্ষিত আছে"}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={!isDirty || saving}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <RotateCcw size={16} /> পরিবর্তন বাতিল
            </button>

            <button
              type="submit"
              disabled={saving || !isDirty}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 py-2.5 font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  সংরক্ষণ হচ্ছে...
                </>
              ) : (
                <>
                  <Save size={18} />
                  তথ্য সংরক্ষণ করুন
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
