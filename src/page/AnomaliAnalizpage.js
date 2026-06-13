import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Thermometer,
  Wind,
  Activity,
  Bell,
  ArrowRight,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Siren,
  RefreshCcw,
  Droplets,
  History,
  Radio,
  Filter,
} from "lucide-react";
import "../CSS/anomaliAnaliz.css";

const AnomaliAnalizpage = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState("live");
  const [alerts, setAlerts] = useState([]);
  const [allHistoryAlerts, setAllHistoryAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLogs, setActionLogs] = useState([]);
  const [resolvedIds, setResolvedIds] = useState(new Set());
  const [lastScanTime, setLastScanTime] = useState(null);
  const [engineStatus, setEngineStatus] = useState("Hazırlanıyor");
  const [selectedDate, setSelectedDate] = useState("");

  const [sensorData, setSensorData] = useState({
    sicaklik: 0,
    nem: 0,
    amonyak: 0,
    zaman: null,
  });

  const [stats, setStats] = useState({
    kritik: 0,
    uyari: 0,
    saglik: 100,
  });

  const API_BASE = "http://localhost:8080/api";

  useEffect(() => {
    if (mode === "live") {
      fetchLiveAlerts();
      const interval = setInterval(fetchLiveAlerts, 5000);
      return () => clearInterval(interval);
    } else {
      fetchHistoryAlerts();
    }
  }, [mode]);

  useEffect(() => {
    if (mode === "history" && selectedDate) {
      const filtered = allHistoryAlerts.filter((a) => a.date === selectedDate);
      updateAlertsAndStats(filtered);
    }
  }, [selectedDate, allHistoryAlerts]);

  const updateAlertsAndStats = (alertList) => {
    const kritikCount = alertList.filter((a) => a.level === "KRİTİK").length;
    const uyariCount = alertList.filter((a) => a.level === "UYARI").length;

    setAlerts(alertList);
    setStats({
      kritik: kritikCount,
      uyari: uyariCount,
      saglik: Math.max(100 - kritikCount * 25 - uyariCount * 10, 35),
    });
  };

  const fetchLiveAlerts = async () => {
    try {
      setEngineStatus("Taranıyor");

      const response = await axios.get(`${API_BASE}/sensor-data/son`);
      const data = response.data;

      const sicaklik = Number(data.sicaklik || 0);
      const nem = Number(data.nem || 0);
      const amonyak = Number(data.amonyak || 0);

      setSensorData({
        sicaklik,
        nem,
        amonyak,
        zaman: data.zaman || null,
      });

      const liveAlerts = [];

      if (amonyak > 25) {
        liveAlerts.push({
          id: "live-nh3-critical",
          level: "KRİTİK",
          type: "AMONYAK",
          title: "Amonyak Seviyesi Kritik",
          desc: `Anlık amonyak değeri ${amonyak} ppm. Havalandırma sistemi acilen kontrol edilmeli.`,
          iconType: "wind",
          bgClass: "purple-bg",
          link: "/dashboard/analiz",
        });
      } else if (amonyak > 20) {
        liveAlerts.push({
          id: "live-nh3-warning",
          level: "UYARI",
          type: "AMONYAK",
          title: "Amonyak Seviyesi Yükseliyor",
          desc: `Anlık amonyak değeri ${amonyak} ppm. Ortam havalandırması takip edilmeli.`,
          iconType: "wind",
          bgClass: "warning-bg",
          link: "/dashboard/analiz",
        });
      }

      if (sicaklik > 28) {
        liveAlerts.push({
          id: "live-temp-critical",
          level: "KRİTİK",
          type: "SICAKLIK",
          title: "Yüksek Isı Stresi Riski",
          desc: `Anlık sıcaklık ${sicaklik}°C. Hayvanlarda ısı stresi riski kritik seviyede olabilir.`,
          iconType: "temp",
          bgClass: "critical-bg",
          link: "/dashboard/analiz",
        });
      } else if (sicaklik > 25) {
        liveAlerts.push({
          id: "live-temp-warning",
          level: "UYARI",
          type: "SICAKLIK",
          title: "Isı Stresi Riski",
          desc: `Anlık sıcaklık ${sicaklik}°C. Soğutma ve havalandırma kontrol edilmeli.`,
          iconType: "temp",
          bgClass: "warning-bg",
          link: "/dashboard/analiz",
        });
      }

      if (nem > 80) {
        liveAlerts.push({
          id: "live-humidity-warning",
          level: "UYARI",
          type: "NEM",
          title: "Nem Seviyesi Yüksek",
          desc: `Anlık nem oranı %${nem}. Yüksek nem, sıcaklık etkisini artırabilir.`,
          iconType: "humidity",
          bgClass: "warning-bg",
          link: "/dashboard/analiz",
        });
      }

      updateAlertsAndStats(liveAlerts);
      setLastScanTime(new Date());
      setEngineStatus("Aktif");
    } catch (err) {
      console.error("Anlık sensör verisi alınamadı:", err);
      setEngineStatus("Hata");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryAlerts = async () => {
    try {
      setLoading(true);
      setEngineStatus("Taranıyor");

      const [prodRes, envRes] = await Promise.all([
  axios.get(`${API_BASE}/analysis-productivity`),
  axios.get(`${API_BASE}/analysis-environment`),
]);

      const foundAnomalies = [];

      envRes.data.forEach((env) => {
        const prod = prodRes.data.find((p) => p.tarih === env.tarih);

        if (prod && prod.sutVerimi < 15) {
          foundAnomalies.push({
            id: `verim-${env.id}`,
            level: "KRİTİK",
            type: "VERİM",
            title: "Ani Verim Düşüşü",
            desc: `Süt verimi ${prod.sutVerimi}L seviyesine düştü. Verim kaybı riski yüksek.`,
            iconType: "activity",
            date: env.tarih,
            bgClass: "critical-bg",
            link: "/dashboard/sut",
          });
        }

        if (env.sicaklik > 25) {
          foundAnomalies.push({
            id: `isi-${env.id}`,
            level: "UYARI",
            type: "SICAKLIK",
            title: "Isı Stresi Riski",
            desc: `Sıcaklık ${env.sicaklik}°C. Soğutma ve havalandırma kontrol edilmeli.`,
            iconType: "temp",
            date: env.tarih,
            bgClass: "warning-bg",
            link: "/dashboard/analiz",
          });
        }

        if (env.amonyak > 22) {
          foundAnomalies.push({
            id: `nh3-${env.id}`,
            level: "KRİTİK",
            type: "AMONYAK",
            title: "Hava Kalitesi Kritik",
            desc: `Amonyak ${env.amonyak} ppm. Havalandırma protokolü gerekli.`,
            iconType: "wind",
            date: env.tarih,
            bgClass: "purple-bg",
            link: "/dashboard/analiz",
          });
        }
      });

      const reversed = foundAnomalies.reverse();
      setAllHistoryAlerts(reversed);

      const dates = [...new Set(reversed.map((a) => a.date))];
      const firstDate = dates[0] || "";
      setSelectedDate(firstDate);

      updateAlertsAndStats(firstDate ? reversed.filter((a) => a.date === firstDate) : reversed);

      setLastScanTime(new Date());
      setEngineStatus("Aktif");
    } catch (err) {
      console.error("Geçmiş analiz hatası:", err);
      setEngineStatus("Hata");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (alert) => {
    setResolvedIds((prev) => {
      const updated = new Set(prev);
      updated.add(alert.id);
      return updated;
    });

    const newLog = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      action: `${alert.title} uyarısına müdahale edildi.`,
      status: "Tamamlandı",
    };

    setActionLogs((prev) => [newLog, ...prev]);
  };

  const getAlertIcon = (iconType, resolved = false) => {
    if (resolved) return <CheckCircle2 size={20} color="#16a34a" />;

    switch (iconType) {
      case "temp":
        return <Thermometer size={20} color="#ea580c" />;
      case "wind":
        return <Wind size={20} color="#7e22ce" />;
      case "humidity":
        return <Droplets size={20} color="#0284c7" />;
      case "activity":
        return <Activity size={20} color="#b91c1c" />;
      default:
        return <Bell size={20} color="#475569" />;
    }
  };

  if (loading) {
    return (
      <div className="anomali-loading-page">
        <div className="anomali-loading-box">
          <Sparkles size={22} />
          <span>Analiz motoru çalışıyor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="anomali-page">
      <div className="anomali-hero">
        <div className="anomali-hero-left">
          <div className="hero-badge">
            {mode === "live" ? <Radio size={16} /> : <History size={16} />}
            <span>{mode === "live" ? "Anlık Uyarı Merkezi" : "Geçmiş Anomali Analizi"}</span>
          </div>

          <h1>Anomali Analiz Merkezi</h1>
          <p>
            Sistem; anlık sensör verileri ve geçmiş çevresel kayıtlar üzerinden
            riskli durumları tespit ederek müdahale sürecini takip eder.
          </p>
        </div>

        <div className="anomali-hero-right">
          <div className="hero-status-card">
            <span className="hero-status-label">Motor Durumu</span>
            <strong
              className={`engine-status ${
                engineStatus === "Aktif"
                  ? "engine-ok"
                  : engineStatus === "Taranıyor"
                  ? "engine-warn"
                  : "engine-error"
              }`}
            >
              {engineStatus}
            </strong>
          </div>

          <div className="hero-status-card">
            <span className="hero-status-label">Son Tarama</span>
            <strong>{lastScanTime ? lastScanTime.toLocaleTimeString() : "--"}</strong>
          </div>

          <button
            className="refresh-btn"
            onClick={mode === "live" ? fetchLiveAlerts : fetchHistoryAlerts}
          >
            <RefreshCcw size={16} />
            Yenile
          </button>
        </div>
      </div>

      <div className="mode-switch">
        <button
          className={`mode-btn ${mode === "live" ? "mode-active" : ""}`}
          onClick={() => {
            setMode("live");
            setResolvedIds(new Set());
          }}
        >
          <Radio size={18} />
          Anlık Veriler
        </button>

        <button
          className={`mode-btn ${mode === "history" ? "mode-active" : ""}`}
          onClick={() => {
            setMode("history");
            setResolvedIds(new Set());
          }}
        >
          <History size={18} />
          Geçmiş Veriler
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-critical">
          <div className="stat-icon-wrap">
            <ShieldAlert size={22} />
          </div>
          <div>
            <span className="stat-label">Kritik Uyarı</span>
            <div className="stat-value">{stats.kritik}</div>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon-wrap">
            <Bell size={22} />
          </div>
          <div>
            <span className="stat-label">Uyarı</span>
            <div className="stat-value">{stats.uyari}</div>
          </div>
        </div>

        <div className="stat-card stat-health">
          <div className="stat-icon-wrap">
            <Siren size={22} />
          </div>
          <div>
            <span className="stat-label">Sistem Sağlık Skoru</span>
            <div className="stat-value">%{stats.saglik}</div>
          </div>
        </div>
      </div>

      {mode === "live" && (
        <div className="live-sensor-grid">
          <div className="live-sensor-card">
            <Thermometer size={20} />
            <span>Sıcaklık</span>
            <strong>{sensorData.sicaklik}°C</strong>
          </div>

          <div className="live-sensor-card">
            <Droplets size={20} />
            <span>Nem</span>
            <strong>%{sensorData.nem}</strong>
          </div>

          <div className="live-sensor-card">
            <Wind size={20} />
            <span>Amonyak</span>
            <strong>{sensorData.amonyak} ppm</strong>
          </div>
        </div>
      )}

      <div className="anomali-toolbar">
        <div className="toolbar-title">
          <h2>{mode === "live" ? "Canlı Uyarı Akışı" : "Geçmiş Uyarı Akışı"}</h2>
          <span>
            {mode === "live"
              ? "Son sensör verisine göre oluşturulan anlık uyarılar"
              : "Productivity ve environment kayıtlarına göre bulunan anomaliler"}
          </span>
        </div>

        {mode === "history" && (
          <div className="filter-box">
            <Filter size={16} />
            <select
              className="filter-select"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            >
              {[...new Set(allHistoryAlerts.map((a) => a.date))].map((date) => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="alerts-list">
        {alerts.length > 0 ? (
          alerts.map((alert) => {
            const resolved = resolvedIds.has(alert.id);

            return (
              <div
                key={alert.id}
                className={`alert-card ${alert.bgClass} ${
                  resolved ? "resolved-card" : ""
                }`}
              >
                <div className="alert-left-bar"></div>

                <div className="alert-main">
                  <div className="alert-icon-box">
                    {getAlertIcon(alert.iconType, resolved)}
                  </div>

                  <div className="alert-content">
                    <div className="alert-top-row">
                      <div className="alert-meta">
                        <span
                          className={`alert-level ${
                            alert.level === "KRİTİK"
                              ? "level-critical"
                              : "level-warning"
                          }`}
                        >
                          {alert.level}
                        </span>
                        <span className="alert-type">{alert.type}</span>
                        <span className="alert-date">
                          {mode === "live"
                            ? lastScanTime?.toLocaleTimeString() || "--"
                            : alert.date}
                        </span>
                      </div>

                      {resolved && (
                        <span className="resolved-badge">✅ MÜDAHALE EDİLDİ</span>
                      )}
                    </div>

                    <h3 className="alert-title">{alert.title}</h3>
                    <p className="alert-desc">{alert.desc}</p>

                    {!resolved && (
                      <div className="alert-actions">
                        <button
                          onClick={() => navigate(alert.link)}
                          className="btn-secondary"
                        >
                          Grafiği İncele <ArrowRight size={14} />
                        </button>
                        <button
                          onClick={() => handleAction(alert)}
                          className="btn-primary"
                        >
                          Aksiyon Al
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state-card">
            <CheckCircle2 size={28} />
            <h3>{mode === "live" ? "Anlık Anomali Yok" : "Geçmiş Kayıt Bulunamadı"}</h3>
            <p>
              {mode === "live"
                ? "Son sensör verilerine göre kritik veya riskli durum tespit edilmedi."
                : "Seçilen tarihte herhangi bir kritik durum tespit edilmedi."}
            </p>
          </div>
        )}
      </div>

      <div className="log-section">
        <h3 className="log-title">
          <Clock size={20} color="#64748b" />
          Müdahale Geçmişi
        </h3>

        <div className="log-container">
          {actionLogs.length > 0 ? (
            actionLogs.map((log) => (
              <div key={log.id} className="log-item">
                <span className="log-time">{log.time}</span>
                <p className="log-text">{log.action}</p>
                <span className="log-status">{log.status}</span>
              </div>
            ))
          ) : (
            <div className="empty-log">
              Henüz herhangi bir müdahale kaydı oluşmadı.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnomaliAnalizpage;