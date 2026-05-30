import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Cpu,
  Database,
  Thermometer,
  Droplets,
  Wind,
  Info,
  TrendingDown,
  Target,
  CheckCircle2,
  ArrowDown,
  Presentation,
  Zap,
  BrainCircuit,
  ShieldCheck,
  AlertTriangle,
  Leaf,
} from "lucide-react";

const TahminAnalizpage = () => {
  const [prediction, setPrediction] = useState(null);
  const [sensorData, setSensorData] = useState({
    sicaklik: 0,
    nem: 0,
    amonyak: 0,
  });

  const [actualProd] = useState(3.8);

  const [simValues, setSimValues] = useState({
    sicaklik: 22,
    nem: 60,
    amonyak: 15,
  });

  const [simPrediction, setSimPrediction] = useState(null);

  const ML_MODEL_URL = "http://127.0.0.1:8000/predict";

  useEffect(() => {
    fetchLatestData();
  }, []);

  const fetchLatestData = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/sensor-data/son");

      if (res.data) {
        const liveData = {
          sicaklik: Number(res.data.sicaklik || 0),
          nem: Number(res.data.nem || 0),
          amonyak: Number(res.data.amonyak || 0),
        };

        setSensorData(liveData);
        setSimValues(liveData);
        getPrediction(liveData, false);
      }
    } catch (error) {
      console.error("Canlı sensör verisi alınamadı:", error);
    }
  };

  const getPrediction = async (currentData, isSim) => {
    try {
      const response = await axios.post(ML_MODEL_URL, {
        sicaklik: Number(currentData.sicaklik),
        nem: Number(currentData.nem),
        amonyak: Number(currentData.amonyak),
      });

      if (isSim) {
        setSimPrediction(response.data?.tahmin_edilen_sut ?? null);
      } else {
        setPrediction(response.data ?? null);
      }
    } catch (error) {
      console.error("Tahmin alınamadı:", error);
    }
  };

  const handleSimChange = (field, value) => {
    const newValues = {
      ...simValues,
      [field]: Number(value),
    };

    setSimValues(newValues);
    getPrediction(newValues, true);
  };

  const thi = useMemo(() => {
    const t = Number(sensorData.sicaklik || 0);
    const rh = Number(sensorData.nem || 0);

    const value = 0.8 * t + (rh / 100) * (t - 14.4) + 46.4;
    return Number(value.toFixed(1));
  }, [sensorData]);

  const riskLevel = useMemo(() => {
    if (sensorData.amonyak >= 25 || thi >= 72) {
      return { text: "Yüksek Risk", color: "#ef4444" };
    }

    if (sensorData.amonyak >= 20 || thi >= 68 || sensorData.sicaklik >= 30) {
      return { text: "Orta Risk", color: "#f59e0b" };
    }

    return { text: "Düşük Risk", color: "#16a34a" };
  }, [sensorData, thi]);

  const aiComment = useMemo(() => {
    if (sensorData.amonyak >= 25) {
      return "Amonyak seviyesi kritik sınıra ulaşmıştır. Havalandırmanın artırılması ve ortam gaz yoğunluğunun takip edilmesi önerilir.";
    }

    if (thi >= 72) {
      return "THI değeri riskli seviyeye yaklaşmıştır. Isı stresi oluşabileceği için ortam sıcaklığı ve nem kontrol edilmelidir.";
    }

    if (sensorData.sicaklik >= 30) {
      return "Sıcaklık değeri yüksek seviyededir. Bu durum süt veriminde düşüş riskini artırabilir.";
    }

    if (sensorData.amonyak >= 20) {
      return "Amonyak seviyesi dikkat edilmesi gereken aralıktadır. Havalandırma durumu izlenmelidir.";
    }

    return "Mikroklima koşulları genel olarak stabil görünmektedir. Mevcut ortam koşulları süt verimi açısından kabul edilebilir seviyededir.";
  }, [sensorData, thi]);

  const alerts = useMemo(() => {
    const list = [];

    if (sensorData.amonyak >= 25) {
      list.push("Kritik amonyak seviyesi tespit edildi.");
    }

    if (sensorData.sicaklik >= 30) {
      list.push("Yüksek sıcaklık riski tespit edildi.");
    }

    if (thi >= 72) {
      list.push("THI değerine göre ısı stresi riski oluştu.");
    }

    return list;
  }, [sensorData, thi]);

  const predictedMilk = useMemo(() => {
    return Number(prediction?.tahmin_edilen_sut ?? 0);
  }, [prediction]);

  const diffValue = useMemo(() => {
    if (!prediction?.tahmin_edilen_sut) return 0;
    return predictedMilk - actualProd;
  }, [predictedMilk, actualProd, prediction]);

  const simDiff = useMemo(() => {
    if (simPrediction == null) return 0;
    return Number(simPrediction) - actualProd;
  }, [simPrediction, actualProd]);

  const simComment = useMemo(() => {
    if (simPrediction == null) {
      return "Senaryo verisi bekleniyor.";
    }

    if (simValues.amonyak >= 25) {
      return "Amonyak seviyesi kritik aralığa yaklaşmıştır. Bu senaryoda tahmini süt veriminde düşüş gözlemlenebilir.";
    }

    if (simValues.sicaklik >= 30) {
      return "Yüksek sıcaklık nedeniyle ısı stresi oluşabilir. Bu durum verim kaybı riskini artırabilir.";
    }

    if (simValues.nem >= 75) {
      return "Nem seviyesi yüksek olduğu için hayvan konforu olumsuz etkilenebilir.";
    }

    if (simDiff < -0.5) {
      return "Bu senaryoda süt veriminde belirgin düşüş beklenmektedir. Ortam koşullarının iyileştirilmesi önerilir.";
    }

    if (simDiff > 0.3) {
      return "Bu ortam koşulları süt verimi açısından olumlu görünmektedir.";
    }

    return "Senaryo sonucu stabil görünmektedir. Kritik bir verim kaybı beklenmemektedir.";
  }, [simPrediction, simValues, simDiff]);

  const formatSigned = (num) => {
    if (num > 0) return `+${num.toFixed(2)}`;
    return num.toFixed(2);
  };

  return (
    <div style={pageStyle}>
      <div style={heroCard}>
        <div style={heroIconWrap}>
          <BrainCircuit size={28} color="#4f46e5" />
        </div>

        <div>
          <h1 style={heroTitle}>Yapay Zeka Analiz ve Karar Merkezi</h1>
          <p style={heroSubtitle}>
            Tarihsel veri setiyle eğitilen model, canlı sensör verilerine göre süt verimi tahmini üretir.
          </p>
        </div>
      </div>

      <div style={infoBanner}>
        <Info size={18} color="#4f46e5" />
        <span>
          Model offline olarak tarihsel analiz veri setiyle eğitilmiştir. Bu sayfada ise
          sensörlerden gelen anlık veriler model giriş değeri olarak kullanılır.
        </span>
      </div>

      {alerts.length > 0 && (
        <div style={alertBox}>
          <AlertTriangle size={18} color="#dc2626" />
          <div>
            {alerts.map((item, index) => (
              <div key={index} style={alertText}>
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={contentWrap}>
        <StepSection number="1" color="#3b82f6">
          <div style={stepCard}>
            <div style={topRow}>
              <h3 style={stepTitle}>
                <Database size={19} color="#3b82f6" />
                ADIM 1: Canlı Sensör Verileri
              </h3>

              <div style={trendChip}>
                <TrendingDown size={14} />
                <span>
                  Canlı Yorum: <strong>Amonyak ve sıcaklık verime etki edebilir</strong>
                </span>
              </div>
            </div>

            <p style={stepDesc}>
              ESP32 üzerinden gelen son sensör verisi alınır ve eğitilmiş modele gönderilir.
            </p>

            <div style={dataRow}>
              <MiniStat icon={<Thermometer size={15} />} label="Canlı Sıcaklık" value={`${sensorData.sicaklik}°C`} />
              <MiniStat icon={<Droplets size={15} />} label="Canlı Nem" value={`%${sensorData.nem}`} />
              <MiniStat icon={<Wind size={15} />} label="Canlı Amonyak" value={`${sensorData.amonyak} ppm`} />
              <MiniStat icon={<ShieldCheck size={15} />} label="THI Konfor İndeksi" value={thi} />
            </div>
          </div>
        </StepSection>

        <ArrowDown size={28} color="#cbd5e1" style={arrowStyle} />

        <StepSection number="2" color="#8b5cf6">
          <div style={stepCard}>
            <h3 style={stepTitle}>
              <Cpu size={19} color="#8b5cf6" />
              ADIM 2: Makine Öğrenmesi Modeli
            </h3>

            <div style={infoBox}>
              <Info size={16} color="#4f46e5" />
              <span>
                Model; <strong>sıcaklık, nem ve amonyak</strong> değişkenlerini kullanarak süt verimi tahmini yapar.
              </span>
            </div>

            <div style={factorList}>
              <FactorBar label="Amonyak Etkisi" value={48} color="#8b5cf6" />
              <FactorBar label="Isı Etkisi" value={32} color="#f59e0b" />
              <FactorBar label="Nem Etkisi" value={20} color="#3b82f6" />
            </div>
          </div>
        </StepSection>

        <ArrowDown size={28} color="#cbd5e1" style={arrowStyle} />

        <StepSection number="3" color="#10b981">
          <div style={stepCard}>
            <div style={topRow}>
              <h3 style={stepTitle}>
                <Target size={19} color="#10b981" />
                ADIM 3: Canlı Tahmin Sonucu
              </h3>

              <div style={badgeRow}>
                <span style={perfBadge}>Offline Eğitim</span>
                <span style={perfBadge}>Canlı Giriş Verisi</span>
              </div>
            </div>

            <div style={resultGrid}>
              <ResultCard label="Tahmini Süt Verimi" value={prediction?.tahmin_edilen_sut ?? "--"} unit="L" color="#10b981" />

              <div style={resultCard}>
                <span style={resultLabel}>Model Durumu</span>
                <div style={{ ...resultValue("#2563eb"), marginBottom: 8 }}>Aktif</div>
                <div style={statusTag}>
                  <CheckCircle2 size={12} />
                  Çalışıyor
                </div>
              </div>

              <div style={resultCard}>
                <span style={resultLabel}>Referans Verim</span>
                <div style={resultValue("#0f172a")}>{actualProd} L</div>
              </div>

              <div style={resultCard}>
                <span style={resultLabel}>Tahmin Farkı</span>
                <div style={resultValue(diffValue < 0 ? "#ef4444" : "#16a34a")}>
                  {formatSigned(diffValue)} L
                </div>
              </div>

              <div style={resultCard}>
                <span style={resultLabel}>Risk Durumu</span>
                <div style={resultValue(riskLevel.color)}>{riskLevel.text}</div>
              </div>
            </div>

            <div style={{ ...riskBox, borderColor: riskLevel.color, background: `${riskLevel.color}15` }}>
              <strong style={{ color: riskLevel.color }}>
                Genel Risk Değerlendirmesi: {riskLevel.text}
              </strong>
            </div>
          </div>
        </StepSection>

        <ArrowDown size={28} color="#cbd5e1" style={arrowStyle} />

        <StepSection number="4" color="#f59e0b">
          <div style={stepCard}>
            <h3 style={stepTitle}>
              <Presentation size={19} color="#f59e0b" />
              ADIM 4: Senaryo Testi
            </h3>

            <div style={simCard}>
              <div style={{ flex: 1 }}>
                <p style={simLabel}>Dinamik Senaryo Testi</p>

                <div style={sliderGroup}>
                  <div style={sliderHeader}>
                    <span>Sıcaklık</span>
                    <strong>{simValues.sicaklik}°C</strong>
                  </div>
                  <input type="range" min="10" max="40" step="0.5" value={simValues.sicaklik} onChange={(e) => handleSimChange("sicaklik", e.target.value)} style={sliderStyle} />
                </div>

                <div style={sliderGroup}>
                  <div style={sliderHeader}>
                    <span>Nem</span>
                    <strong>%{simValues.nem}</strong>
                  </div>
                  <input type="range" min="30" max="90" step="1" value={simValues.nem} onChange={(e) => handleSimChange("nem", e.target.value)} style={sliderStyle} />
                </div>

                <div style={sliderGroup}>
                  <div style={sliderHeader}>
                    <span>Amonyak</span>
                    <strong>{simValues.amonyak} ppm</strong>
                  </div>
                  <input type="range" min="0" max="40" step="1" value={simValues.amonyak} onChange={(e) => handleSimChange("amonyak", e.target.value)} style={sliderStyle} />
                </div>
              </div>

              <div style={simResultCard}>
                <div style={simResultTop}>
                  <Zap size={20} color="#f59e0b" />
                  <span>Senaryo Sonucu</span>
                </div>

                <div style={simMainValue}>
                  {simPrediction != null ? Number(simPrediction).toFixed(2) : "--"} L
                </div>

                <div style={simImprove}>
                  Potansiyel değişim:{" "}
                  <strong style={{ color: simDiff >= 0 ? "#16a34a" : "#ef4444" }}>
                    {simDiff >= 0 ? "+" : ""}
                    {simDiff.toFixed(1)} L
                  </strong>
                </div>

                <div style={simCommentBox}>
                  <strong style={{ color: "#c2410c" }}>🤖 Senaryo Yorumu</strong>
                  <p style={simCommentText}>{simComment}</p>
                </div>
              </div>
            </div>

            <div style={optimumBox}>
              <div style={optimumHeader}>
                <Leaf size={18} color="#166534" />
                <strong>Önerilen Optimum Ortam</strong>
              </div>

              <div style={optimumGrid}>
                <div>🌡️ Sıcaklık: 22°C</div>
                <div>💧 Nem: %60</div>
                <div>☣️ Amonyak: 10 ppm</div>
                <div>🥛 Beklenen Verim: ~4.8 L</div>
              </div>
            </div>

            <div style={decisionBox}>
              <div style={decisionHeader}>
                <ShieldCheck size={18} color="#c2410c" />
                <strong>Karar Destek Özeti</strong>
              </div>

              <p style={decisionText}>
                Canlı tahmin sonucuna göre sıcaklık, nem ve amonyak değerleri izlenir.
                Amonyak veya sıcaklık artışı verim kaybı riski oluşturabileceği için
                havalandırma ve ortam kontrolü önerilir.
              </p>
            </div>

            <div style={aiBox}>
              <strong style={{ color: "#1d4ed8" }}>🤖 Sistem Yorumu</strong>
              <p style={aiText}>{aiComment}</p>
            </div>
          </div>
        </StepSection>
      </div>
    </div>
  );
};

const StepSection = ({ number, color, children }) => (
  <section style={stepWrap}>
    <div style={leftRail}>
      <div style={stepCircle(color)}>{number}</div>
      <div style={line}></div>
    </div>
    <div style={{ flex: 1 }}>{children}</div>
  </section>
);

const MiniStat = ({ icon, label, value }) => (
  <div style={miniStat}>
    <div style={miniIcon}>{icon}</div>
    <div>
      <div style={miniLabel}>{label}</div>
      <div style={miniValue}>{value}</div>
    </div>
  </div>
);

const FactorBar = ({ label, value, color }) => (
  <div style={factorRow}>
    <span style={factorText}>{label}</span>
    <div style={barBg}>
      <div style={{ ...barFill(color), width: `${value}%` }}></div>
    </div>
    <span style={factorVal}>%{value}</span>
  </div>
);

const ResultCard = ({ label, value, unit, color }) => (
  <div style={resultCard}>
    <span style={resultLabel}>{label}</span>
    <div style={resultValue(color)}>
      {value} {unit}
    </div>
  </div>
);

const pageStyle = {
  minHeight: "100vh",
  padding: "36px 24px 60px",
  background: "linear-gradient(180deg, #f8fbff 0%, #f1f5f9 45%, #eef2f7 100%)",
};

const contentWrap = { width: "100%", maxWidth: "1080px", margin: "0 auto" };

const heroCard = {
  maxWidth: "1080px",
  margin: "0 auto 18px",
  background: "rgba(255,255,255,0.72)",
  border: "1px solid rgba(226,232,240,0.9)",
  borderRadius: "24px",
  boxShadow: "0 18px 50px rgba(15,23,42,0.08)",
  padding: "24px 26px",
  display: "flex",
  alignItems: "center",
  gap: "18px",
};

const infoBanner = {
  maxWidth: "1080px",
  margin: "0 auto 28px",
  background: "#eef2ff",
  border: "1px solid #c7d2fe",
  color: "#3730a3",
  padding: "14px 18px",
  borderRadius: "18px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: 1.5,
};

const alertBox = {
  maxWidth: "1080px",
  margin: "0 auto 24px",
  background: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: "18px",
  padding: "16px",
  display: "flex",
  gap: "12px",
  alignItems: "flex-start",
};

const alertText = {
  color: "#dc2626",
  fontWeight: 800,
  marginBottom: "5px",
};

const heroIconWrap = {
  width: "58px",
  height: "58px",
  borderRadius: "18px",
  background: "linear-gradient(135deg, #eef2ff, #e0e7ff)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const heroTitle = { margin: 0, fontSize: "30px", fontWeight: 900, color: "#0f172a" };
const heroSubtitle = { margin: "6px 0 0 0", fontSize: "14px", color: "#64748b" };

const stepWrap = { display: "flex", gap: "18px", alignItems: "stretch" };
const leftRail = { display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 };
const line = { width: "2px", flex: 1, background: "#dbeafe", marginTop: "10px", borderRadius: "999px" };

const stepCircle = (color) => ({
  width: "44px",
  height: "44px",
  borderRadius: "50%",
  background: color,
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 900,
});

const stepCard = {
  background: "rgba(255,255,255,0.86)",
  border: "1px solid rgba(226,232,240,0.95)",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 14px 36px rgba(15,23,42,0.06)",
  marginBottom: "18px",
};

const topRow = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" };
const stepTitle = { margin: 0, fontSize: "18px", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px", color: "#0f172a" };
const stepDesc = { color: "#64748b", fontSize: "14px", marginTop: "8px", marginBottom: 0 };

const trendChip = {
  background: "#fff1f2",
  color: "#be123c",
  padding: "8px 12px",
  borderRadius: "999px",
  fontSize: "12px",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  border: "1px solid #ffe4e6",
};

const dataRow = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginTop: "18px" };
const miniStat = { background: "#f8fafc", padding: "14px", borderRadius: "16px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px" };
const miniIcon = { width: "36px", height: "36px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", color: "#334155", border: "1px solid #e2e8f0" };
const miniLabel = { fontSize: "12px", color: "#64748b", marginBottom: "4px" };
const miniValue = { fontSize: "15px", fontWeight: 800, color: "#0f172a" };

const infoBox = { marginTop: "16px", padding: "14px 16px", background: "#eef2ff", borderRadius: "14px", fontSize: "13px", color: "#4338ca", display: "flex", gap: "10px", alignItems: "center", border: "1px solid #e0e7ff" };
const factorList = { marginTop: "20px" };
const factorRow = { display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" };
const factorText = { width: "120px", fontSize: "13px", fontWeight: 700, color: "#334155" };
const barBg = { flex: 1, height: "10px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" };
const barFill = (color) => ({ height: "100%", background: color, borderRadius: "999px" });
const factorVal = { width: "38px", textAlign: "right", fontWeight: 800, color: "#64748b", fontSize: "12px" };

const badgeRow = { display: "flex", gap: "10px", flexWrap: "wrap" };
const perfBadge = { background: "#f8fafc", border: "1px solid #e2e8f0", padding: "6px 10px", borderRadius: "10px", fontSize: "12px", fontWeight: 800, color: "#475569" };

const resultGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginTop: "18px" };
const resultCard = { background: "#f8fafc", borderRadius: "18px", padding: "18px", textAlign: "center", border: "1px solid #e2e8f0" };
const resultLabel = { display: "block", fontSize: "11px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" };
const resultValue = (color) => ({ fontSize: "30px", fontWeight: 900, color, marginTop: "10px", lineHeight: 1.1 });

const riskBox = {
  marginTop: "18px",
  padding: "16px",
  borderRadius: "16px",
  border: "1px solid",
};

const statusTag = { fontSize: "11px", background: "#dcfce7", color: "#15803d", padding: "5px 9px", borderRadius: "999px", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "5px" };

const simCard = { marginTop: "18px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "18px", display: "grid", gridTemplateColumns: "1.5fr 0.9fr", gap: "18px" };
const simLabel = { margin: "0 0 14px 0", fontSize: "13px", fontWeight: 800, color: "#334155" };
const sliderGroup = { marginBottom: "16px" };
const sliderHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", fontSize: "13px", color: "#475569" };
const sliderStyle = { width: "100%", cursor: "pointer", accentColor: "#f59e0b" };

const simResultCard = { background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "18px", padding: "18px", display: "flex", flexDirection: "column", justifyContent: "center" };
const simResultTop = { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 800, color: "#92400e" };
const simMainValue = { fontSize: "34px", fontWeight: 900, color: "#d97706", marginTop: "10px", lineHeight: 1.1 };
const simImprove = { marginTop: "10px", fontSize: "13px", color: "#78350f" };

const simCommentBox = {
  marginTop: "18px",
  background: "#fff7ed",
  border: "1px solid #fed7aa",
  borderRadius: "14px",
  padding: "14px",
};

const simCommentText = {
  marginTop: "8px",
  color: "#9a3412",
  lineHeight: 1.6,
  fontSize: "13px",
};

const optimumBox = {
  marginTop: "20px",
  background: "#ecfdf5",
  border: "1px solid #bbf7d0",
  borderRadius: "18px",
  padding: "18px",
};

const optimumHeader = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "#166534",
};

const optimumGrid = {
  marginTop: "12px",
  display: "grid",
  gridTemplateColumns: "repeat(2,1fr)",
  gap: "12px",
  color: "#166534",
  fontWeight: 700,
};

const decisionBox = { marginTop: "20px", padding: "16px 18px", background: "#fff7ed", borderRadius: "18px", border: "1px solid #fed7aa" };
const decisionHeader = { display: "flex", alignItems: "center", gap: "8px", color: "#9a3412", marginBottom: "8px" };
const decisionText = { margin: 0, fontSize: "14px", color: "#9a3412", lineHeight: 1.6 };

const aiBox = {
  marginTop: "16px",
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: "16px",
  padding: "16px",
};

const aiText = {
  marginTop: "10px",
  color: "#1e3a8a",
  lineHeight: 1.6,
  fontSize: "14px",
};

const arrowStyle = { display: "block", margin: "2px auto 8px 58px" };

export default TahminAnalizpage;