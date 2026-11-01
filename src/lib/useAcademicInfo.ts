"use client";

import api from "@/lib/axios";
import { useCallback, useEffect, useState } from "react";

export type AcademicInfo = {
  id: string;
  name: string;
  shortName?: string | null;
  tagline?: string | null;
  establishedYear?: number | null;
  eiinNumber?: string | null;
  description?: string | null;
  mission?: string | null;
  vision?: string | null;

  logo?: string | null;
  banner?: string | null;
  favicon?: string | null;

  phone?: string | null;
  secondaryPhone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;

  mapEmbedUrl?: string | null;
  facebookUrl?: string | null;
  youtubeUrl?: string | null;

  principalName?: string | null;
  principalSignature?: string | null;

  signature2Name?: string | null;
  signature2Designation?: string | null;
  signature2Image?: string | null;

  signature3Name?: string | null;
  signature3Designation?: string | null;
  signature3Image?: string | null;

  signature4Name?: string | null;
  signature4Designation?: string | null;
  signature4Image?: string | null;

  principalMessage?: string | null;
};

export function useAcademicInfo() {
  const [info, setInfo] = useState<AcademicInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/api/v1/academic-info");

      setInfo(res.data?.data ?? null);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load academic information";

      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  return {
    info,
    loading,
    error,
    refetch: fetchInfo,
  };
}
