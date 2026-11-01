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
import { useCurrentToken } from "@/Redux/Features/Auth/authSlice";

import { ArrowLeft, ArrowRight, Eye, Trash2 } from "lucide-react";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";

import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";

import districtsData from "@/data/bd-districts.json";
import divisionsData from "@/data/bd-divisions.json";
import upazilasData from "@/data/bd-upazilas.json";

import { getErrorMessage } from "@/lib/getErrorMessage ";
import { getPagination } from "@/lib/getPageNumber";

/* =========================================================
   TYPES
========================================================= */

type GeoItem = {
  id: string;
  name: string;
  bn_name: string;
};

type DistrictItem = GeoItem & {
  division_id: string;
};

type UpazilaItem = GeoItem & {
  district_id: string;
};

interface AddressType {
  divisionId: string;
  division: string;

  districtId: string;
  district: string;

  thanaId: string;
  thana: string;

  village: string;
  postOffice: string;
}

interface ITeacher {
  id: string;

  code: string;
  username: string;

  name: string;
  designation?: string;
  qualification?: string;
  jimmadarClass?: string;

  joinDate?: string;
  dateOfBirth?: string;

  fatherName?: string;
  motherName?: string;
  NIDNO?: string;

  email?: string;
  mobile1?: string;
  mobile2?: string;

  profilePicture?: string | File;

  basicSalary?: number;

  presentAddress?: AddressType;
  permanentAddress?: AddressType;

  status?: string;
  admissionStatus?: string;
}

interface AddressFieldProps {
  base: "presentAddress" | "permanentAddress";
  form: ITeacher;
  handleChange: (field: string, value: string) => void;
}

/* =========================================================
   ADDRESS COMPONENT
========================================================= */

const AddressFields = ({ base, form, handleChange }: AddressFieldProps) => {
  const addressObj = (form[base] ?? {}) as AddressType;

  const fieldClass = "w-full border rounded px-3 py-2 text-lg";

  /* ================= DIVISIONS ================= */

  const divisions = useMemo(
    () => (divisionsData as { divisions: GeoItem[] }).divisions,
    [],
  );

  /* ================= DISTRICTS ================= */

  const districts = useMemo(() => {
    if (!addressObj.divisionId) return [];

    return (districtsData as { districts: DistrictItem[] }).districts.filter(
      (d) => d.division_id === addressObj.divisionId,
    );
  }, [addressObj.divisionId]);

  /* ================= UPAZILAS ================= */

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
          value={addressObj.postOffice || ""}
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
          value={addressObj.village || ""}
          onChange={(e) => handleChange(`${base}.village`, e.target.value)}
        />
      </div>
    </div>
  );
};

/* =========================================================
   ALL TEACHERS
========================================================= */

