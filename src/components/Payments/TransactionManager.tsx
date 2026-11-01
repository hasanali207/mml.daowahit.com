"use client";

import api from "@/lib/axios";
import { generateTransactionPayload } from "@/utils/TransactionPayload";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function TransactionManager() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);

  const [editData, setEditData] = useState<any>(null);
  const [editItems, setEditItems] = useState<any[]>([]);

  const fetchTransactions = async () => {
    try {
      const res = await api.get(
        `/api/v1/paymentreport/transaction/all/trans?page=${page}&limit=${limit}`,
      );
      const { data, meta } = res.data;
      setTransactions(data || []);
      setTotalPages(meta ? Math.ceil(meta.total / limit) : 1);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page]);

  const changePage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setLoading(true);
    setPage(newPage);
  };

  const openEdit = (t: any) => {
    if (!t.id) {
      alert("Transaction has no ID!");
      return;
    }
    setEditData(t); // <-- এখানে ID আছে কি নিশ্চিত কর
    setEditItems(t.items || []);
  };

  const changeAmount = (index: number, value: number) => {
    const updated = [...editItems];
    updated[index].amount = value;
    setEditItems(updated);
  };

  const getItemName = (item: any) => {
    if (item.paymentItem) return item.paymentItem.feeCategory?.name;
    if (item.donationItem) return item.donationItem.title;
    if (item.monthlyInvoice) return "Monthly Donation";
    return "-";
  };
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditData(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const updateTransaction = async () => {
    if (!editData?.id) {
      alert("Transaction ID missing!");
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "success",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Updated it!",
    });

    if (!result.isConfirmed) return;

    const payload = generateTransactionPayload(editData, editItems);

    try {
      await api.patch(`/api/v1/paymenttransaction/${editData.id}`, payload);
      Swal.fire("Updated!", "Trnasaction সফলভাবে আপডেট হয়েছে।", "success");
      setEditData(null);
      fetchTransactions();
    } catch (error: any) {
      console.error("Backend Error:", error.response?.data || error.message);
      alert(
        "Update failed: " + (error.response?.data?.message || error.message),
      );
    }
  };

  const getName = (t: any) => {
    if (t.source === "STUDENT") return t.student?.name ?? "-";

    if (t.source === "DONATION")
      return t.items?.[0]?.donationItem?.donation?.donorName ?? "-";

    if (t.source === "MONTHLY_DONATION")
      return t.items?.[0]?.monthlyInvoice?.donor?.donor?.name ?? "-";

    return "-";
  };

  const total = editItems.reduce((sum, i) => sum + Number(i.amount || 0), 0);

  if (loading)
    return <div className="p-6 text-center text-gray-500">লোড হচ্ছে...</div>;
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Transaction Manager</h1>

      {/* Filter Section */}

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">#</th>
              <th className="p-2 border">Source</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Amount</th>
              <th className="p-2 border">Method</th>
              <th className="p-2 border">Receipt</th>
              <th className="p-2 border">Action</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((t, index) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="border p-2">{(page - 1) * limit + index + 1}</td>

                <td className="border p-2">{t.source}</td>

                <td className="border p-2">{getName(t)}</td>

                <td className="border p-2">{t.totalAmount} ৳</td>

                <td className="border p-2">{t.method}</td>

                <td className="border p-2">{t.roshidNo}</td>

                <td className="border p-2 text-center space-x-2">
                  <button
                    onClick={() => openEdit(t)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

      {/* Edit Modal */}

      {editData && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setEditData(null)}
        >
          <div
            className="bg-white p-6 rounded w-[650px] space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setEditData(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl"
            >
              ✕
            </button>

            <h2 className="text-lg font-semibold">
              Edit Transaction #{editData.roshidNo}
            </h2>

            <table className="w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">Item</th>
                  <th className="border p-2">Amount</th>
                </tr>
              </thead>

              <tbody>
                {editItems.map((item, index) => (
                  <tr key={index}>
                    <td className="border p-2">{getItemName(item)}</td>

                    <td className="border p-2">
                      <input
                        type="number"
                        className="border p-1 w-32"
                        value={item.amount}
                        onChange={(e) =>
                          changeAmount(index, Number(e.target.value))
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-right font-semibold">Total: {total} ৳</div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditData(null)}
                className="px-4 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded"
              >
                Cancel
              </button>

              <button
                onClick={updateTransaction}
                className="px-4 py-1 bg-primary hover:bg-primary text-white rounded"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
