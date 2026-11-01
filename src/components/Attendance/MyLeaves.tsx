"use client";

import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { Eye, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

interface ILeave {
  id: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: LeaveStatus;
  image?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
}

const STATUS_STYLES: Record<LeaveStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const MyLeaves = () => {
  const [leaves, setLeaves] = useState<ILeave[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ILeave | null>(null);

  const fetchMyLeaves = async () => {
    try {
      setLoading(true);

      const res = await api.get("/api/v1/leave/my-leaves?page=1&limit=100");

      setLeaves(res.data.data || []);
    } catch (err: any) {
      console.error(err);

      toast.error(err?.response?.data?.message || "Failed to load your leaves");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Delete leave?",
      text: "You cannot undo this action.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/api/v1/leave/my-leaves/${id}`);

      toast.success("Leave deleted");

      fetchMyLeaves();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete leave");
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-8">
      <div className="bg-white border rounded-2xl shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">My Leave Applications</h2>

          <p className="text-sm text-gray-500 mt-1">
            View your leave application history
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4">From</th>

                <th className="text-left p-4">To</th>

                <th className="text-left p-4">Reason</th>

                <th className="text-left p-4">Status</th>

                <th className="text-left p-4">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    Loading...
                  </td>
                </tr>
              )}

              {!loading &&
                leaves.map((leave) => (
                  <tr key={leave.id} className="border-t hover:bg-gray-50">
                    <td className="p-4">{formatDate(leave.fromDate)}</td>

                    <td className="p-4">{formatDate(leave.toDate)}</td>

                    <td className="p-4 max-w-[250px] truncate">
                      {leave.reason}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          STATUS_STYLES[leave.status]
                        }`}
                      >
                        {leave.status}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelected(leave)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {leave.status === "PENDING" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(leave.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

              {!loading && leaves.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-500">
                    No leave applications found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW MODAL */}

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Leave Details</h3>

              <button
                onClick={() => setSelected(null)}
                className="text-gray-500 hover:text-black text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">From</p>

                  <p className="font-medium">{formatDate(selected.fromDate)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">To</p>

                  <p className="font-medium">{formatDate(selected.toDate)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Status</p>

                <span
                  className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                    STATUS_STYLES[selected.status]
                  }`}
                >
                  {selected.status}
                </span>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Reason</p>

                <div className="border rounded-lg p-3 bg-gray-50">
                  {selected.reason}
                </div>
              </div>

              {selected.approvedBy && (
                <div>
                  <p className="text-sm text-gray-500">Approved/Rejected By</p>

                  <p className="font-medium">{selected.approvedBy}</p>
                </div>
              )}

              {selected.approvedAt && (
                <div>
                  <p className="text-sm text-gray-500">Decision Date</p>

                  <p className="font-medium">
                    {formatDate(selected.approvedAt)}
                  </p>
                </div>
              )}

              {selected.image && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Attachment</p>

                  <img
                    src={selected.image}
                    alt="Leave attachment"
                    className="max-h-60 rounded-lg border object-contain"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyLeaves;
