"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area, LabelList,
  type PieLabelRenderProps,
} from "recharts";

const COLORS = [
  "#16a34a", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#6366f1",
  "#84cc16", "#e11d48", "#0ea5e9", "#a855f7", "#22c55e",
  "#eab308",
];

type ChartItem = { name: string; count: number; [k: string]: unknown };

/* ── Bar Chart ─────────────────────────────────────── */
export function DashboardBarChart({
  data, height = 300, color = "#16a34a", layout = "horizontal", label,
}: {
  data: ChartItem[];
  height?: number;
  color?: string;
  layout?: "horizontal" | "vertical";
  label?: string;
}) {
  if (!data.length) return <EmptyChart message="No data available" />;

  if (layout === "vertical") {
    return (
      <div className="w-full">
        {label && <p className="text-[10px] text-muted-foreground mb-2 italic">{label}</p>}
        <ResponsiveContainer width="100%" height={Math.max(height, data.length * 36)}>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 40, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
            <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
            <Tooltip
              contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
            />
            <Bar dataKey="count" fill={color} radius={[0, 4, 4, 0]}>
              <LabelList dataKey="count" position="right" style={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="w-full">
      {label && <p className="text-[10px] text-muted-foreground mb-2 italic">{label}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ left: -10, right: 10, top: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} angle={-30} textAnchor="end" height={60} interval={0} />
          <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
          <Tooltip
            contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
          />
          <Bar dataKey="count" fill={color} radius={[4, 4, 0, 0]}>
            <LabelList dataKey="count" position="top" style={{ fontSize: 10, fill: "var(--muted-foreground)", fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Pie / Donut Chart ─────────────────────────────── */
export function DashboardPieChart({
  data, height = 300, innerRadius = 55, outerRadius = 95,
}: {
  data: ChartItem[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
}) {
  if (!data.length) return <EmptyChart message="No data available" />;

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="count"
          nameKey="name"
          stroke="none"
          label={(props: PieLabelRenderProps) => {
            const name = props.name ?? "";
            const value = typeof props.value === "number" ? props.value : 0;
            return `${name} (${Math.round((value / total) * 100)}%)`;
          }}
          labelLine={{ stroke: "var(--muted-foreground)", strokeWidth: 0.5 }}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
          formatter={(value, name) => {
            const v = typeof value === "number" ? value : 0;
            return [`${v} (${Math.round((v / total) * 100)}%)`, String(name)];
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 10, color: "var(--muted-foreground)" }}
          iconType="circle"
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ── Area Chart (year trends) ──────────────────────── */
export function DashboardAreaChart({
  data, height = 300,
}: {
  data: { year: number; count: number; employed: number }[];
  height?: number;
}) {
  if (!data.length) return <EmptyChart message="No trend data yet — graduates will appear here as they register" />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradEmployed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="year" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
        <Tooltip
          contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
        />
        <Area type="monotone" dataKey="count" name="Total Graduates" stroke="#3b82f6" fill="url(#gradTotal)" strokeWidth={2} />
        <Area type="monotone" dataKey="employed" name="Employed" stroke="#16a34a" fill="url(#gradEmployed)" strokeWidth={2} />
        <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── Employment Gauge — custom SVG semicircle ──────── */
export function EmploymentGauge({ rate, total, employed }: { rate: number; total?: number; employed?: number }) {
  const clampedRate = Math.min(100, Math.max(0, rate));
  const color = clampedRate >= 70 ? "#16a34a" : clampedRate >= 50 ? "#f59e0b" : "#ef4444";
  const bgColor = "var(--muted)";

  // SVG semicircle arc
  const cx = 100, cy = 90, r = 70;
  const startAngle = Math.PI;
  const endAngle = 0;
  const totalArc = startAngle - endAngle;
  const filledArc = totalArc * (clampedRate / 100);

  const bgX1 = cx + r * Math.cos(startAngle);
  const bgY1 = cy - r * Math.sin(startAngle);
  const bgX2 = cx + r * Math.cos(endAngle);
  const bgY2 = cy - r * Math.sin(endAngle);

  const fillEndAngle = startAngle - filledArc;
  const fX = cx + r * Math.cos(fillEndAngle);
  const fY = cy - r * Math.sin(fillEndAngle);
  const largeArc = filledArc > Math.PI ? 1 : 0;

  const ratingLabel = clampedRate >= 80 ? "Excellent" : clampedRate >= 70 ? "Good" : clampedRate >= 50 ? "Fair" : clampedRate >= 30 ? "Low" : "Critical";

  return (
    <div className="flex flex-col items-center gap-1 py-2">
      <svg viewBox="0 0 200 110" className="w-full max-w-[220px]">
        {/* Background arc */}
        <path
          d={`M ${bgX1} ${bgY1} A ${r} ${r} 0 1 1 ${bgX2} ${bgY2}`}
          fill="none" stroke={bgColor} strokeWidth="14" strokeLinecap="round"
        />
        {/* Filled arc */}
        {clampedRate > 0 && (
          <path
            d={`M ${bgX1} ${bgY1} A ${r} ${r} 0 ${largeArc} 1 ${fX} ${fY}`}
            fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
          />
        )}
        {/* Center text */}
        <text x={cx} y={cy - 8} textAnchor="middle" className="fill-foreground" style={{ fontSize: 28, fontWeight: 900 }}>
          {rate}%
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontSize: 11, fill: color, fontWeight: 600 }}>
          {ratingLabel}
        </text>
      </svg>
      {/* Scale hints */}
      <div className="flex items-center justify-between w-full max-w-[220px] px-2">
        <span className="text-[9px] text-muted-foreground">0%</span>
        <span className="text-[9px] text-muted-foreground">50%</span>
        <span className="text-[9px] text-muted-foreground">100%</span>
      </div>
      {total !== undefined && employed !== undefined && (
        <p className="text-[10px] text-muted-foreground mt-1">
          {employed.toLocaleString()} of {total.toLocaleString()} graduates employed
        </p>
      )}
    </div>
  );
}

/* ── Hero Overview Chart — large full-width status breakdown ── */
export function HeroStatusChart({ data }: { data: ChartItem[] }) {
  if (!data.length) return <EmptyChart message="No graduates registered yet" />;

  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-3">
      {/* Stacked horizontal bar */}
      <div className="flex h-10 w-full overflow-hidden rounded-lg border border-border">
        {data.map((item, i) => {
          const pct = (item.count / total) * 100;
          if (pct < 0.5) return null;
          return (
            <div
              key={item.name}
              className="relative flex items-center justify-center transition-all hover:opacity-90"
              style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
              title={`${item.name}: ${item.count} (${Math.round(pct)}%)`}
            >
              {pct > 8 && (
                <span className="text-[10px] font-bold text-white drop-shadow-sm truncate px-1">
                  {Math.round(pct)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {data.map((item, i) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="text-[11px] text-muted-foreground">
              {item.name}: <span className="font-semibold text-foreground">{item.count}</span>
              <span className="text-muted-foreground/70 ml-0.5">({Math.round((item.count / total) * 100)}%)</span>
            </span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground italic">
        💡 Hover over segments to see exact counts. Total: {total.toLocaleString()} graduates.
      </p>
    </div>
  );
}

/* ── Grouped Comparison Bar Chart (two years side by side) ── */
export function ComparisonBarChart({
  data, labelA, labelB, height = 320,
}: {
  data: { name: string; a: number; b: number }[];
  labelA: string;
  labelB: string;
  height?: number;
}) {
  if (!data.length) return <EmptyChart message="No data available" />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: -10, right: 10, top: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} angle={-25} textAnchor="end" height={55} interval={0} />
        <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
        <Tooltip
          contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
        <Bar dataKey="a" name={labelA} fill="#3b82f6" radius={[3, 3, 0, 0]} />
        <Bar dataKey="b" name={labelB} fill="#16a34a" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Empty state ── */
function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="text-3xl mb-2">📭</span>
      <p className="text-sm text-muted-foreground">{message}</p>
      <p className="text-[10px] text-muted-foreground/60 mt-1">Data will appear once graduates submit their information.</p>
    </div>
  );
}
