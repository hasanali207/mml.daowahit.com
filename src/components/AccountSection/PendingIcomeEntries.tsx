"use client";

import api from "@/lib/axios";
import { formatDateBn } from "@/utils/dateBn";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type Category = {
  id: string;
  name: string;
};

type IncomeEntry = {
  id: string;
  date: string;
  amount: number;
  note?: string;
  attachment?: string;
  categoryId?: string;
  createdAt: string;
  updatedAt: string;
  roshidNo?: string;
  cuttingRoshidNo?: string;
  categoryName?: string;
  status?: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
};

export default function PendingIncomeEntries() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [entries, setEntries] = useState<IncomeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  /* ================= FETCH CATEGORIES ================= */
  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/v1/income/categories");
      setCategories(res.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  /* ================= FETCH PENDING ENTRIES ================= */
  const fetchEntries = async () => {
    try {
      setLoading(true);

      const res = await api.get(
        `/api/v1/income/getincome/pending?page=${page}&limit=${limit}`,
      );
      const { data, meta } = res.data;
      setTotal(meta?.total || 0);
      setEntries(data || []); // আগের data.data বাদ
      setTotalPages(meta ? Math.ceil(meta.total / limit) : 1);
    } catch (error) {
      console.error(error);
      toast.error("Pending আয় লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };
  /* ================= APPROVE ================= */
  const handleApproved = async (id: string) => {
    try {
      const confirmApprove = window.confirm(
        "আপনি কি নিশ্চিতভাবে এই আয়টি APPROVE করতে চান?",
      );

      if (!confirmApprove) return;

      setApprovingId(id);

      await api.patch(`/api/v1/income/approvedincome/${id}`);

      toast.success("আয় সফলভাবে APPROVED হয়েছে");

      // refresh
      fetchEntries();
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.response?.data?.message || "আয় approve করতে সমস্যা হয়েছে",
      );
    } finally {
      setApprovingId(null);
    }
  };

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [page]);

  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  const handleDelete = async (id: string) => {
    console.log(id);
    try {
      const confirmDelete = window.confirm(
        "আপনি কি নিশ্চিতভাবে এই আয়টি মুছে ফেলতে চান?",
      );
      if (!confirmDelete) return;

      await api.delete(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/income/${id}`,
      );

      toast.success("আয় সফলভাবে মুছে ফেলা হয়েছে");

      // 🔄 list refresh
      fetchEntries(); // অথবা যেটা দিয়ে expense reload করো
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "আয় মুছে ফেলতে সমস্যা হয়েছে",
      );
    }
  };
  return (
    <div className="p-6">
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pending Income Approvals</h1>

          <p className="text-gray-500 text-sm mt-1">
            Pending income entries approve করুন
          </p>
        </div>

        <div className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg font-semibold">
          Pending: {total}
        </div>
      </div>

      {/* ================= LOADING ================= */}
      {loading ? (
        <div className="border rounded-lg p-10 text-center">
          <p className="text-lg font-medium">Loading...</p>
        </div>
      ) : total === 0 ? (
        /* ================= EMPTY ================= */
        <div className="border rounded-lg p-10 text-center">
          <p className="text-lg font-medium text-gray-600">
            কোনো Pending Income পাওয়া যায়নি
          </p>
        </div>
      ) : (
        /* ================= TABLE ================= */
        <div className="overflow-x-auto border rounded-xl">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="border px-4 py-3">তারিখ</th>
                <th className="border px-4 py-3">টাকা</th>
                <th className="border px-4 py-3">খাত</th>
                <th className="border px-4 py-3">রসিদ বই নং</th>
                <th className="border px-4 py-3">কর্তনকৃত রসিদ নং</th>
                <th className="border px-4 py-3">নোট</th>
                <th className="border px-4 py-3">ফাইল</th>
                <th className="border px-4 py-3">এন্ট্রি তারিখ</th>
                <th className="border px-4 py-3">আপডেট তারিখ</th>
                <th className="border px-4 py-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50 transition">
                  {/* DATE */}
                  <td className="border px-4 py-3 whitespace-nowrap">
                    {formatDateBn(e.date)}
                  </td>

                  {/* AMOUNT */}
                  <td className="border px-4 py-3 font-semibold">
                    ৳ {e.amount}
                  </td>

                  {/* CATEGORY */}
                  <td className="border px-4 py-3">
                    {e.categoryName ||
                      categories.find((c) => c.id === e.categoryId)?.name ||
                      "N/A"}
                  </td>

                  {/* ROSHID */}
                  <td className="border px-4 py-3">{e.roshidNo || "-"}</td>

                  {/* CUTTING ROSHID */}
                  <td className="border px-4 py-3">
                    {e.cuttingRoshidNo || "-"}
                  </td>

                  {/* NOTE */}
                  <td className="border px-4 py-3">{e.note || "-"}</td>

                  {/* FILE */}
                  <td className="border px-4 py-3">
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

                  {/* CREATED */}
                  <td className="border px-4 py-3 whitespace-nowrap">
                    {formatDateBn(e.createdAt)}
                  </td>

                  {/* UPDATED */}
                  <td className="border px-4 py-3 whitespace-nowrap">
                    {formatDateBn(e.updatedAt)}
                  </td>

                  {/* ACTION */}
                  <td className="border px-4 py-3">
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => handleApproved(e.id)}
                        disabled={approvingId === e.id}
                        className="bg-primary hover:bg-primary disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                      >
                        {approvingId === e.id ? "Approving..." : "Approve"}
                      </button>
                      <button
                        onClick={() => handleDelete(e.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
