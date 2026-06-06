import { useRef, useEffect } from "react";

interface RadarChartProps {
  labels: string[];
  values: number[];      // 0-100 (percentage of max)
  maxLabel?: string;
  color?: string;        // hex color
  size?: number;
}

export function RadarChart({ labels, values, maxLabel: _maxLabel = "Máx", color = "#7c3aed", size = 240 }: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || labels.length < 3) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.36;
    const n = labels.length;
    const angleStep = (2 * Math.PI) / n;
    const startAngle = -Math.PI / 2;

    // Get computed styles for theme awareness
    const isDark = document.documentElement.classList.contains("dark");
    const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
    const textColor = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)";

    ctx.clearRect(0, 0, size, size);

    // Draw concentric rings (25%, 50%, 75%, 100%)
    for (let ring = 1; ring <= 4; ring++) {
      const ringR = (r * ring) / 4;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const angle = startAngle + i * angleStep;
        const x = cx + ringR * Math.cos(angle);
        const y = cy + ringR * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw axis lines
    for (let i = 0; i < n; i++) {
      const angle = startAngle + i * angleStep;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw data polygon (filled)
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const angle = startAngle + i * angleStep;
      const val = Math.min(100, Math.max(0, values[i] || 0)) / 100;
      const x = cx + r * val * Math.cos(angle);
      const y = cy + r * val * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = color + "20";
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw data points
    for (let i = 0; i < n; i++) {
      const angle = startAngle + i * angleStep;
      const val = Math.min(100, Math.max(0, values[i] || 0)) / 100;
      const x = cx + r * val * Math.cos(angle);
      const y = cy + r * val * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = isDark ? "#1a1a2e" : "#fff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Draw labels
    ctx.font = "10px Inter, system-ui, sans-serif";
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < n; i++) {
      const angle = startAngle + i * angleStep;
      const labelR = r + 18;
      const x = cx + labelR * Math.cos(angle);
      const y = cy + labelR * Math.sin(angle);

      // Truncate long labels
      const label = labels[i].length > 14 ? labels[i].slice(0, 13) + "…" : labels[i];
      ctx.fillText(label, x, y);
    }
  }, [labels, values, color, size]);

  if (labels.length < 3) return null;

  return (
    <div className="flex justify-center">
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
    </div>
  );
}
