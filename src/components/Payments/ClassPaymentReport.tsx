"use client";

import { Card, CardContent } from "@/components/ui/card";
import api from "@/lib/axios";
import { useEffect, useState } from "react";

export default function ClassPaymentReport() {
  const sessionId = "6e248a3d-5651-4a7e-a54b-e97d63096435";
  const classId = "ec242177-aa38-4cba-8285-67e7337b1585";

  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    api
      .get(`/paymentreport/${sessionId}/${classId}`)
      .then((res) => setData(res.data.data));
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Class Payment Report</h1>

      {data.map((p) => (
        <Card key={p.id}>
          <CardContent className="p-4 flex justify-between">
            <p>{p.student.name}</p>
            <p className="font-semibold">{p.status}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
