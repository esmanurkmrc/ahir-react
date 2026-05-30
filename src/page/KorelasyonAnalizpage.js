import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Line,
  ComposedChart,
  Area,
  ReferenceLine,
} from "recharts";

const COLORS = {
  primary: "#4f46e5",
  purple: "#8b5cf6",
  red: "#ef4444",
  orange: "#f97316",
  green: "#10b981",
  blue: "#2563eb",
  yellow: "#f59e0b",
  dark: "#0f172a",
  softText: "#64748b",
  border: "#e5e7eb",
  bg: "#f8fafc",
};

const KorelasyonAnalizpage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysisData();
  }, []);

  const fetchAnalysisData = async () => {
    try {
      const [prodRes, envRes] = await Promise.all([
        axios.get("http://localhost:8080/api/analysis-productivity"),
        axios.get("http://localhost:8080/api/analysis-environment"),
      ]);

      const combined = prodRes.data.map((prod) => {
        const env = envRes.data.find((e) => e.tarih === prod.tarih) || {};

        return {
          ...prod,
          ...env,
          tarih: prod.tarih,
          sicaklik: Number(env.sicaklik || 0),
          nem: Number(env.nem || 0),
          amonyak: Number(env.amonyak || 0),
          isik: Number(env.isik || 0),
          sutVerimi: Number(prod.sutVerimi || 0),
        };
      });

      setData(combined);
      setLoading(false);
    } catch (err) {
      console.error("Veri hatası:", err);
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    return data.slice(-40);
  }, [data]);

  const stats = useMemo(() => {
    if (!data.length) {
      return {
        ortSicaklik: 0,
        ortNem: 0,
        ortAmonyak: 0,
        ortSut: 0,
      };
    }

    const avg = (key) =>
      (
        data.reduce((sum, item) => sum + Number(item[key] || 0), 0) /
        data.length
      ).toFixed(1);

    return {
      ortSicaklik: avg("sicaklik"),
      ortNem: avg("nem"),
      ortAmonyak: avg("amonyak"),
      ortSut: avg("sutVerimi"),
    };
  }, [data]);

  if (loading) {
    return (
      <div style={loadingStyle}>
        <div style={loaderBoxStyle}>Analizler yükleniyor...</div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <h2 style={titleStyle}>🔬 Mikroklima ve Verim Analizi</h2>
          <p style={subtitleStyle}>
            Sıcaklık, nem, amonyak ve ışık değerlerinin süt verimi ile ilişkisi.
          </p>
        </div>

        <div style={sourceBadgeStyle}>Veri Kaynağı:Analiz Veri Seti</div>
      </header>

      <div style={summaryGridStyle}>
        <SummaryCard title="Ortalama Sıcaklık" value={`${stats.ortSicaklik} °C`} color={COLORS.red} />
        <SummaryCard title="Ortalama Nem" value={`${stats.ortNem} %`} color={COLORS.blue} />
        <SummaryCard title="Ortalama Amonyak" value={`${stats.ortAmonyak} ppm`} color={COLORS.orange} />
        <SummaryCard title="Ortalama Süt Verimi" value={`${stats.ortSut} L`} color={COLORS.green} />
      </div>

      <div style={gridStyle}>
        <ChartCard
          title="Sıcaklık ve Süt Verimi Trendi"
          desc="Son 40 kayıt üzerinden sıcaklık değişimi ve süt verimi karşılaştırması."
        >
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 15, right: 18, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="tarih" tick={{ fontSize: 11, fill: COLORS.softText }} minTickGap={24} />
              <YAxis
                yAxisId="left"
                stroke={COLORS.red}
                tick={{ fontSize: 11 }}
                domain={["auto", "auto"]}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke={COLORS.green}
                tick={{ fontSize: 11 }}
                domain={["auto", "auto"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine yAxisId="left" y={26} stroke={COLORS.red} strokeDasharray="5 5" />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="sicaklik"
                name="Sıcaklık (°C)"
                fill="#fee2e2"
                stroke={COLORS.red}
                strokeWidth={2}
                fillOpacity={0.45}
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="sutVerimi"
                name="Süt Verimi (L)"
                stroke={COLORS.green}
                strokeWidth={3}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Amonyak ve Süt Verimi Dağılımı"
          desc="Amonyak artışı ile süt verimi arasındaki ilişki."
        >
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 15, right: 18, bottom: 20, left: 0 }}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="amonyak"
                name="Amonyak"
                unit=" ppm"
                tick={{ fontSize: 11, fill: COLORS.softText }}
              />
              <YAxis
                type="number"
                dataKey="sutVerimi"
                name="Süt"
                unit=" L"
                tick={{ fontSize: 11, fill: COLORS.softText }}
              />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<CustomTooltip />} />
              <ReferenceLine x={25} stroke={COLORS.orange} strokeDasharray="5 5" />
              <Scatter
                name="Veri Noktaları"
                data={chartData}
                fill={COLORS.orange}
                fillOpacity={0.72}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Nem ve Süt Verimi Trendi"
          desc="Nem oranının verimlilik üzerindeki genel etkisi."
        >
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 15, right: 18, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="tarih" tick={{ fontSize: 11, fill: COLORS.softText }} minTickGap={24} />
              <YAxis
                yAxisId="left"
                stroke={COLORS.blue}
                tick={{ fontSize: 11 }}
                domain={["auto", "auto"]}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke={COLORS.green}
                tick={{ fontSize: 11 }}
                domain={["auto", "auto"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="nem"
                name="Nem (%)"
                fill="#dbeafe"
                stroke={COLORS.blue}
                strokeWidth={2}
                fillOpacity={0.55}
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="sutVerimi"
                name="Süt Verimi (L)"
                stroke={COLORS.green}
                strokeWidth={3}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Işık Şiddeti ve Süt Verimi"
          desc="Işık seviyesinin süt üretimi ile dağılımsal ilişkisi."
        >
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 15, right: 18, bottom: 20, left: 0 }}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="isik"
                name="Işık"
                unit=" lux"
                tick={{ fontSize: 11, fill: COLORS.softText }}
              />
              <YAxis
                type="number"
                dataKey="sutVerimi"
                name="Süt"
                unit=" L"
                tick={{ fontSize: 11, fill: COLORS.softText }}
              />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<CustomTooltip />} />
              <Scatter
                name="Işık Değerleri"
                data={chartData}
                fill={COLORS.purple}
                fillOpacity={0.72}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, color }) => (
  <div style={summaryCardStyle}>
    <span style={summaryTitleStyle}>{title}</span>
    <strong style={{ ...summaryValueStyle, color }}>{value}</strong>
  </div>
);

