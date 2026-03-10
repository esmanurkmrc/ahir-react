import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../CSS/dashboard.css";

function Dashboardpage() {
  const navigate = useNavigate();
  
  // 1. Kullanıcı ismini localStorage'dan alıyoruz, yoksa "Admin" yazıyoruz
  const [kullaniciIsmi, setKullaniciIsmi] = useState("");
  const [activeTab, setActiveTab] = useState("genel");

  useEffect(() => {
    const isim = localStorage.getItem("kullaniciAdi");
    if (isim) {
      setKullaniciIsmi(isim);
    } else {
      setKullaniciIsmi("Admin"); // Eğer isim bulunamazsa varsayılan
    }
  }, []);

  // Çıkış Yapma Fonksiyonu
  const handleLogout = () => {
    localStorage.removeItem("kullaniciAdi"); // Çıkış yapınca ismi temizle
    navigate("/login");
  };

  // Menü Değiştirme Fonksiyonu
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    // İleride diğer sayfalar hazır olduğunda buralara navigate("/sayfa-yolu") eklenebilir
  };

  return (
    <div className="dashboard-wrapper">
      {/* --- SOL MENÜ (SIDEBAR) --- */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>AKILLI AHIR</h2>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li className={activeTab === "genel" ? "active" : ""}>
              <button onClick={() => handleTabChange("genel")}>
                <span>📊</span> Genel Bakış
              </button>
            </li>
            <li className={activeTab === "hayvan" ? "active" : ""}>
              <button onClick={() => handleTabChange("hayvan")}>
                <span>🐄</span> Hayvan Bilgileri
              </button>
            </li>
            <li className={activeTab === "saglik" ? "active" : ""}>
              <button onClick={() => handleTabChange("saglik")}>
                <span>🏥</span> Sağlık Geçmişi
              </button>
            </li>
            <li className={activeTab === "rapor" ? "active" : ""}>
              <button onClick={() => handleTabChange("rapor")}>
                <span>📋</span> Raporlama
              </button>
            </li>
            <li className={activeTab === "sensor" ? "active" : ""}>
              <button onClick={() => handleTabChange("sensor")}>
                <span>🌡️</span> Sensör Verileri
              </button>
            </li>
          </ul>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            🚪 Çıkış Yap
          </button>
        </div>
      </aside>

      {/* --- SAĞ İÇERİK ALANI --- */}
      <main className="main-content">
        <header className="content-header">
          <h1>{activeTab === "genel" ? "Sistem Özeti" : activeTab.toUpperCase()}</h1>
          <div className="user-info">Hoş geldin, {kullaniciIsmi} 👋</div>
        </header>

        {activeTab === "genel" ? (
          <>
            {/* İstatistik Kartları */}
            <section className="stats-container">
              <div className="stat-card">
                <div className="stat-icon">🌡️</div>
                <h3>Ortalama Sıcaklık</h3>
                <p className="stat-value">22°C</p>
                <span className="stat-label">İdeal Durum</span>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💧</div>
                <h3>Nem Oranı</h3>
                <p className="stat-value">%65</p>
                <span className="stat-label">Normal</span>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🐄</div>
                <h3>Toplam Hayvan</h3>
                <p className="stat-value">48</p>
                <span className="stat-label">Aktif Kayıt</span>
              </div>
            </section>

            {/* Grafik/Analiz Alanı */}
            <div className="placeholder-section">
              <div className="chart-placeholder">
                <h2>Sensör Analiz Grafikleri</h2>
                <p>Gerçek zamanlı sensör verileri ve geçmiş analizleri burada yer alacak.</p>
                <div className="pulse-animation"></div>
              </div>
            </div>
          </>
        ) : (
          /* Diğer Sekmeler İçin Boş İçerik */
          <div className="placeholder-section">
            <h2>{activeTab} Bölümü Çok Yakında</h2>
            <p>Bu ekranın geliştirme çalışmaları devam ediyor.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboardpage;