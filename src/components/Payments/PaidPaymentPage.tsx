"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toBanglaNumber } from "@/utils/toBanglaNumber"
import axios from "axios"
import { useState } from "react"

export default function PaidPaymentPage() {
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [data, setData] = useState<any>(null)

  // ✅ modal state
  const [selectedGroup, setSelectedGroup] = useState<any>(null)

  const summary = data?.summary || {}

  const fetchData = async (from?: string, to?: string) => {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/paymentreport/all/reports/paid`,
      {
        params: {
          fromDate: from || "",
          toDate: to || "",
          limit: 10000,
        },
      },
    )

    setData(res.data?.data || null)
  }

  // ================= FILTERS =================

  const today = () => {
    const d = new Date().toISOString().slice(0, 10)
    setFromDate(d)
    setToDate(d)
    fetchData(d, d)
  }

  const thisMonth = () => {
    const now = new Date()
    const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10)

    setFromDate(from)
    setToDate(to)
    fetchData(from, to)
  }

  const thisYear = () => {
    const y = new Date().getFullYear()
    fetchData(`${y}-01-01`, `${y}-12-31`)
  }

  // ================= SAFE DATA =================

  const sourceWise = summary.sourceWise || []
  const classWise = summary.classWise || []
  const categoryWise = summary.categoryWise || []
  const groupWise = summary.groupWise || []

  return (
    <div className="p-4 space-y-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <h1 className="text-2xl font-bold text-center md:text-left">
        💰 আয়ের রিপোর্ট ড্যাশবোর্ড
      </h1>

      {/* FILTER */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button onClick={today}>Today</Button>
        <Button onClick={thisMonth}>Month</Button>
        <Button onClick={thisYear}>Year</Button>

        <Input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
        <Input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />

        <Button onClick={() => fetchData(fromDate, toDate)}>Filter</Button>
      </div>

      {/* TOTAL */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4 text-center">
          <p className="text-sm">Total Collection</p>
          <h2 className="text-2xl font-bold text-green-700">
            ৳ {toBanglaNumber(summary.totalCollection || 0)}
          </h2>
        </CardContent>
      </Card>

      {/* SOURCE */}
      <Section title="Source Wise">
        {sourceWise.map((s: any) => (
          <MiniCard key={s.source} label={s.source} value={s.totalAmount} />
        ))}
      </Section>

      {/* GROUP WISE */}
      <Section title="রশিদ বই অনুযায়ী রিপোর্ট">
        {groupWise.length ? (
          groupWise.map((g: any) => (
            <Card key={g.group} className="p-3 bg-blue-50">
              <p className="font-semibold">{g.group}</p>

              <p className="text-right font-bold text-blue-700">
                ৳ {toBanglaNumber(g.totalAmount)}
              </p>

              {/* ✅ CLEAN BUTTON */}
              <p className="text-xs text-gray-500 mt-1">
                <span
                  onClick={() => setSelectedGroup(g)}
                  className="cursor-pointer text-blue-600 hover:underline"
                >
                  📄 রশিদ দেখুন ({g.roshidNos?.length || 0})
                </span>
              </p>

              <p className="text-xs text-gray-400">
                Transaction: {g.transactionCount}
              </p>
            </Card>
          ))
        ) : (
          <p>No group data</p>
        )}
      </Section>

      {/* CATEGORY */}
      <Section title="সকল খাতওয়ার আয়ের রিপোর্ট">
        {categoryWise.map((c: any) => (
          <MiniCard key={c.category} label={c.category} value={c.totalAmount} />
        ))}
      </Section>

      {/* CLASS */}
      <Section title="🏫 Class Wise">
        {classWise.map((c: any) => (
          <MiniCard
            key={c.className}
            label={c.className}
            value={c.totalAmount}
          />
        ))}
      </Section>

      {/* ================= MODAL ================= */}
      {selectedGroup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 w-full max-w-md max-h-[80vh] overflow-y-auto">
            {/* ✅ GRID ROSHID */}
            <div className="mt-3">
              <p className="text-sm mb-2">রশিদ তালিকা:</p>

              <div className="">
                {selectedGroup.roshidNos?.map((r: string, i: number) => (
                  <span key={i} className="text-sm text-center">
                    {`${r}, `}
                  </span>
                ))}
              </div>
            </div>

            <Button
              className="mt-4 w-full"
              onClick={() => setSelectedGroup(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ================= UI COMPONENTS =================

const Section = ({ title, children }: any) => (
  <Card>
    <CardContent className="p-4">
      <h2 className="mb-3 text-lg">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{children}</div>
    </CardContent>
  </Card>
)

const MiniCard = ({ label, value }: any) => (
  <Card className="p-3 hover:shadow-md transition">
    <p className="text-sm">{label}</p>
    <p className="text-right">৳ {toBanglaNumber(value)}</p>
  </Card>
)
