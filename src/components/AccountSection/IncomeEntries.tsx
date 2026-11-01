"use client";

import api from "@/lib/axios";
import { formatDateBn } from "@/utils/dateBn";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../ui/button";

type Category = { id: string; name: string };
type IncomeEntry = {
  id: string;
  date: string;
  amount: number;
  note?: string;
  attachment?: string;
  categoryId: string;
  createdAt: string;
  status: string;
  updatedAt: string;
  roshidNo?: string;
  cuttingRoshidNo?: string;
  categoryName: string;
};

export default function IncomeEntriesUI() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [entries, setEntries] = useState<IncomeEntry[]>([]);
  const [form, setForm] = useState({
    date: "",
    amount: "",
    note: "",
    attachment: "",
    categoryId: "",
    roshidNo: "",
    cuttingRoshidNo: "",
  });
  const [fileName, setFileName] = useState("কোনো ছবি নির্বাচিত হয়নি");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [page]);

  const fetchCategories = async () => {
    const res = await api.get("/api/v1/income/categories");
    setCategories(res.data.data);
  };

  const fetchEntries = async () => {
    const res = await api.get(
      `/api/v1/income/getaccountentries?page=${page}&limit=${limit}`,
    );
    const { data, meta } = res.data;
    setEntries(data || []); // আগের data.data বাদ
    setTotalPages(meta ? Math.ceil(meta.total / limit) : 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.date || !form.amount || !form.categoryId) {
      toast.error("Date, Amount & Category required");
      return;
    }

    try {
      const formData = new FormData();
      const fileInput = document.getElementById(
        "attachment",
      ) as HTMLInputElement;
      if (fileInput?.files?.[0]) {
        formData.append("file", fileInput.files[0]);
      }

      formData.append(
        "data",
        JSON.stringify({
          date: form.date,
          amount: Number(form.amount),
          note: form.note,
          categoryId: form.categoryId,
          attachment: form.attachment,
          roshidNo: form.roshidNo,
          cuttingRoshidNo: form.cuttingRoshidNo,
        }),
      );
      const url = editingId ? `/api/v1/income/${editingId}` : "/api/v1/income";

      await api({
        method: editingId ? "put" : "post",
        url,
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      setForm({
        date: "",
        amount: "",
        note: "",
        attachment: "",
        categoryId: "",
        roshidNo: "",
        cuttingRoshidNo: "",
      });
      setFileName("কোনো ছবি নির্বাচিত হয়নি");
      setEditingId(null);
      fetchEntries();
      toast.success(editingId ? "Income updated!" : "Income added!");
    } catch (err: any) {
      toast.error("Error: " + err.message);
    }
  };

  const startEdit = (entry: IncomeEntry) => {
    setEditingId(entry.id);
    setForm({
      date: entry.date.split("T")[0],
      amount: entry.amount.toString(),
      note: entry.note || "",
      attachment: entry.attachment || "",
      categoryId: entry.categoryId,
      roshidNo: entry.roshidNo || "",
      cuttingRoshidNo: entry.cuttingRoshidNo || "",
    });
    setFileName(entry.attachment ? "Uploaded File" : "কোনো ছবি নির্বাচিত হয়নি");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      date: "",
      amount: "",
      note: "",
      attachment: "",
      categoryId: "",
      roshidNo: "",
      cuttingRoshidNo: "",
    });
    setFileName("কোনো ছবি নির্বাচিত হয়নি");
  };

  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center gap-5 my-2 bg-gray-100 p-2">
        <h1 className="text-xl bangla">আয়ের হিসাব এন্ট্রি</h1>
        <Button>
          {" "}
          <Link href="/superadmin/accountant/accounts/pendingincome">
            Pending Income Entry
          </Link>
        </Button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mb-6 max-w-3xl mx-auto space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="border p-2 rounded w-full"
          />
          <input
            type="number"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="border p-2 rounded w-full"
          />
        </div>

        <select
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          className="border p-2 rounded w-full"
        >
          <option value="">Select Category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="রসিদ বই নং"
            value={form.roshidNo}
            onChange={(e) => setForm({ ...form, roshidNo: e.target.value })}
            className="border p-2 rounded w-full"
          />
          <input
            type="text"
            placeholder="কর্তনকৃত রসিদ নং"
            value={form.cuttingRoshidNo}
            onChange={(e) =>
              setForm({ ...form, cuttingRoshidNo: e.target.value })
            }
            className="border p-2 rounded w-full"
          />
        </div>

        <input
          type="text"
          placeholder="Note"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          className="border p-2 rounded w-full"
        />

        <div className="flex flex-col mb-4">
          <label
            htmlFor="attachment"
            className="mb-2 font-medium text-gray-700"
          >
            Attachment
          </label>
          <div className="relative w-full max-w-[300px]">
            <input
              id="attachment"
              type="file"
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFileName(e.target.files[0].name);
                } else setFileName("কোনো ছবি নির্বাচিত হয়নি");
              }}
            />
            <div className="flex items-center justify-between px-4 py-2 border rounded-lg bg-gray-50 hover:border-blue-500 cursor-pointer">
              <span className="truncate">{fileName}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {editingId ? "Update Entry" : "Add Entry"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-4 py-2">তারিখ</th>
            <th className="border px-4 py-2">টাকা</th>
            <th className="border px-4 py-2">খাতসমূহ</th>
            <th className="border px-4 py-2">রসিদ বই নং</th>
            <th className="border px-4 py-2">কর্তনকৃত রসিদ নং</th>
            <th className="border px-4 py-2">নোট</th>
            <th className="border px-4 py-2">ফাইল</th>
            <th className="border px-4 py-2">স্ট্যাটাস</th>
            <th className="border px-4 py-2">পরিবর্তন</th>
            <th className="border px-4 py-2">এন্টি তারিখ</th>
            <th className="border px-4 py-2">আপডেট তারিখ</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e.id}>
              <td className="border px-4 py-2">{formatDateBn(e.date)}</td>
              <td className="border px-4 py-2">{e.amount}</td>
              <td className="border px-4 py-2">
                {e.categoryName ||
                  categories.find((c) => c.id === e.categoryId)?.name ||
                  "N/A"}
              </td>
              <td className="border px-4 py-2">{e.roshidNo || "-"}</td>
              <td className="border px-4 py-2">{e.cuttingRoshidNo || "-"}</td>
              <td className="border px-4 py-2">{e.note || "-"}</td>
              <td className="border px-4 py-2">
                {e.attachment ? (
                  <a
                    href={e.attachment}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                  >
                    View
                  </a>
                ) : (
                  "-"
                )}
              </td>
              <td
                className={`border px-4 py-2 font-medium ${
                  e.status === "PENDING"
                    ? "text-orange-700"
                    : e.status === "APPROVED"
                      ? "text-green-700"
                      : e.status === "REJECTED"
                        ? " text-red-700"
                        : ""
                }`}
              >
                {e.status || "-"}
              </td>
              <td className="border px-4 py-2 flex gap-5">
                <button
                  onClick={() => startEdit(e)}
                  className="bg-yellow-500 text-white px-2 py-1 rounded"
                >
                  Edit
                </button>
              </td>
              <td className="border px-4 py-2">{formatDateBn(e.createdAt)}</td>
              <td className="border px-4 py-2">{formatDateBn(e.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-center gap-3 mt-4">
        <button
          onClick={() => changePage(page - 1)}
          disabled={page === 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span className="px-2 py-1 border rounded">{page}</span>
        <button
          onClick={() => changePage(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
