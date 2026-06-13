import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";

import AmonyakGrafik from "./AmonyakGrafik";

const GenelOzetpage = () => {
  const [productivityData, setProductivityData] = useState([]);
  const [envData, setEnvData] = useState([]);
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");

  const API_BASE = "http://localhost:8080";

  useEffect(() => {
    fetchData();
  }, []);

  const sortByDateTime = (data) => {
    return [...data].sort((a, b) => {
      const dateA = new Date(`${a.tarih}T${a.saat || "00:00"}`);
      const dateB = new Date(`${b.tarih}T${b.saat || "00:00"}`);
      return dateA - dateB;
    });
  };

  const getWeeklyAverageData = (data, valueKey) => {
    if (!data || data.length === 0) return [];

    const weekly = [];

    for (let i = 0; i < data.length; i += 7) {
      const chunk = data.slice(i, i + 7);

      const avgValue =
        chunk.reduce((sum, item) => sum + (Number(item[valueKey]) || 0), 0) /
        chunk.length;

      weekly.push({
        tarih: `${chunk[0].tarih} (Hafta)`,
        [valueKey]: Number(avgValue.toFixed(2)),
      });
    }

    return weekly;
  };

  const getWeeklyMaxData = (data, valueKey) => {
    if (!data || data.length === 0) return [];

    const weekly = [];

    for (let i = 0; i < data.length; i += 7) {
      const chunk = data.slice(i, i + 7);

      const maxValue = Math.max(
        ...chunk.map((item) => Number(item[valueKey]) || 0)
      );

      weekly.push({
        tarih: `${chunk[0].tarih} (Hafta)`,
        [valueKey]: Number(maxValue.toFixed(2)),
      });
    }

    return weekly;
  };

  const getAverage = (data, key) => {
    if (!data || data.length === 0) return 0;

    const total = data.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);
    return Number((total / data.length).toFixed(2));
  };

  const getMax = (data, key) => {
    if (!data || data.length === 0) return 0;
    return Math.max(...data.map((item) => Number(item[key]) || 0));
  };

  const summaryStats = useMemo(() => {
    const avgMilk = getAverage(productivityData, "sutVerimi");
    const avgFeed = getAverage(productivityData, "yemTuketimi");
    const avgTemp = getAverage(envData, "sicaklik");
    const avgHumidity = getAverage(envData, "nem");
    const maxAmonyak = getMax(envData, "amonyak");
    const avgAmonyak = getAverage(envData, "amonyak");

    return {
      avgMilk,
      avgFeed,
      avgTemp,
      avgHumidity,
      maxAmonyak,
      avgAmonyak,
    };
  }, [productivityData, envData]);

  const riskInfo = useMemo(() => {
    const risks = [];

    if (summaryStats.maxAmonyak >= 25) {
      risks.push("Amonyak seviyesi kritik eşiğe ulaşmıştır.");
    }

    if (summaryStats.avgTemp >= 25) {
      risks.push("Sıcaklık değeri ısı stresi riski oluşturabilir.");
    }

    if (summaryStats.avgHumidity >= 70) {
      risks.push("Nem seviyesi yüksek aralıkta seyretmektedir.");
    }

    if (risks.length >= 2) {
      return {
        label: "Yüksek Risk",
        color: "#dc2626",
        bg: "#fef2f2",
        icon: "🚨",
        text: risks.join(" "),
      };
    }

    if (risks.length === 1) {
      return {
        label: "Orta Risk",
        color: "#d97706",
        bg: "#fffbeb",
        icon: "⚠️",
        text: risks[0],
      };
    }

    return {
      label: "Düşük Risk",
      color: "#16a34a",
      bg: "#f0fdf4",
      icon: "✅",
      text: "Çevresel değerler genel olarak kabul edilebilir aralıkta görünmektedir.",
    };
  }, [summaryStats]);

  const fetchData = async () => {
    try {
      const prodRes = await axios.get(`${API_BASE}/api/analysis-productivity`);
      const envRes = await axios.get(`${API_BASE}/api/analysis-environment`);

      const sortedProd = sortByDateTime(prodRes.data || []);
      const sortedEnv = sortByDateTime(envRes.data || []);

      const weeklyProd = getWeeklyAverageData(sortedProd, "sutVerimi");
      const weeklyYem = getWeeklyAverageData(sortedProd, "yemTuketimi");

      const mergedWeeklyProd = weeklyProd.map((item, index) => ({
        ...item,
        yemTuketimi: weeklyYem[index] ? weeklyYem[index].yemTuketimi : 0,
      }));

      const weeklyTemp = getWeeklyAverageData(sortedEnv, "sicaklik");
      const weeklyNem = getWeeklyAverageData(sortedEnv, "nem");
      const weeklyAmonyak = getWeeklyMaxData(sortedEnv, "amonyak");

      const mergedWeeklyEnv = weeklyTemp.map((item, index) => ({
        ...item,
        nem: weeklyNem[index] ? weeklyNem[index].nem : 0,
        amonyak: weeklyAmonyak[index] ? weeklyAmonyak[index].amonyak : 0,
      }));

      setProductivityData(mergedWeeklyProd);
      setEnvData(mergedWeeklyEnv);
    } catch (error) {
      console.error("Veri çekme hatası:", error);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setUploadStatus("⚠️ Lütfen dosya seçin.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadStatus("Yükleniyor...");
      await axios.post(`${API_BASE}/api/excel/upload`, formData);
      setUploadStatus("✅ Başarılı.");
      fetchData();
    } catch (error) {
      console.error("Excel yükleme hatası:", error);
      setUploadStatus("❌ Hata.");
    }
  };

  const StatCard = ({ icon, title, value, unit, color }) => (
    <div style={statCardStyle}>
      <div style={{ ...statIconStyle, background: `${color}18`, color }}>
        {icon}
      </div>
      <p style={statTitleStyle}>{title}</p>
      <h2 style={{ ...statValueStyle, color }}>
        {value} <span style={statUnitStyle}>{unit}</span>
      </h2>
    </div>
  );

  const ChartDescription = ({ children }) => (
    <p style={chartDescStyle}>{children}</p>
  );

  return (
    <div className="summary-container" style={pageStyle}>
      <section style={heroStyle}>
        <div>
          <span style={heroBadgeStyle}>📊 Geçmiş Veri Analizi</span>
          <h2 style={heroTitleStyle}>Genel Veri Analizi</h2>
          <p style={heroTextStyle}>
            Bu sayfa, geçmiş sensör ve üretim verilerini haftalık ortalamalar
            üzerinden değerlendirerek çevresel koşulların süt verimi üzerindeki
            etkisini anlaşılır grafikler ve sistem yorumu ile sunar.
          </p>
        </div>

        <div style={heroMiniCardStyle}>
          <span style={heroMiniLabelStyle}>Genel Durum</span>
          <strong style={{ color: riskInfo.color }}>{riskInfo.label}</strong>
        </div>
      </section>

      <div style={statsGridStyle}>
        <StatCard icon="🐄" title="Ortalama Süt Verimi" value={summaryStats.avgMilk} unit="L" color="#2563eb" />
        <StatCard icon="🌾" title="Ortalama Yem" value={summaryStats.avgFeed} unit="kg" color="#16a34a" />
        <StatCard icon="🌡️" title="Ortalama Sıcaklık" value={summaryStats.avgTemp} unit="°C" color="#f97316" />
        <StatCard icon="💧" title="Ortalama Nem" value={summaryStats.avgHumidity} unit="%" color="#0ea5e9" />
        <StatCard icon="⚠️" title="Maksimum Amonyak" value={summaryStats.maxAmonyak} unit="ppm" color="#dc2626" />
      </div>

      <section
        style={{
          ...riskCardStyle,
          background: riskInfo.bg,
          borderLeft: `7px solid ${riskInfo.color}`,
        }}
      >
        <div style={riskHeaderStyle}>
          <span style={riskIconStyle}>{riskInfo.icon}</span>
          <div>
            <h3 style={{ ...riskTitleStyle, color: riskInfo.color }}>
              Sistem Yorumu: {riskInfo.label}
            </h3>
            <p style={riskTextStyle}>
              {riskInfo.text} Bu değerlendirme sıcaklık, nem ve amonyak
              değerlerinin haftalık analiz sonuçlarına göre yapılmıştır.
            </p>
          </div>
        </div>
      </section>

      <section style={uploadSectionStyle}>
        <div style={uploadHeaderStyle}>
          <span style={uploadIconStyle}>📂</span>
          <div>
            <h3 style={uploadTitleStyle}>Haftalık Analiz Yüklemesi</h3>
            <p style={uploadTextStyle}>
              Excel dosyası yükleyerek geçmiş üretim ve çevre verilerini
              güncelleyebilirsiniz.
            </p>
          </div>
        </div>

        <form onSubmit={handleFileUpload} style={uploadFormStyle}>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files[0])}
            style={fileInputStyle}
          />

          <button type="submit" style={uploadButtonStyle}>
            Yükle
          </button>

          <span style={uploadStatusStyle}>{uploadStatus}</span>
        </form>
      </section>

      <div style={amonyakWrapperStyle}>
        <AmonyakGrafik data={envData} />
      </div>

      <div className="charts-grid" style={chartsGridStyle}>
        <div className="chart-card" style={chartCardStyle}>
          <h4 style={chartTitleStyle}>🐄 Haftalık Ortalama Süt Verimi</h4>
          <ChartDescription>
            Süt veriminin haftalara göre ortalama değişimini gösterir.
          </ChartDescription>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={productivityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="tarih" tick={{ fontSize: 10 }} height={50} />
              <YAxis />
              <Tooltip />
              <Legend iconType="circle" />
              <Line type="monotone" dataKey="sutVerimi" stroke="#2563eb" name="Süt (Ort. L)" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card" style={chartCardStyle}>
          <h4 style={chartTitleStyle}>🌡️ Haftalık Ortalama Sıcaklık</h4>
          <ChartDescription>
            Ahır ortamındaki sıcaklık değişiminin haftalık ortalamasını gösterir.
          </ChartDescription>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={envData}>
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="tarih" tick={{ fontSize: 10 }} height={50} />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="sicaklik" stroke="#f97316" fill="url(#tempGradient)" name="Sıcaklık (°C)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card" style={chartCardStyle}>
          <h4 style={chartTitleStyle}>🌾 Haftalık Ortalama Yem</h4>
          <ChartDescription>
            Haftalık ortalama yem tüketimi ile üretim süreci takip edilir.
          </ChartDescription>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productivityData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="tarih" tick={{ fontSize: 10 }} height={50} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="yemTuketimi" fill="#16a34a" name="Yem (Ort. kg)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card" style={chartCardStyle}>
          <h4 style={chartTitleStyle}>💧 Haftalık Ortalama Nem</h4>
          <ChartDescription>
            Nem oranlarının haftalık ortalama değişimini gösterir.
          </ChartDescription>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={envData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="tarih" tick={{ fontSize: 10 }} height={50} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="stepAfter" dataKey="nem" stroke="#0ea5e9" name="Nem %" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const pageStyle = {
  padding: "28px",
  background: "linear-gradient(135deg, #f8fafc 0%, #eef6ff 100%)",
  minHeight: "100vh",
  fontFamily: "'Segoe UI', Roboto, Arial, sans-serif",
};

const heroStyle = {
  marginBottom: "24px",
  padding: "28px",
  background: "linear-gradient(135deg, #ffffff, #ecfdf5)",
  borderRadius: "24px",
  boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
  border: "1px solid #dbeafe",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "24px",
};

const heroBadgeStyle = {
  display: "inline-block",
  padding: "8px 14px",
  borderRadius: "999px",
  background: "#dcfce7",
  color: "#166534",
  fontWeight: "800",
  fontSize: "13px",
  marginBottom: "12px",
};

const heroTitleStyle = {
  margin: "0 0 8px",
  color: "#0f172a",
  fontSize: "32px",
  fontWeight: "900",
};

const heroTextStyle = {
  margin: 0,
  color: "#64748b",
  lineHeight: "1.7",
  maxWidth: "880px",
  fontSize: "15px",
};

const heroMiniCardStyle = {
  minWidth: "170px",
  background: "#ffffff",
  border: "1px solid #dbeafe",
  borderRadius: "20px",
  padding: "18px",
  textAlign: "center",
  boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
};

const heroMiniLabelStyle = {
  display: "block",
  color: "#64748b",
  fontSize: "13px",
  fontWeight: "700",
  marginBottom: "8px",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gap: "16px",
  marginBottom: "24px",
};

const statCardStyle = {
  background: "#ffffff",
  padding: "20px",
  borderRadius: "20px",
  boxShadow: "0 14px 32px rgba(15,23,42,0.07)",
  border: "1px solid #e2e8f0",
};

const statIconStyle = {
  width: "46px",
  height: "46px",
  borderRadius: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "23px",
  marginBottom: "14px",
};

const statTitleStyle = {
  margin: 0,
  color: "#64748b",
  fontSize: "13px",
  fontWeight: "700",
};

const statValueStyle = {
  margin: "8px 0 0",
  fontSize: "28px",
  fontWeight: "900",
};

const statUnitStyle = {
  fontSize: "14px",
  color: "#64748b",
  fontWeight: "700",
};

const riskCardStyle = {
  marginBottom: "24px",
  padding: "22px",
  borderRadius: "20px",
  boxShadow: "0 12px 26px rgba(15,23,42,0.06)",
  border: "1px solid #e5e7eb",
};

const riskHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "16px",
};

const riskIconStyle = {
  width: "46px",
  height: "46px",
  borderRadius: "16px",
  background: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
  flexShrink: 0,
};

const riskTitleStyle = {
  margin: "0 0 8px",
  fontSize: "20px",
  fontWeight: "900",
};

const riskTextStyle = {
  margin: 0,
  color: "#374151",
  lineHeight: "1.7",
};

const uploadSectionStyle = {
  marginBottom: "30px",
  padding: "22px",
  background: "#ffffff",
  borderRadius: "22px",
  boxShadow: "0 14px 32px rgba(15,23,42,0.07)",
  border: "1px solid #e2e8f0",
};

const uploadHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  marginBottom: "18px",
};

