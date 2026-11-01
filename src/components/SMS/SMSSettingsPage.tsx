"use client";

import api from "@/lib/axios";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { MessageSquare, Settings, Wallet } from "lucide-react";

import Image from "next/image";
import toast from "react-hot-toast";

type SmsStats = {
  balance: number;
  smsRate: number;
  totalSmsSent: number;
  totalCost: number;
};

type SmsConfig = {
  id: string;
  smsRate: number;
  balance: number;
};

export default function SMSSettingsPage() {
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState<SmsStats>({
    balance: 0,
    smsRate: 0,
    totalSmsSent: 0,
    totalCost: 0,
  });

  const [config, setConfig] = useState<SmsConfig>({
    id: "",
    smsRate: 0,
    balance: 0,
  });

  const [balanceAmount, setBalanceAmount] = useState("");

  const fetchStats = async () => {
    try {
      const res = await api.get("/api/v1/sms/stats");

      setStats(res.data.data);
    } catch (error) {
      console.log(error);
      toast.error("Failed to load SMS stats");
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const updateRate = async () => {
    try {
      if (config.smsRate <= 0) {
        toast.error("SMS Rate must be greater than 0");
        return;
      }

      setLoading(true);

      await api.patch(`/api/v1/sms/config/${config.id}`, {
        smsRate: Number(config.smsRate),
      });

      toast.success("SMS Rate Updated Successfully");

      await Promise.all([fetchStats()]);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed To Update SMS Rate",
      );
    } finally {
      setLoading(false);
    }
  };

  const addBalance = async () => {
    try {
      if (!balanceAmount || Number(balanceAmount) <= 0) {
        toast.error("Enter Valid Amount");
        return;
      }

      setLoading(true);

      await api.patch("/api/v1/sms/add-balance", {
        amount: Number(balanceAmount),
      });

      toast.success("Balance Added Successfully");

      setBalanceAmount("");

      await Promise.all([fetchStats()]);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed To Add Balance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">SMS Management</h1>
        <p className="text-muted-foreground">
          Manage SMS balance, SMS rate and usage statistics.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>

              <h2 className="text-3xl font-bold">
                ৳ {stats.balance.toFixed(2)}
              </h2>
            </div>

            <Wallet className="h-10 w-10 text-primary" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm text-muted-foreground">SMS Rate</p>

              <h2 className="text-3xl font-bold">
                ৳ {stats.smsRate.toFixed(2)}
              </h2>
            </div>

            {/* <BangladeshiTaka className="h-10 w-10 text-primary" /> */}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Total SMS Sent</p>

              <h2 className="text-3xl font-bold">{stats.totalSmsSent}</h2>
            </div>

            <MessageSquare className="h-10 w-10 text-primary" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Cost</p>

              <h2 className="text-3xl font-bold">
                ৳ {stats.totalCost?.toFixed(2)}
              </h2>
            </div>

            {/* <BangladeshiTaka className="h-10 w-10 text-primary" /> */}
          </CardContent>
        </Card>
      </div>

      {/* Forms */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* SMS Rate Update */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings size={18} />
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-lg font-medium">
                Sent Money Only
              </label>

              <p className="text-xl">01861026837</p>

              <div className="flex justify-between items-center gap-6 mt-5">
                <div className="relative h-36 w-full overflow-hidden rounded-xl border">
                  <Image
                    src="/bkash.png"
                    alt="SMS Management"
                    width={512}
                    height={300}
                    className="mx-auto h-auto w-full max-w-md object-contain"
                    priority
                  />
                </div>
                <div className="relative h-36 w-full overflow-hidden rounded-xl border">
                  <Image
                    src="/nagad.png"
                    alt="SMS Management"
                    width={512}
                    height={300}
                    className="mx-auto h-auto w-full max-w-md object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Balance */}
        <Card>
          <CardHeader>
            <CardTitle>Add SMS Balance</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Amount</label>

              <Input
                type="number"
                placeholder="Enter Amount"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
              />
            </div>

            <Button disabled={loading} onClick={addBalance} className="w-full">
              {loading ? "Adding..." : "Add Balance"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
