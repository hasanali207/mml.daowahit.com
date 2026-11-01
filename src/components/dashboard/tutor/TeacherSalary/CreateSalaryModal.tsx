"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import toast from "react-hot-toast"

const MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
]

const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_API}/api/v1`

type Teacher = {
  id: string
  name: string
  code: string
  designation: string
  basicSalary: number
}

export function CreateSalaryModal({
  teacher,
  onClose,
  onSuccess,
}: {
  teacher: Teacher | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [month, setMonth] = useState(String(new Date().getMonth() + 1))
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!teacher) return

    setLoading(true)
    setError("")
    console.log(teacher)

    try {
      const res = await fetch(`${BASE_URL}/teachersalary/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teacherId: teacher.id,
          month: Number(month),
          year: Number(year),
          baseSalary: Number(amount),
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || "বেতন তৈরি ব্যর্থ হয়েছে")
      }
      toast.success("বেতন সফলভাবে তৈরি হয়েছে")
      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!teacher} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>বেতন তৈরি করুন</DialogTitle>
        </DialogHeader>

        {teacher && (
          <form onSubmit={submit} className="space-y-5">
            {/* Teacher Info */}
            <div className="rounded-lg bg-muted/50 border px-4 py-3">
              <p className="text-sm font-medium">{teacher.name}</p>
              <p className="text-xs text-muted-foreground">
                কোড: #{teacher.code}
              </p>
            </div>

            {/* Month */}
            <div className="space-y-2">
              <Label>মাস</Label>
              <select
                className="w-full border rounded h-10 px-2"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div className="space-y-2">
              <Label>বছর</Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                required
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>বেতন (টাকা)</Label>

              <Input
                type="number"
                placeholder="যেমন: 15000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />

              {/* 👉 Base Salary Add Button */}
              {teacher?.basicSalary && (
                <button
                  type="button"
                  onClick={() =>
                    setAmount(String(Number(amount || 0) + teacher.basicSalary))
                  }
                  className="text-xs bg-primary/10 px-2 py-1 rounded hover:bg-primary/20 cursor-pointer mt-2"
                >
                  + Base Salary add করুন (৳{" "}
                  {teacher?.basicSalary.toLocaleString("bn-BD")})
                </button>
              )}
            </div>

            {/* Error */}
            {error && <p className="text-sm text-red-500">{error}</p>}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
              >
                বন্ধ করুন
              </Button>

              <Button type="submit" className="flex-1" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {loading ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
