"use client";

import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  MessageSquare,
  RefreshCcw,
  Search,
  Send,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import api from "@/lib/axios";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getErrorMessage } from "@/lib/getErrorMessage ";
import toast from "react-hot-toast";

type SMSLog = {
  id: string;
  mobile: string;
  message: string;
  status: "SENT" | "FAILED" | "PENDING";
  recipientType?: string;
  recipientId?: string;
  campaignId?: string;
  sentBy?: string;
  error?: string;
  smsCount?: number;
  cost?: number;
  createdAt: string;
};

export default function SMSLogsPage() {
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [viewOpen, setViewOpen] = useState(false);
  const [currentLog, setCurrentLog] = useState<SMSLog | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const res = await api.get("/api/v1/sms/logs");

      setLogs(res.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      const mobileMatch = item.mobile
        .toLowerCase()
        .includes(search.toLowerCase());

      const statusMatch =
        statusFilter === "ALL" ? true : item.status === statusFilter;

      return mobileMatch && statusMatch;
    });
  }, [logs, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: logs.length,

      sent: logs.filter((x) => x.status === "SENT").length,

      failed: logs.filter((x) => x.status === "FAILED").length,

      pending: logs.filter((x) => x.status === "PENDING").length,

      cost: logs.reduce((sum, x) => sum + (x.cost || 0), 0),
    };
  }, [logs]);

  const handleSelectAll = () => {
    const failedIds = filteredLogs
      .filter((x) => x.status === "FAILED")
      .map((x) => x.id);

    if (selected.length === failedIds.length) {
      setSelected([]);
    } else {
      setSelected(failedIds);
    }
  };

  const handleSingleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleResend = async (id: string) => {
    try {
      await api.post("/api/v1/sms/retry-failed", {
        ids: [id],
      });
      toast.success("Message Sent Successfully");
      fetchLogs();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleBulkResend = async () => {
    try {
      await api.post("/api/v1/sms/retry-failed", {
        ids: selected,
      });
      toast.success("Message Sent Successfully");
      setSelected([]);
      fetchLogs();
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error));
    }
  };

  const openView = (log: SMSLog) => {
    setCurrentLog(log);
    setViewOpen(true);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "SENT":
        return <Badge className="bg-green-600">Sent</Badge>;

      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>;

      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">SMS Logs</h1>

          <p className="text-muted-foreground">Monitor and manage all SMS</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>

          <Button disabled={!selected.length} onClick={handleBulkResend}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Retry Selected ({selected.length})
          </Button>
        </div>
      </div>

      {/* STATS */}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-muted-foreground text-sm">Total SMS</p>
              <h2 className="text-3xl font-bold">{stats.total}</h2>
            </div>

            <MessageSquare className="h-10 w-10 text-primary" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-muted-foreground text-sm">Sent</p>

              <h2 className="text-3xl font-bold text-green-600">
                {stats.sent}
              </h2>
            </div>

            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-muted-foreground text-sm">Failed</p>

              <h2 className="text-3xl font-bold text-red-600">
                {stats.failed}
              </h2>
            </div>

            <AlertCircle className="h-10 w-10 text-red-600" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-muted-foreground text-sm">Total Cost</p>

              <h2 className="text-3xl font-bold">৳{stats.cost.toFixed(2)}</h2>
            </div>

            <Wallet className="h-10 w-10 text-blue-600" />
          </CardContent>
        </Card>
      </div>

      {/* FILTERS */}

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

              <Input
                className="pl-10"
                placeholder="Search mobile..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>

                <SelectItem value="SENT">Sent</SelectItem>

                <SelectItem value="FAILED">Failed</SelectItem>

                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setStatusFilter("ALL");
              }}
            >
              Reset Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* TABLE */}

      <div className="overflow-x-auto">
        <table className="w-full border text-sm">
          <thead className="bg-secondary text-white">
            <tr className="">
              <th className="border p-2">
                <input
                  type="checkbox"
                  checked={
                    filteredLogs.filter((x) => x.status === "FAILED").length >
                      0 &&
                    selected.length ===
                      filteredLogs.filter((x) => x.status === "FAILED").length
                  }
                  onChange={handleSelectAll}
                  className="h-4 w-4"
                />
              </th>

              <th className="border p-2">Mobile</th>

              <th className="border p-2">Message</th>

              <th className="border p-2">Status</th>

              <th className="border p-2">SMS</th>

              <th className="border p-2">Cost</th>

              <th className="border p-2">Date</th>

              <th className="border p-2">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b transition-colors hover:bg-muted/30"
                >
                  <td className="p-4">
                    {log.status === "FAILED" && (
                      <input
                        type="checkbox"
                        checked={selected.includes(log.id)}
                        onChange={() => handleSingleSelect(log.id)}
                        className="border p-2"
                      />
                    )}
                  </td>

                  <td className="border p-2">{log.mobile}</td>

                  <td className="border p-2">
                    <div className="max-w-[350px] truncate">{log.message}</div>
                  </td>

                  <td className="border p-2">{statusBadge(log.status)}</td>

                  <td className="border p-2">{log.smsCount || 1}</td>

                  <td className="border p-2">৳{log.cost || 0}</td>

                  <td className="border p-2 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </td>

                  <td className="border p-2">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => openView(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {log.status === "FAILED" && (
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => handleResend(log.id)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="p-10 text-center text-muted-foreground"
                >
                  No SMS logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* DETAILS DIALOG */}

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>SMS Details</DialogTitle>
          </DialogHeader>

          {currentLog && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold">Mobile</p>

                <p>{currentLog.mobile}</p>
              </div>

              <div>
                <p className="font-semibold">Message</p>

                <div className="rounded-lg border p-3">
                  {currentLog.message}
                </div>
              </div>

              <div>
                <p className="font-semibold">Status</p>

                {statusBadge(currentLog.status)}
              </div>

              {currentLog.error && (
                <div>
                  <p className="font-semibold text-red-600">Error</p>

                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    {currentLog.error}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
