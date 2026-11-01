"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import districtsData from "@/data/bd-districts.json";
import divisionsData from "@/data/bd-divisions.json";
import upazilasData from "@/data/bd-upazilas.json";
import api from "@/lib/axios";
import { getPagination } from "@/lib/getPageNumber";
import { Plus, SquarePen, Trash2 } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";

/* ================= TYPES ================= */
type GeoItem = { id: string; name: string; bn_name: string };
type DistrictItem = GeoItem & { division_id: string };
type UpazilaItem = GeoItem & { district_id: string };

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

interface IGuarantor {
  id?: string;
  name: string;
  fatherName?: string;
  nid?: string;
  mobile1?: string;
  mobile2?: string;
  relation?: string;
  presentAddress?: IAddress;
}

interface IBorrower {
  id: string;
  code?: string;
  name: string;
  fatherName?: string;
  motherName?: string;
  mobile1?: string;
  mobile2?: string;
  nid?: string;
  presentAddress?: IAddress;
  permanentAddress?: IAddress;
  profilePicture?: string | File;
  guarantors?: IGuarantor[];
}

interface AddressFieldProps {
  base: "presentAddress" | "permanentAddress";
  form: IBorrower;
  handleChange: (field: string, value: string) => void;
}

/* ================= ADDRESS COMPONENT (Borrower) ================= */
const AddressFields = ({ base, form, handleChange }: AddressFieldProps) => {
  const addressObj = form[base] || {};
  const fieldClass = "w-full border rounded px-3 py-2 text-lg";

  const divisions = useMemo(
    () => (divisionsData as { divisions: GeoItem[] }).divisions,
    [],
  );

  const districts = useMemo(() => {
    if (!addressObj.divisionId) return [];
    return (districtsData as { districts: DistrictItem[] }).districts.filter(
      (d) => d.division_id === addressObj.divisionId,
    );
  }, [addressObj.divisionId]);

  const thanas = useMemo(() => {
    if (!addressObj.districtId) return [];
    return (upazilasData as { upazilas: UpazilaItem[] }).upazilas.filter(
      (t) => t.district_id === addressObj.districtId,
    );
  }, [addressObj.districtId]);

  return (
    <div className="mt-2 grid grid-cols-1 gap-4 bangla">
      <div className="flex flex-col">
        <label className="mb-1">
          বিভাগ <span className="text-red-500">*</span>
        </label>
        <select
          className={fieldClass}
          value={addressObj.divisionId}
          onChange={(e) => {
            const id = e.target.value;
            const name = divisions.find((d) => d.id === id)?.bn_name || "";
            handleChange(`${base}.divisionId`, id);
            handleChange(`${base}.division`, name);
            handleChange(`${base}.districtId`, "");
            handleChange(`${base}.district`, "");
            handleChange(`${base}.thanaId`, "");
            handleChange(`${base}.thana`, "");
          }}
        >
          <option value="">বিভাগ নির্বাচন করুন</option>
          {divisions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.bn_name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col bangla">
        <label className="mb-1">
          জেলা <span className="text-red-500">*</span>
        </label>
        <select
          className={fieldClass}
          value={addressObj.districtId}
          disabled={!districts.length}
          onChange={(e) => {
            const id = e.target.value;
            const name = districts.find((d) => d.id === id)?.bn_name || "";
            handleChange(`${base}.districtId`, id);
            handleChange(`${base}.district`, name);
            handleChange(`${base}.thanaId`, "");
            handleChange(`${base}.thana`, "");
          }}
        >
          <option value="">জেলা নির্বাচন করুন</option>
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.bn_name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col bangla">
        <label className="mb-1">
          থানা/উপজেলা <span className="text-red-500">*</span>
        </label>
        <select
          className={fieldClass}
          value={addressObj.thanaId}
          disabled={!thanas.length}
          onChange={(e) => {
            const id = e.target.value;
            const name = thanas.find((t) => t.id === id)?.bn_name || "";
            handleChange(`${base}.thanaId`, id);
            handleChange(`${base}.thana`, name);
          }}
        >
          <option value="">থানা/উপজেলা নির্বাচন করুন</option>
          {thanas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.bn_name}
            </option>
          ))}
        </select>
      </div>

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
const AllBorrowers = forwardRef((props, ref) => {
  const [borrowers, setBorrowers] = useState<IBorrower[]>([]);
  const [filteredBorrowers, setFilteredBorrowers] = useState<IBorrower[]>([]);
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
  const [selectedBorrower, setSelectedBorrower] = useState<IBorrower | null>(
    null,
  );
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* guarantors state (edit modal-e alada rakha hoyeche, easily manipulate korar jonne) */
  const [guarantors, setGuarantors] = useState<IGuarantor[]>([]);
  const [deletingGuarantorId, setDeletingGuarantorId] = useState<string | null>(
    null,
  );

  const fetchAllBorrowers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/v1/borrower?page=1&limit=2000");
      setBorrowers(res.data.data || []);
      setFilteredBorrowers(res.data.data || []);
      setTotalPages(Math.ceil((res.data.data?.length || 0) / limit));
      setPage(1);
    } catch (err) {
      console.error("Fetch all borrowers error:", err);
      toast.error("Failed to load borrowers");
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    reload: fetchAllBorrowers,
  }));

  useEffect(() => {
    fetchAllBorrowers();
  }, []);

  /* FILTER */
  useEffect(() => {
    const filtered = borrowers.filter((b) => {
      const matchName = searchTerm
        ? b.name.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      const matchCode = code
        ? b.code?.toLowerCase() === code.toLowerCase()
        : true;
      const matchMobile = mobile1 ? b.mobile1 === mobile1 : true;
      return matchName && matchCode && matchMobile;
    });
    setFilteredBorrowers(filtered);
    setTotalPages(Math.ceil(filtered.length / limit));
    setPage(1);
  }, [searchTerm, code, mobile1, borrowers]);

  const paginatedBorrowers = filteredBorrowers.slice(
    (page - 1) * limit,
    page * limit,
  );

  const handleEdit = (borrower: IBorrower) => {
    setSelectedBorrower({
      ...borrower,
      presentAddress: borrower.presentAddress || {},
      permanentAddress: borrower.permanentAddress || {},
    });
    setGuarantors(
      (borrower.guarantors || []).map((g) => ({
        ...g,
        presentAddress: g.presentAddress || {},
      })),
    );
    setFileName(
      typeof borrower.profilePicture === "string"
        ? borrower.profilePicture
        : "কোনো ছবি নির্বাচিত হয়নি",
    );
    setOpen(true);
  };

  const cancelEdit = () => {
    setSelectedBorrower(null);
    setGuarantors([]);
    setFileName("কোনো ছবি নির্বাচিত হয়নি");
    setError(null);
    setOpen(false);
  };

  const handleChange = (field: string, value: string) => {
    if (!selectedBorrower) return;
    const keys = field.split(".");
    const updated = { ...selectedBorrower };
    let obj: any = updated;
    for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
    obj[keys[keys.length - 1]] = value;
    setSelectedBorrower(updated);
  };

  /* ================= GUARANTOR HELPERS ================= */
  const handleGuarantorChange = (
    index: number,
    field: string,
    value: string,
  ) => {
    setGuarantors((prev) => {
      const updated = [...prev];
      const keys = field.split(".");
      let obj: any = updated[index];
      if (keys.length > 1) {
        obj = {
          ...obj,
          [keys[0]]: { ...(obj[keys[0]] || {}), [keys[1]]: value },
        };
      } else {
        obj = { ...obj, [keys[0]]: value };
      }
      updated[index] = obj;
      return updated;
    });
  };

  const handleAddGuarantor = () => {
    setGuarantors((prev) => [
      ...prev,
      {
        name: "",
        fatherName: "",
        nid: "",
        mobile1: "",
        mobile2: "",
        relation: "",
        presentAddress: {},
      },
    ]);
  };

  const handleDeleteGuarantor = async (index: number, guarantorId?: string) => {
    // notun (unsaved) guarantor hole, shudhu local state theke remove kore dile hobe
    if (!guarantorId) {
      setGuarantors((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "এই জামিনদারকে স্থায়ীভাবে মুছে ফেলা হবে!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    setDeletingGuarantorId(guarantorId);
    try {
      await api.delete(`/api/v1/borrower/guarantor/${guarantorId}`);
      setGuarantors((prev) => prev.filter((_, i) => i !== index));
      toast.success("জামিনদার মুছে ফেলা হয়েছে");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Delete failed");
    } finally {
      setDeletingGuarantorId(null);
    }
  };

  const cleanGuarantorAddress = (addr?: IAddress) => {
    if (!addr) return {};
    const { divisionId, districtId, thanaId, ...rest } = addr;
    return rest;
  };

  const handleUpdate = async () => {
    if (!selectedBorrower) return;

    setUpdating(true);
    setError(null);

    try {
      const formData = new FormData();

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
        borrower: {
          name: selectedBorrower.name,
          fatherName: selectedBorrower.fatherName || "",
          motherName: selectedBorrower.motherName || "",
          mobile1: selectedBorrower.mobile1 || "",
          mobile2: selectedBorrower.mobile2 || "",
          nid: selectedBorrower.nid || "",
          presentAddress: mapAddress(selectedBorrower.presentAddress),
          permanentAddress: mapAddress(selectedBorrower.permanentAddress),
          profilePicture:
            typeof selectedBorrower.profilePicture === "string" &&
            selectedBorrower.profilePicture.trim() !== ""
              ? selectedBorrower.profilePicture
              : undefined,
        },
        guarantors: guarantors
          .filter((g) => g.name?.trim())
          .map((g) => ({
            ...(g.id && { id: g.id }),
            name: g.name,
            fatherName: g.fatherName || "",
            nid: g.nid || "",
            mobile1: g.mobile1 || "",
            mobile2: g.mobile2 || "",
            relation: g.relation || "",
            presentAddress: cleanGuarantorAddress(g.presentAddress),
          })),
      };

      formData.append("data", JSON.stringify(data));

      if (selectedBorrower.profilePicture instanceof File) {
        formData.append("file", selectedBorrower.profilePicture);
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/borrower/update/${selectedBorrower.id}`,
        { method: "PUT", body: formData },
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result?.message || "Update failed");

      toast.success("Borrower updated successfully");
      cancelEdit();
      fetchAllBorrowers();
    } catch (err: any) {
      console.error("Update error:", err);
      setError(err?.message || "Something went wrong");
      toast.error(err?.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        All Borrowers List
      </h2>

      {/* FILTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 bg-white p-5 rounded-xl shadow">
        <Input
          placeholder="Search Name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Input
          placeholder="Borrower Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <Input
          placeholder="Mobile Number"
          value={mobile1}
          onChange={(e) => setMobile1(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full border text-sm min-w-[800px]">
          <thead className="bg-secondary text-white">
            <tr>
              {[
                "Code",
                "Name",
                "Father Name",
                "Mobile1",
                "Mobile2",
                "NID",
                "Guarantor",
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
                <td colSpan={8} className="text-center py-4">
                  Loading...
                </td>
              </tr>
            )}
            {!loading &&
              paginatedBorrowers.map((b) => (
                <tr key={b.id} className="odd:bg-gray-50 hover:bg-blue-50">
                  <td className="border p-2">{b.code}</td>
                  <td className="border p-2">{b.name}</td>
                  <td className="border p-2">{b.fatherName}</td>
                  <td className="border p-2">{b.mobile1}</td>
                  <td className="border p-2">{b.mobile2}</td>
                  <td className="border p-2">{b.nid}</td>
                  <td className="border p-2">
                    {b.guarantors && b.guarantors.length > 0
                      ? `${b.guarantors.length} জন`
                      : "-"}
                  </td>
                  <td className="border p-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(b)}
                    >
                      <SquarePen />
                    </Button>
                  </td>
                </tr>
              ))}
            {!loading && paginatedBorrowers.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-4">
                  No borrowers found
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
      {open && selectedBorrower && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              ঋণ গ্রহীতা তথ্য আপডেট
            </h3>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Basic Info */}
              <div>
                <Input
                  placeholder="Name"
                  value={selectedBorrower.name}
                  onChange={(e) =>
                    setSelectedBorrower({
                      ...selectedBorrower,
                      name: e.target.value,
                    })
                  }
                />
                <Input
                  className="mt-3"
                  placeholder="Father Name"
                  value={selectedBorrower.fatherName || ""}
                  onChange={(e) =>
                    setSelectedBorrower({
                      ...selectedBorrower,
                      fatherName: e.target.value,
                    })
                  }
                />
                <Input
                  className="mt-3"
                  placeholder="Mother Name"
                  value={selectedBorrower.motherName || ""}
                  onChange={(e) =>
                    setSelectedBorrower({
                      ...selectedBorrower,
                      motherName: e.target.value,
                    })
                  }
                />
                <Input
                  className="mt-3"
                  placeholder="Mobile 1"
                  value={selectedBorrower.mobile1 || ""}
                  onChange={(e) =>
                    setSelectedBorrower({
                      ...selectedBorrower,
                      mobile1: e.target.value,
                    })
                  }
                />
                <Input
                  className="mt-3"
                  placeholder="Mobile 2"
                  value={selectedBorrower.mobile2 || ""}
                  onChange={(e) =>
                    setSelectedBorrower({
                      ...selectedBorrower,
                      mobile2: e.target.value,
                    })
                  }
                />
                <Input
                  className="mt-3"
                  placeholder="NID"
                  value={selectedBorrower.nid || ""}
                  onChange={(e) =>
                    setSelectedBorrower({
                      ...selectedBorrower,
                      nid: e.target.value,
                    })
                  }
                />
              </div>

              {/* Present Address */}
              <AddressFields
                base="presentAddress"
                form={selectedBorrower}
                handleChange={handleChange}
              />

              {/* Permanent Address */}
              <AddressFields
                base="permanentAddress"
                form={selectedBorrower}
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
                      setSelectedBorrower({
                        ...selectedBorrower,
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
              {selectedBorrower.profilePicture && (
                <img
                  src={
                    typeof selectedBorrower.profilePicture === "string"
                      ? selectedBorrower.profilePicture
                      : URL.createObjectURL(selectedBorrower.profilePicture)
                  }
                  alt="Profile"
                  className="w-24 h-24 mt-2 object-cover rounded-full"
                />
              )}
            </div>

            {/* ================= GUARANTORS SECTION ================= */}
            <div className="border-t mt-6 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold">জামিনদারের তথ্য</h4>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddGuarantor}
                >
                  <Plus size={16} /> জামিনদার যুক্ত করুন
                </Button>
              </div>

              {guarantors.length === 0 && (
                <p className="text-sm text-gray-400">কোনো জামিনদার নেই</p>
              )}

              <div className="space-y-5">
                {guarantors.map((g, index) => (
                  <div
                    key={g.id || `new-${index}`}
                    className="border rounded-xl p-4 bg-gray-50 relative"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-semibold text-sm text-gray-600">
                        জামিনদার #{index + 1}{" "}
                        {!g.id && (
                          <span className="text-xs text-blue-500">(নতুন)</span>
                        )}
                      </h5>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={deletingGuarantorId === g.id}
                        onClick={() => handleDeleteGuarantor(index, g.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        placeholder="নাম"
                        value={g.name}
                        onChange={(e) =>
                          handleGuarantorChange(index, "name", e.target.value)
                        }
                      />
                      <Input
                        placeholder="পিতার নাম"
                        value={g.fatherName || ""}
                        onChange={(e) =>
                          handleGuarantorChange(
                            index,
                            "fatherName",
                            e.target.value,
                          )
                        }
                      />
                      <Input
                        placeholder="NID"
                        value={g.nid || ""}
                        onChange={(e) =>
                          handleGuarantorChange(index, "nid", e.target.value)
                        }
                      />
                      <Input
                        placeholder="সম্পর্ক"
                        value={g.relation || ""}
                        onChange={(e) =>
                          handleGuarantorChange(
                            index,
                            "relation",
                            e.target.value,
                          )
                        }
                      />
                      <Input
                        placeholder="মোবাইল ১"
                        value={g.mobile1 || ""}
                        onChange={(e) =>
                          handleGuarantorChange(
                            index,
                            "mobile1",
                            e.target.value,
                          )
                        }
                      />
                      <Input
                        placeholder="মোবাইল ২"
                        value={g.mobile2 || ""}
                        onChange={(e) =>
                          handleGuarantorChange(
                            index,
                            "mobile2",
                            e.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      <Input
                        placeholder="পোস্ট অফিস"
                        value={g.presentAddress?.postOffice || ""}
                        onChange={(e) =>
                          handleGuarantorChange(
                            index,
                            "presentAddress.postOffice",
                            e.target.value,
                          )
                        }
                      />
                      <Input
                        placeholder="গ্রাম/মহল্লা"
                        value={g.presentAddress?.village || ""}
                        onChange={(e) =>
                          handleGuarantorChange(
                            index,
                            "presentAddress.village",
                            e.target.value,
                          )
                        }
                      />
                      <Input
                        placeholder="বিভাগ"
                        value={g.presentAddress?.division || ""}
                        onChange={(e) =>
                          handleGuarantorChange(
                            index,
                            "presentAddress.division",
                            e.target.value,
                          )
                        }
                      />
                      <Input
                        placeholder="জেলা"
                        value={g.presentAddress?.district || ""}
                        onChange={(e) =>
                          handleGuarantorChange(
                            index,
                            "presentAddress.district",
                            e.target.value,
                          )
                        }
                      />
                      <Input
                        placeholder="থানা/উপজেলা"
                        value={g.presentAddress?.thana || ""}
                        onChange={(e) =>
                          handleGuarantorChange(
                            index,
                            "presentAddress.thana",
                            e.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
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

AllBorrowers.displayName = "AllBorrowers";
export default AllBorrowers;
