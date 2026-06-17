import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ComparisonChartData, ChartConfig } from "./types";

interface ComparisonChartProps {
  scaleName: string;
  data: ComparisonChartData[];
  config?: Partial<ChartConfig>;
  colors?: string[];
}

const CHART_GRID = "hsl(var(--border))";
const CHART_MUTED = "hsl(var(--muted-foreground))";
const CHART_SURFACE = "hsl(var(--card) / 0.95)";

const defaultColors = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--accent-foreground))",
  "hsl(var(--secondary-foreground))",
];

export function ComparisonChart({
  scaleName,
  data,
  config = {},
  colors = defaultColors,
}: ComparisonChartProps) {
  const {
    title = `Comparação — ${scaleName}`,
    subtitle = "Análise comparativa entre múltiplas aplicações",
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
            <p className="text-gray-500 text-sm">Nenhum dado disponível para comparação</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format data for chart
  const chartData = data.map((item) => ({
    name: item.application || new Date(item.date).toLocaleDateString("pt-BR"),
    score: item.score,
    maxScore: item.maxScore,
    percentage: Math.round((item.score / item.maxScore) * 100),
  }));

  // Calculate stats
  const avgScore = Math.round(chartData.reduce((sum, d) => sum + d.score, 0) / chartData.length);
  const maxScore = Math.max(...chartData.map((d) => d.maxScore));

  return (
    <Card>
      <CardHeader>
        <div className="space-y-2">
          <CardTitle>{title}</CardTitle>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-gray-600">Total Aplicações</p>
              <p className="text-lg font-bold text-blue-600">{chartData.length}</p>
            </div>

            <div className="p-2 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs text-gray-600">Melhor Score</p>
              <p className="text-lg font-bold text-green-600">
                {Math.max(...chartData.map((d) => d.score))}/{maxScore}
              </p>
            </div>

            <div className="p-2 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-xs text-gray-600">Média</p>
              <p className="text-lg font-bold text-purple-600">{avgScore}</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />}
            <XAxis
              dataKey="name"
              stroke={CHART_MUTED}
              style={{ fontSize: "12px" }}
            />
            <YAxis
              domain={[0, maxScore]}
              stroke={CHART_MUTED}
              style={{ fontSize: "12px" }}
              label={{ value: "Score", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: CHART_SURFACE,
                border: `1px solid ${CHART_GRID}`,
                borderRadius: "8px",
              }}
              formatter={(value) => [`Score: ${value}`, "Valor"]}
              labelFormatter={(label) => `Aplicação: ${label}`}
            />
            {showLegend && <Legend />}

            {/* Bars */}
            <Bar dataKey="score" name="Score Obtido" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Detailed Comparison Table */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="font-semibold text-sm mb-3">Detalhes por Aplicação</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50">
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">#</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Data</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Aplicação</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700">Score</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700">%</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-gray-200 hover:bg-gray-50 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-3 py-2 text-gray-600">
                      <span className="inline-block w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: colors[idx % colors.length] }}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-900">
                      {new Date(item.date).toLocaleDateString("pt-BR", {
                        month: "short",
                        day: "2-digit",
                        year: "2-digit",
                      })}
                    </td>
                    <td className="px-3 py-2 text-gray-700">{item.application || "—"}</td>
                    <td className="px-3 py-2 text-center font-semibold text-gray-900">
                      {item.score}/{item.maxScore}
                    </td>
                    <td className="px-3 py-2 text-center font-bold text-blue-600">
                      {Math.round((item.score / item.maxScore) * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
