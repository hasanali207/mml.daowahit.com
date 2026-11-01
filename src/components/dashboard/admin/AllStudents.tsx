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
import districtsData from "@/data/bd-districts.json";
import divisionsData from "@/data/bd-divisions.json";
import upazilasData from "@/data/bd-upazilas.json";
import { getPagination } from "@/lib/getPageNumber";
import { selectCurrentUser } from "@/Redux/Features/Auth/authSlice";
import { useAppSelector } from "@/Redux/hook";
import { ArrowLeft, ArrowRight, SquarePen, Trash2 } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

type GeoItem = { id: string; name: string; bn_name: string };
type DistrictItem = GeoItem & { division_id: string };
type UpazilaItem = GeoItem & { district_id: string };
/* ================= TYPES ================= */
interface IAddress {
  divisionId?: string;
  division?: string;

  districtId?: string;
  district?: string;

  thanaId?: string;
  thana?: string;

  village?: string;
  postOffice?: string;
}

interface IStudent {
  id: string;
  code?: string;
  name: string;
  currentClass?: string;
  fatherName?: string;
  motherName?: string;
  mobile1?: string;
  mobile2?: string;
  studentType?: string;
  admissionStatus?: string;
  presentAddress?: IAddress;
  permanentAddress?: IAddress;
  profilePicture?: string | File;
  isDeleted: boolean;
}

interface AddressType {
  division?: string;
  district?: string;
  thana?: string;
  village?: string;
  postOffice?: string;
}

interface AddressFieldProps {
  base: "presentAddress" | "permanentAddress";
  form: IStudent;
  handleChange: (field: string, value: string) => void;
}

