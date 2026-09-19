"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMonthlyBusiness } from "@/services/monthlyBusinessApi";

export const monthlyBusinessKeys = {
  all: ["monthly-business"] as const,
  report: (year: number, service: string) =>
    [...monthlyBusinessKeys.all, year, service || "ALL"] as const,
};

export function useMonthlyBusiness(year: number, service = "") {
  return useQuery({
    queryKey: monthlyBusinessKeys.report(year, service),
    queryFn: async () => {
      try {
        return await fetchMonthlyBusiness({
          year,
          service: service || undefined,
        });
      } catch (error) {
        console.error("Unable to load monthly business", error);
        throw error;
      }
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
    retry: 1,
  });
}
