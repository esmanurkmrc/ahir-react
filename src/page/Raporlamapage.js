import React, { useState } from "react";
import { 
  FaFilePdf, FaFileExcel, FaFilter, FaCalendarAlt, FaDownload 
} from 'react-icons/fa';

const Raporlamapage = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("environment"); // 'environment' veya 'animal'

  // GERÇEK BACKEND İNDİRME FONKSİYONU
  const handleDownload = (format) => {
    if (!startDate || !endDate) {
      alert("Lütfen önce bir başlangıç ve bitiş tarihi seçin!");
      return;
    }

    // Backend URL ve Parametre Yapılandırması
    const baseUrl = "http://localhost:8080/api/reports/download";
    const params = new URLSearchParams({
      start: startDate,
      end: endDate,
      format: format,
      category: category
    });

    const downloadUrl = `${baseUrl}?${params.toString()}`;

    // DOĞRUDAN İNDİRME TETİKLEYİCİSİ (Görünmez Link Yöntemi)
    // Bu yöntem tarayıcının dosyayı sekmede açmasını engeller, doğrudan indirir.
    const link = document.createElement('a');
    link.href = downloadUrl;
    
    // Dosya uzantısını belirleyelim
    const extension = format === 'pdf' ? 'pdf' : 'xlsx';
    link.setAttribute('download', `Ahir_Raporu_${startDate}.${extension}`);
    
    document.body.appendChild(link);
    link.click(); // Sahte tıklama ile indirmeyi başlat
    document.body.removeChild(link); // Temizlik
  };

  return (
    <div style={{ padding: '25px', backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
      
      {/* ÜST BAŞLIK */}
      <header style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <div style={{ fontSize: '32px' }}>📊</div>
        <div>
          <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '24px', fontWeight: '700' }}>
            Raporlama ve Veri Arşivi
          </h2>
          <p style={{ margin: '3px 0 0 0', color: '#7f8c8d', fontSize: '14px' }}>
            Akıllı Ahır sistemindeki geçmiş verileri analiz edin ve dışa aktarın.
          </p>
        </div>
      </header>

      {/* FİLTRELEME PANELİ */}
      <section style={{ 
        background: '#fff', padding: '25px', borderRadius: '15px', 
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px', border: '1px solid #e2e8f0' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#4a5568' }}>
          <FaFilter size={16} /> 
          <span style={{ fontWeight: '600', fontSize: '15px' }}>Rapor Parametreleri</span>
        </div>
        
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {/* Kategori Seçimi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: '#718096', fontWeight: '500' }}>Veri Kategorisi</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e0', outline: 'none', minWidth: '220px', cursor: 'pointer' }}
            >
              <option value="environment">🌡️ Ahır Ortam Analizi</option>
              <option value="animal">🐄 Hayvan Verimlilik (Süt/Yem)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: '#718096', fontWeight: '500' }}>Başlangıç</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e0', outline: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: '#718096', fontWeight: '500' }}>Bitiş</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e0', outline: 'none' }}
            />
          </div>
        </div>
      </section>

      {/* RAPOR KARTLARI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px' }}>
        
        {/* PDF KARTI */}
        <div style={{ 
          background: '#fff', padding: '30px', borderRadius: '20px', textAlign: 'center', 
          border: '1px solid #edf2f7', transition: 'transform 0.2s', boxShadow: '0 5px 10px rgba(0,0,0,0.02)'
        }}>
          <div style={{ color: '#e53e3e', fontSize: '50px', marginBottom: '15px' }}><FaFilePdf /></div>
          <h3 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>Yönetici Özeti (PDF)</h3>
          <p style={{ fontSize: '13px', color: '#a0aec0', marginBottom: '20px' }}>
            Resmi sunumlar ve çıktı almak için optimize edilmiş görsel rapor.
          </p>
          <button 
            onClick={() => handleDownload("pdf")}
            style={{ 
              width: '100%', padding: '14px', backgroundColor: '#e53e3e', color: '#fff',
              border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
            }}
          >
            <FaDownload /> PDF Raporu Oluştur
          </button>
        </div>

        {/* EXCEL KARTI */}
        <div style={{ 
          background: '#fff', padding: '30px', borderRadius: '20px', textAlign: 'center', 
          border: '1px solid #edf2f7', transition: 'transform 0.2s', boxShadow: '0 5px 10px rgba(0,0,0,0.02)'
        }}>
          <div style={{ color: '#38a169', fontSize: '50px', marginBottom: '15px' }}><FaFileExcel /></div>
          <h3 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>Veri Analizi (Excel)</h3>
          <p style={{ fontSize: '13px', color: '#a0aec0', marginBottom: '20px' }}>
            İstatistiksel hesaplamalar ve ham veri incelemesi için tam liste.
          </p>
          <button 
            onClick={() => handleDownload("excel")}
            style={{ 
              width: '100%', padding: '14px', backgroundColor: '#38a169', color: '#fff',
              border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
            }}
          >
            <FaDownload /> Excel Verisi İndir
          </button>
        </div>

      </div>

      {/* FOOTER NOTU */}
      <footer style={{ marginTop: '40px', padding: '15px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <FaCalendarAlt style={{ color: '#4299e1' }} />
        <span style={{ fontSize: '13px', color: '#4a5568' }}>
          <strong>Bilgi:</strong> İndirilen raporlar seçilen tarih aralığındaki tüm kayıtları (sıcaklık, nem, gaz oranları veya hayvan verimi) otomatik olarak içerir.
        </span>
      </footer>
    </div>
  );
};

export default Raporlamapage;