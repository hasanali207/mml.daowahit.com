"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { CreateSalaryModal } from "./CreateSalaryModal";

type Teacher = {
  id: string;
  name: string;
  code: string;
  designation: string;
  basicSalary: number;
};

const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_API}/api/v1`;

export default function TeacherSalaryPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  console.log(selectedTeacher);
  useEffect(() => {
    fetch(`${BASE_URL}/teacher`)
      .then((res) => res.json())
      .then((data) => setTeachers(data?.data || data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold mb-4">Teacher Salary Management</h1>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Code</th>
              <th className="p-3 text-left">Designation</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {teachers.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-3">{t.name}</td>
                <td className="p-3">{t.code}</td>
                <td className="p-3">{t.designation}</td>

                <td className="p-3 text-right">
                  <Button size="sm" onClick={() => setSelectedTeacher(t)}>
                    Create Salary
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <CreateSalaryModal
        teacher={selectedTeacher}
        onClose={() => setSelectedTeacher(null)}
        onSuccess={() => {
          setSelectedTeacher(null);
        }}
      />
    </div>
  );
}
