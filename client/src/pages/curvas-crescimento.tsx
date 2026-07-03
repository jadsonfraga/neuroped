import { useState, useMemo } from "react";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

// WHO simplified reference data (percentiles: P3, P10, P25, P50, P75, P90, P97)
// Age in months for 0-5y, years for 5-18y

type PercentileRow = {
  age: number; // months (for 0-60) or years (for 5-18)
  p3: number; p10: number; p25: number; p50: number; p75: number; p90: number; p97: number;
};

// WEIGHT-FOR-AGE boys (kg) — 0 to 18y (selected points)
const weightBoys: PercentileRow[] = [
  { age: 0,  p3: 2.5, p10: 2.8, p25: 3.0, p50: 3.3, p75: 3.7, p90: 4.0, p97: 4.3 },
  { age: 3,  p3: 5.0, p10: 5.5, p25: 6.0, p50: 6.5, p75: 7.0, p90: 7.5, p97: 8.0 },
  { age: 6,  p3: 6.4, p10: 7.0, p25: 7.6, p50: 8.3, p75: 9.0, p90: 9.6, p97: 10.4 },
  { age: 9,  p3: 7.2, p10: 7.9, p25: 8.6, p50: 9.4, p75: 10.1, p90: 10.8, p97: 11.6 },
  { age: 12, p3: 7.8, p10: 8.6, p25: 9.4, p50: 10.2, p75: 11.1, p90: 11.8, p97: 12.6 },
  { age: 18, p3: 8.8, p10: 9.7, p25: 10.7, p50: 11.6, p75: 12.6, p90: 13.5, p97: 14.4 },
  { age: 24, p3: 9.7, p10: 10.8, p25: 11.9, p50: 13.0, p75: 14.1, p90: 15.1, p97: 16.1 },
  { age: 36, p3: 11.4, p10: 12.6, p25: 13.9, p50: 15.3, p75: 16.7, p90: 18.0, p97: 19.5 },
  { age: 48, p3: 13.0, p10: 14.4, p25: 16.0, p50: 17.7, p75: 19.6, p90: 21.4, p97: 23.4 },
  { age: 60, p3: 14.6, p10: 16.3, p25: 18.2, p50: 20.3, p75: 22.7, p90: 25.0, p97: 27.6 },
  { age: 72, p3: 16.3, p10: 18.3, p25: 20.5, p50: 23.1, p75: 26.0, p90: 28.8, p97: 32.0 },
  { age: 96, p3: 20.6, p10: 23.5, p25: 26.9, p50: 31.0, p75: 35.6, p90: 40.1, p97: 45.1 },
  { age: 120, p3: 25.5, p10: 29.5, p25: 34.2, p50: 40.0, p75: 46.5, p90: 53.0, p97: 60.0 },
  { age: 144, p3: 32.0, p10: 38.0, p25: 44.5, p50: 52.0, p75: 60.5, p90: 68.5, p97: 77.0 },
  { age: 168, p3: 42.0, p10: 49.0, p25: 56.5, p50: 64.5, p75: 73.5, p90: 81.5, p97: 90.0 },
  { age: 192, p3: 52.0, p10: 59.5, p25: 67.5, p50: 76.0, p75: 85.0, p90: 93.0, p97: 102.0 },
  { age: 216, p3: 58.0, p10: 66.0, p25: 74.0, p50: 83.0, p75: 93.0, p90: 102.0, p97: 112.0 },
];

