"use client";

import { Fingerprint, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/axios";

type DeviceUser = {
  uid: number;
  role: number;
  password: string;
  name: string;
  cardno: number;
  userId: string;
};

type DeviceUsersResponse = {
  success: boolean;
  message: string;
  data: DeviceUser[];
};

export default function DeviceUsers() {
  const [users, setUsers] = useState<DeviceUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get("/api/v1/zkteco/users", {
          timeout: 3000,
        });

        setUsers(res.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to connect to device");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Fingerprint className="mb-4 h-12 w-12 text-red-500" />

          <h2 className="text-lg font-semibold text-red-600">Device Offline</h2>

          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Device Users</CardTitle>
          <p className="text-sm text-muted-foreground">
            {users?.data?.length ?? 0} users found
          </p>
        </div>

        <Badge variant="secondary">
          <Fingerprint className="mr-1 h-4 w-4" />
          Connected
        </Badge>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full overflow-hidden rounded-lg border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-3 text-left">#</th>
                <th className="border p-3 text-left">UID</th>
                <th className="border p-3 text-left">User ID</th>
                <th className="border p-3 text-left">Name</th>
                <th className="border p-3 text-left">Card No</th>
                <th className="border p-3 text-left">Role</th>
              </tr>
            </thead>

            <tbody>
              {users?.data.map((user, index) => (
                <tr
                  key={user.uid}
                  className="transition-colors hover:bg-gray-50"
                >
                  <td className="border p-3">{index + 1}</td>
                  <td className="border p-3">{user.uid}</td>
                  <td className="border p-3 font-medium">{user.userId}</td>

                  <td className="border p-3">
                    {user.name || (
                      <span className="italic text-gray-400">No Name</span>
                    )}
                  </td>

                  <td className="border p-3">
                    {user.cardno === 0 ? "-" : user.cardno}
                  </td>

                  <td className="border p-3">
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                      {user.role === 0 ? "User" : "Admin"}
                    </span>
                  </td>
                </tr>
              ))}

              {users?.data.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="border p-6 text-center text-gray-500"
                  >
                    No device users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
