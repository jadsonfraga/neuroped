import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LongitudinalChartData, ChartConfig } from "./types";

interface LongitudinalChartProps {
  scaleName: string;
  data: LongitudinalChartData[];
  maxScore: number;
  config?: Partial<ChartConfig>;
  onDataPointClick?: (dataPoint: LongitudinalChartData) => void;
}

export function LongitudinalChart({
  scaleName,
  data,
  maxScore,
  config = {},
  onDataPointClick,
}: LongitudinalChartProps) {
  const {
    title = `Evolução — ${scaleName}`,
    subtitle = "Visualização longitudinal do score ao longo do tempo",
    showLegend = true,
    showGrid = true,
    height = 400,
  } = config;

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-sm">Nenhum dado disponível para este período</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate statistics
  const scores = data.map((d) => d.score);
  const minScore = Math.min(...scores);
  const maxScoreData = Math.max(...scores);
  const avgScore = Math.round(scores.reduce((a, b) => a + b) / scores.length);
  const trend =
    data.length > 1
      ? data[data.length - 1].score > data[0].score
        ? "improving"
        : data[data.length - 1].score < data[0].score
          ? "declining"
          : "stable"
      : "no-data";

  // Format data for chart
  const chartData = data.map((d) => ({
    date: new Date(d.timestamp).toLocaleDateString("pt-BR", { month: "2-digit", day: "2-digit" }),
    score: d.score,
    timestamp: d.timestamp,
    assessor: d.assessor,
    notes: d.notes,
  }));

  const handleClick = (dataIndex: number) => {
    onDataPointClick?.(data[dataIndex]);
  };

  return (
    <Card>
      <CardHeader>
        <div className="space-y-2">
          <CardTitle>{title}</CardTitle>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-gray-600">Último Score</p>
              <p className="text-lg font-bold text-blue-600">
                {data[data.length - 1].score}/{maxScore}
              </p>
            </div>

            <div className="p-2 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-gray-600">Máximo</p>
              <p className="text-lg font-bold text-green-600">{maxScoreData}</p>
            </div>

            <div className="p-2 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-xs text-gray-600">Mínimo</p>
              <p className="text-lg font-bold text-orange-600">{minScore}</p>
            </div>

            <div className="p-2 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-xs text-gray-600">Média</p>
              <p className="text-lg font-bold text-purple-600">{avgScore}</p>
            </div>
          </div>

          {/* Trend Indicator */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm font-semibold text-gray-700">Tendência:</span>
            {trend === "improving" && (
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Melhorando</span>
              </div>
            )}
            {trend === "declining" && (
              <div className="flex items-center gap-1 text-red-600">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm font-medium">Piorando</span>
              </div>
            )}
            {trend === "stable" && (
              <div className="flex items-center gap-1 text-gray-600">
                <Minus className="h-4 w-4" />
                <span className="text-sm font-medium">Estável</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              domain={[0, maxScore]}
              stroke="#9ca3af"
              style={{ fontSize: "12px" }}
              label={{ value: "Score", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
              formatter={(value) => [`Score: ${value}`, "Valor"]}
              labelFormatter={(label) => `Data: ${label}`}
            />
            {showLegend && <Legend />}

            {/* Reference lines */}
            <ReferenceLine
              y={maxScore}
              stroke="#d1d5db"
              strokeDasharray="5 5"
              label={{ value: "Máximo", position: "right", fill: "#9ca3af", fontSize: 12 }}
            />
            <ReferenceLine
              y={avgScore}
              stroke="#93c5fd"
              strokeDasharray="5 5"
              label={{ value: "Média", position: "right", fill: "#3b82f6", fontSize: 12 }}
            />

            {/* Main line */}
            <Line
              type="monotone"
              dataKey="score"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", r: 5 }}
              activeDot={{ r: 7, fill: "#1d4ed8" }}
              onClick={(data: any) => handleClick(data.index)}
              name="Score"
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Data Table */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="font-semibold text-sm mb-3">Histórico Detalhado</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {data.map((point, idx) => (
              <div
                key={idx}
                className="p-2 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer transition text-sm"
                onClick={() => handleClick(idx)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(point.timestamp).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Avaliador: {point.assessor}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{point.score}/{maxScore}</p>
                    <p className="text-xs text-gray-500">
                      {Math.round((point.score / maxScore) * 100)}%
                    </p>
                  </div>
                </div>
                {point.notes && (
                  <p className="text-xs text-gray-600 mt-2 italic">"{point.notes}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