// WEIGHT-FOR-AGE girls (kg)
const weightGirls: PercentileRow[] = [
  { age: 0,  p3: 2.4, p10: 2.7, p25: 2.9, p50: 3.2, p75: 3.6, p90: 3.9, p97: 4.2 },
  { age: 3,  p3: 4.6, p10: 5.0, p25: 5.5, p50: 6.0, p75: 6.5, p90: 7.0, p97: 7.5 },
  { age: 6,  p3: 5.8, p10: 6.4, p25: 7.0, p50: 7.7, p75: 8.4, p90: 9.0, p97: 9.7 },
  { age: 9,  p3: 6.6, p10: 7.3, p25: 8.0, p50: 8.8, p75: 9.6, p90: 10.3, p97: 11.0 },
  { age: 12, p3: 7.1, p10: 7.9, p25: 8.7, p50: 9.6, p75: 10.5, p90: 11.3, p97: 12.2 },
  { age: 18, p3: 8.2, p10: 9.1, p25: 10.0, p50: 11.0, p75: 12.1, p90: 13.0, p97: 14.0 },
  { age: 24, p3: 9.2, p10: 10.2, p25: 11.2, p50: 12.4, p75: 13.6, p90: 14.6, p97: 15.7 },
  { age: 36, p3: 11.0, p10: 12.2, p25: 13.5, p50: 14.9, p75: 16.4, p90: 17.7, p97: 19.2 },
  { age: 48, p3: 12.7, p10: 14.1, p25: 15.7, p50: 17.4, p75: 19.4, p90: 21.1, p97: 23.2 },
  { age: 60, p3: 14.4, p10: 16.1, p25: 18.0, p50: 20.2, p75: 22.6, p90: 25.0, p97: 27.8 },
  { age: 72, p3: 16.2, p10: 18.3, p25: 20.7, p50: 23.5, p75: 26.7, p90: 29.8, p97: 33.3 },
  { age: 96, p3: 20.7, p10: 23.8, p25: 27.5, p50: 32.0, p75: 37.4, p90: 42.8, p97: 49.0 },
  { age: 120, p3: 26.0, p10: 30.5, p25: 35.8, p50: 42.5, p75: 50.5, p90: 58.5, p97: 68.0 },
  { age: 144, p3: 34.0, p10: 40.0, p25: 47.0, p50: 55.5, p75: 65.0, p90: 74.0, p97: 84.0 },
  { age: 168, p3: 44.0, p10: 51.5, p25: 59.5, p50: 69.0, p75: 79.5, p90: 89.0, p97: 99.0 },
  { age: 192, p3: 48.0, p10: 55.5, p25: 63.5, p50: 72.5, p75: 82.0, p90: 90.5, p97: 100.0 },
  { age: 216, p3: 49.0, p10: 57.0, p25: 65.5, p50: 74.5, p75: 84.0, p90: 92.5, p97: 102.0 },
];

// HEIGHT-FOR-AGE boys (cm)
const heightBoys: PercentileRow[] = [
  { age: 0,   p3: 46.3, p10: 47.5, p25: 48.6, p50: 49.9, p75: 51.1, p90: 52.3, p97: 53.4 },
  { age: 3,   p3: 57.3, p10: 58.7, p25: 60.0, p50: 61.4, p75: 62.8, p90: 64.1, p97: 65.5 },
  { age: 6,   p3: 63.3, p10: 64.9, p25: 66.3, p50: 67.8, p75: 69.3, p90: 70.7, p97: 72.3 },
  { age: 12,  p3: 71.0, p10: 72.8, p25: 74.5, p50: 76.1, p75: 77.7, p90: 79.4, p97: 81.2 },
  { age: 24,  p3: 82.3, p10: 84.4, p25: 86.4, p50: 88.3, p75: 90.3, p90: 92.3, p97: 94.3 },
  { age: 36,  p3: 89.2, p10: 91.5, p25: 93.8, p50: 96.1, p75: 98.3, p90: 100.5, p97: 102.8 },
  { age: 48,  p3: 95.8, p10: 98.4, p25: 100.9, p50: 103.3, p75: 105.8, p90: 108.2, p97: 110.8 },
  { age: 60,  p3: 102.0, p10: 104.7, p25: 107.3, p50: 110.0, p75: 112.6, p90: 115.2, p97: 117.9 },
  { age: 72,  p3: 107.5, p10: 110.4, p25: 113.2, p50: 116.1, p75: 118.9, p90: 121.8, p97: 124.7 },
  { age: 96,  p3: 118.5, p10: 121.8, p25: 125.2, p50: 128.5, p75: 131.9, p90: 135.2, p97: 138.6 },
  { age: 120, p3: 129.0, p10: 132.9, p25: 136.7, p50: 140.5, p75: 144.3, p90: 148.1, p97: 151.9 },
  { age: 144, p3: 140.0, p10: 144.4, p25: 148.5, p50: 152.5, p75: 156.6, p90: 160.7, p97: 165.0 },
  { age: 168, p3: 153.0, p10: 157.5, p25: 161.5, p50: 165.5, p75: 169.5, p90: 173.5, p97: 177.5 },
  { age: 192, p3: 162.0, p10: 166.5, p25: 170.0, p50: 174.0, p75: 178.0, p90: 182.0, p97: 186.0 },
  { age: 216, p3: 162.5, p10: 167.0, p25: 170.5, p50: 174.5, p75: 178.5, p90: 182.5, p97: 186.5 },
];

