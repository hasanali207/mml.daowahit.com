"use client";

import { Card, CardContent } from "@/components/ui/card";
import api from "@/lib/axios";
import {
  CheckCircle2,
  Database,
  Fingerprint,
  Loader2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

interface DeviceResponse {
  success: boolean;
  message: string;
  data: {
    userCounts: number;
    logCounts: number;
    logCapacity: number;
  };
}

const DeviceStatus = () => {
  const [device, setDevice] = useState<DeviceResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDevice = async () => {
      try {
        const res = await api.get("/api/v1/zkteco/connect", {
          timeout: 3000,
        });
        const data: DeviceResponse = await res.data;
        setDevice(data);
      } catch (err) {
        setDevice({
          success: false,
          message: "Device Offline",
          data: {
            userCounts: 0,
            logCounts: 0,
            logCapacity: 0,
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDevice();
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

  if (!device?.success) {
    return (
      <Card className="border-red-200">
        <CardContent className="flex h-40 flex-col items-center justify-center gap-2">
          <Fingerprint className="h-10 w-10 text-red-500" />
          <h2 className="text-lg font-semibold text-red-600">
            Device Offline or not reachable.
          </h2>
          <p className="text-sm text-muted-foreground">
            Please check the device connection and try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
          <div>
            <h2 className="text-xl font-bold text-green-600">
              Device Connected
            </h2>
            <p className="text-muted-foreground text-sm">{device.message}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <Users className="mb-2 h-5 w-5" />
            <p className="text-sm text-muted-foreground">Users</p>
            <p className="text-2xl font-bold">{device.data.userCounts}</p>
          </div>

          <div className="rounded-lg border p-4">
            <Fingerprint className="mb-2 h-5 w-5" />
            <p className="text-sm text-muted-foreground">Logs</p>
            <p className="text-2xl font-bold">{device.data.logCounts}</p>
          </div>

          <div className="rounded-lg border p-4">
            <Database className="mb-2 h-5 w-5" />
            <p className="text-sm text-muted-foreground">Capacity</p>
            <p className="text-2xl font-bold">
              {device.data.logCapacity.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviceStatus;
