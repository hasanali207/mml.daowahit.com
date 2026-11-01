"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/axios";
import { getPagination } from "@/lib/getPageNumber";
import { Check, Eye, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

/* ================= TYPES ================= */
type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

interface StudentInfo {
  id: string;
  code: string;
  name: string;
}

interface TeacherInfo {
  id: string;
  code?: string;
  name: string;
}

interface ILeave {
  id: string;
  studentId: string | null;
  teacherId: string | null;
  fromDate: string;
  toDate: string;
  reason: string;
  status: LeaveStatus;
  image: string;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  student: StudentInfo | null;
  teacher: TeacherInfo | null;
}

const STATUS_FILTERS = ["ALL", "PENDING", "APPROVED", "REJECTED"] as const;

/* ================= HELPERS ================= */
const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const STATUS_STYLES: Record<LeaveStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-accent text-white",
  REJECTED: "bg-red-100 text-accent",
};

/* ================= MAIN COMPONENT ================= */
const AllLeaves = () => {
  const [leaves, setLeaves] = useState<ILeave[]>([]);
  const [filteredLeaves, setFilteredLeaves] = useState<ILeave[]>([]);
  const [loading, setLoading] = useState(false);

  /* filter */
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTERS)[number]>("ALL");

  /* pagination */
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);
  const pages = getPagination(page, totalPages);

  /* view modal */
  const [open, setOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<ILeave | null>(null);

  /* action loading (approve/reject) */
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  /* ================= FETCH ================= */
  const fetchAllLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/leave?page=1&limit=2000`);
      setLeaves(res.data.data || []);
      setFilteredLeaves(res.data.data || []);
      setTotalPages(Math.ceil((res.data.data?.length || 0) / limit));
      setPage(1);
    } catch (err) {
      console.error("Fetch all leaves error:", err);
      toast.error("Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllLeaves();
  }, []);

  /* FILTER */
  useEffect(() => {
    const filtered = leaves.filter((l) =>
      statusFilter !== "ALL" ? l.status === statusFilter : true,
    );
    setFilteredLeaves(filtered);
    setTotalPages(Math.ceil(filtered.length / limit));
    setPage(1);
  }, [statusFilter, leaves]);

  const paginatedLeaves = filteredLeaves.slice(
    (page - 1) * limit,
    page * limit,
  );

  /* ================= VIEW ================= */
  const handleView = (leave: ILeave) => {
    setSelectedLeave(leave);
    setOpen(true);
  };

  const closeView = () => {
    setSelectedLeave(null);
    setOpen(false);
  };

  /* ================= APPROVE / REJECT ================= */
  const updateStatus = async (
    leave: ILeave,
    status: "APPROVED" | "REJECTED",
  ) => {
    setActionLoadingId(leave.id);
    try {
      const endpoint =
        status === "APPROVED"
          ? `/api/v1/leave/${leave.id}/approve`
          : `/api/v1/leave/${leave.id}/reject`;

      await api.patch(endpoint, { status });

      setLeaves((prev) =>
        prev.map((item) => (item.id === leave.id ? { ...item, status } : item)),
      );
      toast.success(
        status === "APPROVED"
          ? "Leave request approved"
          : "Leave request rejected",
      );
      closeView();
    } catch (err: any) {
      console.error("Update status error:", err);
      toast.error(
        err?.response?.data?.message || "Failed to update leave status",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/api/v1/leave/${id}`);
      toast.success("Leave request deleted");
      fetchAllLeaves();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  };

  /* ================= UI ================= */
  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Leave Management
      </h2>

      {/* FILTER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 bg-white p-5 rounded-xl shadow">
        <Select
          value={statusFilter}
          onValueChange={(v) =>
            setStatusFilter(v as (typeof STATUS_FILTERS)[number])
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "ALL"
                  ? "All statuses"
                  : s.charAt(0) + s.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full border text-sm min-w-[800px]">
          <thead className="bg-secondary text-white">
            <tr>
              {["Applicant", "From", "To", "Reason", "Status", "Action"].map(
                (h) => (
                  <th key={h} className="border p-2">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  Loading...
                </td>
              </tr>
            )}
            {!loading &&
              paginatedLeaves.map((l) => {
                const person = l.student ?? l.teacher;
                const isActionLoading = actionLoadingId === l.id;

                return (
                  <tr key={l.id} className="odd:bg-gray-50 hover:bg-blue-50">
                    <td className="border p-2">
                      <div className="font-medium">
                        {person?.name ?? "Unknown"}
                      </div>
                      {l.student && (
                        <div className="text-xs text-gray-500">
                          Roll: {l.student.code}
                        </div>
                      )}
                    </td>
                    <td className="border p-2">{formatDate(l.fromDate)}</td>
                    <td className="border p-2">{formatDate(l.toDate)}</td>
                    <td className="border p-2 max-w-[220px] truncate">
                      {l.reason}
                    </td>
                    <td className="border p-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[l.status]}`}
                      >
                        {l.status.charAt(0) + l.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="border p-2">
                      <div className="flex flex-col md:flex-row gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleView(l)}
                        >
                          <Eye />
                        </Button>
                        {l.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-accent text-white hover:bg-accent/90"
                              disabled={isActionLoading}
                              onClick={() => updateStatus(l, "APPROVED")}
                            >
                              <Check />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={isActionLoading}
                              onClick={() => updateStatus(l, "REJECTED")}
                            >
                              <X />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(l.id)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            {!loading && paginatedLeaves.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  No leave requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-10">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            Prev
          </button>

          <div className="flex items-center gap-1">
            {pages.map((item, index) =>
              item === "..." ? (
                <span
                  key={`dots-${index}`}
                  className="w-9 h-9 flex items-center justify-center text-gray-500"
                >
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item as number)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    page === item
                      ? "bg-green-600 text-white shadow-sm"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {item}
                </button>
              ),
            )}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

      {/* VIEW MODAL */}
      {open && selectedLeave && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Leave Request Details
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Applicant</p>
                <p className="font-medium">
                  {(selectedLeave.student ?? selectedLeave.teacher)?.name ??
                    "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[selectedLeave.status]}`}
                >
                  {selectedLeave.status.charAt(0) +
                    selectedLeave.status.slice(1).toLowerCase()}
                </span>
              </div>
              <div>
                <p className="text-gray-500">From</p>
                <p className="font-medium">
                  {formatDate(selectedLeave.fromDate)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">To</p>
                <p className="font-medium">
                  {formatDate(selectedLeave.toDate)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Applied on</p>
                <p className="font-medium">
                  {formatDate(selectedLeave.createdAt)}
                </p>
              </div>
              {selectedLeave.approvedAt && (
                <div>
                  <p className="text-gray-500">Decided on</p>
                  <p className="font-medium">
                    {formatDate(selectedLeave.approvedAt)}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4">
              <p className="text-gray-500 text-sm mb-1">Reason</p>
              <p className="text-sm border rounded-md p-3 bg-gray-50">
                {selectedLeave.reason}
              </p>
            </div>

            {selectedLeave.image && (
              <div className="mt-4">
                <p className="text-gray-500 text-sm mb-1">Attachment</p>
                <img
                  src={selectedLeave.image}
                  alt="Leave attachment"
                  className="rounded-md border max-h-64 object-contain"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={closeView}>
                Close
              </Button>
              {selectedLeave.status === "PENDING" && (
                <>
                  <Button
                    variant="destructive"
                    disabled={actionLoadingId === selectedLeave.id}
                    onClick={() => updateStatus(selectedLeave, "REJECTED")}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    className="bg-accent text-white hover:bg-accent/90"
                    disabled={actionLoadingId === selectedLeave.id}
                    onClick={() => updateStatus(selectedLeave, "APPROVED")}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllLeaves;