const AllTeachers = forwardRef((props, ref) => {
  const token = useSelector(useCurrentToken);

  /* =======================================================
     STATE
  ======================================================= */

  const [isEditMode, setIsEditMode] = useState(false);

  const [teachers, setTeachers] = useState<ITeacher[]>([]);

  const [loading, setLoading] = useState(false);

  const [searchName, setSearchName] = useState("");

  const [searchCode, setSearchCode] = useState("");

  const [searchMobile, setSearchMobile] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [page, setPage] = useState(1);

  const [limit] = useState(20);

  const [totalPages, setTotalPages] = useState(1);

  const [open, setOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [selectedTeacher, setSelectedTeacher] = useState<ITeacher | null>(null);

  const [updating, setUpdating] = useState(false);

  const pages = getPagination(page, totalPages);

  /* =======================================================
     FETCH TEACHERS
     SERVER SIDE PAGINATION + SEARCH + FILTER
  ======================================================= */

  const fetchTeachers = async () => {
    if (!token) return;

    setLoading(true);

    try {
      const params = new URLSearchParams();

      /* Pagination */

      params.set("page", String(page));
      params.set("limit", String(limit));

      /* Search */

      if (searchName.trim()) {
        params.set("searchTerm", searchName.trim());
      }

      /*
       * Code/mobile/status are sent as backend
       * filter fields.
       */

      if (searchCode.trim()) {
        params.set("code", searchCode.trim());
      }

      if (searchMobile.trim()) {
        params.set("mobile1", searchMobile.trim());
      }

      if (statusFilter !== "all") {
        params.set("admissionStatus", statusFilter);
      }

      const res = await api.get(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/teacher?${params.toString()}`,
      );

      const list = res.data?.data || [];

      const total = Number(res.data?.meta?.total) || 0;

      setTeachers(list);

      /*
       * IMPORTANT:
       * totalPages must come from backend total,
       * NOT list.length.
       */

      setTotalPages(Math.max(1, Math.ceil(total / limit)));

      /*
       * If current page becomes invalid
       * after search/filter, move to last
       * available page.
       */

      const calculatedTotalPages = Math.max(1, Math.ceil(total / limit));

      if (page > calculatedTotalPages) {
        setPage(calculatedTotalPages);
      }
    } catch (err) {
      console.error(err);

      toast.error("শিক্ষকদের তালিকা লোড হয়নি");
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     IMPERATIVE RELOAD
  ======================================================= */

  useImperativeHandle(ref, () => ({
    reload: fetchTeachers,
  }));

  /* =======================================================
     FETCH WHEN PAGE / SEARCH / FILTER CHANGES
  ======================================================= */

  useEffect(() => {
    if (!token) return;

    fetchTeachers();
  }, [page, searchName, searchCode, searchMobile, statusFilter, token]);

  /* =======================================================
     RESET PAGE WHEN SEARCH / FILTER CHANGES
  ======================================================= */

  useEffect(() => {
    /*
     * Don't reset on initial render.
     * Search/filter change should always start
     * from page 1.
     */

    setPage(1);
  }, [searchName, searchCode, searchMobile, statusFilter]);

  /* =======================================================
     DATE FORMAT
  ======================================================= */

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString("en-GB") : "-";

  /* =======================================================
     DELETE
  ======================================================= */

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
      await api.delete(`/api/v1/teacher/soft/${id}`);

      toast.success("Teacher Deleted");

      /*
       * Reload current page.
       * Backend will return updated total.
       */

      fetchTeachers();
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    }
  };

  /* =======================================================
     EDIT
  ======================================================= */

  const handleEdit = (teacher: ITeacher) => {
    setSelectedTeacher({
      ...teacher,

      presentAddress: teacher.presentAddress || {
        divisionId: "",
        division: "",
        districtId: "",
        district: "",
        thanaId: "",
        thana: "",
        village: "",
        postOffice: "",
      },

      permanentAddress: teacher.permanentAddress || {
        divisionId: "",
        division: "",
        districtId: "",
        district: "",
        thanaId: "",
        thana: "",
        village: "",
        postOffice: "",
      },
    });

    setIsEditMode(false);
    setOpen(true);
  };

  /* =======================================================
     CANCEL EDIT
  ======================================================= */

  const cancelEdit = () => {
    setSelectedTeacher(null);
    setError(null);
    setOpen(false);
  };

  /* =======================================================
     HANDLE NESTED CHANGE
  ======================================================= */

  const handleChange = (field: string, value: string) => {
    if (!selectedTeacher) return;

    const keys = field.split(".");

    const updated = {
      ...selectedTeacher,
    };

    let obj: any = updated;

    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }

    obj[keys[keys.length - 1]] = value;

    setSelectedTeacher(updated);
  };

  /* =======================================================
     UPDATE
  ======================================================= */

  const handleUpdate = async () => {
    if (!selectedTeacher) return;

    try {
      setUpdating(true);

      const formData = new FormData();

      const payload = {
        name: selectedTeacher.name,
        designation: selectedTeacher.designation,
        qualification: selectedTeacher.qualification,
        jimmadarClass: selectedTeacher.jimmadarClass,

        joinDate: selectedTeacher.joinDate,

        dateOfBirth: selectedTeacher.dateOfBirth,

        fatherName: selectedTeacher.fatherName,

        motherName: selectedTeacher.motherName,

        NIDNO: selectedTeacher.NIDNO,

        email: selectedTeacher.email,

        mobile1: selectedTeacher.mobile1,

        mobile2: selectedTeacher.mobile2,

        basicSalary: selectedTeacher.basicSalary,

        presentAddress: selectedTeacher.presentAddress,

        permanentAddress: selectedTeacher.permanentAddress,
      };

      formData.append("data", JSON.stringify(payload));

      if (selectedTeacher.profilePicture instanceof File) {
        formData.append("file", selectedTeacher.profilePicture);
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/teacher/${selectedTeacher.id}`,
        {
          method: "PUT",
          body: formData,
        },
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message);
      }

      toast.success("Teacher updated successfully");

      cancelEdit();

      fetchTeachers();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUpdating(false);
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
      {/* =================================================
          HEADER
      ================================================= */}

      <div>
        <h2 className="text-2xl font-bold text-gray-800">সকল শিক্ষক</h2>

        <p className="text-sm text-gray-400">শিক্ষকদের তালিকা</p>
      </div>

      {/* =================================================
          FILTER
      ================================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-xl shadow border">
        {/* NAME */}

        <Input
          placeholder="নাম..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />

        {/* CODE */}

        <Input
          placeholder="কোড..."
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
        />

        {/* MOBILE */}

        <Input
          placeholder="মোবাইল..."
          value={searchMobile}
          onChange={(e) => setSearchMobile(e.target.value)}
        />

        {/* STATUS */}

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="স্ট্যাটাস" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">সব</SelectItem>

            <SelectItem value="ACTIVE">Active</SelectItem>

            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="bg-white border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border text-sm min-w-[800px]">
            <thead className="bg-secondary text-white">
              <tr>
                {[
                  "ID",
                  "Name",
                  "Designation",
                  "Join Date",
                  "Mobile",
                  "Salary",
                  "J. Class",
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
              {/* LOADING */}

              {loading ? (
                <tr>
                  <td colSpan={9} className="border p-4 text-center">
                    ⏳ লোড হচ্ছে...
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                /* NO DATA */

                <tr>
                  <td colSpan={9} className="border p-4 text-center">
                    ❌ কোনো ডেটা পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                /* CURRENT PAGE DATA */

                teachers.map((t) => (
                  <tr key={t.id} className="border">
                    {/* CODE */}

                    <td className="px-4 py-3">{t.code || "-"}</td>

                    {/* NAME */}

                    <td className="border p-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t.name}</span>
                      </div>
                    </td>

                    {/* DESIGNATION */}

                    <td className="border p-2">{t.designation || "-"}</td>

                    {/* JOIN DATE */}

                    <td className="border p-2">{formatDate(t.joinDate)}</td>

                    {/* MOBILE */}

                    <td className="border p-2">{t.mobile1 || "-"}</td>

                    {/* SALARY */}

                    <td className="border p-2">
                      {t.basicSalary
                        ? `৳${t.basicSalary.toLocaleString()}`
                        : "-"}
                    </td>

                    {/* J. CLASS */}

                    <td className="border p-2">{t.jimmadarClass || "-"}</td>

                    {/* STATUS */}

                    <td className="border p-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          t.status === "ACTIVE"
                            ? "bg-accent text-white"
                            : "bg-red-100 text-accent"
                        }`}
                      >
                        {t.status || "-"}
                      </span>
                    </td>

                    {/* ACTION */}

                    <td className="border p-2">
                      <div className="flex flex-col md:flex-row gap-2">
                        {/* VIEW */}

                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleEdit(t)}
                        >
                          <Eye />
                        </Button>

                        {/* DELETE */}

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleSoftDelete(t.id)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =================================================
          PAGINATION
      ================================================= */}

      {totalPages > 1 && (
        <div className="flex flex-wrap justify-center items-center gap-2 mt-10">
          {/* PREVIOUS */}

          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ArrowLeft />
            Prev
          </button>

          {/* PAGE NUMBERS */}

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

          {/* NEXT */}

          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            Next
            <ArrowRight />
          </button>
        </div>
      )}

      {/* =================================================
          TEACHER MODAL
      ================================================= */}

      {open && selectedTeacher && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl max-w-5xl max-h-[90vh] overflow-y-auto w-full">
            {/* HEADER */}

            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Teacher Biodata</h3>

              <div className="flex gap-2">
                {!isEditMode && (
                  <Button onClick={() => setIsEditMode(true)}>Edit</Button>
                )}

                {isEditMode && (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditMode(false)}
                  >
                    View Mode
                  </Button>
                )}
              </div>
            </div>

            {/* VIEW / EDIT */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* BASIC INFO */}

              <div className="space-y-3">
                <Input
                  disabled={!isEditMode}
                  value={selectedTeacher.name || ""}
                  onChange={(e) =>
                    setSelectedTeacher({
                      ...selectedTeacher,
                      name: e.target.value,
                    })
                  }
                />

                <Input
                  disabled={!isEditMode}
                  placeholder="Username"
                  value={selectedTeacher.username || ""}
                  onChange={(e) =>
                    setSelectedTeacher({
                      ...selectedTeacher,
                      username: e.target.value,
                    })
                  }
                />

                <Input
                  disabled={!isEditMode}
                  placeholder="Code"
                  value={selectedTeacher.code || ""}
                  onChange={(e) =>
                    setSelectedTeacher({
                      ...selectedTeacher,
                      code: e.target.value,
                    })
                  }
                />

                <Input
                  disabled={!isEditMode}
                  placeholder="Designation"
                  value={selectedTeacher.designation || ""}
                  onChange={(e) =>
                    setSelectedTeacher({
                      ...selectedTeacher,
                      designation: e.target.value,
                    })
                  }
                />

                <Input
                  disabled={!isEditMode}
                  placeholder="Qualification"
                  value={selectedTeacher.qualification || ""}
                  onChange={(e) =>
                    setSelectedTeacher({
                      ...selectedTeacher,
                      qualification: e.target.value,
                    })
                  }
                />

                <Input
                  disabled={!isEditMode}
                  placeholder="Email"
                  value={selectedTeacher.email || ""}
                  onChange={(e) =>
                    setSelectedTeacher({
                      ...selectedTeacher,
                      email: e.target.value,
                    })
                  }
                />

                <Input
                  disabled={!isEditMode}
                  placeholder="NID"
                  value={selectedTeacher.NIDNO || ""}
                  onChange={(e) =>
                    setSelectedTeacher({
                      ...selectedTeacher,
                      NIDNO: e.target.value,
                    })
                  }
                />

                <Input
                  disabled={!isEditMode}
                  placeholder="Salary"
                  type="number"
                  value={selectedTeacher.basicSalary || ""}
                  onChange={(e) =>
                    setSelectedTeacher({
                      ...selectedTeacher,
                      basicSalary: Number(e.target.value),
                    })
                  }
                />
              </div>

              {/* PRESENT ADDRESS */}

              <AddressFields
                base="presentAddress"
                form={selectedTeacher}
                handleChange={handleChange}
              />

              {/* PERMANENT ADDRESS */}

              <AddressFields
                base="permanentAddress"
                form={selectedTeacher}
                handleChange={handleChange}
              />
            </div>

            {/* PROFILE */}

            <div className="mt-5">
              <label className="font-medium">Profile Picture</label>

              {isEditMode && (
                <input
                  type="file"
                  className="mt-2"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setSelectedTeacher({
                        ...selectedTeacher,
                        profilePicture: e.target.files[0],
                      });
                    }
                  }}
                />
              )}

              {selectedTeacher.profilePicture && (
                <img
                  className="w-24 h-24 mt-2 rounded-full object-cover"
                  src={
                    typeof selectedTeacher.profilePicture === "string"
                      ? selectedTeacher.profilePicture
                      : URL.createObjectURL(selectedTeacher.profilePicture)
                  }
                  alt="Teacher"
                />
              )}
            </div>

            {/* ACTION */}

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={cancelEdit}>
                Close
              </Button>

              {isEditMode && (
                <Button onClick={handleUpdate} disabled={updating}>
                  {updating ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

AllTeachers.displayName = "AllTeachers";

export default AllTeachers;
