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

// AddDonor-এর মতোই local static data ব্যবহার করা হচ্ছে — কোনো API fetch/race condition নেই
import districtsData from "@/data/bd-districts.json";
import divisionsData from "@/data/bd-divisions.json";
import upazilasData from "@/data/bd-upazilas.json";

/* ================= TYPES ================= */

type GeoItem = { id: string; name: string; bn_name: string };
type DistrictItem = GeoItem & { division_id: string };
type UpazilaItem = GeoItem & { district_id: string };

interface IAddress {
  divisionId?: string;
  districtId?: string;
  thanaId?: string;

  division?: string;
  district?: string;
  thana?: string;

  village?: string;
  postOffice?: string;
}

const emptyAddress: IAddress = {
  divisionId: "",
  division: "",
  districtId: "",
  district: "",
  thanaId: "",
  thana: "",
  postOffice: "",
  village: "",
};

interface IDonor {
  id: string;
  username: string;
  code?: string;
  name: string;
  fatherName?: string;
  motherName?: string;
  mobile1?: string;
  mobile2?: string;
  donorType?: string;
  presentAddress?: IAddress;
  permanentAddress?: IAddress;
  profilePicture?: string | File;
  isDeleted: boolean;
}

interface AddressFieldProps {
  base: "presentAddress" | "permanentAddress";
  form: IDonor;
  handleChange: (field: string, value: string) => void;
}

/* ================= GEO HELPERS ================= */

const getDivisions = () =>
  (divisionsData as { divisions: GeoItem[] }).divisions;

const getDistrictsByDivision = (divisionId?: string): DistrictItem[] => {
  if (!divisionId) return [];
  return (districtsData as { districts: DistrictItem[] }).districts.filter(
    (d) => d.division_id === divisionId,
  );
};

const getUpazilasByDistrict = (districtId?: string): UpazilaItem[] => {
  if (!districtId) return [];
  return (upazilasData as { upazilas: UpazilaItem[] }).upazilas.filter(
    (t) => t.district_id === districtId,
  );
};

// backend থেকে আসা address-এ শুধু bn_name থাকে (id থাকে না), তাই
// edit-এ ঢোকার সময় নাম মিলিয়ে divisionId/districtId/thanaId বের করে বসিয়ে দেওয়া হচ্ছে
// — যাতে Select-এ সঠিক value প্রি-সিলেক্টেড থাকে এবং cascade ঠিকমতো কাজ করে
const hydrateAddressWithIds = (addr?: IAddress): IAddress => {
  if (!addr) return { ...emptyAddress };

  const divisionId =
    addr.divisionId ||
    getDivisions().find((d) => d.bn_name === addr.division)?.id ||
    "";

  const districtsForDivision = getDistrictsByDivision(divisionId);
  const districtId =
    addr.districtId ||
    districtsForDivision.find((d) => d.bn_name === addr.district)?.id ||
    "";

  const upazilasForDistrict = getUpazilasByDistrict(districtId);
  const thanaId =
    addr.thanaId ||
    upazilasForDistrict.find((t) => t.bn_name === addr.thana)?.id ||
    "";

  return {
    divisionId,
    division: addr.division || "",
    districtId,
    district: addr.district || "",
    thanaId,
    thana: addr.thana || "",
    village: addr.village || "",
    postOffice: addr.postOffice || "",
  };
};