// HEIGHT-FOR-AGE girls (cm)
const heightGirls: PercentileRow[] = [
  { age: 0,   p3: 45.6, p10: 46.8, p25: 47.9, p50: 49.1, p75: 50.4, p90: 51.5, p97: 52.7 },
  { age: 3,   p3: 56.0, p10: 57.3, p25: 58.6, p50: 60.0, p75: 61.3, p90: 62.6, p97: 64.0 },
  { age: 6,   p3: 61.5, p10: 63.1, p25: 64.6, p50: 66.0, p75: 67.5, p90: 68.9, p97: 70.4 },
  { age: 12,  p3: 69.2, p10: 71.0, p25: 72.6, p50: 74.3, p75: 76.0, p90: 77.6, p97: 79.3 },
  { age: 24,  p3: 81.0, p10: 83.1, p25: 85.1, p50: 87.1, p75: 89.1, p90: 91.1, p97: 93.1 },
  { age: 36,  p3: 88.3, p10: 90.6, p25: 93.0, p50: 95.2, p75: 97.5, p90: 99.8, p97: 102.2 },
  { age: 48,  p3: 95.0, p10: 97.6, p25: 100.2, p50: 102.7, p75: 105.2, p90: 107.7, p97: 110.3 },
  { age: 60,  p3: 101.5, p10: 104.2, p25: 106.9, p50: 109.5, p75: 112.2, p90: 114.9, p97: 117.6 },
  { age: 72,  p3: 107.0, p10: 110.0, p25: 112.8, p50: 115.7, p75: 118.5, p90: 121.3, p97: 124.2 },
  { age: 96,  p3: 118.0, p10: 121.5, p25: 125.0, p50: 128.5, p75: 132.0, p90: 135.5, p97: 139.0 },
  { age: 120, p3: 129.5, p10: 133.5, p25: 137.5, p50: 141.5, p75: 145.5, p90: 149.5, p97: 153.5 },
  { age: 144, p3: 141.0, p10: 145.5, p25: 149.5, p50: 154.0, p75: 158.5, p90: 162.5, p97: 166.5 },
  { age: 168, p3: 149.0, p10: 153.5, p25: 157.5, p50: 162.0, p75: 166.0, p90: 169.5, p97: 173.5 },
  { age: 192, p3: 150.5, p10: 155.0, p25: 159.0, p50: 163.0, p75: 167.0, p90: 170.5, p97: 174.5 },
  { age: 216, p3: 150.5, p10: 155.5, p25: 159.5, p50: 163.5, p75: 167.5, p90: 171.0, p97: 175.0 },
];

