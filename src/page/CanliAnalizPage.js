import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Thermometer,
  Droplets,
  Wind,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldCheck,
  Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
} from "recharts";

function CanliAnalizPage() {
  const [veriler, setVeriler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sonGuncelleme, setSonGuncelleme] = useState(null);

  const API_URL = "http://localhost:8080/api/sensor-data";

  const verileriGetir = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      if (Array.isArray(data)) {
        setVeriler(data);
        setSonGuncelleme(new Date());
      }
    } catch (error) {
      console.error("Canlı analiz verisi alınamadı:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verileriGetir();
    const interval = setInterval(verileriGetir, 5000);
    return () => clearInterval(interval);
  }, []);

  const thiHesapla = (sicaklik, nem) => {
    return (
      1.8 * sicaklik +
      32 -
      (0.55 - 0.0055 * nem) * (1.8 * sicaklik - 26)
    );
  };

  const analiz = useMemo(() => {
    const son20 = veriler.slice(-20);

    if (son20.length === 0) return null;

    const ortalama = (key) =>
      son20.reduce((toplam, item) => toplam + Number(item[key] || 0), 0) /
      son20.length;

    const sonVeri = son20[son20.length - 1];
    const oncekiVeri = son20.length > 1 ? son20[son20.length - 2] : sonVeri;

    const ortSicaklik = ortalama("sicaklik");
    const ortNem = ortalama("nem");
    const ortAmonyak = ortalama("amonyak");

    const tumThiVerileri = son20.map((v) => {
      const thi = thiHesapla(Number(v.sicaklik || 0), Number(v.nem || 0));
      return Number(thi.toFixed(1));
    });

    const saatlikGruplar = {};

    son20.forEach((v) => {
      if (!v.zaman) return;

      const tarih = new Date(v.zaman);

      const saatLabel = tarih.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const thi = thiHesapla(Number(v.sicaklik || 0), Number(v.nem || 0));

      if (!saatlikGruplar[saatLabel]) {
        saatlikGruplar[saatLabel] = {
          toplamTHI: 0,
          toplamSicaklik: 0,
          toplamNem: 0,
          sayi: 0,
        };
      }

      saatlikGruplar[saatLabel].toplamTHI += thi;
      saatlikGruplar[saatLabel].toplamSicaklik += Number(v.sicaklik || 0);
      saatlikGruplar[saatLabel].toplamNem += Number(v.nem || 0);
      saatlikGruplar[saatLabel].sayi += 1;
    });

    const thiChartData = Object.entries(saatlikGruplar).map(([saat, veri]) => ({
      saat,
      thi: Number((veri.toplamTHI / veri.sayi).toFixed(1)),
      sicaklik: Number((veri.toplamSicaklik / veri.sayi).toFixed(1)),
      nem: Number((veri.toplamNem / veri.sayi).toFixed(1)),
    }));

    const ortThi =
      tumThiVerileri.reduce((toplam, item) => toplam + item, 0) /
      tumThiVerileri.length;

    const thiRiskliSayisi = tumThiVerileri.filter((v) => v >= 72).length;

    const amonyakAsimSayisi = son20.filter(
      (v) => Number(v.amonyak || 0) > 25
    ).length;

    const sicaklikAsimSayisi = son20.filter(
      (v) => Number(v.sicaklik || 0) > 26
    ).length;

    const trendBul = (key) => {
      const fark = Number(sonVeri[key] || 0) - Number(oncekiVeri[key] || 0);

      if (fark > 0.3) return "Artıyor";
      if (fark < -0.3) return "Azalıyor";
      return "Stabil";
    };

    const sonThi = tumThiVerileri[tumThiVerileri.length - 1] || 0;
    const oncekiThi =
      tumThiVerileri.length > 1
        ? tumThiVerileri[tumThiVerileri.length - 2]
        : sonThi;

    let thiTrend = "Stabil";
    if (sonThi - oncekiThi > 0.3) thiTrend = "Artıyor";
    if (sonThi - oncekiThi < -0.3) thiTrend = "Azalıyor";

    let riskSkoru =
      thiRiskliSayisi * 8 + amonyakAsimSayisi * 10 + sicaklikAsimSayisi * 6;

    riskSkoru = Math.min(100, riskSkoru);

    let genelDurum = "Normal";
    let durumRenk = "#22c55e";

    if (riskSkoru >= 60) {
      genelDurum = "Kritik";
      durumRenk = "#ef4444";
    } else if (riskSkoru >= 30) {
      genelDurum = "Dikkat";
      durumRenk = "#f59e0b";
    }

    const sistemYorumu = [];

    if (ortThi >= 72) {
      sistemYorumu.push("THI değeri risk sınırına yaklaşmış veya aşılmıştır.");
    } else {
      sistemYorumu.push("THI değeri normal seviyededir.");
    }

    if (ortAmonyak > 25) {
      sistemYorumu.push("Amonyak seviyesi kritik sınırın üzerindedir.");
    } else {
      sistemYorumu.push("Amonyak kritik sınırın altındadır.");
    }

    if (trendBul("sicaklik") === "Artıyor") {
      sistemYorumu.push("Sıcaklık son kayıtlarda artış eğilimindedir.");
    } else if (trendBul("sicaklik") === "Azalıyor") {
      sistemYorumu.push("Sıcaklık son kayıtlarda düşüş eğilimindedir.");
    } else {
      sistemYorumu.push("Sıcaklık son kayıtlarda stabil seyretmektedir.");
    }

    return {
      son20,
      thiChartData,
      sonVeri,
      ortSicaklik,
      ortNem,
      ortAmonyak,
      ortThi,
      sonThi,
      thiRiskliSayisi,
      amonyakAsimSayisi,
      sicaklikAsimSayisi,
      sicaklikTrend: trendBul("sicaklik"),
      nemTrend: trendBul("nem"),
      amonyakTrend: trendBul("amonyak"),
      thiTrend,
      riskSkoru,
      genelDurum,
      durumRenk,
      sistemYorumu,
    };
  }, [veriler]);

  const TrendIcon = ({ durum }) => {
    if (durum === "Artıyor") return <TrendingUp size={22} color="#ef4444" />;
    if (durum === "Azalıyor") return <TrendingDown size={22} color="#2563eb" />;
    return <Minus size={22} color="#64748b" />;
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={loadingStyle}>Canlı analiz yükleniyor...</div>
      </div>
    );
  }

  if (!analiz) {
    return (
      <div style={pageStyle}>
        <div style={emptyStyle}>Henüz analiz yapılacak sensör verisi yok.</div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={badgeStyle}>📡 Gerçek Zamanlı Sensör Analizi</div>
          <h1 style={titleStyle}>Canlı Analiz Merkezi</h1>
          <p style={subtitleStyle}>
            Son 20 gerçek sensör kaydı üzerinden saatlik THI, mikroklima riski,
            eşik aşımı ve trend analizi.
          </p>
        </div>

        <div style={timeCardStyle}>
          <Clock size={20} />
          <span>
            Son Güncelleme:{" "}
            <strong>
              {sonGuncelleme ? sonGuncelleme.toLocaleTimeString("tr-TR") : "--"}
            </strong>
          </span>
        </div>
      </div>

      <div style={summaryGridStyle}>
        <InfoCard
          title="Ortalama Sıcaklık"
          value={`${analiz.ortSicaklik.toFixed(1)} °C`}
          icon={<Thermometer size={26} />}
          color="#ef4444"
        />

        <InfoCard
          title="Ortalama Nem"
          value={`%${analiz.ortNem.toFixed(1)}`}
          icon={<Droplets size={26} />}
          color="#2563eb"
        />

        <InfoCard
          title="Ortalama Amonyak"
          value={`${analiz.ortAmonyak.toFixed(1)} ppm`}
          icon={<Wind size={26} />}
          color="#f97316"
        />

        <InfoCard
          title="Canlı THI"
          value={analiz.sonThi.toFixed(1)}
          icon={<Activity size={26} />}
          color={analiz.sonThi >= 72 ? "#ef4444" : "#8b5cf6"}
        />
      </div>

      <div style={thiChartCardStyle}>
        <div style={cardHeaderStyle}>
          <div>
            <h2 style={cardTitleStyle}>Saatlik THI Isı Stresi Grafiği</h2>
            <p style={chartDescStyle}>
              Sensörlerden gelen sıcaklık ve nem verileri saatlik ortalamaya
              dönüştürülerek THI değeri hesaplanmıştır. Kritik eşik: 72.
            </p>
          </div>

          <span
            style={{
              ...statusPillStyle,
              backgroundColor: analiz.sonThi >= 72 ? "#ef4444" : "#22c55e",
            }}
          >
            {analiz.sonThi >= 72 ? "Isı Stresi Riski" : "Normal Konfor"}
          </span>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <AreaChart
            data={analiz.thiChartData}
            margin={{ top: 15, right: 25, bottom: 10, left: 0 }}
          >
            <defs>
              <linearGradient id="thiLiveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="saat" tick={{ fontSize: 11, fill: "#64748b" }} />
            <YAxis domain={[60, 85]} tick={{ fontSize: 11, fill: "#64748b" }} />

            <Tooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                boxShadow: "0 10px 25px rgba(15,23,42,0.12)",
              }}
              formatter={(value) => [Number(value).toFixed(1), "Saatlik THI"]}
              labelFormatter={(label) => `Saat: ${label}`}
            />

            <ReferenceArea y1={60} y2={72} fill="#dcfce7" fillOpacity={0.35} />
            <ReferenceArea y1={72} y2={85} fill="#fee2e2" fillOpacity={0.45} />

            <ReferenceLine
              y={72}
              stroke="#ef4444"
              strokeDasharray="6 6"
              label={{
                value: "THI 72 Kritik Eşik",
                position: "insideTopRight",
                fill: "#ef4444",
                fontSize: 12,
              }}
            />

            <Area
              type="monotone"
              dataKey="thi"
              name="Saatlik THI"
              stroke="#ef4444"
              strokeWidth={3}
              fill="url(#thiLiveGradient)"
              dot={{ r: 4, fill: "#ef4444" }}
              activeDot={{ r: 7 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={mainGridStyle}>
        <div style={largeCardStyle}>
          <div style={cardHeaderStyle}>
            <h2 style={cardTitleStyle}>Canlı Sistem Yorumu</h2>
            <span
              style={{
                ...statusPillStyle,
                backgroundColor: analiz.durumRenk,
              }}
            >
              {analiz.genelDurum}
            </span>
          </div>

          <div style={commentBoxStyle}>
            {analiz.sistemYorumu.map((yorum, index) => (
              <div key={index} style={commentLineStyle}>
                {yorum.includes("normal") || yorum.includes("altındadır") ? (
                  <CheckCircle size={20} color="#22c55e" />
                ) : (
                  <AlertTriangle size={20} color="#f59e0b" />
                )}
                <span>{yorum}</span>
              </div>
            ))}
          </div>

          <div style={riskAreaStyle}>
            <div style={riskTopStyle}>
              <span>Genel Risk Skoru</span>
              <strong style={{ color: analiz.durumRenk }}>
                %{analiz.riskSkoru}
              </strong>
            </div>

            <div style={riskBarBgStyle}>
              <div
                style={{
                  ...riskBarStyle,
                  width: `${analiz.riskSkoru}%`,
                  backgroundColor: analiz.durumRenk,
                }}
              ></div>
            </div>
          </div>
        </div>

        <div style={largeCardStyle}>
          <h2 style={cardTitleStyle}>Son 20 Kayıt Eşik Analizi</h2>

          <div style={thresholdListStyle}>
            <ThresholdRow
              label="THI ≥ 72"
              value={`${analiz.thiRiskliSayisi} kez`}
              danger={analiz.thiRiskliSayisi > 0}
            />

            <ThresholdRow
              label="Amonyak > 25 ppm"
              value={`${analiz.amonyakAsimSayisi} kez`}
              danger={analiz.amonyakAsimSayisi > 0}
            />

            <ThresholdRow
              label="Sıcaklık > 26°C"
              value={`${analiz.sicaklikAsimSayisi} kez`}
              danger={analiz.sicaklikAsimSayisi > 0}
            />
          </div>

          <div style={noteStyle}>
            <ShieldCheck size={20} />
            <span>
              Son 20 kayıt değerlendirilerek anlık ortam riski hesaplanmıştır.
            </span>
          </div>
        </div>
      </div>

      <div style={trendGridStyle}>
        <TrendCard
          title="Sıcaklık Trendi"
          value={analiz.sicaklikTrend}
          icon={<TrendIcon durum={analiz.sicaklikTrend} />}
        />

        <TrendCard
          title="Nem Trendi"
          value={analiz.nemTrend}
          icon={<TrendIcon durum={analiz.nemTrend} />}
        />

        <TrendCard
          title="Amonyak Trendi"
          value={analiz.amonyakTrend}
          icon={<TrendIcon durum={analiz.amonyakTrend} />}
        />

        <TrendCard
          title="THI Trendi"
          value={analiz.thiTrend}
          icon={<TrendIcon durum={analiz.thiTrend} />}
        />
      </div>
    </div>
  );
}

const InfoCard = ({ title, value, icon, color }) => (
  <div style={infoCardStyle}>
    <div style={{ ...iconBoxStyle, color, backgroundColor: `${color}18` }}>
      {icon}
    </div>
    <span style={infoTitleStyle}>{title}</span>
    <strong style={{ ...infoValueStyle, color }}>{value}</strong>
  </div>
);

const ThresholdRow = ({ label, value, danger }) => (
  <div style={thresholdRowStyle}>
    <span>{label}</span>
    <strong style={{ color: danger ? "#ef4444" : "#22c55e" }}>{value}</strong>
  </div>
);

const TrendCard = ({ title, value, icon }) => (
  <div style={trendCardStyle}>
    <div>{icon}</div>
    <span>{title}</span>
    <strong>{value}</strong>
  </div>
);

const pageStyle = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "30px",
  fontFamily: "'Segoe UI', Roboto, Arial, sans-serif",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  marginBottom: "24px",
};

const badgeStyle = {
  display: "inline-block",
  padding: "8px 14px",
  borderRadius: "999px",
  background: "#e0f2fe",
  color: "#0369a1",
  fontWeight: "700",
  fontSize: "13px",
  marginBottom: "12px",
};

const titleStyle = {
  margin: 0,
  fontSize: "34px",
  color: "#0f172a",
  fontWeight: "800",
};

