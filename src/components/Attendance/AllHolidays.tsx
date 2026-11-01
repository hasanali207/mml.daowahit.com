"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/axios";
import { getPagination } from "@/lib/getPageNumber";
import { SquarePen, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

/* ================= TYPES ================= */
const HOLIDAY_TYPES = ["HOLIDAY", "WEEKEND", "EVENT"] as const;
type HolidayType = (typeof HOLIDAY_TYPES)[number];

interface IHoliday {
  id: string;
  title: string;
  description: string;
  date: string;
  type: HolidayType;
  isActive: boolean;
  createdAt?: string;
}

/* ================= HELPERS ================= */
const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const toDateInputValue = (value: string) => value?.slice(0, 10) || "";

const TYPE_STYLES: Record<HolidayType, string> = {
  HOLIDAY: "bg-sky-100 text-sky-800",
  WEEKEND: "bg-slate-100 text-slate-800",
  EVENT: "bg-amber-100 text-amber-800",
};

/* ================= MAIN COMPONENT ================= */
const AllHolidays = () => {
  const [holidays, setHolidays] = useState<IHoliday[]>([]);
  const [filteredHolidays, setFilteredHolidays] = useState<IHoliday[]>([]);
  const [loading, setLoading] = useState(false);

  /* create form */
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<HolidayType>("HOLIDAY");
  const [creating, setCreating] = useState(false);

  /* filter */
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | HolidayType>("ALL");

  /* pagination */
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);
  const pages = getPagination(page, totalPages);

  /* edit modal */
  const [open, setOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<IHoliday | null>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ================= FETCH ================= */
  const fetchAllHolidays = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/holiday?page=1&limit=2000`,
      );
      const data = await res.json();
      setHolidays(data.data || []);
      setFilteredHolidays(data.data || []);
      setTotalPages(Math.ceil((data.data?.length || 0) / limit));
      setPage(1);
    } catch (err) {
      console.error("Fetch all holidays error:", err);
      toast.error("Failed to load holidays");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllHolidays();
  }, []);

  /* FILTER */
  useEffect(() => {
    const filtered = holidays.filter((h) => {
      const matchTitle = searchTerm
        ? h.title.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      const matchType = typeFilter !== "ALL" ? h.type === typeFilter : true;
      return matchTitle && matchType;
    });
    setFilteredHolidays(filtered);
    setTotalPages(Math.ceil(filtered.length / limit));
    setPage(1);
  }, [searchTerm, typeFilter, holidays]);

  const paginatedHolidays = filteredHolidays.slice(
    (page - 1) * limit,
    page * limit,
  );

  /* ================= CREATE ================= */
  const handleCreate = async () => {
    if (!title || !date) {
      return toast.error("Title, Date দিন");
    }

    setCreating(true);
    try {
      const res = await api.post("/api/v1/holiday", {
        title,
        description,
        date,
        type,
      });

      if (!res.data?.success)
        throw new Error(res.data?.message || "Holiday create failed");

      toast.success("Holiday created successfully");
      setTitle("");
      setDescription("");
      setDate("");
      setType("HOLIDAY");
      fetchAllHolidays();
    } catch (err: any) {
      console.error("Create holiday error:", err);
      const message =
        err?.response?.data?.message || err?.message || "Something went wrong";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (holiday: IHoliday) => {
    setSelectedHoliday({ ...holiday });
    setOpen(true);
  };

  const cancelEdit = () => {
    setSelectedHoliday(null);
    setError(null);
    setOpen(false);
  };

  const handleUpdate = async () => {
    if (!selectedHoliday) return;

    setUpdating(true);
    setError(null);

    try {
      const res = await api.patch(`/api/v1/holiday/${selectedHoliday.id}`, {
        title: selectedHoliday.title,
        description: selectedHoliday.description,
        date: selectedHoliday.date,
        type: selectedHoliday.type,
      });

      if (!res.data?.success)
        throw new Error(res.data?.message || "Update failed");

      toast.success("Holiday updated successfully");
      cancelEdit();
      fetchAllHolidays();
    } catch (err: any) {
      console.error("Update error:", err);
      const message =
        err?.response?.data?.message || err?.message || "Update failed";
      setError(message);
      toast.error(message);
    } finally {
      setUpdating(false);
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
      const res = await api.delete(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/holiday/${id}`,
      );
      toast.success("Holiday deleted");
      fetchAllHolidays();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Holiday Management
      </h2>

      {/* CREATE FORM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8 bg-white p-5 rounded-xl shadow items-end">
        <div className="flex flex-col">
          <label className="mb-1 text-sm">
            Title <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="e.g. Eid-ul-Adha"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-sm">Description</label>
          <Input
            placeholder="e.g. Government Holiday"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-sm">
            Date <span className="text-red-500">*</span>
          </label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-sm">
            Type <span className="text-red-500">*</span>
          </label>
          <Select value={type} onValueChange={(v) => setType(v as HolidayType)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {HOLIDAY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreate} disabled={creating}>
          {creating ? "Creating..." : "Add Holiday"}
        </Button>
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Input
          placeholder="Search Title"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as "ALL" | HolidayType)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            {HOLIDAY_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t.charAt(0) + t.slice(1).toLowerCase()}
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
              {["Title", "Description", "Date", "Type", "Status", "Action"].map(
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
              paginatedHolidays.map((h) => (
                <tr key={h.id} className="odd:bg-gray-50 hover:bg-blue-50">
                  <td className="border p-2 font-medium">{h.title}</td>
                  <td className="border p-2 max-w-[220px] truncate">
                    {h.description}
                  </td>
                  <td className="border p-2">{formatDate(h.date)}</td>
                  <td className="border p-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${TYPE_STYLES[h.type]}`}
                    >
                      {h.type.charAt(0) + h.type.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="border p-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        h.isActive
                          ? "bg-accent text-white"
                          : "bg-red-100 text-accent"
                      }`}
                    >
                      {h.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="border p-2">
                    <div className="flex flex-col md:flex-row gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(h)}
                      >
                        <SquarePen />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(h.id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && paginatedHolidays.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  No holidays found
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

      {/* EDIT MODAL */}
      {open && selectedHoliday && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Update Holiday</h3>
            {error && <div className="text-red-600 mb-2">{error}</div>}

            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm">Title</label>
                <Input
                  value={selectedHoliday.title}
                  onChange={(e) =>
                    setSelectedHoliday({
                      ...selectedHoliday,
                      title: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm">Description</label>
                <Input
                  value={selectedHoliday.description}
                  onChange={(e) =>
                    setSelectedHoliday({
                      ...selectedHoliday,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm">Date</label>
                <Input
                  type="date"
                  value={toDateInputValue(selectedHoliday.date)}
                  onChange={(e) =>
                    setSelectedHoliday({
                      ...selectedHoliday,
                      date: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm">Type</label>
                <Select
                  value={selectedHoliday.type}
                  onValueChange={(v) =>
                    setSelectedHoliday({
                      ...selectedHoliday,
                      type: v as HolidayType,
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOLIDAY_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.charAt(0) + t.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedHoliday.isActive}
                  onChange={(e) =>
                    setSelectedHoliday({
                      ...selectedHoliday,
                      isActive: e.target.checked,
                    })
                  }
                />
                Active
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updating}>
                {updating ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllHolidays;
