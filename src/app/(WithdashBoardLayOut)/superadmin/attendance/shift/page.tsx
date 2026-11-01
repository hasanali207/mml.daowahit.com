"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPagination } from "@/lib/getPageNumber";
import { SquarePen, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

/* ================= TYPES ================= */
interface IShift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  lateAfterMinutes: number;
  isActive: boolean;
  createdAt?: string;
}

/* ================= HELPERS (time <-> input value) ================= */
// DB e ase "1970-01-01T08:00:00.000Z" format, input type="time" chay "08:00"
const toTimeInputValue = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

// input value "08:00" -> "1970-01-01T08:00:00.000Z"
const toIsoTime = (value: string) => {
  if (!value) return "";
  return `1970-01-01T${value}:00.000Z`;
};

/* ================= MAIN COMPONENT ================= */
const AllShifts = () => {
  const [shifts, setShifts] = useState<IShift[]>([]);
  const [filteredShifts, setFilteredShifts] = useState<IShift[]>([]);
  const [loading, setLoading] = useState(false);

  /* create form */
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [lateAfterMinutes, setLateAfterMinutes] = useState("15");
  const [creating, setCreating] = useState(false);

  /* filter */
  const [searchTerm, setSearchTerm] = useState("");

  /* pagination */
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);
  const pages = getPagination(page, totalPages);

  /* edit modal */
  const [open, setOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<IShift | null>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ================= FETCH ================= */
  const fetchAllShifts = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/shift?page=1&limit=2000`,
      );
      const data = await res.json();
      setShifts(data.data || []);
      setFilteredShifts(data.data || []);
      setTotalPages(Math.ceil((data.data?.length || 0) / limit));
      setPage(1);
    } catch (err) {
      console.error("Fetch all shifts error:", err);
      toast.error("Failed to load shifts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllShifts();
  }, []);

  /* FILTER */
  useEffect(() => {
    const filtered = shifts.filter((s) =>
      searchTerm
        ? s.name.toLowerCase().includes(searchTerm.toLowerCase())
        : true,
    );
    setFilteredShifts(filtered);
    setTotalPages(Math.ceil(filtered.length / limit));
    setPage(1);
  }, [searchTerm, shifts]);

  const paginatedShifts = filteredShifts.slice(
    (page - 1) * limit,
    page * limit,
  );

  /* ================= CREATE ================= */
  const handleCreate = async () => {
    if (!name || !startTime || !endTime) {
      return toast.error("Name, Start Time, End Time দিন");
    }

    setCreating(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/shift`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            startTime: toIsoTime(startTime),
            endTime: toIsoTime(endTime),
            lateAfterMinutes: Number(lateAfterMinutes) || 15,
          }),
        },
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result?.message || "Shift create failed");

      toast.success("Shift created successfully");
      setName("");
      setStartTime("");
      setEndTime("");
      setLateAfterMinutes("15");
      fetchAllShifts();
    } catch (err: any) {
      console.error("Create shift error:", err);
      toast.error(err?.message || "Something went wrong");
    } finally {
      setCreating(false);
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (shift: IShift) => {
    setSelectedShift({ ...shift });
    setOpen(true);
  };

  const cancelEdit = () => {
    setSelectedShift(null);
    setError(null);
    setOpen(false);
  };

  const handleUpdate = async () => {
    if (!selectedShift) return;

    setUpdating(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/shift/${selectedShift.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: selectedShift.name,
            startTime: toIsoTime(toTimeInputValue(selectedShift.startTime)),
            endTime: toIsoTime(toTimeInputValue(selectedShift.endTime)),
            lateAfterMinutes: Number(selectedShift.lateAfterMinutes) || 15,
            isActive: selectedShift.isActive,
          }),
        },
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result?.message || "Update failed");

      toast.success("Shift updated successfully");
      cancelEdit();
      fetchAllShifts();
    } catch (err: any) {
      console.error("Update error:", err);
      setError(err?.message || "Something went wrong");
      toast.error(err?.message || "Update failed");
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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/shift/${id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Shift deleted");
      fetchAllShifts();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Shift Management
      </h2>

      {/* CREATE FORM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8 bg-white p-5 rounded-xl shadow items-end">
        <div className="flex flex-col">
          <label className="mb-1 text-sm">
            Name <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="e.g. Morning"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-sm">
            Start Time <span className="text-red-500">*</span>
          </label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-sm">
            End Time <span className="text-red-500">*</span>
          </label>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-1 text-sm">Late After (min)</label>
          <Input
            type="number"
            value={lateAfterMinutes}
            onChange={(e) => setLateAfterMinutes(e.target.value)}
          />
        </div>
        <Button onClick={handleCreate} disabled={creating}>
          {creating ? "Creating..." : "Add Shift"}
        </Button>
      </div>

      {/* SEARCH */}
      <div className="mb-4">
        <Input
          placeholder="Search Shift Name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full border text-sm min-w-[700px]">
          <thead className="bg-secondary text-white">
            <tr>
              {[
                "Name",
                "Start Time",
                "End Time",
                "Late After",
                "Status",
                "Action",
              ].map((h) => (
                <th key={h} className="border p-2">
                  {h}
                </th>
              ))}
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
              paginatedShifts.map((s) => (
                <tr key={s.id} className="odd:bg-gray-50 hover:bg-blue-50">
                  <td className="border p-2">{s.name}</td>
                  <td className="border p-2">
                    {toTimeInputValue(s.startTime)}
                  </td>
                  <td className="border p-2">{toTimeInputValue(s.endTime)}</td>
                  <td className="border p-2">{s.lateAfterMinutes} min</td>
                  <td className="border p-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        s.isActive
                          ? "bg-accent text-white"
                          : "bg-red-100 text-accent"
                      }`}
                    >
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="border p-2">
                    <div className="flex flex-col md:flex-row gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(s)}
                      >
                        <SquarePen />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(s.id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && paginatedShifts.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4">
                  No shifts found
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
      {open && selectedShift && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Update Shift</h3>
            {error && <div className="text-red-600 mb-2">{error}</div>}

            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm">Name</label>
                <Input
                  value={selectedShift.name}
                  onChange={(e) =>
                    setSelectedShift({ ...selectedShift, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm">Start Time</label>
                <Input
                  type="time"
                  value={toTimeInputValue(selectedShift.startTime)}
                  onChange={(e) =>
                    setSelectedShift({
                      ...selectedShift,
                      startTime: toIsoTime(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm">End Time</label>
                <Input
                  type="time"
                  value={toTimeInputValue(selectedShift.endTime)}
                  onChange={(e) =>
                    setSelectedShift({
                      ...selectedShift,
                      endTime: toIsoTime(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm">Late After (min)</label>
                <Input
                  type="number"
                  value={selectedShift.lateAfterMinutes}
                  onChange={(e) =>
                    setSelectedShift({
                      ...selectedShift,
                      lateAfterMinutes: Number(e.target.value),
                    })
                  }
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedShift.isActive}
                  onChange={(e) =>
                    setSelectedShift({
                      ...selectedShift,
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

export default AllShifts;
