import React, { useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from 'xlsx';
import { 
  FaFilePdf, FaFileExcel, FaFilter, FaCalendarAlt, FaDownload, FaSpinner, FaInfoCircle 
} from 'react-icons/fa';

const Raporlamapage = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("environment");
  const [loading, setLoading] = useState(false);

  
  const calculateSummary = (data) => {
    if (data.length === 0) return null;
    
    if (category === "environment") {
      const avgTemp = (data.reduce((s, i) => s + i.sicaklik, 0) / data.length).toFixed(1);
      const avgHum = (data.reduce((s, i) => s + i.nem, 0) / data.length).toFixed(1);
      const maxAmm = Math.max(...data.map(i => i.amonyak));
      return `Ort. Sıcaklık: ${avgTemp}°C | Ort. Nem: %${avgHum} | Maks. Amonyak: ${maxAmm} ppm`;
    } else {
      const totalMilk = data.reduce((s, i) => s + i.sutVerimi, 0).toFixed(1);
      const avgEff = (data.reduce((s, i) => s + (i.sutVerimi / i.yemTuketimi), 0) / data.length).toFixed(2);
      return `Toplam Üretim: ${totalMilk} L | Verimlilik Skoru (FCR): ${avgEff}`;
    }
  };

  const handleDownload = async (format) => {
    if (!startDate || !endDate) {
      alert("Lütfen önce bir tarih aralığı seçin!");
      return;
    }

    setLoading(true);
    try {
     
      const res = await axios.get(`http://localhost:8080/api/${category}`);
      const filteredData = res.data.filter(item => item.tarih >= startDate && item.tarih <= endDate);

      if (filteredData.length === 0) {
        alert("Seçilen tarih aralığında kayıt bulunamadı!");
        setLoading(false);
        return;
      }

      if (format === "pdf") {
       
        const doc = new jsPDF();
        const summaryText = calculateSummary(filteredData);

        doc.setFontSize(20);
        doc.setTextColor(44, 62, 80);
        doc.text("AKILLI AHIR YONETICI RAPORU", 14, 20);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Kategori: ${category === 'environment' ? 'Ortam Analizi' : 'Hayvan Verimliliği'}`, 14, 30);
        doc.text(`Tarih Aralığı: ${startDate} / ${endDate}`, 14, 35);

        
        doc.setFillColor(245, 247, 250);
        doc.rect(14, 42, 182, 12, 'F');
        doc.setTextColor(52, 152, 219);
        doc.setFont("helvetica", "bold");
        doc.text(`ÖZET: ${summaryText}`, 18, 50);

        const tableBody = filteredData.map(item => [
          item.tarih,
          category === "environment" ? `${item.sicaklik}°C` : `${item.sutVerimi} L`,
          category === "environment" ? `%${item.nem}` : `${item.yemTuketimi} kg`,
          category === "environment" ? `${item.amonyak} ppm` : (item.sutVerimi / item.yemTuketimi).toFixed(2)
        ]);

        autoTable(doc, {
          startY: 60,
          head: [['Tarih', category === "environment" ? 'Sıcaklık' : 'Süt', category === "environment" ? 'Nem' : 'Yem', category === "environment" ? 'Amonyak' : 'Verim']],
          body: tableBody,
          headStyles: { fillColor: [229, 62, 62] }
        });

        doc.save(`Rapor_${startDate}_${endDate}.pdf`);

      } else {
       
        const ws = XLSX.utils.json_to_sheet(filteredData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Veri Listesi");
        XLSX.writeFile(wb, `Veri_Analizi_${startDate}.xlsx`);
      }
    } catch (error) {
      console.error("Rapor hatası:", error);
      alert("Veri çekilirken bir hata oluştu!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '30px', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      
      
      <header style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '35px' }}>
        <div style={{ fontSize: '40px', background: '#fff', padding: '15px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>📊</div>
        <div>
          <h2 style={{ margin: 0, color: '#1a202c', fontSize: '28px', fontWeight: '800' }}>Raporlama ve Veri Arşivi</h2>
          <p style={{ margin: '5px 0 0 0', color: '#718096', fontSize: '15px' }}>Dinamik tarih filtreleme ve akıllı özet çıktıları.</p>
        </div>
      </header>

  
      <section style={panelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', color: '#2d3748' }}>
          <FaFilter color="#4299e1" /> <span style={{ fontWeight: '700' }}>Rapor Parametrelerini Belirleyin</span>
        </div>
        
        <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap' }}>
          <div style={inputGroup}>
            <label style={labelStyle}>Veri Kategorisi</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={selectStyle}>
              <option value="environment">🌡️ Ahır Ortam Analizi</option>
              <option value="productivity">🐄 Hayvan Verimlilik (Süt/Yem)</option>
            </select>
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}>Başlangıç Tarihi</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}>Bitiş Tarihi</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
          </div>
        </div>
      </section>

      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
        
        
        <div style={cardStyle}>
          <FaFilePdf size={55} color="#e53e3e" style={{ marginBottom: '20px' }} />
          <h3 style={cardTitle}>Yönetici Özeti (PDF)</h3>
          <p style={cardText}>İstatistiksel özetler ve grafik uyumlu tablolar içeren profesyonel doküman.</p>
          <button 
            disabled={loading} 
            onClick={() => handleDownload("pdf")} 
            style={{ ...btnStyle, backgroundColor: '#e53e3e' }}
          >
            {loading ? <FaSpinner className="spinner" /> : <><FaDownload /> Raporu Oluştur</>}
          </button>
        </div>

        
        <div style={cardStyle}>
          <FaFileExcel size={55} color="#38a169" style={{ marginBottom: '20px' }} />
          <h3 style={cardTitle}>Veri Analizi (Excel)</h3>
          <p style={cardText}>Ham verilerin tüm detaylarıyla incelenmesi ve harici yazılımlarda kullanım için.</p>
          <button 
            disabled={loading} 
            onClick={() => handleDownload("excel")} 
            style={{ ...btnStyle, backgroundColor: '#38a169' }}
          >
            {loading ? <FaSpinner className="spinner" /> : <><FaDownload /> Verileri İndir</>}
          </button>
        </div>

      </div>

      
      <footer style={infoStyle}>
        <FaInfoCircle color="#3182ce" size={20} />
        <span>Raporlar seçilen tarih aralığını kapsar. PDF raporu otomatik olarak <strong>Yönetici Özeti Analizi</strong> içerir.</span>
      </footer>

      
      <style>{`
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};


const panelStyle = { background: '#fff', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', marginBottom: '35px', border: '1px solid #e2e8f0' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minWidth: '200px' };
const labelStyle = { fontSize: '13px', color: '#4a5568', fontWeight: '700', textTransform: 'uppercase' };
const selectStyle = { padding: '14px', borderRadius: '12px', border: '2px solid #edf2f7', outline: 'none', background: '#f8fafc', fontWeight: '600' };
const inputStyle = { ...selectStyle };
const cardStyle = { background: '#fff', padding: '40px', borderRadius: '25px', textAlign: 'center', border: '1px solid #edf2f7', boxShadow: '0 15px 35px rgba(0,0,0,0.05)' };
const cardTitle = { fontSize: '20px', color: '#2d3748', fontWeight: '800', marginBottom: '12px' };
const cardText = { fontSize: '14px', color: '#718096', lineHeight: '1.6', marginBottom: '25px' };
const btnStyle = { width: '100%', padding: '16px', color: '#fff', border: 'none', borderRadius: '15px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', transition: '0.3s' };
const infoStyle = { marginTop: '40px', padding: '20px', backgroundColor: '#ebf8ff', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #bee3f8', color: '#2a4365', fontWeight: '600' };

export default Raporlamapage;