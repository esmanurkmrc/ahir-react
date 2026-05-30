import React, { useState, useEffect } from "react";
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

  const fetchData = async () => {
    try {
      const prodRes = await axios.get(
        "http://localhost:8080/api/analysis-productivity"
      );

      const envRes = await axios.get(
        "http://localhost:8080/api/analysis-environment"
      );

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
      await axios.post("http://localhost:8080/api/excel/upload", formData);
      setUploadStatus("✅ Başarılı.");
      fetchData();
    } catch (error) {
      console.error("Excel yükleme hatası:", error);
      setUploadStatus("❌ Hata.");
    }
  };

  return (
    <div className="summary-container" style={{ padding: "20px" }}>
      <section
        style={{
          marginBottom: "30px",
          padding: "25px",
          background: "#fff",
          borderRadius: "15px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "15px",
          }}
        >
          <span style={{ fontSize: "24px" }}>📂</span>
          <h3 style={{ margin: 0, color: "#2d3748" }}>
            Haftalık Analiz Yüklemesi
          </h3>
        </div>

        <form
          onSubmit={handleFileUpload}
          style={{ display: "flex", gap: "15px", alignItems: "center" }}
        >
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files[0])}
            style={{
              padding: "8px",
              border: "1px dashed #cbd5e0",
              borderRadius: "8px",
            }}
          />

          <button
            type="submit"
            style={{
              padding: "10px 20px",
              background: "#2ecc71",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Yükle
          </button>

          <span style={{ fontSize: "14px", color: "#718096" }}>
            {uploadStatus}
          </span>
        </form>
      </section>

      <div style={{ marginBottom: "30px" }}>
        <AmonyakGrafik data={envData} />
      </div>

      <div
        className="charts-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "25px",
        }}
      >
        <div
          className="chart-card"
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
          }}
        >
          <h4 style={{ color: "#4a5568" }}>🐄 Haftalık Ortalama Süt Verimi</h4>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={productivityData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f0f0f0"
              />
              <XAxis dataKey="tarih" tick={{ fontSize: 10 }} height={50} />
              <YAxis />
              <Tooltip />
              <Legend iconType="circle" />
              <Line
                type="monotone"
                dataKey="sutVerimi"
                stroke="#3498db"
                name="Süt (Ort. L)"
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div
          className="chart-card"
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
          }}
        >
          <h4 style={{ color: "#4a5568" }}>🌡️ Haftalık Ortalama Sıcaklık</h4>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={envData}>
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f39c12" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f39c12" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="tarih" tick={{ fontSize: 10 }} height={50} />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="sicaklik"
                stroke="#e67e22"
                fill="url(#tempGradient)"
                name="Sıcaklık (°C)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div
          className="chart-card"
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
          }}
        >
          <h4 style={{ color: "#4a5568" }}>🌾 Haftalık Ortalama Yem</h4>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productivityData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f0f0f0"
              />
              <XAxis dataKey="tarih" tick={{ fontSize: 10 }} height={50} />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="yemTuketimi"
                fill="#27ae60"
                name="Yem (Ort. kg)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div
          className="chart-card"
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
          }}
        >
          <h4 style={{ color: "#4a5568" }}>💧 Haftalık Ortalama Nem</h4>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={envData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="tarih" tick={{ fontSize: 10 }} height={50} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line
                type="stepAfter"
                dataKey="nem"
                stroke="#16a085"
                name="Nem %"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default GenelOzetpage;