/* ================= ADDRESS COMPONENT (AddDonor-এর মতো, local data দিয়ে) ================= */
const AddressFields = ({ base, form, handleChange }: AddressFieldProps) => {
  const addressObj = (form[base] || emptyAddress) as IAddress;
  const fieldClass = "w-full border rounded px-3 py-2 text-lg";

  const divisions = useMemo(() => getDivisions(), []);

  const districts = useMemo(
    () => getDistrictsByDivision(addressObj.divisionId),
    [addressObj.divisionId],
  );

  const thanas = useMemo(
    () => getUpazilasByDistrict(addressObj.districtId),
    [addressObj.districtId],
  );

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
            // division পাল্টালে নিচের সব child field synchronous reset — race condition নেই
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

/* ================= MAIN COMPONENT ================= */
const AllDonors = forwardRef((props, ref) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const isAdmin =
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "SUPER_ADMIN" ||
    currentUser?.role === "ACCOUNTANT";
  const [donors, setDonors] = useState<IDonor[]>([]);
  const [filteredDonors, setFilteredDonors] = useState<IDonor[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("কোনো ছবি নির্বাচিত হয়নি");

  /* filters */
  const [searchTerm, setSearchTerm] = useState("");
  const [code, setCode] = useState("");
  const [mobile1, setMobile1] = useState("");

  /* pagination */
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);
  const pages = getPagination(page, totalPages);
  /* edit modal */
  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<IDonor | null>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllDonors = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/monthlydonations?page=1&limit=2000`,
      );
      const data = await res.json();
      setDonors(data.data || []);
      setFilteredDonors(data.data || []);
      setTotalPages(Math.ceil((data.data?.length || 0) / limit));
      setPage(1);
    } catch (err) {
      console.error("Fetch all donors error:", err);
      toast.error("Failed to load donors");
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    reload: fetchAllDonors,
  }));

  useEffect(() => {
    fetchAllDonors();
  }, []);

  /* FILTER */
  useEffect(() => {
    const filtered = donors.filter((s) => {
      const matchName = searchTerm
        ? s.name.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      const matchCode = code
        ? s.code?.toLowerCase() === code.toLowerCase()
        : true;
      const matchMobile = mobile1 ? s.mobile1 === mobile1 : true;

      return matchName && matchCode && matchMobile;
    });
    setFilteredDonors(filtered);
    setTotalPages(Math.ceil(filtered.length / limit));
    setPage(1);
  }, [searchTerm, code, mobile1, donors]);

  const paginatedDonors = filteredDonors.slice(
    (page - 1) * limit,
    page * limit,
  );

  const handleEdit = (donor: IDonor) => {
    setSelectedStudent({
      ...donor,
      // এখানেই মূল ফিক্স: bn_name থেকে divisionId/districtId/thanaId রিভার্স-লুকআপ করে বসানো হচ্ছে
      presentAddress: hydrateAddressWithIds(donor.presentAddress),
      permanentAddress: hydrateAddressWithIds(donor.permanentAddress),
    });
    setFileName(
      typeof donor.profilePicture === "string"
        ? donor.profilePicture
        : "কোনো ছবি নির্বাচিত হয়নি",
    );
    setOpen(true);
  };

  const cancelEdit = () => {
    setSelectedStudent(null);
    setFileName("কোনো ছবি নির্বাচিত হয়নি");
    setError(null);
    setOpen(false);
  };

  const handleChange = (field: string, value: string) => {
    if (!selectedStudent) return;
    setSelectedStudent((prev) => {
      if (!prev) return prev;
      const keys = field.split(".");
      if (keys.length === 1) {
        return { ...prev, [keys[0]]: value } as IDonor;
      }
      const [parent, key] = keys as [
        "presentAddress" | "permanentAddress",
        string,
      ];
      return {
        ...prev,
        [parent]: {
          ...(prev[parent] as IAddress),
          [key]: value,
        },
      };
    });
  };

  const handleUpdate = async () => {
    if (!isAdmin) return toast.error("Only admin can delete");
    if (!selectedStudent) return;

    setUpdating(true);
    setError(null);

    try {
      const formData = new FormData();

      // backend-এ শুধু নাম পাঠানো হয় (id গুলো UI-only, AddDonor-এর cleanAddress এর মতোই)
      const mapAddress = (address?: IAddress) => {
        if (!address) return {};
        return {
          division: address.division || "",
          district: address.district || "",
          thana: address.thana || "",
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
        donorType: selectedStudent.donorType || "",
        presentAddress: mapAddress(selectedStudent.presentAddress),
        permanentAddress: mapAddress(selectedStudent.permanentAddress),
        profilePicture:
          typeof selectedStudent.profilePicture === "string" &&
          selectedStudent.profilePicture.trim() !== ""
            ? selectedStudent.profilePicture
            : undefined,
      };

      formData.append(
        "data",
        JSON.stringify({
          donor: data,
        }),
      );

      if (selectedStudent.profilePicture instanceof File) {
        formData.append("file", selectedStudent.profilePicture);
      }

      await api.put(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/monthlydonations/donor/update/${selectedStudent.id}`,
        formData,
      );

      toast.success("Donor updated successfully");
      cancelEdit();
      fetchAllDonors();
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
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/donor/soft/${id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Soft delete failed");
      toast.success("Donor soft deleted");
      fetchAllDonors();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const donorTypeLabels = {
    ASHARAYE: "আশারায়ে মুবাশশারা - প্রতি মাস 1000",
    BODORI: "বদরি ৩১৩ সদস্য - প্রতি মাস 500",
    LIFETIME: "আজীবন দাতা সদস্য - ঐচ্ছিক অর্থ দান",
    LIFETIME2: "আজীবন দাতা সদস্য - খাদ্য সমগ্রী দান",
    MOSQUE: "দাওয়াহ্ মাদরাসা মসজিদ নির্মাণ - ঐচ্ছিক দান",
  } as const;

  /* ================= UI ================= */
  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">All Donors List</h2>
      {/* FILTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 bg-white p-5 rounded-xl shadow">
        <Input
          placeholder="Search Name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Input
          placeholder="Donor Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Input
          placeholder="Mobile Number"
          value={mobile1}
          onChange={(e) => setMobile1(e.target.value)}
        />
        <Select value={""} onValueChange={() => {}}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="নির্বাচন করুন" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="ASHARAYE">
              আশারায়ে মুবোশশারা সদস্য - প্রতি মাস 1000
            </SelectItem>

            <SelectItem value="BODORI">
              বদরি ৩১৩ সদস্য - প্রতি মাস 500
            </SelectItem>

            <SelectItem value="LIFETIME">
              আজীবন দাতা সদস্য - ঐচ্ছিক অর্থ দান
            </SelectItem>

            <SelectItem value="LIFETIME2">
              আজীবন দাতা সদস্য - খাদ্য সমগ্রী দান
            </SelectItem>

            <SelectItem value="MOSQUE">
              দাওয়াহ্ মাদরাসা মসজিদ নির্মান - ঐচ্ছিক দান
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full border min-w-[800px] text-sm">
          <thead className="bg-secondary text-white">
            <tr>
              {[
                "ID",
                "Name",
                "Mobile1",
                "Mobile2",
                "Type",
                "status",
                "Action",
              ].map((h) => (
                <th key={h} className="border p-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedDonors.map((s) => (
              <tr key={s.id} className="odd:bg-gray-50 hover:bg-blue-50">
                <td className="border p-2">{s.code}</td>
                <td className="border p-2">{s.name}</td>
                <td className="border p-2">{s.mobile1}</td>
                <td className="border p-2">{s.mobile2}</td>
                <td className="border p-2">
                  {s.donorType
                    ? (donorTypeLabels[
                        s.donorType as keyof typeof donorTypeLabels
                      ] ?? s.donorType)
                    : "-"}
                </td>
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
                <td className="border p-2 ">
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
                      disabled={s.isDeleted}
                      variant="destructive"
                      onClick={() => handleSoftDelete(s.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedDonors.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-4">
                  No donors found with the applied filters.
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
            <h3 className="text-lg font-semibold mb-4">
              দাতা সদস্য তথ্য আপডেট!
            </h3>
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

                <Select
                  value={selectedStudent.donorType || ""}
                  onValueChange={(value) => handleChange("donorType", value)}
                >
                  <SelectTrigger className="w-full mt-3">
                    <SelectValue placeholder="নির্বাচন করুন" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="ASHARAYE">
                      আশারায়ে মুবোশশারা সদস্য - প্রতি মাস 1000
                    </SelectItem>

                    <SelectItem value="BODORI">
                      বদরি ৩১৩ সদস্য - প্রতি মাস 500
                    </SelectItem>

                    <SelectItem value="LIFETIME">
                      আজীবন দাতা সদস্য - ঐচ্ছিক অর্থ দান
                    </SelectItem>

                    <SelectItem value="LIFETIME2">
                      আজীবন দাতা সদস্য - খাদ্য সমগ্রী দান
                    </SelectItem>

                    <SelectItem value="MOSQUE">
                      দাওয়াহ্ মাদরাসা মসজিদ নির্মান - ঐচ্ছিক দান
                    </SelectItem>
                  </SelectContent>
                </Select>
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
                    } else setFileName("কোনো ছবি নির্বাচিত হয়নি");
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

AllDonors.displayName = "AllDonors";
export default AllDonors;
