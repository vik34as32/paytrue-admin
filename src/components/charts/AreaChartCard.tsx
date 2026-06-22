"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader } from "@/components/common/Card";
import { ChartDataPoint } from "@/types";

interface AreaChartCardProps {
  title: string;
  data: ChartDataPoint[];
  dataKey?: string;
}

export function AreaChartCard({
  title,
  data,
  dataKey = "revenue",
}: AreaChartCardProps) {
  return (
    <Card>
      <CardHeader title={title} />
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4318FF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4318FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#A3AED0", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#A3AED0", fontSize: 12 }}
            />
            <Tooltip />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke="#4318FF"
              strokeWidth={2}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
