import React, { useState, useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import "../CSS/dashboard.css";

function Dashboardpage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [kullaniciIsmi, setKullaniciIsmi] = useState("");
  
  const [stats, setStats] = useState({
    amonyak: 0,
    sicaklik: 0,
    nem: 0,
    riskSkoru: 0,
    gunlukSutVerimi: 0,
    durumMesaji: "Sistem Aktif"
  });

  const fetchStats = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/environment/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Veri senkronizasyon hatası:", error);
    }
  };

  useEffect(() => {
    const isim = localStorage.getItem("kullaniciAdi");
    setKullaniciIsmi(isim || "Mühendis");
    
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const currentPath = location.pathname.split("/").pop();

  const getAmonyakColor = (val) => val > 25 ? "#ff4757" : "#2ed573";
  const getRiskColor = (val) => val > 60 ? "#ffa502" : "#54a0ff";

  const handleLogout = () => {
    localStorage.removeItem("kullaniciAdi");
    navigate("/login");
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', height: '100vh', backgroundColor: '#f1f2f6' }}>
      
      {/* --- SIDEBAR (SOL PANEL) --- */}
      <aside style={{ width: '280px', backgroundColor: '#2f3542', color: '#ffffff', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 10px rgba(0,0,0,0.2)' }}>
        
        <div style={{ padding: '40px 20px', textAlign: 'center', background: '#222f3e' }}>
          <h1 style={{ fontSize: '18px', margin: 0, fontWeight: '700', letterSpacing: '1px', lineHeight: '1.4' }}>
            AKILLI AHIR <br/> 
            <span style={{ fontSize: '11px', color: '#54a0ff', fontWeight: '400' }}>MİKROKLİMA İZLEME VE ANALİZ SİSTEMİ</span>
          </h1>
        </div>

        {/* ANLIK ANALİZ VE DURUM KARTLARI */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div style={statusCardStyle}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={cardLabelStyle}>AMONYAK ($NH_3$)</span>
                <div style={{ ...dotStyle, backgroundColor: getAmonyakColor(stats.amonyak) }}></div>
             </div>
             <div style={{ fontSize: '24px', fontWeight: 'bold', color: getAmonyakColor(stats.amonyak) }}>
                {stats.amonyak.toFixed(1)} <small style={{ fontSize: '12px', color: '#ced4da' }}>ppm</small>
             </div>
          </div>

          <div style={{ ...statusCardStyle, borderLeft: '4px solid #2ecc71' }}>
             <span style={cardLabelStyle}>GÜNLÜK SÜT ÜRETİMİ</span>
             <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
                {stats.gunlukSutVerimi} <small style={{ fontSize: '12px', color: '#ced4da' }}>Litre</small>
             </div>
          </div>

          <div style={statusCardStyle}>
             <span style={cardLabelStyle}>SİSTEM RİSKİ</span>
             <div style={{ fontSize: '24px', fontWeight: 'bold', color: getRiskColor(stats.riskSkoru) }}>
                %{stats.riskSkoru}
             </div>
             <div style={{ height: '4px', width: '100%', backgroundColor: '#57606f', marginTop: '10px', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${stats.riskSkoru}%`, backgroundColor: getRiskColor(stats.riskSkoru), transition: '0.5s ease' }}></div>
             </div>
          </div>
        </div>

        {/* NAVİGASYON MENÜSÜ */}
        <nav style={{ flexGrow: 1, marginTop: '10px', overflowY: 'auto' }}>
          <button onClick={() => navigate("/dashboard/genel")} style={navLinkStyle(currentPath === "genel")}>📊 Genel Analiz</button>
          
          {/* SİSTEM ZEKASI - YENİ EKLENDİ */}
          <button 
            onClick={() => navigate("/dashboard/anomali")} 
            style={navLinkStyle(currentPath === "anomali")}
          >
            🧠 Sistem Zekası
          </button>

          <button onClick={() => navigate("/dashboard/hayvanlar")} style={navLinkStyle(currentPath === "hayvanlar")}>🐄 Sürü Yönetimi</button>
          <button onClick={() => navigate("/dashboard/sut")} style={navLinkStyle(currentPath === "sut")}>🥛 Süt Verileri</button>
          
          <button 
            onClick={() => navigate("/dashboard/analiz")} 
            style={navLinkStyle(currentPath === "analiz")}
          >
            🔬 Korelasyon Analizi
          </button>
          
          <button onClick={() => navigate("/dashboard/sensor")} style={navLinkStyle(currentPath === "sensor")}>🌡️ Sensör Ağı</button>
          <button onClick={() => navigate("/dashboard/rapor")} style={navLinkStyle(currentPath === "rapor")}>📋 Rapor Çıktısı</button>
        </nav>

        <div style={{ padding: '20px' }}>
          <button onClick={handleLogout} style={logoutButtonStyle}>OTURUMU KAPAT</button>
        </div>
      </aside>

      {/* --- ANA İÇERİK ALANI --- */}
      <main style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '20px 40px', backgroundColor: '#fff', borderBottom: '1px solid #dcdde1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: '#2f3542', fontWeight: '600' }}>
             <span style={{ color: '#747d8c' }}>Sistem Durumu:</span> <span style={{ color: '#2ed573' }}>● Çevrimiçi</span>
          </div>
          <div style={{ color: '#2f3542', fontWeight: '500' }}>
             Operatör: <strong style={{ color: '#54a0ff' }}>{kullaniciIsmi}</strong> 👋
          </div>
        </header>

        <div style={{ padding: '40px', flexGrow: 1 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

// STİLLER
const statusCardStyle = {
  backgroundColor: '#3d4451',
  padding: '15px',
  borderRadius: '12px',
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid rgba(255,255,255,0.05)'
};

const cardLabelStyle = { fontSize: '11px', color: '#a4b0be', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' };
const dotStyle = { width: '10px', height: '10px', borderRadius: '50%', boxShadow: '0 0 5px rgba(0,0,0,0.3)' };

const navLinkStyle = (isActive) => ({
  width: '100%',
  padding: '15px 25px',
  backgroundColor: isActive ? '#54a0ff' : 'transparent',
  color: isActive ? '#fff' : '#a4b0be',
  border: 'none',
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: isActive ? 'bold' : '500',
  transition: 'all 0.3s ease'
});

const logoutButtonStyle = {
  width: '100%',
  padding: '12px',
  backgroundColor: 'transparent',
  color: '#ff4757',
  border: '1px solid #ff4757',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
  letterSpacing: '1px'
};

export default Dashboardpage;