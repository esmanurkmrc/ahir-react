import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  AlertTriangle, Thermometer, Wind, Activity, 
  Bell, CheckCircle, ArrowRight, Filter, Clock 
} from "lucide-react";

const AnomaliAnalizpage = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLogs, setActionLogs] = useState([]); // Müdahale geçmişi simülasyonu
  const [stats, setStats] = useState({ kritik: 0, cozulur: 12, saglik: 94 });

  useEffect(() => {
    detectAnomalies();
  }, []);

  const detectAnomalies = async () => {
    try {
      const [prodRes, envRes] = await Promise.all([
        axios.get("http://localhost:8080/api/productivity"),
        axios.get("http://localhost:8080/api/environment")
      ]);

      const foundAnomalies = [];
      let kritikCount = 0;

      envRes.data.forEach(env => {
        const prod = prodRes.data.find(p => p.tarih === env.tarih);

        // 1. Kural: Verim Düşüşü Tahmini
        if (prod && prod.sutVerimi < 15) {
          kritikCount++;
          foundAnomalies.push({
            id: `verim-${prod.id}`,
            level: "KRİTİK",
            title: "Ani Verim Düşüşü",
            desc: `Süt verimi ${prod.sutVerimi}L'ye düştü. Mevcut trend devam ederse önümüzdeki 24 saatte %4 ek kayıp bekleniyor.`,
            icon: <Activity color="#b91c1c" size={20} />,
            date: env.tarih,
            bg: "#fef2f2",
            link: "/dashboard/sut"
          });
        }

        // 2. Kural: Isı Stresi ve Öneri
        if (env.sicaklik > 22) {
          foundAnomalies.push({
            id: `isi-${env.id}`,
            level: "UYARI",
            title: "Isı Stresi Riski",
            desc: `Sıcaklık ${env.sicaklik}°C. Hayvanların su tüketimini artırması ve rasyonun gözden geçirilmesi önerilir.`,
            icon: <Thermometer color="#ea580c" size={20} />,
            date: env.tarih,
            bg: "#fff7ed",
            link: "/dashboard/analiz"
          });
        }

        // 3. Kural: Amonyak ve Sağlık Riski
        if (env.amonyak > 20) {
          kritikCount++;
          foundAnomalies.push({
            id: `nh3-${env.id}`,
            level: "KRİTİK",
            title: "Hava Kalitesi Sınır Değerde",
            desc: `Amonyak: ${env.amonyak} ppm. Yüksek amonyak solunum yolu hastalıkları riskini %15 artırır. Havalandırmayı açın.`,
            icon: <Wind color="#7e22ce" size={20} />,
            date: env.tarih,
            bg: "#faf5ff",
            link: "/dashboard/analiz"
          });
        }
      });

      setAlerts(foundAnomalies.reverse().slice(0, 8));
      setStats(prev => ({ ...prev, kritik: kritikCount }));
      setLoading(false);
    } catch (err) {
      console.error("Analiz hatası:", err);
      setLoading(false);
    }
  };

  // Aksiyon Log Simülasyonu Fonksiyonu
  const handleAction = (alertTitle) => {
    const newLog = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      action: `${alertTitle} uyarısı için sisteme manuel müdahale edildi ve havalandırma protokolü başlatıldı.`,
      status: "Başarılı"
    };
    setActionLogs([newLog, ...actionLogs]);
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>🧠 Analiz Motoru Çalışıyor...</div>;

  return (
    <div style={{ padding: '30px', backgroundColor: '#fcfcfc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* 1. ÜST PANEL: DİNAMİK İSTATİSTİKLER */}
      <div style={statsGrid}>
        <div style={statCard}>
          <span style={statLabel}>Aktif Kritik Uyarı</span>
          <div style={{ ...statValue, color: '#ef4444' }}>{stats.kritik}</div>
        </div>
        <div style={statCard}>
          <span style={statLabel}>Çözülen Sorunlar</span>
          <div style={{ ...statValue, color: '#22c55e' }}>{stats.cozulur}</div>
        </div>
        <div style={statCard}>
          <span style={statLabel}>Sistem Sağlık Skoru</span>
          <div style={{ ...statValue, color: '#3b82f6' }}>%{stats.saglik}</div>
        </div>
      </div>

      {/* 3. ZAMAN ÇİZGELESİ FİLTRELEME */}
      <header style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell color="#8b5cf6" /> Sistem Zekası Raporu
          </h2>
        </div>
        <div style={filterBox}>
          <Filter size={16} />
          <select style={selectStyle}>
            <option>Bugün (2026-03-30)</option>
            <option>Dün</option>
            <option>Son 7 Gün</option>
          </select>
        </div>
      </header>

      {/* UYARI LİSTESİ */}
      <div style={{ display: 'grid', gap: '15px' }}>
        {alerts.map((alert) => (
          <div key={alert.id} style={{ ...cardStyle, backgroundColor: alert.bg }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
              <div style={iconBox}>{alert.icon}</div>
              <div style={{ flex: 1 }}>
                <span style={levelLabel}>{alert.level} • {alert.date}</span>
                <h3 style={cardTitle}>{alert.title}</h3>
                <p style={cardDesc}>{alert.desc}</p>
                
                {/* 2. GRAFİK YÖNLENDİRME & AKSİYON BUTONLARI */}
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                  <button onClick={() => navigate(alert.link)} style={secondaryBtn}>
                    Grafiği İncele <ArrowRight size={14} />
                  </button>
                  <button onClick={() => handleAction(alert.title)} style={primaryBtn}>
                    Aksiyon Al
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 4. MÜDAHALE GEÇMİŞİ (LOGS) */}
      <div style={{ marginTop: '50px' }}>
        <h3 style={{ color: '#1e293b', fontSize: '18px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock size={20} color="#64748b" /> Müdahale Geçmişi
        </h3>
        <div style={logContainer}>
          {actionLogs.length > 0 ? (
            actionLogs.map(log => (
              <div key={log.id} style={logItem}>
                <span style={logTime}>{log.time}</span>
                <p style={logText}>{log.action}</p>
                <span style={logStatus}>{log.status}</span>
              </div>
            ))
          ) : (
            <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
              Henüz kaydedilmiş bir müdahale bulunmuyor.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// --- MODERN STİLLER ---
const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' };
const statCard = { background: '#fff', padding: '20px', borderRadius: '15px', border: '1px solid #f1f5f9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' };
const statLabel = { fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' };
const statValue = { fontSize: '28px', fontWeight: '800', marginTop: '5px' };

const filterBox = { display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px', background: '#fff', padding: '8px 15px', borderRadius: '10px', border: '1px solid #e2e8f0' };
const selectStyle = { border: 'none', outline: 'none', color: '#1e293b', fontWeight: '600', cursor: 'pointer', background: 'transparent' };

const cardStyle = { padding: '20px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.04)' };
const iconBox = { background: '#fff', padding: '10px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const levelLabel = { fontSize: '11px', fontWeight: '800', color: '#64748b' };
const cardTitle = { margin: '5px 0', fontSize: '17px', color: '#0f172a', fontWeight: '700' };
const cardDesc = { margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.5' };

const primaryBtn = { background: '#1e293b', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' };
const secondaryBtn = { background: 'transparent', color: '#475569', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' };

const logContainer = { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '5px' };
const logItem = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', borderBottom: '1px solid #f1f5f9' };
const logTime = { fontSize: '12px', fontWeight: 'bold', color: '#64748b', width: '100px' };
const logText = { flex: 1, margin: '0 15px', fontSize: '13px', color: '#1e293b' };
const logStatus = { fontSize: '11px', fontWeight: '800', color: '#16a34a', backgroundColor: '#f0fdf4', padding: '4px 8px', borderRadius: '6px' };

export default AnomaliAnalizpage;