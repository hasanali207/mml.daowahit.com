"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import api from "@/lib/axios"
import { selectCurrentUser } from "@/Redux/Features/Auth/authSlice"
import { useAppSelector } from "@/Redux/hook"
import { formatDateBn } from "@/utils/dateBn"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import Swal from "sweetalert2"

interface FeeItem {
  id: string
  feeCategoryId: string
  amount: number
  status: "PAID" | "UNPAID"
  feeCategory: { name: string }
}

interface StudentPayment {
  id: string
  month: string
  year: number
  status: string
  items: FeeItem[]
  RoshidNo: string
  paymentMethod: string
}

interface Student {
  id: string
  name: string
  code: string
  profilePicture: string
  fatherName: string
  mobile1: string
  currentClass: string
  createdAt: string
  presentAddress: {
    village: string
    postOffice: string
    thana: string
  }
  admissions: [
    {
      residence: string
      session: {
        name: string
      }
    },
  ]
}

export default function StudentPaymentManagement() {
  const [searchCode, setSearchCode] = useState("")
  const [student, setStudent] = useState<Student | null>(null)
  const [payments, setPayments] = useState<StudentPayment[]>([])
  const [selected, setSelected] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)
  const [editAmounts, setEditAmounts] = useState<Record<string, number>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  // ================= SEARCH STUDENT =================
  const searchStudent = async () => {
    if (!searchCode.trim()) return toast.error("শিক্ষার্থী কোড লিখুন")

    setLoading(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/student?code=${searchCode}`,
      )
      const json = await res.json()
      const s = Array.isArray(json.data) ? json.data[0] : json.data
      if (!s) throw new Error()
      setStudent(s)
      fetchPayments(s.id)
    } catch {
      toast.error("শিক্ষার্থী পাওয়া যায়নি")
      setStudent(null)
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  const updateAmount = async (itemId: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "success",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Updated it!",
    })

    if (!result.isConfirmed) return

    try {
      const amount = editAmounts[itemId]

      if (!amount) {
        return toast.error("Amount পাওয়া যায়নি")
      }

      setSavingId(itemId)

      await api.patch(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/payment/item/${itemId}`,
        { amount },
      )
      toast.success("Amount updated successfully")

      if (student) fetchPayments(student.id)

      setSavingId(null)
    } catch (err: any) {
      setSavingId(null)
      toast.error(err?.response?.data?.message || "Update failed")
    }
  }

  const deleteFeeItem = async (itemId: string, studentId: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    })
    if (!result.isConfirmed) return

    try {
      // 🔹 Delete API call
      await api.delete(`/api/v1/paymenttransaction/deleteFeeItem/${itemId}`)

      toast.success("FeeItem deleted successfully")

      // 🔹 Frontend state থেকে instant remove
      setPayments((prev) =>
        prev.map((p) => ({
          ...p,
          items: p.items.filter((i) => i.id !== itemId),
        })),
      )

      // 🔹 Optional: যদি চাইলে আবার full fetch করতে
      // await fetchPayments(studentId);
    } catch (error: any) {
      console.error(error)
      toast.error(error?.response?.data?.message || "Delete failed")
    }
  }
  const deleteStudentPayment = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    })

    if (!result.isConfirmed) return

    try {
      await api.delete(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/payment/delete/paidwrongpayments/${id}`,
      )

      if (student) {
        fetchPayments(student.id)
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error?.response?.data?.message || "Delete failed")
    }
  }

  const markAsUnpaid = async (itemId: string) => {
    const result = await Swal.fire({
      title: "আপনি কি নিশ্চিত?",
      text: "এই আইটেমটি আবার UNPAID করা হবে",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Undo",
    })

    if (!result.isConfirmed) return

    try {
      setSavingId(itemId)

      await api.patch(`/api/v1/payment/item/${itemId}/unpaid`)

      toast.success("UNPAID করা হয়েছে")

      if (student) fetchPayments(student.id)

      setSavingId(null)
    } catch (err: any) {
      setSavingId(null)
      toast.error(err?.response?.data?.message || "Failed")
    }
  }

  const fetchPayments = async (studentId: string) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/paymentreport/single/${studentId}`,
    )
    const json = await res.json()
    const paymentsData: StudentPayment[] = json.data || []

    const initialSelected: Record<string, string[]> = {}
    paymentsData.forEach((p) => {
      initialSelected[p.id] = []
    })

    setPayments(paymentsData)
    setSelected(initialSelected)
  }

  // ================= TOGGLE SELECTION =================
  const toggle = (paymentId: string, feeId: string) => {
    setSelected((prev) => {
      const list = Array.isArray(prev[paymentId]) ? prev[paymentId] : []
      const updatedList = list.includes(feeId)
        ? list.filter((id) => id !== feeId)
        : [...list, feeId]
      return { ...prev, [paymentId]: updatedList }
    })
  }

  // ================= PAY MULTI MONTH CASH =================

  const selectedTotalAmount = payments
    .flatMap(
      (p) =>
        p.items
          .filter((i) => selected[p.id]?.includes(i.id)) // selected items
          .map((i) => editAmounts[i.id] ?? i.amount), // edited amount থাকলে সেটাও নাও
    )
    .reduce((sum, amt) => sum + amt, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex gap-2 max-w-xl mx-auto mt-5">
        <input
          className="border p-2 rounded flex-1"
          placeholder="শিক্ষার্থীর আইডি লিখে এন্টার প্রেস করুন"
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchStudent()}
        />
        <Button onClick={searchStudent} disabled={loading}>
          Search
        </Button>
      </div>

      {student && (
        <div className="max-w-2xl bg-gray-100 mx-auto flex gap-10 p-2">
          <div>
            <p className="p-2 text-xl bangla">
              শিক্ষার্থীর নাম: {student.name}
            </p>
            <p className="p-2 text-xl bangla">শ্রেণি: {student.currentClass}</p>
            <p className="p-2 text-xl  bangla">
              পিতার নাম: {student.fatherName}
            </p>
          </div>
          <div className="flex">
            <p className="p-2  bangla">
              আইডি:({student.code}) ডাটা এন্ট্রি তারিখ:{" "}
              {formatDateBn(student.createdAt)}
              {payments.length > 0 && (
                <div className="mt-4">
                  <span className="bangla text-lg text-red-500">
                    মোট নির্বাচিত পরিমাণ: {selectedTotalAmount} ৳
                  </span>
                </div>
              )}
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5">
        {payments.map((p) => (
          <Card key={p.id}>
            <CardContent className="space-y-2">
              <strong>
                {p.month} / {p.year}
              </strong>
              {p.items.map((i) => {
                const isSelected = selected[p.id]?.includes(i.id)

                return (
                  <div
                    key={i.id}
                    onClick={() => {
                      if (i.status !== "PAID") toggle(p.id, i.id)
                    }}
                    className={`flex justify-between items-center border p-2 cursor-pointer
        ${isSelected ? "bg-green-50 border-green-500" : ""}
        ${i.status === "PAID" ? "opacity-60 cursor-not-allowed" : ""}
      `}
                  >
                    <span className="flex items-center gap-2">
                      {i.feeCategory.name} –{" "}
                      <span className="font-semibold">{i.amount}৳</span>
                      {i.status === "PAID" ? (
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 font-semibold">
                            PAID
                          </span>

                          <Button
                            size="sm"
                            variant="outline"
                            disabled={savingId === i.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              markAsUnpaid(i.id)
                            }}
                          >
                            {savingId === i.id ? "Undoing..." : "UNPAID"}
                          </Button>
                        </div>
                      ) : (
                        <>
                          <input
                            type="number"
                            className="w-20 border rounded px-1 py-0.5"
                            value={editAmounts[i.id] ?? i.amount}
                            disabled={selected[p.id]?.includes(i.id)}
                            onChange={(e) =>
                              setEditAmounts((prev) => ({
                                ...prev,
                                [i.id]: Number(e.target.value),
                              }))
                            }
                            onClick={(e) => e.stopPropagation()}
                          />

                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={savingId === i.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              updateAmount(i.id)
                            }}
                          >
                            {savingId === i.id ? "Saving..." : "Save"}
                          </Button>
                        </>
                      )}
                    </span>

                    <span className="flex items-center gap-2">
                      {i.status === "PAID" ? (
                        <span className="text-green-600 font-semibold">
                          PAID
                        </span>
                      ) : (
                        <>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            onClick={(e) => e.stopPropagation()}
                          />
                          {/* 🔹 Delete icon for unpaid */}
                          <button
                            className="text-red-600 ml-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteFeeItem(i.id, p.id)
                            }}
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </span>
                  </div>
                )
              })}

              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteStudentPayment(p.id)}
              >
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-lg bangla text-red-600 mt-15">
        সতর্কতা: রশিদ একবার কাটা হয়ে গেলে তা ডিলিট করা সম্ভব নয়। ভুল রশিদ কর্তন
        করিলে এর দায়ভার আপনার নিজের।
      </p>
    </div>
  )
}
