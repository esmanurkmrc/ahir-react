import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area,
  ScatterChart, Scatter, ZAxis
} from "recharts";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { FileText, Table, Search, TrendingUp, Info } from "lucide-react";

const CorrelationTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const yem = Number(payload[0]?.value || 0);
    const sut = Number(payload[1]?.value || 0);

    return (
      <div style={{
        background: "#fff",
        padding: "12px",
        borderRadius: "12px",
        boxShadow: "0 10px 15px rgba(0,0,0,0.1)",
        border: "1px solid #e2e8f0"
      }}>
        <p style={{ margin: "0 0 8px 0", fontWeight: "bold", color: "#1e293b", fontSize: "13px" }}>
          Verimlilik Noktası
        </p>
        <p style={{ margin: 0, color: "#6366f1", fontSize: "12px" }}>
          🌾 Yem: <strong>{yem} kg</strong>
        </p>
        <p style={{ margin: 0, color: "#3b82f6", fontSize: "12px" }}>
          🥛 Süt: <strong>{sut} L</strong>
        </p>
        <p style={{ margin: "8px 0 0 0", color: "#10b981", fontSize: "11px", fontWeight: "600" }}>
          Oran: {yem > 0 ? (sut / yem).toFixed(2) : "0.00"}
        </p>
      </div>
    );
  }
  return null;
};