const subtitleStyle = {
  margin: "8px 0 0",
  color: "#64748b",
  fontSize: "15px",
  maxWidth: "760px",
  lineHeight: "1.6",
};

const timeCardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "14px 18px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  color: "#334155",
  boxShadow: "0 10px 25px rgba(15,23,42,0.05)",
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "18px",
  marginBottom: "22px",
};

const infoCardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "22px",
  padding: "22px",
  boxShadow: "0 12px 28px rgba(15,23,42,0.06)",
};

const iconBoxStyle = {
  width: "54px",
  height: "54px",
  borderRadius: "18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "16px",
};

const infoTitleStyle = {
  display: "block",
  color: "#64748b",
  fontSize: "13px",
  fontWeight: "700",
  marginBottom: "8px",
};

const infoValueStyle = {
  fontSize: "30px",
  fontWeight: "800",
};

const thiChartCardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "24px",
  padding: "26px",
  boxShadow: "0 12px 28px rgba(15,23,42,0.06)",
  marginBottom: "22px",
};

const chartDescStyle = {
  margin: "6px 0 0",
  color: "#64748b",
  fontSize: "14px",
};

const mainGridStyle = {
  display: "grid",
  gridTemplateColumns: "1.2fr 0.8fr",
  gap: "22px",
  marginBottom: "22px",
};

const largeCardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "24px",
  padding: "26px",
  boxShadow: "0 12px 28px rgba(15,23,42,0.06)",
};

const cardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "18px",
  gap: "16px",
};

const cardTitleStyle = {
  margin: 0,
  color: "#0f172a",
  fontSize: "21px",
  fontWeight: "800",
};

const statusPillStyle = {
  color: "#ffffff",
  padding: "8px 16px",
  borderRadius: "999px",
  fontWeight: "800",
  fontSize: "13px",
  whiteSpace: "nowrap",
};

const commentBoxStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
  marginBottom: "24px",
};

const commentLineStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  padding: "14px",
  borderRadius: "16px",
  color: "#334155",
  fontWeight: "600",
};

const riskAreaStyle = {
  marginTop: "20px",
};

const riskTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "10px",
  color: "#334155",
  fontWeight: "700",
};

const riskBarBgStyle = {
  height: "12px",
  background: "#e2e8f0",
  borderRadius: "999px",
  overflow: "hidden",
};

const riskBarStyle = {
  height: "100%",
  borderRadius: "999px",
  transition: "0.4s ease",
};

const thresholdListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
  marginTop: "18px",
};

const thresholdRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "16px",
  color: "#334155",
  fontWeight: "700",
};

const noteStyle = {
  marginTop: "22px",
  background: "#ecfdf5",
  color: "#047857",
  border: "1px solid #bbf7d0",
  borderRadius: "16px",
  padding: "14px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  fontWeight: "700",
};

const trendGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "18px",
};

const trendCardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "20px",
  padding: "22px",
  display: "flex",
  alignItems: "center",
  gap: "14px",
  boxShadow: "0 10px 25px rgba(15,23,42,0.05)",
  color: "#334155",
  fontWeight: "700",
};

const loadingStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "20px",
  padding: "30px",
  color: "#334155",
  fontWeight: "800",
};

const emptyStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "20px",
  padding: "30px",
  color: "#334155",
  fontWeight: "800",
};

export default CanliAnalizPage;