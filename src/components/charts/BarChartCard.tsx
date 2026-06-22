"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader } from "@/components/common/Card";
import { ChartDataPoint } from "@/types";

interface BarChartCardProps {
  title: string;
  data: ChartDataPoint[];
  dataKey?: string;
  color?: string;
}

export function BarChartCard({
  title,
  data,
  dataKey = "value",
  color = "#4318FF",
}: BarChartCardProps) {
  return (
    <Card>
      <CardHeader title={title} />
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
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
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #E9EDF7",
              }}
            />
            <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
