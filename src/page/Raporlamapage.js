import React, { useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  FaFilePdf,
  FaFileExcel,
  FaFilter,
  FaDownload,
  FaSpinner,
  FaInfoCircle,
} from "react-icons/fa";

const Raporlamapage = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dataType, setDataType] = useState("real");
  const [category, setCategory] = useState("environment");
  const [loading, setLoading] = useState(false);
  const [previewStats, setPreviewStats] = useState(null);

  const getApiUrl = () => {
    if (dataType === "real") {
      return "http://localhost:8080/api/sensor-data";
    }

    return `http://localhost:8080/api/analysis-${category}`;
  };

  const getDateValue = (item) => {
    if (dataType === "real") {
      return item.zaman ? item.zaman.substring(0, 10) : "";
    }

    return item.tarih || "";
  };

  const normalizeData = (data) => {
    return data.filter((item) => {
      const dateValue = getDateValue(item);
      return dateValue >= startDate && dateValue <= endDate;
    });
  };

  const calculateTHI = (sicaklik, nem) => {
    const T = Number(sicaklik || 0);
    const RH = Number(nem || 0);

    return (
      1.8 * T +
      32 -
      (0.55 - 0.0055 * RH) * (1.8 * T - 26)
    );
  };

  const calculateStats = (data) => {
    if (!data || data.length === 0) return null;

    const avg = (key) =>
      data.reduce((sum, item) => sum + Number(item[key] || 0), 0) / data.length;

    const avgTemp = avg("sicaklik");
    const avgHum = avg("nem");
    const avgAmm = avg("amonyak");
    const maxAmm = Math.max(...data.map((i) => Number(i.amonyak || 0)));

    const thiValues = data.map((item) => calculateTHI(item.sicaklik, item.nem));
    const avgTHI =
      thiValues.reduce((sum, value) => sum + value, 0) / thiValues.length;

    const criticalAmmCount = data.filter(
      (item) => Number(item.amonyak || 0) > 25
    ).length;

    const criticalTHICount = thiValues.filter((value) => value >= 72).length;

    let totalMilk = 0;
    let avgEfficiency = 0;

    if (category === "productivity" && dataType === "analysis") {
      totalMilk = data.reduce(
        (sum, item) => sum + Number(item.sutVerimi || 0),
        0
      );

      avgEfficiency =
        data.reduce((sum, item) => {
          const yem = Number(item.yemTuketimi || 1);
          return sum + Number(item.sutVerimi || 0) / yem;
        }, 0) / data.length;
    }

    let performanceText = "Sistem genel olarak normal seviyede çalışmaktadır.";

    if (avgTHI >= 72 && criticalAmmCount > 0) {
      performanceText =
        "THI ve amonyak değerlerinde kritik seviyeler gözlemlenmiştir. Ahır içi havalandırma ve soğutma koşullarının iyileştirilmesi önerilir.";
    } else if (avgTHI >= 72) {
      performanceText =
        "Ortalama THI değeri kritik eşik olan 72 seviyesinin üzerindedir. Isı stresi riski bulunmaktadır.";
    } else if (criticalAmmCount > 0) {
      performanceText =
        "Bazı kayıtlarda amonyak seviyesi kritik sınırın üzerine çıkmıştır. Hava kalitesi açısından takip önerilir.";
    } else if (category === "productivity" && dataType === "analysis") {
      performanceText =
        "Süt verimi ve yem tüketimi verileri raporlanabilir seviyededir. Verimlilik analizleri için düzenli veri takibi önerilir.";
    }

    return {
      recordCount: data.length,
      avgTemp: avgTemp.toFixed(1),
      avgHum: avgHum.toFixed(1),
      avgAmm: avgAmm.toFixed(1),
      maxAmm: maxAmm.toFixed(1),
      avgTHI: avgTHI.toFixed(1),
      criticalAmmCount,
      criticalTHICount,
      totalMilk: totalMilk.toFixed(1),
      avgEfficiency: avgEfficiency.toFixed(2),
      performanceText,
    };
  };

  const calculateSummary = (data) => {
    const stats = calculateStats(data);

    if (!stats) return "Kayıt bulunamadı.";

    if (dataType === "real" || category === "environment") {
      return `Kayıt: ${stats.recordCount} | Ort. Sıcaklık: ${stats.avgTemp}°C | Ort. Nem: %${stats.avgHum} | Ort. THI: ${stats.avgTHI} | Maks. Amonyak: ${stats.maxAmm} ppm | Kritik THI Kaydı: ${stats.criticalTHICount} | Kritik NH3 Kaydı: ${stats.criticalAmmCount}`;
    }

    return `Kayıt: ${stats.recordCount} | Toplam Süt: ${stats.totalMilk} L | Ortalama Verimlilik: ${stats.avgEfficiency} | Performans: ${stats.performanceText}`;
  };

  const getPdfTable = (data) => {
    if (dataType === "real") {
      return {
        head: [["ID", "Tarih", "Saat", "Sıcaklık", "Nem", "Amonyak", "THI"]],
        body: data.map((item) => [
          item.id,
          item.zaman ? item.zaman.substring(0, 10) : "-",
          item.zaman ? item.zaman.substring(11, 19) : "-",
          `${item.sicaklik}°C`,
          `%${item.nem}`,
          `${item.amonyak} ppm`,
          calculateTHI(item.sicaklik, item.nem).toFixed(1),
        ]),
      };
    }

    if (category === "environment") {
      return {
        head: [["Tarih", "Sıcaklık", "Nem", "Amonyak", "THI", "Işık"]],
        body: data.map((item) => [
          item.tarih,
          `${item.sicaklik}°C`,
          `%${item.nem}`,
          `${item.amonyak} ppm`,
          calculateTHI(item.sicaklik, item.nem).toFixed(1),
          item.isik ?? "-",
        ]),
      };
    }

    return {
      head: [["Tarih", "Hayvan ID", "Süt Verimi", "Yem Tüketimi", "Verim"]],
      body: data.map((item) => {
        const yem = Number(item.yemTuketimi || 1);
        const verim = (Number(item.sutVerimi || 0) / yem).toFixed(2);

        return [
          item.tarih,
          item.hayvanId ?? "-",
          `${item.sutVerimi} L`,
          `${item.yemTuketimi} kg`,
          verim,
        ];
      }),
    };
  };

  const getExcelData = (data) => {
    if (dataType === "real" || category === "environment") {
      return data.map((item) => ({
        ID: item.id ?? "",
        Tarih:
          dataType === "real"
            ? item.zaman
              ? item.zaman.substring(0, 10)
              : ""
            : item.tarih,
        Saat:
          dataType === "real" && item.zaman ? item.zaman.substring(11, 19) : "",
        Sicaklik: item.sicaklik,
        Nem: item.nem,
        Amonyak: item.amonyak,
        THI: calculateTHI(item.sicaklik, item.nem).toFixed(1),
        Isik: item.isik,
        Zaman: item.zaman ?? "",
      }));
    }

    return data.map((item) => {
      const yem = Number(item.yemTuketimi || 1);
      return {
        Tarih: item.tarih,
        HayvanID: item.hayvanId ?? "",
        SutVerimi: item.sutVerimi,
        YemTuketimi: item.yemTuketimi,
        Verimlilik: (Number(item.sutVerimi || 0) / yem).toFixed(2),
      };
    });
  };

  const fetchFilteredData = async () => {
    if (!startDate || !endDate) {
      alert("Lütfen önce bir tarih aralığı seçin!");
      return null;
    }

    const res = await axios.get(getApiUrl());
    const filteredData = normalizeData(res.data || []);

    if (filteredData.length === 0) {
      alert("Seçilen tarih aralığında kayıt bulunamadı!");
      setPreviewStats(null);
      return null;
    }

    setPreviewStats(calculateStats(filteredData));
    return filteredData;
  };

  const handlePreview = async () => {
    setLoading(true);

    try {
      await fetchFilteredData();
    } catch (error) {
      console.error("Özet hatası:", error);
      alert("Veri çekilirken bir hata oluştu!");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format) => {
    setLoading(true);

    try {
      const filteredData = await fetchFilteredData();

      if (!filteredData) return;

      const summaryText = calculateSummary(filteredData);
      const stats = calculateStats(filteredData);

      if (format === "pdf") {
        const doc = new jsPDF();
        const table = getPdfTable(filteredData);

        doc.setFontSize(19);
        doc.setTextColor(44, 62, 80);
        doc.text("AKILLI AHIR YONETICI RAPORU", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);

        doc.text(
          `Veri Turu: ${
            dataType === "real"
              ? "Gercek Sensor Verisi"
              : "Tarihsel / Analiz Veri Seti"
          }`,
          14,
          30
        );

        doc.text(
          `Kategori: ${
            dataType === "real"
              ? "Canli Sensor Kayitlari"
              : category === "environment"
              ? "Ortam Analizi"
              : "Hayvan Verimliligi"
          }`,
          14,
          36
        );

        doc.text(`Tarih Araligi: ${startDate} / ${endDate}`, 14, 42);

        doc.setFillColor(245, 247, 250);
        doc.rect(14, 49, 182, 24, "F");
        doc.setTextColor(52, 152, 219);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(`OZET: ${summaryText}`, 18, 58, { maxWidth: 170 });

        doc.setTextColor(44, 62, 80);
        doc.setFontSize(9);
        doc.text(`DEGERLENDIRME: ${stats.performanceText}`, 18, 68, {
          maxWidth: 170,
        });

        autoTable(doc, {
          startY: 82,
          head: table.head,
          body: table.body,
          headStyles: { fillColor: [66, 153, 225] },
          styles: { fontSize: 8 },
        });

        doc.save(
          `${
            dataType === "real" ? "Gercek_Sensor_Raporu" : "Analiz_Verisi_Raporu"
          }_${startDate}_${endDate}.pdf`
        );
      } else {
        const excelData = getExcelData(filteredData);
        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
          wb,
          ws,
          dataType === "real" ? "Gercek Sensor Verisi" : "Analiz Verisi"
        );

        if (stats) {
          const summarySheet = XLSX.utils.json_to_sheet([
            {
              KayitSayisi: stats.recordCount,
              OrtalamaSicaklik: stats.avgTemp,
              OrtalamaNem: stats.avgHum,
              OrtalamaAmonyak: stats.avgAmm,
              OrtalamaTHI: stats.avgTHI,
              KritikTHIKaydi: stats.criticalTHICount,
              KritikAmonyakKaydi: stats.criticalAmmCount,
              Degerlendirme: stats.performanceText,
            },
          ]);

          XLSX.utils.book_append_sheet(wb, summarySheet, "Ozet");
        }

        XLSX.writeFile(
          wb,
          `${
            dataType === "real" ? "Gercek_Sensor_Verisi" : "Analiz_Verisi"
          }_${startDate}_${endDate}.xlsx`
        );
      }
    } catch (error) {
      console.error("Rapor hatası:", error);
      alert("Veri çekilirken bir hata oluştu!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "30px", backgroundColor: "#f4f7f6", minHeight: "100vh" }}>
      <header style={headerStyle}>
        <div style={headerIconStyle}>📊</div>

        <div>
          <h2 style={pageTitleStyle}>Raporlama ve Veri Arşivi</h2>

          <p style={pageSubtitleStyle}>
            Gerçek sensör verileri ve tarihsel analiz verileri için dinamik raporlama.
          </p>
        </div>
      </header>

      <section style={panelStyle}>
        <div style={panelTitleStyle}>
          <FaFilter color="#4299e1" />
          <span>Rapor Parametrelerini Belirleyin</span>
        </div>

        <div style={{ display: "flex", gap: "25px", flexWrap: "wrap" }}>
          <div style={inputGroup}>
            <label style={labelStyle}>Veri Türü</label>
            <select
              value={dataType}
              onChange={(e) => {
                setDataType(e.target.value);
                setPreviewStats(null);
              }}
              style={selectStyle}
            >
              <option value="real">📡 Gerçek Sensör Verisi</option>
              <option value="analysis">📊 Analiz Veri Seti</option>
            </select>
          </div>

          {dataType === "analysis" && (
            <div style={inputGroup}>
              <label style={labelStyle}>Analiz Kategorisi</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPreviewStats(null);
                }}
                style={selectStyle}
              >
                <option value="environment">🌡️ Ahır Ortam Analizi</option>
                <option value="productivity">🐄 Hayvan Verimlilik</option>
              </select>
            </div>
          )}

          <div style={inputGroup}>
            <label style={labelStyle}>Başlangıç Tarihi</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPreviewStats(null);
              }}
              style={inputStyle}
            />
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}>Bitiş Tarihi</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPreviewStats(null);
              }}
              style={inputStyle}
            />
          </div>

          <div style={{ ...inputGroup, justifyContent: "flex-end" }}>
            <button disabled={loading} onClick={handlePreview} style={previewBtnStyle}>
              {loading ? "Yükleniyor..." : "Özeti Göster"}
            </button>
          </div>
        </div>
      </section>

      {previewStats && (
        <>
          <section style={statsGridStyle}>
            <ReportStat title="Kayıt Sayısı" value={previewStats.recordCount} />
            <ReportStat title="Ort. Sıcaklık" value={`${previewStats.avgTemp} °C`} />
            <ReportStat title="Ort. Nem" value={`%${previewStats.avgHum}`} />
            <ReportStat title="Ort. THI" value={previewStats.avgTHI} />
            <ReportStat title="Kritik THI" value={previewStats.criticalTHICount} />
            <ReportStat title="Kritik NH3" value={previewStats.criticalAmmCount} />
          </section>

          <section style={evaluationStyle}>
            <strong>Performans Değerlendirmesi</strong>
            <p>{previewStats.performanceText}</p>
          </section>
        </>
      )}

      <div style={downloadGridStyle}>
        <div style={cardStyle}>
          <FaFilePdf size={55} color="#e53e3e" style={{ marginBottom: "20px" }} />
          <h3 style={cardTitle}>Yönetici Özeti (PDF)</h3>
          <p style={cardText}>
            Seçilen veri türüne göre özet, performans yorumu ve tablo içeren PDF raporu.
          </p>

          <button
            disabled={loading}
            onClick={() => handleDownload("pdf")}
            style={{ ...btnStyle, backgroundColor: "#e53e3e" }}
          >
            {loading ? <FaSpinner className="spinner" /> : <><FaDownload /> Raporu Oluştur</>}
          </button>
        </div>

        <div style={cardStyle}>
          <FaFileExcel size={55} color="#38a169" style={{ marginBottom: "20px" }} />
          <h3 style={cardTitle}>Veri Analizi (Excel)</h3>
          <p style={cardText}>
            Verileri Excel formatında indirir ve ayrı bir özet sayfası oluşturur.
          </p>

          <button
            disabled={loading}
            onClick={() => handleDownload("excel")}
            style={{ ...btnStyle, backgroundColor: "#38a169" }}
          >
            {loading ? <FaSpinner className="spinner" /> : <><FaDownload /> Verileri İndir</>}
          </button>
        </div>
      </div>

      <footer style={infoStyle}>
        <FaInfoCircle color="#3182ce" size={20} />
        <span>Raporlar seçilen tarih aralığına göre oluşturulur.</span>
      </footer>

      <style>{`
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const ReportStat = ({ title, value }) => (
  <div style={statCardStyle}>
    <span>{title}</span>
    <strong>{value}</strong>
  </div>
);

const headerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "20px",
  marginBottom: "35px",
};

const headerIconStyle = {
  fontSize: "40px",
  background: "#fff",
  padding: "15px",
  borderRadius: "15px",
  boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
};

const pageTitleStyle = {
  margin: 0,
  color: "#1a202c",
  fontSize: "28px",
  fontWeight: "800",
};

const pageSubtitleStyle = {
  margin: "5px 0 0 0",
  color: "#718096",
  fontSize: "15px",
};

const panelStyle = {
  background: "#fff",
  padding: "30px",
  borderRadius: "20px",
  boxShadow: "0 10px 25px rgba(0,0,0,0.03)",
  marginBottom: "25px",
  border: "1px solid #e2e8f0",
};

const panelTitleStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "25px",
  color: "#2d3748",
  fontWeight: "700",
};

const inputGroup = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  flex: 1,
  minWidth: "200px",
};

const labelStyle = {
  fontSize: "13px",
  color: "#4a5568",
  fontWeight: "700",
  textTransform: "uppercase",
};

const selectStyle = {
  padding: "14px",
  borderRadius: "12px",
  border: "2px solid #edf2f7",
  outline: "none",
  background: "#f8fafc",
  fontWeight: "600",
};

const inputStyle = {
  ...selectStyle,
};

const previewBtnStyle = {
  padding: "15px",
  borderRadius: "12px",
  border: "none",
  background: "#4299e1",
  color: "#fff",
  fontWeight: "800",
  cursor: "pointer",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "18px",
  marginBottom: "25px",
};

const statCardStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "18px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 8px 20px rgba(0,0,0,0.04)",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const evaluationStyle = {
  background: "#ebf8ff",
  border: "1px solid #bee3f8",
  color: "#2a4365",
  padding: "22px",
  borderRadius: "18px",
  marginBottom: "30px",
  lineHeight: "1.6",
};

const downloadGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
  gap: "30px",
};

const cardStyle = {
  background: "#fff",
  padding: "40px",
  borderRadius: "25px",
  textAlign: "center",
  border: "1px solid #edf2f7",
  boxShadow: "0 15px 35px rgba(0,0,0,0.05)",
};

const cardTitle = {
  fontSize: "20px",
  color: "#2d3748",
  fontWeight: "800",
  marginBottom: "12px",
};

const cardText = {
  fontSize: "14px",
  color: "#718096",
  lineHeight: "1.6",
  marginBottom: "25px",
};

const btnStyle = {
  width: "100%",
  padding: "16px",
  color: "#fff",
  border: "none",
  borderRadius: "15px",
  fontWeight: "800",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
};

const infoStyle = {
  marginTop: "40px",
  padding: "20px",
  backgroundColor: "#ebf8ff",
  borderRadius: "15px",
  display: "flex",
  alignItems: "center",
  gap: "15px",
  border: "1px solid #bee3f8",
  color: "#2a4365",
  fontWeight: "600",
};

export default Raporlamapage;