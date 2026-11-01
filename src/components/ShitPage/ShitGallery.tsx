"use client";

import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

/* ================= TYPES ================= */

type ClassType = {
  id: string;
  name: string;
};

type SessionType = {
  id: string;
  name: string;
};

type GalleryItem = {
  id: string;
  classId: string;
  imageUrl?: string; // image OR pdf
  title?: string;
  description?: string;
  date: string; // ISO
  month: string;
};

/* ================= COMPONENT ================= */

export default function ShitGallery() {
  const API = process.env.NEXT_PUBLIC_BASE_API!;
  const token = useSelector((state: any) => state.auth.token);

  /* ---------------- STATES ---------------- */
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [classes, setClasses] = useState<ClassType[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);

  /* ================= LOAD SESSIONS ================= */
  useEffect(() => {
    fetch(`${API}/api/v1/session`)
      .then((res) => res.json())
      .then((data) => setSessions(data.data || []))
      .catch(console.error);
  }, []);

  /* ================= LOAD CLASSES ON SESSION SELECT ================= */
  useEffect(() => {
    if (!selectedSessionId) {
      setClasses([]);
      setSelectedClassId("");
      return;
    }

    fetch(`${API}/api/v1/session/${selectedSessionId}/classes`)
      .then((res) => res.json())
      .then((data) => setClasses(data.data || []))
      .catch(console.error);

    // Clean dependent selections
    setSelectedClassId("");
    setSelectedMonth("");
    setSelectedDate(null);
    setGalleryItems([]);
  }, [selectedSessionId]);

  /* ================= LOAD GALLERY ON CLASS SELECT ================= */
  useEffect(() => {
    if (!selectedClassId) {
      setGalleryItems([]);
      setSelectedMonth("");
      setSelectedDate(null);
      return;
    }

    fetch(`${API}/api/v1/shits`, {
      headers: { Authorization: `${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.data.filter(
          (item: GalleryItem) => item.classId === selectedClassId,
        );
        setGalleryItems(filtered);
      })
      .catch(console.error);

    // Clean dependent selections
    setSelectedMonth("");
    setSelectedDate(null);
  }, [selectedClassId]);

  /* ================= DERIVED DATA ================= */
  const monthsForClass = useMemo(() => {
    return Array.from(new Set(galleryItems.map((g) => g.month)));
  }, [galleryItems]);

  const datesForMonth = useMemo(() => {
    if (!selectedMonth) return [];
    return Array.from(
      new Set(
        galleryItems
          .filter((g) => g.month === selectedMonth)
          .map((g) => new Date(g.date).getDate()),
      ),
    ).sort((a, b) => a - b);
  }, [galleryItems, selectedMonth]);

  const itemsForDate = useMemo(() => {
    if (!selectedDate) return [];
    return galleryItems.filter(
      (g) => new Date(g.date).getDate() === selectedDate,
    );
  }, [galleryItems, selectedDate]);

  /* ================= HELPERS ================= */
  const getPdfPreview = (pdfUrl: string) => {
    if (!pdfUrl) return "";
    return pdfUrl.replace("/upload/", "/upload/pg_1/");
  };

  const handleDownload = (item: GalleryItem) => {
    if (!item.imageUrl) return;
    const link = document.createElement("a");
    link.href = item.imageUrl;
    link.download = `${item.title || "file"}`;
    link.click();
  };

  /* ================= UI ================= */
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* LEFT SIDEBAR */}
      <div className="w-full md:w-64 bg-white border-b md:border-r p-4 space-y-4">
        {/* SESSION */}
        <div>
          <label className="font-semibold">Session</label>
          <select
            className="w-full border rounded p-2"
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

        {/* CLASS */}
        {classes.length > 0 && (
          <div>
            <label className="font-semibold">Class</label>
            <select
              className="w-full border rounded p-2"
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

        {/* MONTH */}
        {monthsForClass.length > 0 && (
          <div>
            <label className="font-semibold">Month</label>
            {monthsForClass.map((m) => (
              <button
                key={m}
                className={`w-full text-left p-2 rounded mt-1 ${
                  selectedMonth === m
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-200"
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
      </div>

      {/* MAIN */}
      <div className="flex-1 p-6">
        {selectedMonth && (
          <>
            <h3 className="font-semibold mb-2">Date</h3>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-6">
              {datesForMonth.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={`p-2 rounded border ${
                    selectedDate === d
                      ? "bg-blue-500 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {itemsForDate.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow hover:shadow-lg transition p-3"
            >
              {item.imageUrl &&
                (item.imageUrl.toLowerCase().endsWith(".pdf") ? (
                  <div className="relative w-full h-48 sm:h-64 bg-gray-100 rounded-lg border overflow-hidden">
                    <img
                      src={getPdfPreview(item.imageUrl)}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white">
                      <p className="text-sm">{item.title || "PDF Document"}</p>
                      <button
                        onClick={() => handleDownload(item)}
                        className="mt-2 px-3 py-1 bg-blue-600 rounded hover:bg-blue-700"
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>
                ) : (
                  <img
                    src={item.imageUrl}
                    className="w-full h-48 sm:h-64 object-cover rounded-lg cursor-pointer"
                    onClick={() => setModalImage(item.imageUrl!)}
                  />
                ))}

              <h4 className="font-semibold mt-2">{item.title}</h4>
              <p className="text-sm text-gray-600 mb-2">{item.description}</p>

              <button
                onClick={() => handleDownload(item)}
                className="w-full bg-blue-600 text-white py-1 rounded hover:bg-blue-700"
              >
                Download
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* IMAGE MODAL */}
      {modalImage && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setModalImage(null)}
        >
          <img
            src={modalImage}
            className="max-w-[90%] max-h-[90%] rounded-xl"
          />
        </div>
      )}
    </div>
  );
}
