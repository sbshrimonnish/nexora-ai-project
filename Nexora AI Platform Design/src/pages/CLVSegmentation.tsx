import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { segmentData } from "../data/demoData";
import { Users, TrendingUp } from "lucide-react";

const trajectoryBySegment = [
  { period: "Q1 '24", highValue: 8200000, growth: 2600000, stable: 1500000, developing: 480000 },
  { period: "Q2 '24", highValue: 8800000, growth: 2900000, stable: 1550000, developing: 510000 },
  { period: "Q3 '24", highValue: 9200000, growth: 3100000, stable: 1580000, developing: 490000 },
  { period: "Q4 '24", highValue: 9800000, growth: 3400000, stable: 1600000, developing: 520000 },
  { period: "Q1 '25", highValue: 10500000, growth: 3700000, stable: 1620000, developing: 540000 },
];

export default function CLVSegmentation() {
  return (
    <div className="page-wrap">
      <div style={{ marginBottom: 20 }}>
        <h1 className="page-title">CLV Segmentation</h1>
        <p className="page-subtitle">Customer segments by predicted lifetime value — distribution, comparison, and trajectory</p>
      </div>

      {/* Segment cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        {segmentData.map(seg => (
          <div key={seg.name} className="kpi-card" style={{ borderLeft: `4px solid ${seg.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}>{seg.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", marginTop: 2 }}>
                  <Users size={10} style={{ display: "inline", verticalAlign: "middle" }} /> {seg.customers.toLocaleString()} customers · avg tenure {seg.tenure}mo
                </div>
              </div>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: seg.color, marginTop: 4 }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Avg CLV</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: seg.color }}>
                  ₹{(seg.avgClv / 100000).toFixed(1)}L
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Revenue %</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>
                  {seg.revenue}%
                </div>
              </div>
            </div>
            <div style={{ marginTop: 10, height: 5, background: "var(--muted)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${seg.revenue * 2}%`, height: "100%", background: seg.color, borderRadius: 3 }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16, marginBottom: 16 }}>
        {/* Donut */}
        <div className="chart-card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Revenue Contribution by Segment</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={segmentData} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={3}>
                {segmentData.map(s => <Cell key={s.name} fill={s.color} />)}
              </Pie>
              <Tooltip formatter={(v: any) => v + "%"} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {segmentData.map(s => (
              <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                  <span style={{ color: "var(--muted-foreground)" }}>{s.name}</span>
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                  <span style={{ color: "var(--muted-foreground)", fontFamily: "'JetBrains Mono', monospace" }}>{s.customers.toLocaleString()}</span>
                  <span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: s.color }}>{s.revenue}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CLV Trajectory by segment */}
        <div className="chart-card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>CLV Trajectory by Segment</div>
          <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 14 }}>Average CLV over time — quarterly</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trajectoryBySegment}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} tickFormatter={v => "₹" + (v / 100000).toFixed(0) + "L"} />
              <Tooltip formatter={(v: number) => "₹" + (v / 100000).toFixed(1) + "L"} />
              <Legend iconType="circle" iconSize={8} />
              <Line type="monotone" dataKey="highValue" name="High Value" stroke="#6366f1" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="growth" name="Growth Opp." stroke="#8b5cf6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="stable" name="Stable Value" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="5 3" />
              <Line type="monotone" dataKey="developing" name="Developing" stroke="#10b981" strokeWidth={1.5} dot={false} strokeDasharray="3 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Segment comparison bar */}
      <div className="chart-card">
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Segment Comparison — Average CLV</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={segmentData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} tickFormatter={v => "₹" + (v / 100000).toFixed(0) + "L"} />
            <Tooltip formatter={(v: number) => "₹" + (v / 100000).toFixed(1) + "L"} />
            <Bar dataKey="avgClv" name="Avg CLV" radius={[4, 4, 0, 0]}>
              {segmentData.map(s => <Cell key={s.name} fill={s.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
