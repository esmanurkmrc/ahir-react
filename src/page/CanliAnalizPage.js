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
  Brain,
  Database,
  CalendarDays,
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
  const [mlTahmin, setMlTahmin] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);

  const API_URL = "http://localhost:8080/api/sensor-data";
  const SUT_API = "http://localhost:8080/api/sut-verim";
  const ML_API = "http://localhost:8000/predict";
  const MODEL_STATUS_API = "http://localhost:8000/model-status";

  const thiHesapla = (sicaklik, nem) => {
    return (
      1.8 * Number(sicaklik || 0) +
      32 -
      (0.55 - 0.0055 * Number(nem || 0)) *
        (1.8 * Number(sicaklik || 0) - 26)
    );
  };

  const sonYemTuketimiGetir = async () => {
    try {
      const response = await fetch(SUT_API);

      if (!response.ok) return 6;

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) return 6;

      const siraliKayitlar = [...data].sort(
        (a, b) => Number(b.id || 0) - Number(a.id || 0)
      );

      const sonKayit = siraliKayitlar.find(
        (item) =>
          item.yemTuketimi !== null &&
          item.yemTuketimi !== undefined &&
          Number(item.yemTuketimi) > 0
      );

      return sonKayit ? Number(sonKayit.yemTuketimi) : 6;
    } catch (error) {
      console.error("Yem tüketimi alınamadı:", error);
      return 6;
    }
  };

  const mlTahminYap = async (sonVeri) => {
    if (!sonVeri) return;

    setMlLoading(true);

    try {
      const sonYemTuketimi = await sonYemTuketimiGetir();

      const payload = {
        sicaklik: Number(sonVeri.sicaklik || 0),
        nem: Number(sonVeri.nem || 0),
        amonyak: Number(sonVeri.amonyak || 0),
        isik: Number(sonVeri.isik || 0),
        yem_tuketimi: sonYemTuketimi,
      };

      const [predictRes, statusRes] = await Promise.all([
        fetch(ML_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        fetch(MODEL_STATUS_API),
      ]);

      if (predictRes.ok) {
        const predictData = await predictRes.json();
        setMlTahmin(predictData);
      }

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setModelStatus(statusData);
      }
    } catch (error) {
      console.error("ML tahmin alınamadı:", error);
    } finally {
      setMlLoading(false);
    }
  };

  const verileriGetir = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      if (Array.isArray(data)) {
        setVeriler(data);
        setSonGuncelleme(new Date());

        const sonVeri = data[data.length - 1];
        mlTahminYap(sonVeri);
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

    const tumThiVerileri = son20.map((v) =>
      Number(thiHesapla(v.sicaklik, v.nem).toFixed(1))
    );

    const saatlikGruplar = {};

    son20.forEach((v) => {
      if (!v.zaman) return;

      const tarih = new Date(v.zaman);
      const saatLabel = tarih.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const thi = thiHesapla(v.sicaklik, v.nem);

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

    const maxThi = Math.max(...tumThiVerileri);
    const minThi = Math.min(...tumThiVerileri);

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
    let riskBaslik = "Düşük Risk";
    let riskAciklama =
      "Anlık sensör değerleri kabul edilebilir seviyededir. Sistem izleme modunda çalışmaya devam edebilir.";

    if (riskSkoru >= 60) {
      genelDurum = "Kritik";
      durumRenk = "#ef4444";
      riskBaslik = "Kritik Risk";
      riskAciklama =
        "THI, sıcaklık veya amonyak eşiklerinde belirgin risk oluşmuştur. Ortam koşullarına hızlı müdahale edilmesi önerilir.";
    } else if (riskSkoru >= 30) {
      genelDurum = "Dikkat";
      durumRenk = "#f59e0b";
      riskBaslik = "Orta Risk";
      riskAciklama =
        "Bazı çevresel değerler takip edilmesi gereken aralıktadır. Havalandırma ve hayvan konforu kontrol edilmelidir.";
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

    const mikroklimaYorumu = (() => {
      const sicaklikTrend = trendBul("sicaklik");
      const nemTrend = trendBul("nem");

      if (sicaklikTrend === "Artıyor" && nemTrend === "Artıyor") {
        return "Sıcaklık ve nem birlikte artıyor. Bu durum THI değerini yükselterek ısı stresi riskini artırabilir.";
      }

      if (sicaklikTrend === "Artıyor") {
        return "Sıcaklık artış eğilimindedir. Nem değeriyle birlikte izlenmesi THI değerlendirmesi açısından önemlidir.";
      }

      if (nemTrend === "Artıyor") {
        return "Nem artış eğilimindedir. Yüksek nem, sıcaklığın hayvan üzerindeki etkisini artırabilir.";
      }

      if (trendBul("amonyak") === "Artıyor") {
        return "Amonyak artış eğilimindedir. Havalandırma koşullarının takip edilmesi önerilir.";
      }

      return "Mikroklima değerleri son kayıtlarda genel olarak dengeli görünmektedir.";
    })();

    const onerilenAksiyonlar = [];

    if (sonThi >= 72 || ortThi >= 72) {
      onerilenAksiyonlar.push({
        baslik: "Su erişimini ve serinletmeyi kontrol et",
        aciklama:
          "THI değeri ısı stresi sınırına yaklaşmıştır. Hayvanların suya erişimi, gölgelik ve serinletme koşulları kontrol edilmelidir.",
        renk: "#ef4444",
      });
    }

    if (ortAmonyak > 25 || amonyakAsimSayisi > 0) {
      onerilenAksiyonlar.push({
        baslik: "Havalandırmayı artır",
        aciklama:
          "Amonyak seviyesi kritik sınırın üzerindedir. Havalandırma ve altlık temizliği kontrol edilmelidir.",
        renk: "#f97316",
      });
    }

    if (Number(sonVeri.sicaklik || 0) > 26 || sicaklikAsimSayisi > 0) {
      onerilenAksiyonlar.push({
        baslik: "Sıcaklık artışını takip et",
        aciklama:
          "Sıcaklık eşik değerin üzerine çıkmıştır. Ortam sıcaklığı düzenli izlenmeli ve gerekirse serinletme önlemi alınmalıdır.",
        renk: "#f59e0b",
      });
    }

    if (trendBul("amonyak") === "Artıyor") {
      onerilenAksiyonlar.push({
        baslik: "Amonyak seviyesi takip edilmeli",
        aciklama:
          "Amonyak son kayıtlarda artış eğilimindedir. Kritik seviyeye ulaşmadan havalandırma koşulları değerlendirilmelidir.",
        renk: "#f97316",
      });
    }

    if (onerilenAksiyonlar.length === 0) {
      onerilenAksiyonlar.push({
        baslik: "Koşullar normal, izleme devam etmeli",
        aciklama:
          "Anlık değerlerde kritik bir eşik aşımı görünmemektedir. Sistem düzenli izleme yapmaya devam edebilir.",
        renk: "#22c55e",
      });
    }

    const bugunLocal = new Date().toLocaleDateString("tr-TR");

    const bugunkuVeriSayisi = veriler.filter((item) => {
      const zaman = item.zaman || item.tarih || item.createdAt;

      if (!zaman) return false;

      const itemTarih = new Date(zaman).toLocaleDateString("tr-TR");

      return itemTarih === bugunLocal;
    }).length;

    return {
      son20,
      thiChartData,
      sonVeri,
      ortSicaklik,
      ortNem,
      ortAmonyak,
      ortThi,
      maxThi,
      minThi,
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
      riskBaslik,
      riskAciklama,
      sistemYorumu,
      mikroklimaYorumu,
      onerilenAksiyonlar,
      toplamVeri: veriler.length,
      bugunkuVeriSayisi,
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

  const tahminiSut =
    mlTahmin?.tahmin_edilen_sut !== undefined
      ? Number(mlTahmin.tahmin_edilen_sut).toFixed(1)
      : "--";

  const mlDurum = mlTahmin?.durum || "Veri bekleniyor";

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <div style={badgeStyle}>📡 Gerçek Zamanlı Sensör Analizi</div>
          <h1 style={titleStyle}>Canlı Analiz Merkezi</h1>
          <p style={subtitleStyle}>
            Canlı sensör verileriyle mikroklima riski, eşik aşımı, yapay zeka tahmini ve trend analizi yapılır. THI grafiği son 20 kayıt üzerinden gösterilir.
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

      <div style={dataOverviewGridStyle}>
        <InfoCard title="Toplam Veri" value={analiz.toplamVeri} icon={<Database size={26} />} color="#4f46e5" />
        <InfoCard title="Bugünkü Veri" value={analiz.bugunkuVeriSayisi} icon={<CalendarDays size={26} />} color="#0ea5e9" />
        <InfoCard title="Grafik Penceresi" value="Son 20" icon={<Activity size={26} />} color="#16a34a" />
        <InfoCard title="Model Durumu" value={modelStatus?.durum || "Hazır"} icon={<Brain size={26} />} color="#8b5cf6" />
      </div>

      <div style={summaryGridStyle}>
        <InfoCard title="Ortalama Sıcaklık" value={`${analiz.ortSicaklik.toFixed(1)} °C`} icon={<Thermometer size={26} />} color="#ef4444" />
        <InfoCard title="Ortalama Nem" value={`%${analiz.ortNem.toFixed(1)}`} icon={<Droplets size={26} />} color="#2563eb" />
        <InfoCard title="Ortalama Amonyak" value={`${analiz.ortAmonyak.toFixed(1)} ppm`} icon={<Wind size={26} />} color="#f97316" />
        <InfoCard title="Canlı THI" value={analiz.sonThi.toFixed(1)} icon={<Activity size={26} />} color={analiz.sonThi >= 72 ? "#ef4444" : "#8b5cf6"} />
      </div>

      <div style={mlMicroGridStyle}>
        <div style={mlCardStyle}>
          <div style={cardHeaderStyle}>
            <div>
              <h2 style={cardTitleStyle}>🤖 Yapay Zeka Tahmini</h2>
              <p style={chartDescStyle}>
                Son sensör verisi FastAPI makine öğrenmesi modeline gönderilerek
                anlık süt verimi tahmini oluşturulur.
              </p>
            </div>

            <span
              style={{
                ...statusPillStyle,
                backgroundColor: mlDurum.toLowerCase().includes("risk")
                  ? "#ef4444"
                  : "#22c55e",
              }}
            >
              {mlLoading ? "Analiz..." : mlDurum}
            </span>
          </div>

          <div style={mlResultGridStyle}>
            <div style={mlMiniBoxStyle}>
              <span style={boxLabelStyle}>Tahmini Süt Verimi</span>
              <strong style={boxValueStyle}>{tahminiSut} L</strong>
            </div>

            <div style={mlMiniBoxStyle}>
              <span style={boxLabelStyle}>Model R²</span>
              <strong style={boxValueStyle}>
                {modelStatus?.r2_skoru !== null &&
                modelStatus?.r2_skoru !== undefined
                  ? modelStatus.r2_skoru
                  : "--"}
              </strong>
            </div>
          </div>
        </div>

        <div style={microCardStyle}>
          <div style={cardHeaderStyle}>
            <div>
              <h2 style={cardTitleStyle}>Mikroklima Durumu</h2>
              <p style={chartDescStyle}>
                Sensörler arası ilişki yorumlanarak risk nedeni açıklanır.
              </p>
            </div>
          </div>

          <div style={microRelationStyle}>
            <span style={microRelationItemStyle}>
              Sıcaklık: <strong>{analiz.sicaklikTrend}</strong>
            </span>
            <span style={microRelationItemStyle}>
              Nem: <strong>{analiz.nemTrend}</strong>
            </span>
            <span style={microRelationItemStyle}>
              Amonyak: <strong>{analiz.amonyakTrend}</strong>
            </span>
          </div>

          <p style={microTextStyle}>→ {analiz.mikroklimaYorumu}</p>
        </div>
      </div>

      <div style={decisionSupportGridStyle}>
        <div style={actionCardStyle}>
          <div style={cardHeaderStyle}>
            <div>
              <h2 style={cardTitleStyle}>Önerilen Aksiyon</h2>
              <p style={chartDescStyle}>
                Anlık sensör değerlerine göre uygulanabilecek karar destek önerileri.
              </p>
            </div>
            <span style={{ ...statusPillStyle, backgroundColor: analiz.durumRenk }}>
              {analiz.genelDurum}
            </span>
          </div>

          <div style={actionListStyle}>
            {analiz.onerilenAksiyonlar.map((aksiyon, index) => (
              <div
                key={index}
                style={{
                  ...actionItemStyle,
                  borderLeft: `5px solid ${aksiyon.renk}`,
                  backgroundColor: `${aksiyon.renk}10`,
                }}
              >
                <div style={{ ...actionIconStyle, color: aksiyon.renk }}>
                  {aksiyon.renk === "#22c55e" ? (
                    <CheckCircle size={22} />
                  ) : (
                    <AlertTriangle size={22} />
                  )}
                </div>
                <div>
                  <strong style={{ ...actionTitleStyle, color: aksiyon.renk }}>
                    {aksiyon.baslik}
                  </strong>
                  <p style={actionTextStyle}>{aksiyon.aciklama}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={riskExplainCardStyle}>
          <div style={cardHeaderStyle}>
            <div>
              <h2 style={cardTitleStyle}>Risk Seviyesi Açıklaması</h2>
              <p style={chartDescStyle}>
                Risk skoru; THI, amonyak ve sıcaklık eşiklerine göre değerlendirilir.
              </p>
            </div>
          </div>

          <div style={riskExplainBodyStyle}>
            <div
              style={{
                ...riskLevelCircleStyle,
                borderColor: analiz.durumRenk,
                color: analiz.durumRenk,
                backgroundColor: `${analiz.durumRenk}12`,
              }}
            >
              %{analiz.riskSkoru}
            </div>

            <div>
              <strong style={{ ...riskExplainTitleStyle, color: analiz.durumRenk }}>
                {analiz.riskBaslik}
              </strong>
              <p style={riskExplainTextStyle}>{analiz.riskAciklama}</p>
            </div>
          </div>
        </div>
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

        <ResponsiveContainer width="100%" height={360}>
          <AreaChart data={analiz.thiChartData} margin={{ top: 15, right: 25, bottom: 10, left: 0 }}>
            <defs>
              <linearGradient id="thiLiveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="saat" tick={{ fontSize: 11, fill: "#64748b" }} />
            <YAxis domain={[60, 85]} tick={{ fontSize: 11, fill: "#64748b" }} />
            <Tooltip />
            <ReferenceArea y1={60} y2={72} fill="#dcfce7" fillOpacity={0.35} />
            <ReferenceArea y1={72} y2={85} fill="#fee2e2" fillOpacity={0.45} />
            <ReferenceLine y={72} stroke="#ef4444" strokeDasharray="6 6" />
            <Area type="monotone" dataKey="thi" name="Saatlik THI" stroke="#ef4444" strokeWidth={3} fill="url(#thiLiveGradient)" />
          </AreaChart>
        </ResponsiveContainer>

        <div style={thiMiniGridStyle}>
          <SmallStat title="En Yüksek THI" value={analiz.maxThi.toFixed(1)} danger={analiz.maxThi >= 72} />
          <SmallStat title="En Düşük THI" value={analiz.minThi.toFixed(1)} danger={false} />
          <SmallStat title="Ortalama THI" value={analiz.ortThi.toFixed(1)} danger={analiz.ortThi >= 72} />
          <SmallStat title="Riskli Kayıt" value={`${analiz.thiRiskliSayisi} kez`} danger={analiz.thiRiskliSayisi > 0} />
        </div>
      </div>

      <div style={mainGridStyle}>
        <div style={largeCardStyle}>
          <div style={cardHeaderStyle}>
            <h2 style={cardTitleStyle}>Canlı Sistem Yorumu</h2>
            <span style={{ ...statusPillStyle, backgroundColor: analiz.durumRenk }}>
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
              <strong style={{ color: analiz.durumRenk }}>%{analiz.riskSkoru}</strong>
            </div>

            <div style={riskBarBgStyle}>
              <div style={{ ...riskBarStyle, width: `${analiz.riskSkoru}%`, backgroundColor: analiz.durumRenk }}></div>
            </div>
          </div>
        </div>

        <div style={largeCardStyle}>
          <h2 style={cardTitleStyle}>Son 20 Kayıt Eşik Analizi</h2>

          <div style={thresholdListStyle}>
            <ThresholdRow label="THI ≥ 72" value={`${analiz.thiRiskliSayisi} kez`} danger={analiz.thiRiskliSayisi > 0} />
            <ThresholdRow label="Amonyak > 25 ppm" value={`${analiz.amonyakAsimSayisi} kez`} danger={analiz.amonyakAsimSayisi > 0} />
            <ThresholdRow label="Sıcaklık > 26°C" value={`${analiz.sicaklikAsimSayisi} kez`} danger={analiz.sicaklikAsimSayisi > 0} />
          </div>

          <div style={noteStyle}>
            <ShieldCheck size={20} />
            <span>Son 20 kayıt değerlendirilerek anlık ortam riski hesaplanmıştır.</span>
          </div>
        </div>
      </div>

      <div style={trendGridStyle}>
        <TrendCard title="Sıcaklık Trendi" value={analiz.sicaklikTrend} icon={<TrendIcon durum={analiz.sicaklikTrend} />} color={getTrendColor(analiz.sicaklikTrend)} />
        <TrendCard title="Nem Trendi" value={analiz.nemTrend} icon={<TrendIcon durum={analiz.nemTrend} />} color={getTrendColor(analiz.nemTrend)} />
        <TrendCard title="Amonyak Trendi" value={analiz.amonyakTrend} icon={<TrendIcon durum={analiz.amonyakTrend} />} color={getTrendColor(analiz.amonyakTrend)} />
        <TrendCard title="THI Trendi" value={analiz.thiTrend} icon={<TrendIcon durum={analiz.thiTrend} />} color={getTrendColor(analiz.thiTrend)} />
      </div>
    </div>
  );
}

const getTrendColor = (durum) => {
  if (durum === "Artıyor") return "#ef4444";
  if (durum === "Azalıyor") return "#2563eb";
  return "#64748b";
};

const InfoCard = ({ title, value, icon, color }) => (
  <div style={infoCardStyle}>
    <div style={{ ...iconBoxStyle, color, backgroundColor: `${color}18` }}>{icon}</div>
    <span style={infoTitleStyle}>{title}</span>
    <strong style={{ ...infoValueStyle, color }}>{value}</strong>
  </div>
);

const SmallStat = ({ title, value, danger }) => (
  <div style={{ ...smallStatStyle, borderLeft: `5px solid ${danger ? "#ef4444" : "#22c55e"}` }}>
    <span style={smallStatTitleStyle}>{title}</span>
    <strong style={{ ...smallStatValueStyle, color: danger ? "#ef4444" : "#0f172a" }}>{value}</strong>
  </div>
);

const ThresholdRow = ({ label, value, danger }) => (
  <div style={thresholdRowStyle}>
    <span>{label}</span>
    <strong style={{ color: danger ? "#ef4444" : "#22c55e" }}>{value}</strong>
  </div>
);

const TrendCard = ({ title, value, icon, color }) => (
  <div style={{ ...trendCardStyle, borderLeft: `6px solid ${color}` }}>
    <div>{icon}</div>
    <span>{title}</span>
    <strong style={{ color }}>{value}</strong>
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
  boxShadow: "0 12px 28px rgba(15,23,42,0.08)",
};

const dataOverviewGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "18px",
  marginBottom: "22px",
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
  boxShadow: "0 16px 35px rgba(15,23,42,0.09)",
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

const mlMicroGridStyle = {
  display: "grid",
  gridTemplateColumns: "1.1fr 0.9fr",
  gap: "22px",
  marginBottom: "22px",
};

const mlCardStyle = {
  background: "linear-gradient(135deg, #ffffff, #eef2ff)",
  border: "1px solid #c7d2fe",
  borderRadius: "24px",
  padding: "26px",
  boxShadow: "0 18px 40px rgba(79,70,229,0.12)",
};

const microCardStyle = {
  background: "linear-gradient(135deg, #ffffff, #ecfeff)",
  border: "1px solid #bae6fd",
  borderRadius: "24px",
  padding: "26px",
  boxShadow: "0 18px 40px rgba(14,165,233,0.1)",
};

const mlResultGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px",
};

const mlMiniBoxStyle = {
  background: "#ffffff",
  border: "1px solid #e0e7ff",
  borderRadius: "18px",
  padding: "18px",
  minHeight: "100px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const boxLabelStyle = {
  color: "#64748b",
  fontSize: "13px",
  fontWeight: "700",
  marginBottom: "8px",
};

const boxValueStyle = {
  color: "#0f172a",
  fontSize: "26px",
  fontWeight: "900",
};

const microRelationStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "10px",
  marginBottom: "18px",
};

const microRelationItemStyle = {
  background: "#ffffff",
  border: "1px solid #bae6fd",
  borderRadius: "14px",
  padding: "12px",
  color: "#0f172a",
  fontWeight: "700",
  textAlign: "center",
};

const microTextStyle = {
  margin: 0,
  color: "#0f172a",
  fontSize: "15px",
  fontWeight: "700",
  lineHeight: "1.7",
};

const thiChartCardStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "26px",
  padding: "30px",
  boxShadow: "0 18px 42px rgba(15,23,42,0.09)",
  marginBottom: "22px",
};

const thiMiniGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "14px",
  marginTop: "18px",
};

const smallStatStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "16px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const smallStatTitleStyle = {
  color: "#475569",
  fontSize: "14px",
  fontWeight: "800",
};

const smallStatValueStyle = {
  fontSize: "22px",
  fontWeight: "900",
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
  boxShadow: "0 16px 35px rgba(15,23,42,0.08)",
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
  boxShadow: "0 14px 30px rgba(15,23,42,0.08)",
  color: "#334155",
  fontWeight: "700",
};

const decisionSupportGridStyle = {
  display: "grid",
  gridTemplateColumns: "1.15fr 0.85fr",
  gap: "22px",
  marginBottom: "22px",
};

const actionCardStyle = {
  background: "linear-gradient(135deg, #ffffff, #f0fdf4)",
  border: "1px solid #bbf7d0",
  borderRadius: "24px",
  padding: "26px",
  boxShadow: "0 18px 40px rgba(22,163,74,0.1)",
};

const riskExplainCardStyle = {
  background: "linear-gradient(135deg, #ffffff, #fff7ed)",
  border: "1px solid #fed7aa",
  borderRadius: "24px",
  padding: "26px",
  boxShadow: "0 18px 40px rgba(249,115,22,0.1)",
};

const actionListStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
};

const actionItemStyle = {
  display: "flex",
  alignItems: "flex-start",
  gap: "14px",
  padding: "16px",
  borderRadius: "18px",
  border: "1px solid #e2e8f0",
};

const actionIconStyle = {
  width: "40px",
  height: "40px",
  borderRadius: "14px",
  background: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const actionTitleStyle = {
  display: "block",
  fontSize: "15px",
  fontWeight: "900",
  marginBottom: "5px",
};

const actionTextStyle = {
  margin: 0,
  color: "#334155",
  fontSize: "14px",
  fontWeight: "600",
  lineHeight: "1.6",
};

const riskExplainBodyStyle = {
  display: "flex",
  alignItems: "center",
  gap: "18px",
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "20px",
  padding: "20px",
};

const riskLevelCircleStyle = {
  width: "92px",
  height: "92px",
  borderRadius: "50%",
  border: "5px solid",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "25px",
  fontWeight: "900",
  flexShrink: 0,
};

const riskExplainTitleStyle = {
  display: "block",
  fontSize: "22px",
  fontWeight: "900",
  marginBottom: "8px",
};

const riskExplainTextStyle = {
  margin: 0,
  color: "#334155",
  fontSize: "14px",
  fontWeight: "600",
  lineHeight: "1.7",
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