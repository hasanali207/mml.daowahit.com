"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

type ClassType = { id: string; name: string };
type SessionType = { id: string; name: string };
type ShitGalleryItem = {
  id: string;
  classId?: string;
  imageUrl?: string;
  title?: string;
  description?: string;
  date: string;
  month: string;
  createdAt: string;
};

export default function AddShitGallery() {
  const API = process.env.NEXT_PUBLIC_BASE_API!;
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [gallery, setGallery] = useState<ShitGalleryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    month: "",
    classId: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("কোনো ছবি নির্বাচিত হয়নি");

  /* ================= LOAD SESSIONS ================= */
  useEffect(() => {
    axios
      .get(`${API}/api/v1/session`)
      .then((res) => setSessions(res.data.data || []))
      .catch(console.error);
  }, []);

  /* ================= LOAD CLASSES ON SESSION SELECT ================= */
  useEffect(() => {
    if (!selectedSessionId) {
      setClasses([]);
      setSelectedClassId("");
      return;
    }

    axios
      .get(`${API}/api/v1/session/${selectedSessionId}/classes`)
      .then((res) => setClasses(res.data.data || []))
      .catch(console.error);

    setSelectedClassId("");
    setForm({ ...form, classId: "" });
  }, [selectedSessionId]);

  /* ================= LOAD GALLERY ON CLASS SELECT ================= */
  useEffect(() => {
    if (!selectedClassId) {
      setGallery([]);
      return;
    }

    axios
      .get(`${API}/api/v1/shits`)
      .then((res) => {
        const filtered = res.data.data.filter(
          (item: ShitGalleryItem) => item.classId === selectedClassId
        );
        setGallery(filtered);
      })
      .catch(console.error);
  }, [selectedClassId]);

  /* ================= DERIVED DATA FOR FILTER ================= */
  const monthsForClass = useMemo(() => {
    return Array.from(new Set(gallery.map((g) => g.month)));
  }, [gallery]);

  const datesForMonth = useMemo(() => {
    if (!selectedMonth) return [];
    return Array.from(
      new Set(
        gallery
          .filter((g) => g.month === selectedMonth)
          .map((g) => new Date(g.date).getDate())
      )
    ).sort((a, b) => a - b);
  }, [gallery, selectedMonth]);

  const itemsForDate = useMemo(() => {
    if (!selectedDate) return [];
    return gallery.filter(
      (g) => new Date(g.date).getDate() === selectedDate
    );
  }, [gallery, selectedDate]);

  /* ================= HANDLE DATE CHANGE ================= */
  const handleDateChange = (dateValue: string) => {
    setForm({
      ...form,
      date: dateValue,
      month: new Date(dateValue).toLocaleString("bn-BD", { month: "long" }),
    });
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return toast.error("Class select করুন!");
    if (!form.date) return toast.error("Date select করুন!");
    setLoading(true);

    try {
      const formData = new FormData();
      if (file) formData.append("file", file);

      formData.append(
        "data",
        JSON.stringify({
          ...form,
          classId: selectedClassId,
        })
      );

      const res = await axios.post(`${API}/api/v1/shits`, formData);
      toast.success("Gallery added!");
      setForm({ title: "", description: "", date: "", month: "", classId: "" });
      setFile(null);
      setFileName("কোনো ছবি নির্বাচিত হয়নি");

      // Refresh gallery
      const galleryRes = await axios.get(`${API}/api/v1/shits`);
      const filtered = galleryRes.data.data.filter(
        (item: ShitGalleryItem) => item.classId === selectedClassId
      );
      setGallery(filtered);
      setSelectedMonth("");
      setSelectedDate(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Error adding gallery");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DOWNLOAD HELPER ================= */
  const handleDownload = (url: string, title?: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = title || "file";
    link.click();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Add ShitGallery</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* SESSION SELECT */}
        <div>
          <label className="font-semibold">Session</label>
          <select
            className="w-full border p-2 rounded"
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
          >
            <option value="">Select Session</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* CLASS SELECT */}
        {classes.length > 0 && (
          <div>
            <label className="font-semibold">Class</label>
            <select
              className="w-full border p-2 rounded"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* TITLE */}
        <input
          type="text"
          placeholder="Title"
          className="border p-2 rounded w-full"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        {/* DESCRIPTION */}
        <input
          type="text"
          placeholder="Description"
          className="border p-2 rounded w-full"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        {/* DATE */}
        <input
          type="date"
          className="border p-2 rounded w-full"
          value={form.date}
          onChange={(e) => handleDateChange(e.target.value)}
        />

        {/* FILE UPLOAD */}
        <div className="flex flex-col mb-4">
          <div className="relative w-full max-w-[300px]">
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFile(e.target.files[0]);
                  setFileName(e.target.files[0].name);
                } else {
                  setFile(null);
                  setFileName("কোনো ছবি নির্বাচিত হয়নি");
                }
              }}
            />
            <div className="flex items-center justify-between px-4 py-2 border rounded-lg bg-gray-50 hover:border-blue-500 cursor-pointer">
              <span className="truncate">{fileName}</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className={`bg-blue-600 text-white px-4 py-2 rounded flex items-center justify-center`}
          disabled={loading}
        >
          {loading && (
            <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5 mr-2"></span>
          )}
          {loading ? "Adding..." : "Add Gallery"}
        </button>
      </form>

      {/* MONTH FILTER */}
      {monthsForClass.length > 0 && (
        <div className="mt-6 space-x-2">
          <span className="font-semibold">Filter by Month: </span>
          {monthsForClass.map((m) => (
            <button
              key={m}
              className={`px-3 py-1 rounded ${
                selectedMonth === m
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
              onClick={() => {
                setSelectedMonth(m);
                setSelectedDate(null);
              }}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {/* DATE FILTER */}
      {selectedMonth && datesForMonth.length > 0 && (
        <div className="mt-2 space-x-2">
          <span className="font-semibold">Filter by Date: </span>
          {datesForMonth.map((d) => (
            <button
              key={d}
              className={`px-3 py-1 rounded ${
                selectedDate === d
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
              onClick={() => setSelectedDate(d)}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      {/* GALLERY LIST */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {(selectedDate ? itemsForDate : gallery).map((g) => (
          <div key={g.id} className="border rounded p-2 shadow-sm">
            {g.imageUrl && (
              <img
                src={g.imageUrl}
                alt={g.title}
                className="w-full h-40 object-cover rounded mb-2"
              />
            )}
            <h4 className="font-semibold">{g.title}</h4>
            <p className="text-sm text-gray-600">{g.description}</p>
            <p className="text-xs text-gray-400">{g.date.split("T")[0]}</p>
            {g.imageUrl && (
              <button
                className="mt-1 w-full bg-blue-600 text-white py-1 rounded hover:bg-blue-700"
                onClick={() => handleDownload(g.imageUrl!, g.title)}
              >
                Download
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