// HC-FOR-AGE boys (cm) — 0-60 months
const hcBoys: PercentileRow[] = [
  { age: 0,  p3: 32.1, p10: 33.1, p25: 34.2, p50: 35.2, p75: 36.2, p90: 37.0, p97: 37.9 },
  { age: 3,  p3: 38.0, p10: 39.0, p25: 40.0, p50: 41.0, p75: 42.0, p90: 43.0, p97: 44.0 },
  { age: 6,  p3: 41.5, p10: 42.5, p25: 43.5, p50: 44.5, p75: 45.5, p90: 46.3, p97: 47.3 },
  { age: 12, p3: 44.0, p10: 45.0, p25: 46.1, p50: 47.1, p75: 48.2, p90: 49.2, p97: 50.3 },
  { age: 24, p3: 46.3, p10: 47.3, p25: 48.4, p50: 49.5, p75: 50.6, p90: 51.6, p97: 52.6 },
  { age: 36, p3: 47.7, p10: 48.7, p25: 49.8, p50: 50.9, p75: 52.0, p90: 53.0, p97: 54.1 },
  { age: 48, p3: 48.6, p10: 49.7, p25: 50.8, p50: 52.0, p75: 53.1, p90: 54.1, p97: 55.1 },
  { age: 60, p3: 49.3, p10: 50.4, p25: 51.6, p50: 52.8, p75: 53.9, p90: 54.9, p97: 56.0 },
];

// HC-FOR-AGE girls (cm) — 0-60 months
const hcGirls: PercentileRow[] = [
  { age: 0,  p3: 31.7, p10: 32.7, p25: 33.7, p50: 34.6, p75: 35.6, p90: 36.5, p97: 37.4 },
  { age: 3,  p3: 37.3, p10: 38.3, p25: 39.3, p50: 40.2, p75: 41.2, p90: 42.1, p97: 43.0 },
  { age: 6,  p3: 40.5, p10: 41.5, p25: 42.5, p50: 43.5, p75: 44.5, p90: 45.4, p97: 46.3 },
  { age: 12, p3: 43.2, p10: 44.2, p25: 45.1, p50: 46.1, p75: 47.1, p90: 48.0, p97: 49.0 },
  { age: 24, p3: 45.3, p10: 46.3, p25: 47.3, p50: 48.4, p75: 49.4, p90: 50.3, p97: 51.2 },
  { age: 36, p3: 46.6, p10: 47.7, p25: 48.7, p50: 49.8, p75: 50.8, p90: 51.8, p97: 52.7 },
  { age: 48, p3: 47.6, p10: 48.6, p25: 49.7, p50: 50.8, p75: 51.8, p90: 52.7, p97: 53.6 },
  { age: 60, p3: 48.4, p10: 49.4, p25: 50.5, p50: 51.6, p75: 52.6, p90: 53.5, p97: 54.4 },
];

// BMI-FOR-AGE boys (kg/m²) — 2-18 y (in months)
const bmiBoys: PercentileRow[] = [
  { age: 24,  p3: 14.3, p10: 14.9, p25: 15.5, p50: 16.2, p75: 17.0, p90: 17.8, p97: 18.8 },
  { age: 36,  p3: 13.7, p10: 14.3, p25: 14.9, p50: 15.5, p75: 16.3, p90: 17.0, p97: 17.9 },
  { age: 48,  p3: 13.3, p10: 13.8, p25: 14.4, p50: 15.0, p75: 15.8, p90: 16.6, p97: 17.5 },
  { age: 60,  p3: 13.1, p10: 13.6, p25: 14.2, p50: 14.8, p75: 15.7, p90: 16.6, p97: 17.7 },
  { age: 72,  p3: 12.9, p10: 13.5, p25: 14.1, p50: 14.8, p75: 15.7, p90: 16.8, p97: 18.0 },
  { age: 96,  p3: 13.1, p10: 13.7, p25: 14.4, p50: 15.3, p75: 16.5, p90: 17.8, p97: 19.6 },
  { age: 120, p3: 13.5, p10: 14.2, p25: 15.2, p50: 16.3, p75: 17.7, p90: 19.4, p97: 21.5 },
  { age: 144, p3: 14.2, p10: 15.2, p25: 16.4, p50: 17.8, p75: 19.6, p90: 21.7, p97: 24.1 },
  { age: 168, p3: 15.4, p10: 16.6, p25: 18.1, p50: 19.9, p75: 22.0, p90: 24.2, p97: 26.9 },
  { age: 192, p3: 17.0, p10: 18.3, p25: 20.0, p50: 22.0, p75: 24.3, p90: 26.6, p97: 29.3 },
  { age: 216, p3: 18.2, p10: 19.7, p25: 21.4, p50: 23.4, p75: 25.9, p90: 28.3, p97: 31.1 },
];