/* ================= ADDRESS COMPONENT ================= */
const AddressFields = ({ base, form, handleChange }: AddressFieldProps) => {
  const addressObj = form[base] || {};
  const fieldClass = "w-full border rounded px-3 py-2 text-lg";

  /* ================= DIVISIONS (static, loaded once, instant) ================= */
  const divisions = useMemo(
    () => (divisionsData as { divisions: GeoItem[] }).divisions,
    [],
  );

  /* ================= DISTRICTS (derived synchronously, no fetch) ================= */
  const districts = useMemo(() => {
    if (!addressObj.divisionId) return [];
    return (districtsData as { districts: DistrictItem[] }).districts.filter(
      (d) => d.division_id === addressObj.divisionId,
    );
  }, [addressObj.divisionId]);

  /* ================= UPAZILAS (derived synchronously, no fetch) ================= */
  const thanas = useMemo(() => {
    if (!addressObj.districtId) return [];
    return (upazilasData as { upazilas: UpazilaItem[] }).upazilas.filter(
      (t) => t.district_id === addressObj.districtId,
    );
  }, [addressObj.districtId]);

  return (
    <div className="mt-2 grid grid-cols-1 gap-4 bangla">
      {/* ================= DIVISION ================= */}
      <div className="flex flex-col">
        <label className="mb-1">
          বিভাগ <span className="text-red-500">*</span>
        </label>
        <Select
          value={addressObj.divisionId}
          onValueChange={(id) => {
            const name = divisions.find((d) => d.id === id)?.bn_name || "";
            handleChange(`${base}.divisionId`, id);
            handleChange(`${base}.division`, name);
            // division পাল্টালে নিচের সব child field reset — synchronous, কোনো race condition নেই
            handleChange(`${base}.districtId`, "");
            handleChange(`${base}.district`, "");
            handleChange(`${base}.thanaId`, "");
            handleChange(`${base}.thana`, "");
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="বিভাগ নির্বাচন করুন" />
          </SelectTrigger>
          <SelectContent className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-lg z-50">
            {divisions.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.bn_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ================= DISTRICT ================= */}
      <div className="flex flex-col bangla">
        <label className="mb-1">
          জেলা <span className="text-red-500">*</span>
        </label>
        <Select
          value={addressObj.districtId}
          onValueChange={(id) => {
            const name = districts.find((d) => d.id === id)?.bn_name || "";
            handleChange(`${base}.districtId`, id);
            handleChange(`${base}.district`, name);
            handleChange(`${base}.thanaId`, "");
            handleChange(`${base}.thana`, "");
          }}
          disabled={!districts.length}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="জেলা নির্বাচন করুন" />
          </SelectTrigger>
          <SelectContent className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-lg z-50">
            {districts.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.bn_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ================= THANA ================= */}
      <div className="flex flex-col bangla">
        <label className="mb-1">
          থানা/উপজেলা <span className="text-red-500">*</span>
        </label>
        <Select
          value={addressObj.thanaId}
          onValueChange={(id) => {
            const name = thanas.find((t) => t.id === id)?.bn_name || "";
            handleChange(`${base}.thanaId`, id);
            handleChange(`${base}.thana`, name);
          }}
          disabled={!thanas.length}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="থানা/উপজেলা নির্বাচন করুন" />
          </SelectTrigger>
          <SelectContent className="w-full text-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-lg z-50">
            {thanas.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.bn_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ================= POST OFFICE ================= */}
      <div className="flex flex-col bangla">
        <label className="mb-1">
          পোস্ট অফিস <span className="text-red-500">*</span>
        </label>
        <Input
          className={fieldClass}
          value={addressObj.postOffice}
          onChange={(e) => handleChange(`${base}.postOffice`, e.target.value)}
        />
      </div>

      {/* ================= VILLAGE ================= */}
      <div className="flex flex-col bangla">
        <label className="mb-1">
          গ্রাম/মহল্লা <span className="text-red-500">*</span>
        </label>
        <Input
          className={fieldClass}
          value={addressObj.village}
          onChange={(e) => handleChange(`${base}.village`, e.target.value)}
        />
      </div>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */
const AllStudents = forwardRef((props, ref) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const isAdmin =
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "SUPER_ADMIN" ||
    currentUser?.role === "ACCOUNTANT";
  const [students, setStudents] = useState<IStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<IStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("কোনো ছবি নির্বাচিত হয়নি");

  /* filters */
  const [searchTerm, setSearchTerm] = useState("");
  const [code, setCode] = useState("");
  const [mobile1, setMobile1] = useState("");
  const [currentClass, setCurrentClass] = useState("all");

  /* pagination */
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);
  const pages = getPagination(page, totalPages);
  /* edit modal */
  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<IStudent | null>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/student?page=1&limit=2000`,
      );
      const data = await res.json();
      setStudents(data.data || []);
      setFilteredStudents(data.data || []);
      setTotalPages(Math.ceil((data.data?.length || 0) / limit));
      setPage(1);
    } catch (err) {
      console.error("Fetch all students error:", err);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    reload: fetchAllStudents,
  }));

  useEffect(() => {
    fetchAllStudents();
  }, []);

  /* FILTER */
  useEffect(() => {
    const filtered = students.filter((s) => {
      const matchName = searchTerm
        ? s.name.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      const matchCode = code
        ? s.code?.toLowerCase() === code.toLowerCase()
        : true;
      const matchMobile = mobile1 ? s.mobile1 === mobile1 : true;
      const matchClass =
        currentClass !== "all" ? s.currentClass === currentClass : true;
      return matchName && matchCode && matchMobile && matchClass;
    });
    setFilteredStudents(filtered);
    setTotalPages(Math.ceil(filtered.length / limit));
    setPage(1);
  }, [searchTerm, code, mobile1, currentClass, students]);

  const paginatedStudents = filteredStudents.slice(
    (page - 1) * limit,
    page * limit,
  );

  const handleEdit = (student: IStudent) => {
    setSelectedStudent({
      ...student,
      presentAddress: student.presentAddress || {},
      permanentAddress: student.permanentAddress || {},
    });
    setFileName(
      typeof student.profilePicture === "string"
        ? student.profilePicture
        : "কোনো ছবি নির্বাচিত হয়নি",
    );
    setOpen(true);
  };

  const cancelEdit = () => {
    setSelectedStudent(null);
    setFileName("কোনো ছবি নির্বাচিত হয়নি");
    setError(null);
    setOpen(false);
  };

  const handleChange = (field: string, value: string) => {
    if (!selectedStudent) return;
    const keys = field.split(".");
    const updated = { ...selectedStudent };
    let obj: any = updated;
    for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
    obj[keys[keys.length - 1]] = value;
    setSelectedStudent(updated);
  };

  const handleUpdate = async () => {
    if (!isAdmin) return toast.error("Only admin can delete");
    if (!selectedStudent) return;

    setUpdating(true);
    setError(null);

    try {
      const formData = new FormData();

      const mapIdToName = (address?: IAddress) => {
        if (!address) return {};
        const divisionName = address.division || "";
        const districtName = address.district || "";
        const thanaName = address.thana || "";
        return {
          division: divisionName,
          district: districtName,
          thana: thanaName,
          village: address.village || "",
          postOffice: address.postOffice || "",
        };
      };

      const data = {
        name: selectedStudent.name,
        fatherName: selectedStudent.fatherName || "",
        motherName: selectedStudent.motherName || "",
        mobile1: selectedStudent.mobile1 || "",
        mobile2: selectedStudent.mobile2 || "",
        currentClass: selectedStudent.currentClass || "",
        studentType: selectedStudent.studentType || "",
        admissionStatus: selectedStudent.admissionStatus || "",
        presentAddress: mapIdToName(selectedStudent.presentAddress),
        permanentAddress: mapIdToName(selectedStudent.permanentAddress),
        profilePicture:
          typeof selectedStudent.profilePicture === "string" &&
          selectedStudent.profilePicture.trim() !== ""
            ? selectedStudent.profilePicture
            : undefined,
      };

      formData.append("data", JSON.stringify(data));

      if (selectedStudent.profilePicture instanceof File) {
        formData.append("file", selectedStudent.profilePicture);
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/student/${selectedStudent.id}`,
        { method: "PUT", body: formData },
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result?.message || "Update failed");

      toast.success("Student updated successfully");
      cancelEdit();
      fetchAllStudents();
    } catch (err: any) {
      console.error("Update error:", err);
      setError(err?.message || "Something went wrong");
      toast.error(err?.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleSoftDelete = async (id: string) => {
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
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/student/soft/${id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Soft delete failed");
      toast.success("Student soft deleted");
      fetchAllStudents();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        All Students List
      </h2>

      {/* FILTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 bg-white p-5 rounded-xl shadow">
        <Input
          placeholder="Search Name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Input
          placeholder="Student Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Input
          placeholder="Mobile Number"
          value={mobile1}
          onChange={(e) => setMobile1(e.target.value)}
        />
        <Select value={currentClass} onValueChange={setCurrentClass}>
          <SelectTrigger>
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="প্রথম">প্রথম</SelectItem>
            <SelectItem value="দ্বিতীয়">দ্বিতীয়</SelectItem>
            <SelectItem value="তৃতীয়">তৃতীয়</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full border text-sm min-w-[800px]">
          <thead className="bg-secondary text-white">
            <tr>
              {[
                "Code",
                "Name",
                "Class",
                "Type",
                "Admission",
                "Mobile1",
                "Mobile2",
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
            {paginatedStudents.map((s) => (
              <tr key={s.id} className="odd:bg-gray-50 hover:bg-blue-50">
                <td className="border p-2">{s.code}</td>
                <td className="border p-2">{s.name}</td>
                <td className="border p-2">{s.currentClass}</td>
                <td className="border p-2">{s.studentType}</td>
                <td className="border p-2">{s.admissionStatus}</td>
                <td className="border p-2">{s.mobile1}</td>
                <td className="border p-2">{s.mobile2}</td>
                <td className="border p-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      s.isDeleted
                        ? "bg-red-100 text-accent"
                        : "bg-accent text-white"
                    }`}
                  >
                    {s.isDeleted ? "Deleted" : "Active"}
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
                      disabled={s.isDeleted}
                      onClick={() => handleSoftDelete(s.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedStudents.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-4">
                  No students found
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
            <ArrowLeft /> Prev
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
            Next <ArrowRight />
          </button>
        </div>
      )}

      {/* EDIT MODAL */}
      {open && selectedStudent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">শিক্ষা তথ্য আপডেট!</h3>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Basic Info */}
              <div>
                <Input
                  placeholder="Name"
                  value={selectedStudent.name}
                  onChange={(e) =>
                    setSelectedStudent({
                      ...selectedStudent,
                      name: e.target.value,
                    })
                  }
                />
                <Input
                  className="mt-3"
                  placeholder="Father Name"
                  value={selectedStudent.fatherName || ""}
                  onChange={(e) =>
                    setSelectedStudent({
                      ...selectedStudent,
                      fatherName: e.target.value,
                    })
                  }
                />
                <Input
                  className="mt-3"
                  placeholder="Mother Name"
                  value={selectedStudent.motherName || ""}
                  onChange={(e) =>
                    setSelectedStudent({
                      ...selectedStudent,
                      motherName: e.target.value,
                    })
                  }
                />
                <Input
                  className="mt-3"
                  placeholder="Mobile 1"
                  value={selectedStudent.mobile1 || ""}
                  onChange={(e) =>
                    setSelectedStudent({
                      ...selectedStudent,
                      mobile1: e.target.value,
                    })
                  }
                />
                <Input
                  className="mt-3"
                  placeholder="Mobile 2"
                  value={selectedStudent.mobile2 || ""}
                  onChange={(e) =>
                    setSelectedStudent({
                      ...selectedStudent,
                      mobile2: e.target.value,
                    })
                  }
                />
              </div>

              {/* Present Address */}
              <AddressFields
                base="presentAddress"
                form={selectedStudent}
                handleChange={handleChange}
              />

              {/* Permanent Address */}
              <AddressFields
                base="permanentAddress"
                form={selectedStudent}
                handleChange={handleChange}
              />
            </div>

            {/* PROFILE PICTURE */}
            <div className="flex flex-col mt-5">
              <label className="mb-2 font-medium">Profile Picture</label>
              <div className="relative w-full max-w-[300px]">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedStudent({
                        ...selectedStudent,
                        profilePicture: e.target.files[0],
                      });
                      setFileName(e.target.files[0].name);
                    } else setFileName("কোনো ছবি নির্বাচিত হয়নি");
                  }}
                />
                <div className="flex items-center justify-between px-4 py-2 border rounded-lg bg-gray-50 hover:border-red-500 cursor-pointer">
                  <span className="truncate">{fileName}</span>
                </div>
              </div>
              {selectedStudent.profilePicture && (
                <img
                  src={
                    typeof selectedStudent.profilePicture === "string"
                      ? selectedStudent.profilePicture
                      : URL.createObjectURL(selectedStudent.profilePicture)
                  }
                  alt="Profile"
                  className="w-24 h-24 mt-2 object-cover rounded-full"
                />
              )}
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
});

AllStudents.displayName = "AllStudents";
export default AllStudents;