const SutVerileripage = () => {
  const [data, setData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isListVisible, setIsListVisible] = useState(false);

  useEffect(() => {
    fetchProductionData();
  }, []);

  const fetchProductionData = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/analysis-productivity");

      const cleaned = (res.data || [])
        .map((item) => ({
          ...item,
          sutVerimi: Number(item.sutVerimi) || 0,
          yemTuketimi: Number(item.yemTuketimi) || 0,
          hayvanId: Number(item.hayvanId) || 0,
        }))
        .sort((a, b) => {
          const dateA = new Date(`${a.tarih}T${a.saat || "00:00"}`);
          const dateB = new Date(`${b.tarih}T${b.saat || "00:00"}`);
          return dateA - dateB;
        });

      setData(cleaned);
      setDailyData(createDailySummary(cleaned));
    } catch (err) {
      console.error("Veri çekilemedi", err);
    } finally {
      setLoading(false);
    }
  };

  const createDailySummary = (list) => {
    const grouped = {};

    list.forEach((item) => {
      if (!grouped[item.tarih]) {
        grouped[item.tarih] = {
          tarih: item.tarih,
          sutToplam: 0,
          yemToplam: 0,
          kayitSayisi: 0,
        };
      }

      grouped[item.tarih].sutToplam += Number(item.sutVerimi) || 0;
      grouped[item.tarih].yemToplam += Number(item.yemTuketimi) || 0;
      grouped[item.tarih].kayitSayisi += 1;
    });

    return Object.values(grouped).map((item) => ({
      tarih: item.tarih,
      sutVerimi: Number((item.sutToplam / item.kayitSayisi).toFixed(2)),
      yemTuketimi: Number((item.yemToplam / item.kayitSayisi).toFixed(2)),
      toplamSut: Number(item.sutToplam.toFixed(1)),
      toplamYem: Number(item.yemToplam.toFixed(1)),
    }));
  };

  const formatNum = (num) => {
    return new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(Number(num) || 0);
  };

  const totalSut = useMemo(() => {
    return data.reduce((acc, curr) => acc + (Number(curr.sutVerimi) || 0), 0);
  }, [data]);

  const avgSut = useMemo(() => {
    return data.length > 0 ? totalSut / data.length : 0;
  }, [data, totalSut]);

  const maxSut = useMemo(() => {
    return data.length > 0 ? Math.max(...data.map((d) => Number(d.sutVerimi) || 0)) : 0;
  }, [data]);

  const avgEfficiency = useMemo(() => {
    if (data.length === 0) return 0;

    const total = data.reduce((acc, curr) => {
      const yem = Number(curr.yemTuketimi) || 1;
      return acc + ((Number(curr.sutVerimi) || 0) / yem);
    }, 0);

    return total / data.length;
  }, [data]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Sut Uretim Analiz Raporu", 14, 15);

    const tableRows = data.map((item) => [
      item.tarih,
      item.saat || "-",
      item.hayvanId,
      `${item.sutVerimi} L`,
      `${item.yemTuketimi} kg`,
      item.yemTuketimi > 0 ? (item.sutVerimi / item.yemTuketimi).toFixed(2) : "0.00",
    ]);

    autoTable(doc, {
      head: [["Tarih", "Saat", "Hayvan ID", "Sut", "Yem", "Verim"]],
      body: tableRows,
      startY: 30,
    });

    doc.save("Sut_Analizi.pdf");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Veriler");
    XLSX.writeFile(wb, "Uretim_Analizi.xlsx");
  };

  if (loading) {
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        📊 Analiz Ediliyor...
      </div>
    );
  }

  return (
    <div style={{ padding: "25px", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <header style={headerStyle}>
        <div>
          <h2 style={{ margin: 0, color: "#1e293b", fontSize: "24px", fontWeight: "800" }}>
            🥛 Üretim & Verimlilik Paneli
          </h2>
          <p style={{ margin: "5px 0 0 0", color: "#64748b" }}>
            Süt üretimi ve yem dönüşüm oranlarının analiz takibi.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => setIsListVisible(!isListVisible)} style={listBtnStyle}>
            <Search size={16} /> {isListVisible ? "Gizle" : "Kayıtları Listele"}
          </button>
          <button onClick={exportExcel} style={excelBtnStyle}>
            <Table size={16} /> Excel
          </button>
          <button onClick={exportPDF} style={pdfBtnStyle}>
            <FileText size={16} /> PDF
          </button>
        </div>
      </header>

      <div style={kpiGridStyle}>
        <div style={kpiCardStyle("#3b82f6")}>
          <span style={kpiLabelStyle}>Toplam Süt Üretimi</span>
          <div style={kpiValueStyle}>
            {formatNum(totalSut)} <small style={{ fontSize: "14px" }}>Litre</small>
          </div>
        </div>

        <div style={kpiCardStyle("#10b981")}>
          <span style={kpiLabelStyle}>Kayıt Ortalama Süt</span>
          <div style={kpiValueStyle}>
            {formatNum(avgSut)} <small style={{ fontSize: "14px" }}>L</small>
          </div>
        </div>

        <div style={kpiCardStyle("#f59e0b")}>
          <span style={kpiLabelStyle}>En Yüksek Ölçüm</span>
          <div style={kpiValueStyle}>
            {formatNum(maxSut)} <small style={{ fontSize: "14px" }}>Litre</small>
          </div>
        </div>

        <div style={kpiCardStyle("#6366f1")}>
          <span style={kpiLabelStyle}>Yem/Süt Dönüşümü</span>
          <div style={kpiValueStyle}>
            {avgEfficiency.toFixed(2)} <small style={{ fontSize: "14px" }}>Skor</small>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", marginBottom: "25px" }}>
        <div style={cardStyle}>
          <h4 style={cardTitleStyle}>
            <TrendingUp size={18} /> Günlük Ortalama Süt Trendi
          </h4>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="sutGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="tarih" tick={{ fontSize: 10 }} interval={3} />
              <YAxis domain={[1, 5]} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="sutVerimi"
                stroke="#3b82f6"
                strokeWidth={3}
                fill="url(#sutGrad)"
                name="Günlük Ort. Süt (L)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={cardStyle}>
          <h4 style={cardTitleStyle}>🎯 Yem vs Süt Korelasyonu</h4>

          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" dataKey="yemTuketimi" name="Yem" unit="kg" domain={[0, 9]} tick={{ fontSize: 11 }} />
              <YAxis type="number" dataKey="sutVerimi" name="Süt" unit="L" domain={[0, 6]} tick={{ fontSize: 11 }} />
              <ZAxis range={[50, 51]} />
              <Tooltip content={<CorrelationTooltip />} />
              <Scatter name="Verimlilik" data={data} fill="#6366f1" />
            </ScatterChart>
          </ResponsiveContainer>

          <div style={analysisNoteStyle}>
            <Info size={16} color="#3182ce" />
            <p style={{ margin: 0, fontSize: "12px", color: "#2c5282", fontStyle: "italic" }}>
              <strong>Veri Bilimi Notu:</strong> Yem tüketimi arttıkça süt veriminde genel olarak artış eğilimi gözlemlenmektedir.
            </p>
          </div>
        </div>
      </div>

      {isListVisible && (
        <div style={{ ...cardStyle, padding: "0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                <th style={thStyle}>Tarih</th>
                <th style={thStyle}>Saat</th>
                <th style={thStyle}>Hayvan ID</th>
                <th style={thStyle}>Süt (L)</th>
                <th style={thStyle}>Yem (kg)</th>
                <th style={thStyle}>Verim</th>
              </tr>
            </thead>

            <tbody>
              {data.slice().reverse().map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={tdStyle}>{row.tarih}</td>
                  <td style={tdStyle}>{row.saat || "-"}</td>
                  <td style={tdStyle}>{row.hayvanId}</td>
                  <td style={tdStyle}>{formatNum(row.sutVerimi)} L</td>
                  <td style={tdStyle}>{formatNum(row.yemTuketimi)} kg</td>
                  <td style={{ ...tdStyle, color: "#10b981", fontWeight: "bold" }}>
                    {row.yemTuketimi > 0 ? (row.sutVerimi / row.yemTuketimi).toFixed(2) : "0.00"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", background: "#fff", padding: "25px", borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" };
const kpiGridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "20px", marginBottom: "30px" };
const kpiCardStyle = (color) => ({ background: "#fff", padding: "20px", borderRadius: "18px", borderLeft: `6px solid ${color}`, boxShadow: "0 4px 12px rgba(0,0,0,0.02)" });
const kpiLabelStyle = { fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase" };
const kpiValueStyle = { fontSize: "26px", color: "#1e293b", fontWeight: "800", marginTop: "8px" };
const cardStyle = { background: "#fff", padding: "25px", borderRadius: "20px", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" };
const cardTitleStyle = { margin: "0 0 20px 0", fontSize: "16px", color: "#475569", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" };
const analysisNoteStyle = { marginTop: "15px", padding: "12px", background: "#ebf8ff", borderRadius: "10px", display: "flex", gap: "10px", alignItems: "center", borderLeft: "4px solid #3182ce" };
const thStyle = { padding: "15px 20px", fontSize: "12px", color: "#64748b", textAlign: "left" };
const tdStyle = { padding: "15px 20px", fontSize: "14px" };
const listBtnStyle = { padding: "10px 18px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" };
const excelBtnStyle = { ...listBtnStyle, background: "#10b981" };
const pdfBtnStyle = { ...listBtnStyle, background: "#ef4444" };

export default SutVerileripage;