// BMI-FOR-AGE girls (kg/m²)
const bmiGirls: PercentileRow[] = [
  { age: 24,  p3: 14.0, p10: 14.6, p25: 15.2, p50: 15.9, p75: 16.7, p90: 17.4, p97: 18.4 },
  { age: 36,  p3: 13.4, p10: 14.0, p25: 14.6, p50: 15.3, p75: 16.1, p90: 16.8, p97: 17.7 },
  { age: 48,  p3: 13.1, p10: 13.6, p25: 14.2, p50: 15.0, p75: 15.9, p90: 16.7, p97: 17.7 },
  { age: 60,  p3: 12.9, p10: 13.4, p25: 14.1, p50: 14.9, p75: 15.9, p90: 16.9, p97: 18.1 },
  { age: 72,  p3: 12.7, p10: 13.3, p25: 14.1, p50: 15.0, p75: 16.2, p90: 17.4, p97: 18.8 },
  { age: 96,  p3: 13.0, p10: 13.7, p25: 14.7, p50: 15.8, p75: 17.2, p90: 18.7, p97: 20.6 },
  { age: 120, p3: 13.7, p10: 14.6, p25: 15.8, p50: 17.2, p75: 19.0, p90: 20.8, p97: 23.1 },
  { age: 144, p3: 14.7, p10: 15.8, p25: 17.3, p50: 19.1, p75: 21.4, p90: 23.6, p97: 26.3 },
  { age: 168, p3: 16.2, p10: 17.7, p25: 19.5, p50: 21.7, p75: 24.3, p90: 26.9, p97: 29.7 },
  { age: 192, p3: 17.5, p10: 19.2, p25: 21.3, p50: 23.7, p75: 26.5, p90: 29.2, p97: 32.3 },
  { age: 216, p3: 17.8, p10: 19.8, p25: 22.2, p50: 24.9, p75: 28.1, p90: 31.1, p97: 34.5 },
];

function interpolate(table: PercentileRow[], ageMonths: number): PercentileRow | null {
  if (table.length === 0) return null;
  const sorted = [...table].sort((a, b) => a.age - b.age);
  if (ageMonths <= sorted[0].age) return sorted[0];
  if (ageMonths >= sorted[sorted.length - 1].age) return sorted[sorted.length - 1];

  let lower = sorted[0], upper = sorted[1];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].age <= ageMonths && sorted[i + 1].age >= ageMonths) {
      lower = sorted[i];
      upper = sorted[i + 1];
      break;
    }
  }
  const t = (ageMonths - lower.age) / (upper.age - lower.age);
  const lerp = (a: number, b: number) => a + t * (b - a);
  return {
    age: ageMonths,
    p3: lerp(lower.p3, upper.p3),
    p10: lerp(lower.p10, upper.p10),
    p25: lerp(lower.p25, upper.p25),
    p50: lerp(lower.p50, upper.p50),
    p75: lerp(lower.p75, upper.p75),
    p90: lerp(lower.p90, upper.p90),
    p97: lerp(lower.p97, upper.p97),
  };
}

