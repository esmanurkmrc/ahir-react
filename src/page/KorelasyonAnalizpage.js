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
  BarChart,
  Bar,
} from "recharts";

const COLORS = {
  primary: "#4f46e5",
  purple: "#8b5cf6",
  red: "#ef4444",
  orange: "#f97316",
  green: "#10b981",
  blue: "#2563eb",
  dark: "#0f172a",
  softText: "#64748b",
  border: "#e5e7eb",
  bg: "#f8fafc",
};

const KorelasyonAnalizpage = () => {
  const [data, setData] = useState([]);
  const [modelStatus, setModelStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const ML_BASE = "http://localhost:8000";

  useEffect(() => {
    fetchAnalysisData();
  }, []);

  const fetchAnalysisData = async () => {
    try {
      const [prodRes, envRes, modelRes] = await Promise.all([
        axios.get("http://localhost:8080/api/analysis-productivity"),
        axios.get("http://localhost:8080/api/analysis-environment"),
        axios.get(`${ML_BASE}/model-status`),
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
      setModelStatus(modelRes.data);
    } catch (err) {
      console.error("Veri hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTHI = (sicaklik, nem) => {
    const t = Number(sicaklik || 0);
    const rh = Number(nem || 0);

    const thi =
      (1.8 * t + 32) -
      (0.55 - 0.0055 * rh) * (1.8 * t - 26);

    return Number(thi.toFixed(2));
  };

  const chartData = useMemo(() => {
    const grouped = {};
    data.forEach((item) => {
      const gun = item.tarih.slice(0, 10);
      if (!grouped[gun]) grouped[gun] = [];
      grouped[gun].push(item);
    });
    return Object.entries(grouped).map(([gun, items]) => ({
      tarih: gun,
      sutVerimi: parseFloat((items.reduce((s, i) => s + i.sutVerimi, 0) / items.length).toFixed(2)),
      sicaklik: parseFloat((items.reduce((s, i) => s + i.sicaklik, 0) / items.length).toFixed(2)),
      nem: parseFloat((items.reduce((s, i) => s + i.nem, 0) / items.length).toFixed(2)),
      amonyak: parseFloat((items.reduce((s, i) => s + i.amonyak, 0) / items.length).toFixed(2)),
      isik: parseFloat((items.reduce((s, i) => s + i.isik, 0) / items.length).toFixed(2)),
    }));
  }, [data]);

  const stats = useMemo(() => {
    if (!data.length) {
      return {
        ortSicaklik: 0,
        ortNem: 0,
        ortAmonyak: 0,
        ortSut: 0,
        ortThi: 0,
      };
    }

    const avg = (key) =>
      (
        data.reduce((sum, item) => sum + Number(item[key] || 0), 0) /
        data.length
      ).toFixed(1);

    const thiValues = data.map((item) => calculateTHI(item.sicaklik, item.nem));
    const avgThi =
      thiValues.reduce((sum, value) => sum + value, 0) / thiValues.length;

    return {
      ortSicaklik: avg("sicaklik"),
      ortNem: avg("nem"),
      ortAmonyak: avg("amonyak"),
      ortSut: avg("sutVerimi"),
      ortThi: avgThi.toFixed(1),
    };
  }, [data]);

  const featureImportanceData = useMemo(() => {
    const importance = modelStatus?.feature_importance;

    if (!importance) return [];

    return [
      { name: "Sıcaklık", value: importance.sicaklik || 0 },
      { name: "Nem", value: importance.nem || 0 },
      { name: "Amonyak", value: importance.amonyak || 0 },
      { name: "Yem", value: importance.yem_tuketimi || 0 },
    ];
  }, [modelStatus]);

  const getMlComment = () => {
    if (!featureImportanceData.length) {
      return "Model önem dereceleri henüz görüntülenemedi. Model eğitimi tamamlandığında süt verimini en çok etkileyen değişkenler bu alanda gösterilecektir.";
    }

    const sorted = [...featureImportanceData].sort((a, b) => b.value - a.value);
    const first = sorted[0];
    const second = sorted[1];

    return `Makine öğrenmesi modeline göre süt verimini en fazla ${first.name.toLowerCase()} (%${first.value}) ve ${second.name.toLowerCase()} (%${second.value}) değişkenleri etkilemektedir. Bu sonuç, çevresel verilerin süt verimi tahmininde önemli rol oynadığını göstermektedir.`;
  };

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
            Sıcaklık, nem, amonyak ve ışık değerlerinin süt verimi üzerindeki genel etkisi.
          </p>
        </div>

        <div style={sourceBadgeStyle}>Veri Kaynağı: Analiz Veri Seti</div>
      </header>

      <div style={summaryGridStyle}>
        <SummaryCard title="Ortalama Sıcaklık" value={`${stats.ortSicaklik} °C`} color={COLORS.red} />
        <SummaryCard title="Ortalama Nem" value={`${stats.ortNem} %`} color={COLORS.blue} />
        <SummaryCard title="Ortalama Amonyak" value={`${stats.ortAmonyak} ppm`} color={COLORS.orange} />
        <SummaryCard title="Ortalama Süt Verimi" value={`${stats.ortSut} L`} color={COLORS.green} />
        <SummaryCard title="Ortalama THI" value={stats.ortThi} color={Number(stats.ortThi) >= 72 ? COLORS.red : COLORS.green} />
      </div>

      <section style={mlSectionStyle}>
        <div style={mlLeftStyle}>
          <span style={mlBadgeStyle}>🤖 Makine Öğrenmesi Yorumu</span>
          <h3 style={insightTitleStyle}>Modeli Etkileyen Faktörler</h3>
          <p style={insightTextStyle}>{getMlComment()}</p>

          <div style={modelInfoStyle}>
            <span>Model Durumu: {modelStatus?.durum || "--"}</span>
            <span>
              R² Skoru:{" "}
              {modelStatus?.r2_skoru !== null && modelStatus?.r2_skoru !== undefined
                ? modelStatus.r2_skoru
                : "--"}
            </span>
            <span>Veri Sayısı: {modelStatus?.veri_sayisi || "--"}</span>
          </div>
        </div>

        <div style={mlChartStyle}>
          {featureImportanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={featureImportanceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.primary} radius={[0, 8, 8, 0]} name="Etki (%)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={emptyMlStyle}>Model önem dereceleri bulunamadı.</div>
          )}
        </div>
      </section>

      <div style={gridStyle}>
        <ChartCard title="Sıcaklık ve Süt Verimi Trendi" desc="Günlük ortalamalar üzerinden sıcaklık değişimi ve süt verimi karşılaştırması.">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 15, right: 18, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="tarih" tick={{ fontSize: 11, fill: COLORS.softText }} minTickGap={24} />
              <YAxis yAxisId="left" stroke={COLORS.red} tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
              <YAxis yAxisId="right" orientation="right" stroke={COLORS.green} tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine yAxisId="left" y={26} stroke={COLORS.red} strokeDasharray="5 5" />
              <Area yAxisId="left" type="monotone" dataKey="sicaklik" name="Sıcaklık (°C)" fill="#fee2e2" stroke={COLORS.red} strokeWidth={2} fillOpacity={0.45} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="sutVerimi" name="Süt Verimi (L)" stroke={COLORS.green} strokeWidth={3} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>


        <ChartCard title="Amonyak ve Süt Verimi Dağılımı" desc="Günlük ortalama amonyak değerleri ile süt verimi arasındaki dağılım görünümü.">
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 15, right: 18, bottom: 20, left: 0 }}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
              <XAxis type="number" dataKey="amonyak" name="Amonyak" unit=" ppm" tick={{ fontSize: 11, fill: COLORS.softText }} />
              <YAxis type="number" dataKey="sutVerimi" name="Süt" unit=" L" tick={{ fontSize: 11, fill: COLORS.softText }} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<CustomTooltip />} />
              <ReferenceLine x={25} stroke={COLORS.orange} strokeDasharray="5 5" />
              <Scatter name="Veri Noktaları" data={chartData} fill={COLORS.orange} fillOpacity={0.72} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Nem ve Süt Verimi Trendi" desc="Günlük ortalama nem oranı ve süt verimi değişiminin birlikte gösterimi.">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 15, right: 18, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="tarih" tick={{ fontSize: 11, fill: COLORS.softText }} minTickGap={24} />
              <YAxis yAxisId="left" stroke={COLORS.blue} tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
              <YAxis yAxisId="right" orientation="right" stroke={COLORS.green} tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area yAxisId="left" type="monotone" dataKey="nem" name="Nem (%)" fill="#dbeafe" stroke={COLORS.blue} strokeWidth={2} fillOpacity={0.55} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="sutVerimi" name="Süt Verimi (L)" stroke={COLORS.green} strokeWidth={3} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Işık Şiddeti ve Süt Verimi" desc="Işık seviyeleri ve süt verimi değerlerinin dağılımsal görünümü.">
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 15, right: 18, bottom: 20, left: 0 }}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
              <XAxis type="number" dataKey="isik" name="Işık" unit=" lux" tick={{ fontSize: 11, fill: COLORS.softText }} />
              <YAxis type="number" dataKey="sutVerimi" name="Süt" unit=" L" tick={{ fontSize: 11, fill: COLORS.softText }} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<CustomTooltip />} />
              <Scatter name="Işık Değerleri" data={chartData} fill={COLORS.purple} fillOpacity={0.72} />
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
      <h4 style={cardTitleStyle}>{title}</h4>
      <p style={cardDescStyle}>{desc}</p>
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
          <span style={{ ...tooltipDotStyle, backgroundColor: item.color || item.fill }} />
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
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
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

const mlSectionStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "20px",
  background: "linear-gradient(135deg, #ffffff, #eef2ff)",
  border: "1px solid #c7d2fe",
  borderRadius: "20px",
  padding: "22px",
  marginBottom: "24px",
  boxShadow: "0 12px 30px rgba(79, 70, 229, 0.08)",
};

const mlLeftStyle = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const mlBadgeStyle = {
  display: "inline-block",
  width: "fit-content",
  background: "#e0e7ff",
  color: "#3730a3",
  padding: "7px 12px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 800,
};

const insightTitleStyle = {
  margin: "12px 0 8px",
  color: COLORS.dark,
  fontSize: "18px",
  fontWeight: 800,
};

const insightTextStyle = {
  margin: 0,
  color: COLORS.softText,
  lineHeight: "1.6",
  fontSize: "14px",
};

const modelInfoStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  marginTop: "16px",
};

const mlChartStyle = {
  background: "#ffffff",
  borderRadius: "16px",
  padding: "12px",
  border: "1px solid #e0e7ff",
};

const emptyMlStyle = {
  height: "220px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: COLORS.softText,
  fontWeight: 700,
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