const uploadIconStyle = {
  width: "46px",
  height: "46px",
  borderRadius: "16px",
  background: "#eff6ff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "22px",
};

const uploadTitleStyle = {
  margin: 0,
  color: "#0f172a",
  fontWeight: "900",
};

const uploadTextStyle = {
  margin: "4px 0 0",
  color: "#64748b",
  fontSize: "14px",
};

const uploadFormStyle = {
  display: "flex",
  gap: "14px",
  alignItems: "center",
  flexWrap: "wrap",
};

const fileInputStyle = {
  padding: "10px",
  border: "1px dashed #cbd5e1",
  borderRadius: "12px",
  background: "#f8fafc",
  color: "#475569",
};

const uploadButtonStyle = {
  padding: "11px 22px",
  background: "linear-gradient(135deg, #16a34a, #22c55e)",
  color: "white",
  border: "none",
  borderRadius: "12px",
  fontWeight: "800",
  cursor: "pointer",
  boxShadow: "0 8px 18px rgba(22,163,74,0.22)",
};

const uploadStatusStyle = {
  fontSize: "14px",
  color: "#64748b",
  fontWeight: "700",
};

const amonyakWrapperStyle = {
  marginBottom: "30px",
};

const chartsGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "24px",
};

const chartCardStyle = {
  background: "#ffffff",
  padding: "22px",
  borderRadius: "22px",
  boxShadow: "0 14px 32px rgba(15,23,42,0.07)",
  border: "1px solid #e2e8f0",
};

const chartTitleStyle = {
  color: "#0f172a",
  marginBottom: "6px",
  fontSize: "18px",
  fontWeight: "900",
};

const chartDescStyle = {
  marginTop: "-2px",
  marginBottom: "16px",
  color: "#64748b",
  fontSize: "13px",
  lineHeight: "1.5",
};

export default GenelOzetpage;