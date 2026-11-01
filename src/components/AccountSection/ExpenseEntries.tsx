"use client";

import api from "@/lib/axios";
import { formatDateBn } from "@/utils/dateBn";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../ui/button";

type Category = { id: string; name: string };
type ExpenseEntry = {
  id: string;
  date: string;
  amount: number;
  summaryNo?: string;
  voucherNo?: string;
  note?: string;
  attachment?: string;
  categoryId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  categoryName: string;
};

export default function ExpenseEntriesUI() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);
  const [form, setForm] = useState({
    date: "",
    amount: "",
    summaryNo: "",
    voucherNo: "",
    note: "",
    attachment: "",
    categoryId: "",
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
    const res = await api.get("/api/v1/expense/categories");
    setCategories(res.data.data);
  };

  const fetchEntries = async () => {
    const res = await api.get(
      `/api/v1/expense/getaccountentries?page=${page}&limit=${limit}`,
    );
    const { data, meta } = res.data;
    setEntries(data || []);
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

      // Updated data object
      formData.append(
        "data",
        JSON.stringify({
          date: form.date,
          amount: Number(form.amount),
          summaryNo: form.summaryNo,
          voucherNo: form.voucherNo,
          note: form.note,
          categoryId: form.categoryId,
          attachment: form.attachment,
        }),
      );

      const url = editingId
        ? `/api/v1/expense/${editingId}`
        : "/api/v1/expense";

      await api({
        method: editingId ? "put" : "post",
        url,
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(editingId ? "Expense updated!" : "Expense added!");

      setForm({
        date: "",
        amount: "",
        summaryNo: "",
        voucherNo: "",
        note: "",
        attachment: "",
        categoryId: "",
      });
      setFileName("কোনো ছবি নির্বাচিত হয়নি");
      setEditingId(null);
      fetchEntries();
    } catch (err: any) {
      toast.error("Error: " + err.message);
    }
  };

  const startEdit = (entry: ExpenseEntry) => {
    setEditingId(entry.id);
    setForm({
      date: entry.date.split("T")[0],
      amount: entry.amount.toString(),
      summaryNo: entry.summaryNo || "",
      voucherNo: entry.voucherNo || "",
      note: entry.note || "",
      attachment: entry.attachment || "",
      categoryId: entry.categoryId,
    });
    setFileName(entry.attachment ? "Uploaded File" : "কোনো ছবি নির্বাচিত হয়নি");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      date: "",
      amount: "",
      summaryNo: "",
      voucherNo: "",
      note: "",
      attachment: "",
      categoryId: "",
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
        <h1 className="text-xl bangla"> ব্যয়ের হিসাব এন্ট্রি</h1>
        <Button>
          {" "}
          <Link href="/superadmin/accountant/accounts/pendingexpense">
            Pending Expnese Entry
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
            placeholder="সামারি নাম্বার"
            value={form.summaryNo}
            onChange={(e) => setForm({ ...form, summaryNo: e.target.value })}
            className="border p-2 rounded w-full"
          />
          <input
            type="text"
            placeholder="ভাউচার নাম্বার"
            value={form.voucherNo}
            onChange={(e) => setForm({ ...form, voucherNo: e.target.value })}
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

        {/* Attachment Upload UI */}
        <div className="flex flex-col mb-4">
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
            <div className="flex items-center justify-between px-4 py-2 border rounded-lg bg-gray-50 hover:border-red-500 cursor-pointer">
              <span className="truncate">{fileName}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-orange-600 text-white px-4 py-2 rounded"
          >
            {editingId ? "Update Expense" : "Add Expense"}
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

      {/* Entries Table */}
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-4 py-2">তারিখ</th>
            <th className="border px-4 py-2">টাকা</th>
            <th className="border px-4 py-2">খাতসমূহ</th>
            <th className="border px-4 py-2">সামারি ভাউচার নাম্বার</th>
            <th className="border px-4 py-2"> সংযুক্ত ভাউচার সংখ্যা</th>
            <th className="border px-4 py-2">নোট</th>
            <th className="border px-4 py-2">ছবি</th>
            <th className="border px-4 py-2">স্ট্যাটাস</th>
            <th className="border px-4 py-2">একশন</th>
            <th className="border px-4 py-2">এন্ট্রি তারিখ </th>
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
                  "-"}
              </td>
              <td className="border px-4 py-2">{e.summaryNo || "-"}</td>
              <td className="border px-4 py-2">{e.voucherNo || "-"}</td>
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
              <td className="border flex gap-3 px-4 py-2">
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

      {/* Pagination */}
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
