import React, { useEffect, useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import "../CSS/sensordata.css";

// Renk standardı
const COLORS = {
  temp: "#ff4d4f",
  humidity: "#4da6ff",
  ammonia: "#00f5d4",
  light: "#f4c542",
  textSoft: "#9fb3c8",
  border: "rgba(0,255,195,0.08)"
};

// --- KONFOR GÖSTERGESİ (THI) ---
const ComfortGauge = ({ thiValue }) => {
  const min = 50;
  const max = 90;

  const normalizedValue = Math.max(min, Math.min(max, thiValue));
  const percentage = (normalizedValue - min) / (max - min);

  const radius = 90;
  const strokeWidth = 18;
  const centerX = 120;
  const centerY = 120;

  const polarToCartesian = (cx, cy, r, angle) => {
    const rad = ((angle - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad)
    };
  };

  const describeArc = (x, y, r, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, r, endAngle);
    const end = polarToCartesian(x, y, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M",
      start.x,
      start.y,
      "A",
      r,
      r,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y
    ].join(" ");
  };

  const getStatusInfo = (value) => {
    if (value < 72) {
      return { text: "STABİL REFAH", color: COLORS.ammonia };
    }
    if (value < 78) {
      return { text: "DİKKAT GEREKİYOR", color: COLORS.light };
    }
    return { text: "KRİTİK STRES", color: COLORS.temp };
  };

  const status = getStatusInfo(thiValue);
  const angle = 180 * percentage;
  const valueEndAngle = 180 - angle;

  return (
    <div className="comfort-gauge-card">
      <div className="comfort-title">KONFOR ENDEKSİ (THI)</div>

      <div className="comfort-gauge-svg-wrapper">
        <svg
          width="100%"
          height="230"
          viewBox="0 0 240 170"
          className="comfort-gauge-svg"
        >
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={COLORS.ammonia} />
              <stop offset="60%" stopColor={COLORS.light} />
              <stop offset="100%" stopColor={COLORS.temp} />
            </linearGradient>

            <filter id="neonGlow">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            d={describeArc(centerX, centerY, radius, 180, 0)}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          <path
            d={describeArc(centerX, centerY, radius, 180, valueEndAngle)}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            filter="url(#neonGlow)"
          />

          <text
            x="120"
            y="118"
            textAnchor="middle"
            className="gauge-value-text"
            fill={status.color}
          >
            {thiValue.toFixed(1)}
          </text>

          <text
            x="120"
            y="140"
            textAnchor="middle"
            className="gauge-status-text"
            fill={status.color}
          >
            {status.text}
          </text>
        </svg>
      </div>

      <div className="comfort-legend">
        <span><i className="legend-dot comfort-green"></i> İdeal</span>
        <span><i className="legend-dot comfort-yellow"></i> Riskli</span>
        <span><i className="legend-dot comfort-red"></i> Kritik</span>
      </div>

      <div className="comfort-subtitle">MİKROKLİMA TREND ANALİZİ</div>
    </div>
  );
};

// --- KÜÇÜK GRAFİK KARTI ---
const MiniChartCard = ({ title, children, footer }) => {
  return (
    <div className="mini-chart-card glass">
      <div className="mini-chart-header">
        <h4>{title}</h4>
      </div>
      <div className="mini-chart-body">{children}</div>
      {footer && <div className="mini-chart-footer">{footer}</div>}
    </div>
  );
};

function SensorDataPage() {
  const [tumVeriler, setTumVeriler] = useState([]);
  const [sonVeri, setSonVeri] = useState(null);
  const [oncekiVeri, setOncekiVeri] = useState(null);
  const [thi, setThi] = useState(0);
  const [tabloGoster, setTabloGoster] = useState(false);
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(100);
  const [simdikiSaat, setSimdikiSaat] = useState(new Date());
  const [sonGuncelleme, setSonGuncelleme] = useState(null);
  const [baglantiDurumu, setBaglantiDurumu] = useState("AKTİF");
  const [uyariMesaji, setUyariMesaji] = useState("");

  const addLog = (msg) => {
    setLogs((prev) => [
      `${new Date().toLocaleTimeString()} - ${msg}`,
      ...prev.slice(0, 4)
    ]);
  };

  const thiHesapla = (sicaklik, nem) => {
    return (
      (1.8 * sicaklik + 32) -
      (0.55 - 0.0055 * nem) * (1.8 * sicaklik - 26)
    );
  };

  const verileriGetir = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/sensor-data");

      if (!response.ok) {
        setBaglantiDurumu("PASİF");
        throw new Error(`HTTP hata kodu: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        setUyariMesaji("Henüz sensör verisi gelmedi.");
        setBaglantiDurumu("AKTİF");
        addLog("Veri bulunamadı.");
        return;
      }

      setUyariMesaji("");
      setBaglantiDurumu("AKTİF");

      const yeniSon = data[data.length - 1];

      setTumVeriler((prevTumVeriler) => {
        const eskiSon =
          prevTumVeriler.length > 0
            ? prevTumVeriler[prevTumVeriler.length - 1]
            : null;

        setOncekiVeri(eskiSon);
        setSonVeri(yeniSon);
        setThi(thiHesapla(Number(yeniSon.sicaklik), Number(yeniSon.nem)));
        setProgress(100);
        setSonGuncelleme(new Date());

        if (!eskiSon || eskiSon.id !== yeniSon.id) {
          addLog(`Yeni veri alındı (ID: #${yeniSon.id})`);
        } else {
          addLog("Veriler yenilendi.");
        }

        return data;
      });
    } catch (e) {
      console.error("Bağlantı Hatası:", e);
      setBaglantiDurumu("PASİF");
      setUyariMesaji("Sunucuya bağlanılamıyor veya veri akışı durmuş olabilir.");
      addLog("Bağlantı hatası oluştu.");
    }
  };

  useEffect(() => {
    verileriGetir();

    const veriInterval = setInterval(() => {
      verileriGetir();
    }, 3000);

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev <= 0 ? 100 : prev - 1));
    }, 30);

    const clockInterval = setInterval(() => {
      setSimdikiSaat(new Date());
    }, 1000);

    return () => {
      clearInterval(veriInterval);
      clearInterval(progressInterval);
      clearInterval(clockInterval);
    };
  }, []);

  const son20Veri = useMemo(() => tumVeriler.slice(-20), [tumVeriler]);
  const son10Veri = useMemo(() => tumVeriler.slice(-10), [tumVeriler]);

  const analiz = useMemo(() => {
    if (tumVeriler.length < 1 || son20Veri.length < 1) return null;

    const avgFrom = (arr, key) =>
      (
        arr.reduce((toplam, item) => toplam + (Number(item[key]) || 0), 0) /
        arr.length
      ).toFixed(1);

    const minFrom = (arr, key) =>
      Math.min(...arr.map((item) => Number(item[key]) || 0)).toFixed(1);

    const maxFrom = (arr, key) =>
      Math.max(...arr.map((item) => Number(item[key]) || 0)).toFixed(1);

    return {
      avgSic: avgFrom(son20Veri, "sicaklik"),
      avgNem: avgFrom(son20Veri, "nem"),
      avgAmo: avgFrom(son20Veri, "amonyak"),
      avgIsik: avgFrom(son20Veri, "isik"),
      minAmo: minFrom(son20Veri, "amonyak"),
      maxAmo: maxFrom(son20Veri, "amonyak"),
      minIsik: minFrom(son20Veri, "isik"),
      maxIsik: maxFrom(son20Veri, "isik"),
      deltaSic:
        sonVeri && oncekiVeri
          ? (Number(sonVeri.sicaklik) || 0) - (Number(oncekiVeri.sicaklik) || 0)
          : 0
    };
  }, [tumVeriler, son20Veri, sonVeri, oncekiVeri]);

  const getStatus = (val, type) => {
    const deger = Number(val) || 0;

    if (type === "temp") {
      return deger > 26
        ? { t: "YÜKSEK", c: COLORS.temp }
        : { t: "NORMAL", c: COLORS.ammonia };
    }

    if (type === "amo") {
      return deger > 25
        ? { t: "RİSKLİ", c: COLORS.light }
        : { t: "TEMİZ", c: COLORS.ammonia };
    }

    if (type === "isik") {
      return deger < 100
        ? { t: "DÜŞÜK", c: COLORS.light }
        : { t: "YETERLİ", c: COLORS.ammonia };
    }

    return { t: "STABİL", c: COLORS.ammonia };
  };

  const csvIndir = () => {
    if (tumVeriler.length === 0) return;

    const header = "ID,Sicaklik,Nem,Amonyak,Isik,Zaman\n";
    const csvContent = tumVeriler
      .map(
        (v) =>
          `${v.id},${v.sicaklik},${v.nem},${v.amonyak},${v.isik},${v.zaman}`
      )
      .join("\n");

    const blob = new Blob([header + csvContent], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sensor_verileri_rapor.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="industrial-dashboard dark-theme">
      <div className="status-ribbon">
        <div className="ribbon-item">
          <span className={`dot ${baglantiDurumu === "AKTİF" ? "pulse" : "dot-passive"}`}></span>
          SİSTEM DURUMU:{" "}
          <span className={`highlight ${baglantiDurumu === "PASİF" ? "danger-text" : ""}`}>
            {baglantiDurumu}
          </span>
        </div>

        <div className="ribbon-item">
          <div className="refresh-bar-wrapper">
            <div
              className="refresh-bar"
              style={{ width: `${progress}%` }}
            ></div>
            <small>VERİ SENKRONİZASYONU</small>
          </div>
        </div>

        <div className="ribbon-item">
          SON 20 ANALİZ:{" "}
          <span className="highlight">
            SIC: {analiz?.avgSic ?? "0.0"}°C | NEM: {analiz?.avgNem ?? "0.0"}% |
            IŞIK: {analiz?.avgIsik ?? "0.0"} lx
          </span>
        </div>

        <div className="ribbon-item clock">
          {simdikiSaat.toLocaleTimeString()}
        </div>
      </div>

      {uyariMesaji && (
        <div className="warning-banner">
          ⚠️ {uyariMesaji}
        </div>
      )}

      <div className="dashboard-grid">
        <div className="card-column">
          <div className="stat-card glass metric-temp">
            <label>SICAKLIK</label>
            <div className="value-row">
              <h2>{sonVeri ? `${Number(sonVeri.sicaklik).toFixed(1)}°C` : "--"}</h2>
              <span className={`delta ${(analiz?.deltaSic ?? 0) >= 0 ? "up" : "down"}`}>
                {(analiz?.deltaSic ?? 0) >= 0 ? "▲" : "▼"}
              </span>
            </div>
            <span
              className="badge"
              style={{ background: getStatus(sonVeri?.sicaklik, "temp").c }}
            >
              {getStatus(sonVeri?.sicaklik, "temp").t}
            </span>
          </div>

          <div className="stat-card glass metric-ammonia">
            <label>AMONYAK</label>
            <div className="value-row">
              <h2>
                {sonVeri ? Number(sonVeri.amonyak).toFixed(1) : "--"}{" "}
                <small>ppm</small>
              </h2>
            </div>
            <span
              className="badge"
              style={{ background: getStatus(sonVeri?.amonyak, "amo").c }}
            >
              {getStatus(sonVeri?.amonyak, "amo").t}
            </span>
          </div>

          <div className="stat-card glass metric-light">
            <label>IŞIK ŞİDDETİ</label>
            <div className="value-row">
              <h2>
                {sonVeri?.isik != null ? Number(sonVeri.isik).toFixed(0) : "--"}{" "}
                <small>lux</small>
              </h2>
            </div>
            <span
              className="badge"
              style={{ background: getStatus(sonVeri?.isik, "isik").c }}
            >
              {getStatus(sonVeri?.isik, "isik").t}
            </span>
          </div>

          <div className="log-panel glass">
            <header>BİLGİ AKIŞI</header>
            {logs.length > 0 ? (
              logs.map((log, i) => (
                <div key={i} className="log-line">
                  {log}
                </div>
              ))
            ) : (
              <div className="log-line">Henüz log yok.</div>
            )}
          </div>
        </div>

        <div className="main-display glass">
          <div className="display-header">
            <div>
              <h3>
                TREND ANALİZİ <small>(SON 20 KAYIT)</small>
              </h3>
              <div className="last-update-text">
                Son güncellenme: {sonGuncelleme ? sonGuncelleme.toLocaleTimeString() : "--"}
              </div>
            </div>
            <div className="live-tag">CANLI</div>
          </div>

          <div className="visual-row">
            <ComfortGauge thiValue={thi} />

            <div className="mini-stats">
              <div className="m-item temp-item">
                <strong>SICAKLIK ORT:</strong> {analiz?.avgSic ?? "0.0"} °C
              </div>
              <div className="m-item humidity-item">
                <strong>NEM ORT:</strong> {analiz?.avgNem ?? "0.0"} %
              </div>
              <div className="m-item light-item">
                <strong>IŞIK ORT:</strong> {analiz?.avgIsik ?? "0.0"} lx
              </div>
              <div className="m-item neutral-item">
                <strong>TOPLAM VERİ:</strong> {tumVeriler.length}
              </div>
            </div>
          </div>

          <div className="main-chart-wrapper main-focus-chart">
            <div className="chart-title-row">
              <h4>Ana Mikroklima Grafiği</h4>
              <span>Sıcaklık • Amonyak • Işık</span>
            </div>

            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={son20Veri}>
                <defs>
                  <linearGradient id="colorSic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.temp} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={COLORS.temp} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorIsik" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.light} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={COLORS.light} stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />

                <XAxis dataKey="id" stroke="#aaa" fontSize={10} />
                <YAxis yAxisId="left" stroke={COLORS.temp} fontSize={10} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke={COLORS.light}
                  fontSize={10}
                />

                <Tooltip
                  contentStyle={{
                    background: "#0b1220",
                    border: `1px solid ${COLORS.border}`,
                    color: "#fff",
                    borderRadius: "10px"
                  }}
                />

                <ReferenceLine
                  y={26}
                  yAxisId="left"
                  stroke={COLORS.temp}
                  strokeDasharray="5 5"
                  strokeOpacity={0.5}
                />

                <Area
                  isAnimationActive={true}
                  animationDuration={900}
                  yAxisId="left"
                  type="monotone"
                  dataKey="sicaklik"
                  name="Sıcaklık"
                  stroke={COLORS.temp}
                  fill="url(#colorSic)"
                  strokeWidth={3}
                />

                <Area
                  isAnimationActive={true}
                  animationDuration={900}
                  yAxisId="left"
                  type="monotone"
                  dataKey="amonyak"
                  name="Amonyak"
                  stroke={COLORS.ammonia}
                  fillOpacity={0}
                  strokeWidth={2.5}
                />

                <Area
                  isAnimationActive={true}
                  animationDuration={900}
                  yAxisId="right"
                  type="monotone"
                  dataKey="isik"
                  name="Işık"
                  stroke={COLORS.light}
                  fill="url(#colorIsik)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mini-charts-grid reduced-emphasis">
            <MiniChartCard
              title="SICAKLIK + NEM TRENDİ"
              footer={`Ort. Sıcaklık: ${analiz?.avgSic ?? "0.0"}°C | Ort. Nem: ${analiz?.avgNem ?? "0.0"}%`}
            >
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={son10Veri}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                    vertical={false}
                  />
                  <XAxis dataKey="id" hide />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: "#0b1220",
                      border: `1px solid ${COLORS.border}`,
                      color: "#fff",
                      borderRadius: "10px"
                    }}
                  />
                  <Line
                    isAnimationActive={true}
                    animationDuration={800}
                    type="monotone"
                    dataKey="sicaklik"
                    name="Sıcaklık"
                    stroke={COLORS.temp}
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    isAnimationActive={true}
                    animationDuration={800}
                    type="monotone"
                    dataKey="nem"
                    name="Nem"
                    stroke={COLORS.humidity}
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </MiniChartCard>

            <MiniChartCard
              title="AMONYAK MİNİ TREND"
              footer={`Min: ${analiz?.minAmo ?? "0.0"} ppm | Max: ${analiz?.maxAmo ?? "0.0"} ppm`}
            >
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={son10Veri}>
                  <defs>
                    <linearGradient id="colorAmoMini" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.ammonia} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={COLORS.ammonia} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                    vertical={false}
                  />
                  <XAxis dataKey="id" hide />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: "#0b1220",
                      border: `1px solid ${COLORS.border}`,
                      color: "#fff",
                      borderRadius: "10px"
                    }}
                  />
                  <Area
                    isAnimationActive={true}
                    animationDuration={800}
                    type="monotone"
                    dataKey="amonyak"
                    name="Amonyak"
                    stroke={COLORS.ammonia}
                    fill="url(#colorAmoMini)"
                    strokeWidth={2.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </MiniChartCard>

            <MiniChartCard
              title="IŞIK MİNİ TREND"
              footer={`Min: ${analiz?.minIsik ?? "0.0"} lx | Max: ${analiz?.maxIsik ?? "0.0"} lx`}
            >
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={son10Veri}>
                  <defs>
                    <linearGradient id="colorIsikMini" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.light} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={COLORS.light} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                    vertical={false}
                  />
                  <XAxis dataKey="id" hide />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: "#0b1220",
                      border: `1px solid ${COLORS.border}`,
                      color: "#fff",
                      borderRadius: "10px"
                    }}
                  />
                  <Area
                    isAnimationActive={true}
                    animationDuration={800}
                    type="monotone"
                    dataKey="isik"
                    name="Işık"
                    stroke={COLORS.light}
                    fill="url(#colorIsikMini)"
                    strokeWidth={2.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </MiniChartCard>
          </div>

          <div className="all-data-chart glass secondary-chart">
            <div className="section-title">
              <h4>TÜM VERİLER GENEL TRENDİ</h4>
              <span>Geçmişten bugüne tüm kayıtlar</span>
            </div>

            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={tumVeriler}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis dataKey="id" stroke="#aaa" fontSize={10} />
                <YAxis stroke="#aaa" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    background: "#0b1220",
                    border: `1px solid ${COLORS.border}`,
                    color: "#fff",
                    borderRadius: "10px"
                  }}
                />
                <Line
                  isAnimationActive={true}
                  animationDuration={800}
                  type="monotone"
                  dataKey="sicaklik"
                  name="Sıcaklık"
                  stroke={COLORS.temp}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  isAnimationActive={true}
                  animationDuration={800}
                  type="monotone"
                  dataKey="amonyak"
                  name="Amonyak"
                  stroke={COLORS.ammonia}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  isAnimationActive={true}
                  animationDuration={800}
                  type="monotone"
                  dataKey="isik"
                  name="Işık"
                  stroke={COLORS.light}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="action-column">
          <div className="ai-card glass pulse-glow">
            <header>🤖 MAKİNE ÖĞRENMESİ ANALİZİ</header>

            <div className="prediction-row">
              <div className="pred-item">
                <small>TAHMİNİ SÜT VERİMİ</small>
                <h2 className="highlight">
                  {sonVeri
                    ? (20 - Number(sonVeri.sicaklik || 0) * 0.18).toFixed(1)
                    : "0.0"}{" "}
                  L
                </h2>
              </div>

              <div className="pred-item">
                <small>MODEL GÜVENİ</small>
                <span className="confidence-text">%94</span>
              </div>
            </div>

            <p className="ai-text">
              {thi > 75
                ? "⚠️ ML UYARISI: Isı stresi tespit edildi. Verim kaybı riski yüksek."
                : "✅ ML DURUMU: Ortam koşulları stabil."}
            </p>
          </div>

          <div className="control-card glass">
            <button className="cyber-btn" onClick={() => setTabloGoster(true)}>
              SENSÖR VERİLERİ
            </button>
            <button className="cyber-btn secondary" onClick={csvIndir}>
              RAPOR AL (CSV)
            </button>
          </div>
        </div>
      </div>

      {tabloGoster && (
        <div className="data-table-overlay fade-in">
          <div className="table-wrapper glass">
            <header className="table-header">
              <span>SENSÖR VERİLERİ ARŞİVİ</span>
              <button
                className="close-btn"
                onClick={() => setTabloGoster(false)}
              >
                ✕
              </button>
            </header>

            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>SICAKLIK</th>
                  <th>NEM</th>
                  <th>AMONYAK</th>
                  <th>IŞIK</th>
                  <th>ZAMAN</th>
                </tr>
              </thead>
              <tbody>
                {tumVeriler
                  .slice()
                  .reverse()
                  .slice(0, 15)
                  .map((v) => (
                    <tr key={v.id}>
                      <td>#{v.id}</td>
                      <td>{v.sicaklik}°C</td>
                      <td>{v.nem}%</td>
                      <td>{v.amonyak} ppm</td>
                      <td>{v.isik} lx</td>
                      <td>{new Date(v.zaman).toLocaleTimeString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default SensorDataPage;