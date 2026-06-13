import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  ReferenceLine,
  Label,
  ReferenceArea,
} from "recharts";

import {
  Wind,
  Thermometer,
  Droplets,
  Activity,
  LayoutGrid,
} from "lucide-react";

const SensorVerileripage = () => {
  const [data, setData] = useState([]);
  const [viewType, setViewType] = useState("daily");

  useEffect(() => {
    fetchSensorData();
  }, [viewType]);

  const calculateTHI = (sicaklik, nem) => {
    const T = Number(sicaklik || 0);
    const RH = Number(nem || 0);

    return (
      1.8 * T +
      32 -
      (0.55 - 0.0055 * RH) * (1.8 * T - 26)
    );
  };

  const fetchSensorData = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8080/api/analysis-environment"
      );

      let rawData = (res.data || []).map((item) => ({
        ...item,
        sicaklik: Number(item.sicaklik) || 0,
        nem: Number(item.nem) || 0,
        amonyak: Number(item.amonyak) || 0,
        thi: Number(calculateTHI(item.sicaklik, item.nem).toFixed(2)),
      }));

      rawData.sort((a, b) => {
        const dateA = new Date(`${a.tarih}T${a.saat || "00:00"}`);
        const dateB = new Date(`${b.tarih}T${b.saat || "00:00"}`);
        return dateA - dateB;
      });

      if (viewType === "weekly") {
        const weeklyGrouped = [];

        for (let i = 0; i < rawData.length; i += 7) {
          const chunk = rawData.slice(i, i + 7);

          const avgSicaklik =
            chunk.reduce((sum, item) => sum + item.sicaklik, 0) /
            chunk.length;

          const avgNem =
            chunk.reduce((sum, item) => sum + item.nem, 0) /
            chunk.length;

          const avgTHI =
            chunk.reduce((sum, item) => sum + item.thi, 0) /
            chunk.length;

          const maxAmonyak = Math.max(
            ...chunk.map((item) => item.amonyak)
          );

          weeklyGrouped.push({
            tarih: `${chunk[0].tarih}`,
            sicaklik: Number(avgSicaklik.toFixed(2)),
            nem: Number(avgNem.toFixed(2)),
            amonyak: Number(maxAmonyak.toFixed(2)),
            thi: Number(avgTHI.toFixed(2)),
          });
        }

        setData(weeklyGrouped);
      } else {
        setData(rawData);
      }
    } catch (err) {
      console.error("Veri çekilemedi", err);
    }
  };

  const stats = useMemo(() => {
    if (!data.length) {
      return {
        avgTemp: 0,
        avgHumidity: 0,
        maxAmonyak: 0,
        avgTHI: 0,
      };
    }

    const avg = (key) =>
      data.reduce((sum, item) => sum + Number(item[key] || 0), 0) / data.length;

    return {
      avgTemp: avg("sicaklik").toFixed(1),
      avgHumidity: avg("nem").toFixed(1),
      maxAmonyak: Math.max(...data.map((item) => item.amonyak || 0)).toFixed(1),
      avgTHI: avg("thi").toFixed(1),
    };
  }, [data]);

  const getSystemComment = () => {
    if (Number(stats.avgTHI) >= 72 && Number(stats.maxAmonyak) >= 25) {
      return "THI ve amonyak değerleri kritik sınıra yaklaşmaktadır. Bu durum hayvan refahı ve süt verimi açısından risk oluşturabilir.";
    }

    if (Number(stats.avgTHI) >= 72) {
      return "Ortalama THI değeri ısı stresi risk bölgesindedir. Sıcaklık ve nem birlikte takip edilmelidir.";
    }

    if (Number(stats.maxAmonyak) >= 25) {
      return "Amonyak değeri kritik seviyeye ulaşmıştır. Havalandırma koşullarının kontrol edilmesi önerilir.";
    }

    return "Veriler genel olarak kabul edilebilir aralıktadır. Mikroklima koşulları düzenli takip edilmelidir.";
  };

  const getGradientOffset = () => {
    if (data.length === 0) return 0;

    const dataMax = Math.max(...data.map((i) => i.amonyak || 0));
    const dataMin = Math.min(...data.map((i) => i.amonyak || 0));

    if (dataMax <= 25) return 0;
    if (dataMin >= 25) return 1;

    return (dataMax - 25) / (dataMax - dataMin);
  };

  const off = getGradientOffset();

  return (
    <div
      style={{
        padding: "30px",
        backgroundColor: "#f4f7f9",
        minHeight: "100vh",
      }}
    >
      <header style={headerWrapperStyle}>
        <div>
          <h2
            style={{
              margin: 0,
              color: "#1e293b",
              fontSize: "26px",
              fontWeight: "800",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Activity color="#3b82f6" />
            Mikroklima Analiz Merkezi
          </h2>

          <p
            style={{
              margin: "5px 0 0 0",
              color: "#64748b",
              fontWeight: "500",
            }}
          >
            Teknik denetim ve sensör bazlı kritik eşik takibi
          </p>
        </div>

        <div style={toggleBgStyle}>
          <button
            onClick={() => setViewType("daily")}
            style={{
              ...toggleBtnStyle,
              backgroundColor:
                viewType === "daily" ? "#fff" : "transparent",
              color:
                viewType === "daily" ? "#3b82f6" : "#94a3b8",
            }}
          >
            Günlük Takip
          </button>

          <button
            onClick={() => setViewType("weekly")}
            style={{
              ...toggleBtnStyle,
              backgroundColor:
                viewType === "weekly" ? "#fff" : "transparent",
              color:
                viewType === "weekly" ? "#3b82f6" : "#94a3b8",
            }}
          >
            Haftalık Analiz
          </button>
        </div>
      </header>

      <div style={summaryGridStyle}>
        <SummaryCard title="Ortalama Sıcaklık" value={`${stats.avgTemp} °C`} icon="🌡️" />
        <SummaryCard title="Ortalama Nem" value={`%${stats.avgHumidity}`} icon="💧" />
        <SummaryCard title="Maksimum Amonyak" value={`${stats.maxAmonyak} ppm`} icon="⚠️" />
        <SummaryCard title="Ortalama THI" value={stats.avgTHI} icon="🐄" />
      </div>

      <div style={systemCommentStyle}>
        <strong>🧠 Sistem Yorumu</strong>
        <p>{getSystemComment()}</p>
      </div>

      <div style={wideCardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "25px",
          }}
        >
          <h4 style={cardTitleStyle}>
            <Wind color="#ef4444" size={20} />
            Amonyak (NH₃) Kritik Seviye Denetimi
          </h4>

          <div style={criticalLabelStyle}>
            KRİTİK EŞİK: 25 ppm
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data}>
            <defs>
              <linearGradient
                id="splitColor"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset={off} stopColor="#ef4444" stopOpacity={0.85} />
                <stop offset={off} stopColor="#3b82f6" stopOpacity={0.25} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

            <XAxis
              dataKey="tarih"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              hide={viewType === "daily"}
            />

            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} domain={[0, "auto"]} />

            <Tooltip />

            <ReferenceLine y={25} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2}>
              <Label
                value="TEHLİKE SINIRI"
                position="top"
                fill="#ef4444"
                fontSize={10}
                fontWeight="900"
              />
            </ReferenceLine>

            <Area
              type="monotone"
              dataKey="amonyak"
              stroke="#1e293b"
              strokeWidth={2}
              fill="url(#splitColor)"
              name="Amonyak"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: "30px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "30px",
          }}
        >
          <div style={cardStyle}>
            <h4 style={cardTitleStyle}>
              <Thermometer color="#f59e0b" size={20} />
              Sıcaklık Değişim Grafiği
            </h4>

            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="tarih" hide />
                <YAxis unit="°C" tick={{ fontSize: 11 }} stroke="#cbd5e1" axisLine={false} />
                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="sicaklik"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  fill="url(#tGrad)"
                  name="Sıcaklık"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={cardStyle}>
            <h4 style={cardTitleStyle}>
              <Droplets color="#06b6d4" size={20} />
              Nem Stabilizasyon Takibi
            </h4>

            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="tarih" hide />
                <YAxis unit="%" tick={{ fontSize: 11 }} stroke="#cbd5e1" axisLine={false} />
                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="nem"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={false}
                  name="Nem"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={cardStyle}>
            <h4 style={cardTitleStyle}>
              <Activity color="#ef4444" size={20} />
              THI Isı Stresi Takibi
            </h4>

            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="tarih" hide />
                <YAxis domain={[50, 90]} tick={{ fontSize: 11 }} stroke="#cbd5e1" axisLine={false} />
                <Tooltip />

                <ReferenceLine y={72} stroke="#ef4444" strokeDasharray="5 5">
                  <Label
                    value="THI 72 Risk Eşiği"
                    position="top"
                    fill="#ef4444"
                    fontSize={10}
                    fontWeight="900"
                  />
                </ReferenceLine>

                <Line
                  type="monotone"
                  dataKey="thi"
                  stroke="#ef4444"
                  strokeWidth={2.8}
                  dot={false}
                  name="THI"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={cardStyle}>
          <h4 style={cardTitleStyle}>
            <LayoutGrid color="#6366f1" size={20} />
            Sıcaklık vs Nem (Konfor Analizi)
          </h4>

          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

              <XAxis
                type="number"
                dataKey="sicaklik"
                name="Sıcaklık"
                unit="°C"
                domain={[10, 35]}
              />

              <YAxis
                type="number"
                dataKey="nem"
                name="Nem"
                unit="%"
                domain={[40, 90]}
              />

              <ReferenceArea
                x1={18}
                x2={23}
                y1={50}
                y2={65}
                fill="#10b981"
                fillOpacity={0.15}
                stroke="#10b981"
                strokeDasharray="3 3"
              >
                <Label
                  value="İDEAL KONFOR"
                  position="center"
                  fill="#059669"
                  fontSize={10}
                  fontWeight="bold"
                />
              </ReferenceArea>

              <Tooltip cursor={{ strokeDasharray: "3 3" }} />

              <Scatter name="Anlık Durum" data={data} fill="#6366f1" />
            </ScatterChart>
          </ResponsiveContainer>

          <div style={techNoteStyle}>
            <h5
              style={{
                margin: "0 0 8px 0",
                color: "#1e40af",
                fontSize: "14px",
              }}
            >
              💡 Bilimsel Çıkarım
            </h5>

            <p
              style={{
                fontSize: "12px",
                color: "#334155",
                lineHeight: "1.6",
                margin: 0,
              }}
            >
              <strong>Yeşil Alan:</strong> Hayvan refahı için optimum
              bölgedir. Veri noktalarının bu alanın dışına çıkması,
              ısı stresi veya aşırı nem kaynaklı verim kaybı riskini
              temsil eder.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, icon }) => (
  <div style={summaryCardStyle}>
    <span style={summaryIconStyle}>{icon}</span>
    <span style={summaryTitleStyle}>{title}</span>
    <strong style={summaryValueStyle}>{value}</strong>
  </div>
);

const headerWrapperStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "35px",
  background: "#fff",
  padding: "25px",
  borderRadius: "20px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
};

const toggleBgStyle = {
  display: "flex",
  background: "#f1f5f9",
  padding: "6px",
  borderRadius: "12px",
};

const toggleBtnStyle = {
  padding: "8px 18px",
  border: "none",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "13px",
  transition: "0.3s",
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "18px",
  marginBottom: "25px",
};

const summaryCardStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "20px",
  boxShadow: "0 8px 28px rgba(0,0,0,0.04)",
  border: "1px solid #f1f5f9",
};

const summaryIconStyle = {
  fontSize: "24px",
  display: "block",
  marginBottom: "8px",
};

const summaryTitleStyle = {
  display: "block",
  fontSize: "12px",
  color: "#64748b",
  fontWeight: "800",
  textTransform: "uppercase",
  marginBottom: "6px",
};

const summaryValueStyle = {
  fontSize: "24px",
  color: "#1e293b",
  fontWeight: "900",
};

const systemCommentStyle = {
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderLeft: "6px solid #3b82f6",
  color: "#1e3a8a",
  padding: "18px 22px",
  borderRadius: "18px",
  marginBottom: "30px",
};

const wideCardStyle = {
  background: "#fff",
  padding: "30px",
  borderRadius: "24px",
  boxShadow: "0 10px 40px rgba(0,0,0,0.04)",
  marginBottom: "30px",
  border: "1px solid #f1f5f9",
};

const cardStyle = {
  background: "#fff",
  padding: "28px",
  borderRadius: "24px",
  boxShadow: "0 10px 40px rgba(0,0,0,0.04)",
  border: "1px solid #f1f5f9",
};

const cardTitleStyle = {
  margin: "0 0 25px 0",
  color: "#1e293b",
  fontSize: "17px",
  fontWeight: "700",
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const criticalLabelStyle = {
  padding: "6px 14px",
  backgroundColor: "#fef2f2",
  borderRadius: "20px",
  fontSize: "11px",
  color: "#ef4444",
  fontWeight: "900",
  border: "1px solid #fee2e2",
};

const techNoteStyle = {
  marginTop: "20px",
  padding: "15px",
  background: "#eff6ff",
  borderRadius: "14px",
  borderLeft: "5px solid #3b82f6",
};

export default SensorVerileripage;