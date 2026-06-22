"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardHeader } from "@/components/common/Card";
import { ChartDataPoint } from "@/types";

const COLORS = ["#4318FF", "#05CD99", "#FFB547", "#EE5D50", "#6AD2FF"];

interface PieChartCardProps {
  title: string;
  data: ChartDataPoint[];
}

export function PieChartCard({ title, data }: PieChartCardProps) {
  return (
    <Card>
      <CardHeader title={title} />
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
