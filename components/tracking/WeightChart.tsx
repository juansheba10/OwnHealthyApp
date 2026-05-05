"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface WeightEntry {
  date: string;
  weight_kg: number;
}

interface WeightChartProps {
  data: WeightEntry[];
  goalWeight?: number;
}

export function WeightChart({ data, goalWeight }: WeightChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-52 text-muted text-sm">
        Sin datos — registra tu primer peso
      </div>
    );
  }

  const chartData = data.map((d) => ({
    date: d.date,
    label: format(new Date(d.date + "T12:00:00"), "d MMM", { locale: es }),
    peso: Number(d.weight_kg),
  }));

  const weights = chartData.map((d) => d.peso);
  const min = Math.floor(Math.min(...weights, goalWeight ?? Infinity) - 1);
  const max = Math.ceil(Math.max(...weights, goalWeight ?? -Infinity) + 1);

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#252927" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#6b7a6d" }}
            tickLine={false}
            axisLine={{ stroke: "#252927" }}
          />
          <YAxis
            domain={[min, max]}
            tick={{ fontSize: 10, fill: "#6b7a6d" }}
            tickLine={false}
            axisLine={{ stroke: "#252927" }}
            unit=" kg"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1d1b",
              border: "1px solid #252927",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#e8ede9",
            }}
            formatter={(value) => [`${value} kg`, "Peso"]}
          />
          {goalWeight && (
            <ReferenceLine
              y={goalWeight}
              stroke="#b5f03d"
              strokeDasharray="5 5"
              label={{
                value: `Objetivo: ${goalWeight} kg`,
                position: "insideTopRight",
                fill: "#b5f03d",
                fontSize: 10,
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="peso"
            stroke="#4ade80"
            strokeWidth={2}
            dot={{ fill: "#4ade80", r: 3 }}
            activeDot={{ r: 5, fill: "#b5f03d" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