const ChartCard = ({ title, desc, children }) => (
  <div style={cardStyle}>
    <div style={cardHeaderStyle}>
      <div>
        <h4 style={cardTitleStyle}>{title}</h4>
        <p style={cardDescStyle}>{desc}</p>
      </div>
    </div>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div style={tooltipStyle}>
      {label && <div style={tooltipDateStyle}>{label}</div>}
      {payload.map((item, index) => (
        <div key={index} style={tooltipRowStyle}>
          <span
            style={{
              ...tooltipDotStyle,
              backgroundColor: item.color || item.fill,
            }}
          />
          <span>{item.name}: </span>
          <strong>
            {Number(item.value).toFixed(1)}
            {item.unit || ""}
          </strong>
        </div>
      ))}
    </div>
  );
};

const pageStyle = {
  padding: "30px",
  background: COLORS.bg,
  minHeight: "100vh",
  fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

const headerStyle = {
  marginBottom: "24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
};

const titleStyle = {
  margin: 0,
  color: COLORS.dark,
  fontWeight: 750,
  fontSize: "26px",
};

const subtitleStyle = {
  margin: "8px 0 0",
  color: COLORS.softText,
  fontSize: "14px",
};

const sourceBadgeStyle = {
  background: "#eef2ff",
  color: COLORS.primary,
  border: "1px solid #c7d2fe",
  padding: "10px 14px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "16px",
  marginBottom: "24px",
};

const summaryCardStyle = {
  background: "#ffffff",
  border: `1px solid ${COLORS.border}`,
  borderRadius: "18px",
  padding: "18px",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
};

const summaryTitleStyle = {
  display: "block",
  color: COLORS.softText,
  fontSize: "12px",
  fontWeight: 700,
  textTransform: "uppercase",
  marginBottom: "8px",
};

const summaryValueStyle = {
  fontSize: "24px",
  fontWeight: 800,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "24px",
};

const cardStyle = {
  background: "#ffffff",
  padding: "22px",
  borderRadius: "20px",
  border: `1px solid ${COLORS.border}`,
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
};

const cardHeaderStyle = {
  marginBottom: "12px",
};

const cardTitleStyle = {
  margin: 0,
  fontSize: "15px",
  color: COLORS.dark,
  fontWeight: 800,
};

const cardDescStyle = {
  margin: "6px 0 0",
  fontSize: "12px",
  color: COLORS.softText,
};

const tooltipStyle = {
  background: "#ffffff",
  border: `1px solid ${COLORS.border}`,
  borderRadius: "12px",
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.12)",
  padding: "10px 12px",
  fontSize: "12px",
};

const tooltipDateStyle = {
  fontWeight: 800,
  color: COLORS.dark,
  marginBottom: "6px",
};

const tooltipRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  color: COLORS.softText,
  marginTop: "4px",
};

const tooltipDotStyle = {
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  display: "inline-block",
};

const loadingStyle = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: COLORS.bg,
};

const loaderBoxStyle = {
  background: "#ffffff",
  border: `1px solid ${COLORS.border}`,
  borderRadius: "16px",
  padding: "20px 28px",
  color: COLORS.dark,
  fontWeight: 700,
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
};

export default KorelasyonAnalizpage;