function getPercentileInfo(value: number, row: PercentileRow & { p85: number }): {
  label: string; color: string; badgeClass: string; barValue: number;
} {
  if (value < row.p3) return { label: "< P3 — Abaixo do esperado", color: "text-red-600", badgeClass: "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300", barValue: 2 };
  if (value < row.p10) return { label: "P3–P10 — Vigilância", color: "text-amber-600", badgeClass: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300", barValue: 12 };
  if (value < row.p25) return { label: "P10–P25 — Vigilância", color: "text-amber-600", badgeClass: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300", barValue: 22 };
  if (value < row.p75) return { label: "P25–P75 — Adequado", color: "text-green-600", badgeClass: "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300", barValue: 50 };
  if (value < row.p85) return { label: "P75–P85 — Adequado", color: "text-green-600", badgeClass: "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300", barValue: 78 };
  if (value < row.p90) return { label: "P85–P90 — Acima do esperado", color: "text-amber-600", badgeClass: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300", barValue: 87 };
  if (value < row.p97) return { label: "P90–P97 — Acima do esperado", color: "text-amber-600", badgeClass: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300", barValue: 93 };
  return { label: "> P97 — Muito acima", color: "text-red-600", badgeClass: "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300", barValue: 99 };
}

// Add p85 approx to PercentileRow for BMI use
function addP85(row: PercentileRow): PercentileRow & { p85: number } {
  return { ...row, p85: row.p75 + (row.p90 - row.p75) * 0.67 };
}

function ResultBlock({ label, value, unit, row }: {
  label: string; value: number; unit: string; row: PercentileRow;
}) {
  const extRow = addP85(row);
  const info = getPercentileInfo(value, extRow as any);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
        <span className="text-sm font-bold">{value.toFixed(1)} {unit}</span>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={info.barValue} className="flex-1 h-3" />
        <span className="text-xs text-muted-foreground w-10 text-right">{info.barValue}%ile</span>
      </div>
      <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${info.badgeClass}`}>
        {info.label}
      </span>
    </div>
  );
}

export default function CurvasCrescimentoPage() {
  const [sex, setSex] = useState<"M" | "F">("M");
  const [years, setYears] = useState<string>("");
  const [months, setMonths] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [hc, setHc] = useState<string>("");

  const ageMonths = useMemo(() => {
    const y = parseInt(years) || 0;
    const m = parseInt(months) || 0;
    return y * 12 + m;
  }, [years, months]);

  const weightNum = parseFloat(weight);
  const heightNum = parseFloat(height);
  const hcNum = parseFloat(hc);
  const bmi = weightNum && heightNum ? weightNum / ((heightNum / 100) ** 2) : null;

  const weightRow = useMemo(() =>
    interpolate(sex === "M" ? weightBoys : weightGirls, ageMonths),
    [sex, ageMonths]);

  const heightRow = useMemo(() =>
    interpolate(sex === "M" ? heightBoys : heightGirls, ageMonths),
    [sex, ageMonths]);

  const hcRow = useMemo(() =>
    ageMonths <= 60 ? interpolate(sex === "M" ? hcBoys : hcGirls, ageMonths) : null,
    [sex, ageMonths]);

  const bmiRow = useMemo(() =>
    ageMonths >= 24 ? interpolate(sex === "M" ? bmiBoys : bmiGirls, ageMonths) : null,
    [sex, ageMonths]);

  const hasResults = ageMonths > 0 && (weightNum || heightNum || hcNum);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHero
        icon={TrendingUp}
        eyebrow="antropometria"
        title="Curvas de Crescimento"
        subtitle="Referência OMS (WHO) — Percentis P3 a P97."
        gradient="from-emerald-500 to-teal-500"
      />

      {/* Inputs */}
      <Card className="border-card-border">
        <CardContent className="p-5 space-y-5">
          {/* Sex */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sexo</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSex("M")}
                data-testid="button-sex-m"
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${sex === "M" ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300" : "border-border text-muted-foreground hover:border-border/80"}`}
              >
                Masculino
              </button>
              <button
                onClick={() => setSex("F")}
                data-testid="button-sex-f"
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${sex === "F" ? "border-pink-500 bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-300" : "border-border text-muted-foreground hover:border-border/80"}`}
              >
                Feminino
              </button>
            </div>
          </div>

          {/* Age */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Idade</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type="number"
                  placeholder="0"
                  value={years}
                  onChange={e => setYears(e.target.value)}
                  className="pr-10"
                  min={0} max={18}
                  data-testid="input-age-years"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">anos</span>
              </div>
              <div className="flex-1 relative">
                <Input
                  type="number"
                  placeholder="0"
                  value={months}
                  onChange={e => setMonths(e.target.value)}
                  className="pr-12"
                  min={0} max={11}
                  data-testid="input-age-months"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">meses</span>
              </div>
            </div>
          </div>

          {/* Measurements */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Peso (kg)</label>
              <Input
                type="number"
                placeholder="0"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                data-testid="input-weight-growth"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Altura (cm)</label>
              <Input
                type="number"
                placeholder="0"
                value={height}
                onChange={e => setHeight(e.target.value)}
                data-testid="input-height"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">PC (cm)</label>
              <Input
                type="number"
                placeholder="0"
                value={hc}
                onChange={e => setHc(e.target.value)}
                data-testid="input-hc"
              />
            </div>
          </div>

          {bmi && (
            <div className="flex items-center gap-2 text-xs bg-muted/40 rounded-lg px-3 py-2">
              <span className="text-muted-foreground">IMC calculado:</span>
              <span className="font-bold text-foreground">{bmi.toFixed(1)} kg/m²</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {hasResults && (
        <Card className="border-card-border">
          <CardContent className="p-5 space-y-5">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Resultados — {sex === "M" ? "Masculino" : "Feminino"}, {Math.floor(ageMonths / 12)}a {ageMonths % 12}m
            </h2>

            {weightNum > 0 && weightRow && (
              <ResultBlock label="Peso para Idade" value={weightNum} unit="kg" row={weightRow} />
            )}
            {heightNum > 0 && heightRow && (
              <ResultBlock label="Altura para Idade" value={heightNum} unit="cm" row={heightRow} />
            )}
            {hcNum > 0 && hcRow && (
              <ResultBlock label="Perímetro Cefálico para Idade" value={hcNum} unit="cm" row={hcRow} />
            )}
            {bmi && bmiRow && (
              <ResultBlock label="IMC para Idade" value={bmi} unit="kg/m²" row={bmiRow} />
            )}
            {hcNum > 0 && !hcRow && ageMonths > 60 && (
              <p className="text-xs text-muted-foreground italic">Perímetro cefálico: referência OMS disponível até 5 anos.</p>
            )}
            {bmi && !bmiRow && ageMonths < 24 && (
              <p className="text-xs text-muted-foreground italic">IMC para idade: referência disponível a partir de 2 anos.</p>
            )}
          </CardContent>
        </Card>
      )}

      {!hasResults && (
        <div className="text-center py-10 space-y-2">
          <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Preencha os dados da criança para ver os percentis.</p>
        </div>
      )}

      {/* Reference legend */}
      <Card className="border-card-border">
        <CardContent className="p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Legenda dos Percentis</p>
          <div className="grid grid-cols-1 gap-1.5 text-xs">
            {[
              { label: "< P3", desc: "Abaixo do esperado — investigar", cls: "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300" },
              { label: "P3–P15", desc: "Vigilância — monitorar evolução", cls: "bg-amber-100 text-amber-700 border-amber-300" },
              { label: "P15–P85", desc: "Adequado — dentro do esperado", cls: "bg-green-100 text-green-700 border-green-300" },
              { label: "P85–P97", desc: "Acima do esperado — avaliar IMC", cls: "bg-amber-100 text-amber-700 border-amber-300" },
              { label: "> P97", desc: "Muito acima — investigar sobrepeso/obesidade", cls: "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full border font-medium min-w-[60px] text-center ${item.cls}`}>{item.label}</span>
                <span className="text-muted-foreground">{item.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-3 flex gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 dark:text-amber-300">
          Dados baseados nas curvas da OMS (WHO 2006/2007). Os percentis são estimados por interpolação linear entre os pontos de referência. Sempre interprete em contexto clínico.
        </p>
      </div>
    </div>
  );
}
