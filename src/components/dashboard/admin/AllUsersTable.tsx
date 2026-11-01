"use client";

import api from "@/lib/axios";
import Image from "next/image";
import { useEffect, useState } from "react";

type Student = {
  id: string;
  code: string;
  name: string;
  profilePicture?: string | null;
};

type Admin = {
  id: string;
  name: string;
  code: string;
  contactNumber: string;
  profilePicture?: string | null;
};

type User = {
  id: string;
  username: string;
  name: string;
  role: string;
  userStatus: string;
  createdAt: string;
  student: Student | null;
  admin: Admin | null;
  teacher: any | null;
};

export default function AllUsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  /* 🔍 filters */
  const [searchTerm, setSearchTerm] = useState("");
  const [role, setRole] = useState("");

  /* 📄 pagination */
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / limit);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (searchTerm) params.append("searchTerm", searchTerm);
      if (role) params.append("role", role);

      const res = await api.get(
        `${process.env.NEXT_PUBLIC_BASE_API}/api/v1/user?${params.toString()}`,
      );
      const data = await res.data;

      setUsers(data.data || []);
      setTotal(data.meta?.total || 0);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  /* 🔁 refetch on filter/page change */
  useEffect(() => {
    fetchUsers();
  }, [searchTerm, role, page]);

  const getPerson = (user: User) => user.admin || user.student || user.teacher;

  return (
    <div className="space-y-4">
      {/* 🔍 Search & Role Filter */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name / code / username"
          className="border px-3 py-2 rounded w-64"
          value={searchTerm}
          onChange={(e) => {
            setPage(1);
            setSearchTerm(e.target.value);
          }}
        />

        <select
          className="border px-3 py-2 rounded"
          value={role}
          onChange={(e) => {
            setPage(1);
            setRole(e.target.value);
          }}
        >
          <option value="">All Roles</option>
          <option value="STUDENT">Student</option>
          <option value="TEACHER">Teacher</option>
          <option value="ADMIN">Admin</option>
          <option value="ACCOUNTANT">Accountant</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="DONOR">Donor</option>
        </select>
      </div>

      {/* 📋 Table */}
      {loading ? (
        <p className="text-center py-6">Loading users...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded">
            <thead className="bg-gray-100">
              <tr>
                {[
                  "Profile",
                  "Username",
                  "name",
                  "Role",
                  "Status",
                  "Name",
                  "ID",
                  "Mobile",
                  "Created",
                ].map((h) => (
                  <th key={h} className="px-4 py-2 border">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const person = getPerson(user);
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border">
                      {person?.profilePicture ? (
                        <Image
                          src={person.profilePicture}
                          alt="profile"
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-2 border">{user.username}</td>
                    <td className="px-4 py-2 border">{user.name}</td>
                    <td className="px-4 py-2 border">{user.role}</td>
                    <td className="px-4 py-2 border">{user.userStatus}</td>
                    <td className="px-4 py-2 border">{person?.name || "-"}</td>
                    <td className="px-4 py-2 border">{person?.code || "-"}</td>
                    <td className="px-4 py-2 border">
                      {(person as any)?.contactNumber || "-"}
                    </td>
                    <td className="px-4 py-2 border">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 📄 Pagination */}
      <div className="flex justify-between items-center">
        <p>
          Page {page} of {totalPages}
        </p>
        <div className="space-x-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
