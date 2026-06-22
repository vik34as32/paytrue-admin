"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader } from "@/components/common/Card";
import { ChartDataPoint } from "@/types";

interface LineChartCardProps {
  title: string;
  data: ChartDataPoint[];
  dataKey?: string;
  color?: string;
}

export function LineChartCard({
  title,
  data,
  dataKey = "value",
  color = "#4318FF",
}: LineChartCardProps) {
  return (
    <Card>
      <CardHeader title={title} />
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
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
                boxShadow: "0 18px 40px rgba(112,144,176,0.12)",
              }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={3}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
