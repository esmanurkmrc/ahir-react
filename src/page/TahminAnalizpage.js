import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BrainCircuit,
  Thermometer,
  Droplets,
  Wind,
  Milk,
  Wheat,
  Activity,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Lightbulb,
  Target,
  CalendarDays,
  Sparkles,
  Gauge,
  SlidersHorizontal,
  Database,
  ArrowRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const T = {
  bg:           "#f0f4ff",
  card:         "#ffffff",
  border:       "#e0e7ff",
  borderFocus:  "#c7d2fe",

  violet:       "#6366f1",
  violetDark:   "#4f46e5",
  violetBg:     "#eef2ff",
  violetBorder: "#c7d2fe",

  green:        "#059669",
  greenBg:      "#f0fdf4",
  red:          "#dc2626",
  redBg:        "#fff1f1",
  amber:        "#d97706",
  amberBg:      "#fffbeb",
  cyan:         "#0891b2",
  purple:       "#7c3aed",

  t1:           "#0f172a",
  t2:           "#475569",
  t3:           "#94a3b8",

  radius:       "16px",
  radiusLg:     "20px",
  shadow:       "0 1px 3px rgba(99,102,241,0.07), 0 4px 16px rgba(99,102,241,0.08)",
};

const font = "'Segoe UI', Roboto, Arial, sans-serif";
const mono = "'Segoe UI', Roboto, Arial, sans-serif";

const TahminAnalizpage = () => {
  const ENV_API  = "http://localhost:8080/api/analysis-environment";
  const PROD_API = "http://localhost:8080/api/analysis-productivity";

  const [envData,  setEnvData]  = useState([]);
  const [prodData, setProdData] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [sonGuncelleme, setSonGuncelleme] = useState("-");

  const [scenario, setScenario] = useState({
    sicaklik: 20,
    nem:      65,
    amonyak:  12,
    yem:       5,
  });

  const HEDEF_VERIM = 5;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [envRes, prodRes] = await Promise.all([
        axios.get(ENV_API),
        axios.get(PROD_API),
      ]);
      setEnvData(Array.isArray(envRes.data)  ? envRes.data  : []);
      setProdData(Array.isArray(prodRes.data) ? prodRes.data : []);
      setSonGuncelleme(new Date().toLocaleTimeString("tr-TR"));
    } catch (e) {
      console.error("Karar destek verileri alınamadı:", e);
    } finally {
      setLoading(false);
    }
  };

  const sortByDateTime = (data) =>
    [...data].sort((a, b) => {
      const dA = new Date(`${a.tarih}T${a.saat || "00:00"}`);
      const dB = new Date(`${b.tarih}T${b.saat || "00:00"}`);
      return dA - dB;
    });

  const sortedEnv  = useMemo(() => sortByDateTime(envData),  [envData]);
  const sortedProd = useMemo(() => sortByDateTime(prodData), [prodData]);

  const average  = (d, k) => !d?.length ? 0 : d.reduce((s, i) => s + Number(i[k] || 0), 0) / d.length;
  const maxValue = (d, k) => !d?.length ? 0 : Math.max(...d.map(i => Number(i[k] || 0)));
  const minValue = (d, k) => !d?.length ? 0 : Math.min(...d.map(i => Number(i[k] || 0)));

  const getTrendPercent = (d, k) => {
    if (!d || d.length < 2) return 0;
    const first = Number(d[0]?.[k] || 0);
    const last  = Number(d[d.length - 1]?.[k] || 0);
    return first === 0 ? 0 : Number((((last - first) / first) * 100).toFixed(1));
  };

  const avgSicaklik = average(sortedEnv,  "sicaklik");
  const avgNem      = average(sortedEnv,  "nem");
  const maxAmonyak  = maxValue(sortedEnv, "amonyak");

  const avgSut = average(sortedProd, "sutVerimi");
  const avgYem = average(sortedProd, "yemTuketimi");
  const minSut = minValue(sortedProd, "sutVerimi");
  const maxSut = maxValue(sortedProd, "sutVerimi");

  const sutTrendPercent      = getTrendPercent(sortedProd, "sutVerimi");
  const yemTrendPercent      = getTrendPercent(sortedProd, "yemTuketimi");
  const sicaklikTrendPercent = getTrendPercent(sortedEnv,  "sicaklik");

  const enIyiGun = useMemo(() =>
    sortedProd.length ? [...sortedProd].sort((a, b) => Number(b.sutVerimi || 0) - Number(a.sutVerimi || 0))[0] : null,
    [sortedProd]);

  const enKotuGun = useMemo(() =>
    sortedProd.length ? [...sortedProd].sort((a, b) => Number(a.sutVerimi || 0) - Number(b.sutVerimi || 0))[0] : null,
    [sortedProd]);

  const enIyiGunEnv = useMemo(() => {
    if (!enIyiGun || !sortedEnv.length) return null;
    return sortedEnv.find(e => e.tarih === enIyiGun.tarih) || null;
  }, [enIyiGun, sortedEnv]);

  const calculateTHI = (s, n) =>
    1.8 * Number(s || 0) + 32 - (0.55 - 0.0055 * Number(n || 0)) * (1.8 * Number(s || 0) - 26);

  const avgTHI = calculateTHI(avgSicaklik, avgNem);

  const sutDegisimYonu = useMemo(() => {
    if (sortedProd.length < 2) return "Veri Bekleniyor";
    const first = Number(sortedProd[0]?.sutVerimi || 0);
    const last  = Number(sortedProd[sortedProd.length - 1]?.sutVerimi || 0);
    if (last > first) return "Artış Eğilimi";
    if (last < first) return "Düşüş Eğilimi";
    return "Stabil";
  }, [sortedProd]);

  const verimFarki = avgSut - HEDEF_VERIM;

  const yemSutOrani = useMemo(() =>
    avgSut > 0 ? Number((avgYem / avgSut).toFixed(2)) : 0,
    [avgYem, avgSut]);

  const yemSutYorum = useMemo(() => {
    if (yemSutOrani === 0) return "Veri yetersiz.";
    if (yemSutOrani < 0.5) return "Çok verimli dönüşüm — yem kullanımı oldukça etkili.";
    if (yemSutOrani < 0.7) return "İyi dönüşüm oranı, normal aralık.";
    if (yemSutOrani < 1.0) return "Dönüşüm oranı sınırda, besleme takibi önerilir.";
    return "Yüksek yem/süt oranı — verimlilik düşük, nedenler incelenmeli.";
  }, [yemSutOrani]);

  const veriAraligi = useMemo(() => {
    const allDates = [...sortedProd, ...sortedEnv].map(d => d.tarih).filter(Boolean).sort();
    if (!allDates.length) return { ilk: "—", son: "—", toplamKayit: 0 };
    return {
      ilk: allDates[0],
      son: allDates[allDates.length - 1],
      toplamKayit: sortedProd.length + sortedEnv.length,
    };
  }, [sortedProd, sortedEnv]);

  const sutChartData = useMemo(() =>
    sortedProd.map((d, i) => ({
      idx: i + 1,
      tarih: d.tarih,
      sut: Number(Number(d.sutVerimi || 0).toFixed(2)),
    })),
    [sortedProd]);

  const riskScore = useMemo(() => {
    let s = 0;
    if (avgTHI >= 78)        s += 40; else if (avgTHI >= 72)        s += 25;
    if (maxAmonyak >= 25)    s += 35; else if (maxAmonyak >= 15)     s += 20;
    if (avgSicaklik >= 30)   s += 15; else if (avgSicaklik >= 27)    s +=  8;
    if (avgNem >= 80)        s += 10; else if (avgNem >= 70)         s +=  5;
    if (avgYem < 5)          s += 10;
    if (sutDegisimYonu === "Düşüş Eğilimi") s += 10;
    return Math.min(s, 100);
  }, [avgTHI, maxAmonyak, avgSicaklik, avgNem, avgYem, sutDegisimYonu]);

  const riskInfo = useMemo(() => {
    if (riskScore >= 70) return {
      text: "Yüksek Risk", color: T.red, bg: T.redBg, border: "#fecaca",
      icon: <AlertTriangle size={22} />,
      desc: "Geçmiş veriler çevresel koşulların dikkat gerektirdiğini göstermektedir.",
    };
    if (riskScore >= 40) return {
      text: "Orta Risk", color: T.amber, bg: T.amberBg, border: "#fde68a",
      icon: <Activity size={22} />,
      desc: "Bazı değerler takip edilmelidir. THI, amonyak ve süt eğilimi önemlidir.",
    };
    return {
      text: "Düşük Risk", color: T.green, bg: T.greenBg, border: "#a7f3d0",
      icon: <CheckCircle2 size={22} />,
      desc: "Geçmiş veriler genel olarak kabul edilebilir ve dengeli bir tablo göstermektedir.",
    };
  }, [riskScore]);

  const thiInfo = useMemo(() => {
    if (avgTHI >= 78) return { text: "Yüksek Isı Stresi", color: T.red,   desc: "THI değeri yüksek seviyededir. Serinletme ve su erişimi öncelikli olmalıdır." };
    if (avgTHI >= 72) return { text: "Isı Stresi Riski",  color: T.amber, desc: "THI değeri risk sınırına yaklaşmıştır. Hayvan konforu izlenmelidir." };
    return               { text: "Konforlu Bölge",        color: T.green, desc: "THI değeri kabul edilebilir aralıktadır." };
  }, [avgTHI]);

  const riskNedenleri = useMemo(() => {
    const n = [];
    if (avgTHI >= 72)              n.push("THI değeri ısı stresi sınırına yaklaşmıştır.");
    if (maxAmonyak >= 25)          n.push("Amonyak seviyesi kritik sınırın üzerindedir.");
    else if (maxAmonyak >= 15)     n.push("Amonyak seviyesi takip edilmesi gereken aralıktadır.");
    if (avgSicaklik >= 30)         n.push("Ortalama sıcaklık yüksek seviyededir.");
    if (avgNem >= 70)              n.push("Nem seviyesi hayvan konforunu etkileyebilir.");
    if (avgYem < 5)                n.push("Ortalama yem tüketimi düşük görünmektedir.");
    if (sutDegisimYonu === "Düşüş Eğilimi") n.push("Süt veriminde düşüş eğilimi görülmektedir.");
    if (!n.length)                 n.push("Kritik çevresel veya üretimsel risk tespit edilmemiştir.");
    return n;
  }, [avgTHI, maxAmonyak, avgSicaklik, avgNem, avgYem, sutDegisimYonu]);

  const kararYorumu = useMemo(() => {
    if (!sortedEnv.length || !sortedProd.length)
      return "Geçmiş çevresel ve üretim verileri yüklendiğinde sistem karar destek yorumu oluşturacaktır.";
    if (riskScore >= 70)
      return "Sistem geçmiş verilerde yüksek riskli bir tablo algılamıştır. Havalandırma, serinletme ve besleme kontrollerinin birlikte yapılması önerilir.";
    if (riskScore >= 40)
      return "Sistem orta düzey risk tespit etmiştir. THI, amonyak ve yem tüketimi düzenli takip edilmelidir.";
    return "Sistem geçmiş verilere göre stabil bir tablo göstermektedir. Mevcut koşullar korunmalı ve düzenli takip sürdürülmelidir.";
  }, [sortedEnv, sortedProd, riskScore]);

  const oneriler = useMemo(() => {
    const list = [];
    if (avgTHI >= 72)   list.push({ icon: <Thermometer size={15} />, title: "Serinletme Önlemi",    text: "Fan, gölgelendirme ve su erişimi kontrol edilmelidir." });
    if (maxAmonyak>=15) list.push({ icon: <Wind size={15} />,        title: "Havalandırma Kontrolü", text: "Havalandırma ve gübre temizliği düzenli yapılmalıdır." });
    if (avgYem < 5)     list.push({ icon: <Wheat size={15} />,       title: "Besleme Takibi",        text: "Besleme düzeni ve hayvan iştahı kontrol edilmelidir." });
    if (sutDegisimYonu === "Düşüş Eğilimi")
                        list.push({ icon: <TrendingDown size={15} />,title: "Verim Düşüşü İzleme",  text: "Çevresel koşullar ve yem tüketimiyle birlikte değerlendirilmelidir." });
    if (!list.length)   list.push({ icon: <ShieldCheck size={15} />, title: "Sistem Stabil",          text: "Kritik risk görülmemektedir. Mevcut koşullar korunarak takip yapılmalıdır." });
    return list;
  }, [avgTHI, maxAmonyak, avgYem, sutDegisimYonu]);

  const trendCards = [
    {
      title: "Süt Verimi Trendi",
      value: sutDegisimYonu,
      percent: `${sutTrendPercent > 0 ? "+" : ""}${sutTrendPercent}%`,
      icon: sutTrendPercent >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />,
      color: sutTrendPercent >= 0 ? T.green : T.red,
      desc: sutTrendPercent >= 0 ? "Süt veriminde artış eğilimi görülmektedir." : "Süt veriminde düşüş eğilimi görülmektedir.",
    },
    {
      title: "Yem Tüketimi Trendi",
      value: yemTrendPercent >= 0 ? "Artış Eğilimi" : "Düşüş Eğilimi",
      percent: `${yemTrendPercent > 0 ? "+" : ""}${yemTrendPercent}%`,
      icon: yemTrendPercent >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />,
      color: yemTrendPercent >= 0 ? T.green : T.red,
      desc: "Yem tüketimindeki değişim üretim performansı açısından izlenmektedir.",
    },
    {
      title: "Mikroklima Trendi",
      value: sicaklikTrendPercent >= 0 ? "Isınma Eğilimi" : "Serinleme Eğilimi",
      percent: `${sicaklikTrendPercent > 0 ? "+" : ""}${sicaklikTrendPercent}%`,
      icon: <Thermometer size={18} />,
      color: sicaklikTrendPercent >= 0 ? T.amber : T.cyan,
      desc: "Sıcaklık değişimi THI ve hayvan konforu açısından değerlendirilir.",
    },
  ];

  const insightCards = [
    { title: "THI Analizi",       value: thiInfo.text,   desc: thiInfo.desc,                                                                                                      color: thiInfo.color,                                                                       icon: <Gauge size={18} /> },
    { title: "Süt Eğilimi",       value: sutDegisimYonu, desc: sutDegisimYonu === "Düşüş Eğilimi" ? "Üretim eğilimi dikkat gerektiriyor." : "Üretim eğilimi takip edilebilir seviyededir.", color: sutDegisimYonu === "Düşüş Eğilimi" ? T.red : T.violet, icon: sutDegisimYonu === "Düşüş Eğilimi" ? <TrendingDown size={18} /> : <TrendingUp size={18} /> },
    { title: "Yem-Verim Dengesi", value: avgYem >= 5 ? "Yeterli" : "Düşük",                                                                                               desc: avgYem >= 5 ? "Yem tüketimi üretim açısından yeterli." : "Düşük yem tüketimi verim kaybı oluşturabilir.", color: avgYem >= 5 ? T.green : T.red, icon: <Wheat size={18} /> },
  ];

  const scenarioTHI = calculateTHI(scenario.sicaklik, scenario.nem);

  const scenarioRiskScore = useMemo(() => {
    let s = 0;
    if (scenarioTHI >= 78)        s += 40; else if (scenarioTHI >= 72)      s += 25;
    if (scenario.amonyak >= 25)   s += 35; else if (scenario.amonyak >= 15) s += 20;
    if (scenario.sicaklik >= 30)  s += 15; else if (scenario.sicaklik >= 27) s += 8;
    if (scenario.nem >= 80)       s += 10; else if (scenario.nem >= 70)     s +=  5;
    if (scenario.yem < 5)         s += 10;
    return Math.min(s, 100);
  }, [scenario, scenarioTHI]);

  const scenarioVerim = useMemo(() => {
    let v = avgSut || HEDEF_VERIM;
    if (scenarioTHI >= 78)        v -= 0.8; else if (scenarioTHI >= 72)      v -= 0.4;
    if (scenario.amonyak >= 25)   v -= 0.6; else if (scenario.amonyak >= 15) v -= 0.25;
    if (scenario.yem >= 6)        v += 0.3; else if (scenario.yem < 5)       v -= 0.25;
    return Math.max(v, 0);
  }, [avgSut, scenario, scenarioTHI]);

  const scenarioInfo = useMemo(() => {
    if (scenarioRiskScore >= 70) {
      return {
        label: "Yüksek Risk",
        comment: "Bu senaryoda çevresel koşullar yüksek risk oluşturmaktadır. Sıcaklık, nem veya amonyak değerleri hayvan konforunu olumsuz etkileyebilir.",
        color: T.red,
        bg: T.redBg,
        border: "#fecaca",
      };
    }

    if (scenarioRiskScore >= 40) {
      return {
        label: "Orta Risk",
        comment: "Bu senaryoda orta düzey risk oluşmaktadır. THI, amonyak ve yem tüketimi dikkatle izlenmelidir.",
        color: T.amber,
        bg: T.amberBg,
        border: "#fde68a",
      };
    }

    return {
      label: "Düşük Risk",
      comment: "Bu senaryoda ortam koşulları kabul edilebilir seviyededir.",
      color: T.green,
      bg: T.greenBg,
      border: "#bbf7d0",
    };
  }, [scenarioRiskScore]);

  const sliderSafeRanges = {
    sicaklik: { min: 10, max: 25, label: "Güvenli: 10–25 °C" },
    nem:      { min: 40, max: 72, label: "Güvenli: %40–72" },
    amonyak:  { min: 0,  max: 25, label: "Güvenli: 0–25 ppm" },
    yem:      { min: 5,  max: 8,  label: "Güvenli: 5–8 kg" },
  };

  const isInSafeRange = (field, value) => {
    const r = sliderSafeRanges[field];
    return value >= r.min && value <= r.max;
  };

  const handleScenarioChange = (field, value) =>
    setScenario({ ...scenario, [field]: Number(value) });

  const metrics = [
    { icon: <Thermometer size={17} />, title: "Ort. Sıcaklık",  value: `${avgSicaklik.toFixed(1)}°C`, desc: "Ortam ort.",    color: T.red    },
    { icon: <Droplets    size={17} />, title: "Ort. Nem",       value: `%${avgNem.toFixed(1)}`,        desc: "Ortam ort.",    color: T.cyan   },
    { icon: <Wind        size={17} />, title: "Maks. Amonyak",  value: `${maxAmonyak.toFixed(1)} ppm`, desc: "En yüksek",     color: T.amber  },
    { icon: <Activity    size={17} />, title: "Ort. THI",       value: avgTHI.toFixed(1),              desc: "Konfor endeksi",color: T.purple },
    { icon: <Milk        size={17} />, title: "Ort. Süt",       value: `${avgSut.toFixed(1)} L`,       desc: "Üretim ort.",   color: T.green  },
    { icon: <Wheat       size={17} />, title: "Ort. Yem",       value: `${avgYem.toFixed(1)} kg`,      desc: "Besleme ort.",  color: "#ca8a04" },
  ];

  const tooltipStyle = {
    background: "#fff",
    border: `1px solid ${T.border}`,
    borderRadius: "10px",
    fontSize: "12px",
    fontFamily: font,
    boxShadow: "0 4px 16px rgba(99,102,241,0.1)",
  };

  return (
    <div style={s.page}>

      <div style={s.hero}>
        <div style={{ flex: 1 }}>
          <div style={s.badge}>
            <BrainCircuit size={14} />
            Karar Destek Sistemi
          </div>
          <h1 style={s.heroTitle}>Tahmin Analiz Merkezi</h1>
          <p style={s.heroText}>
            Geçmiş ahır ortamı ve üretim verilerini değerlendirerek risk, THI durumu,
            senaryo testi ve öneriler üzerinden karar desteği sunar.
          </p>
        </div>
        <button onClick={fetchData} style={s.refreshBtn} disabled={loading}>
          <RefreshCw size={14} style={{ flexShrink: 0 }} />
          {loading ? "Yükleniyor..." : "Verileri Yenile"}
        </button>
      </div>

      <div style={s.veriAraligiBanner}>
        <div style={s.veriAraligi_left}>
          <Database size={16} color={T.violet} />
          <span style={{ fontWeight: 700, fontSize: 13, color: T.t1 }}>Veri Aralığı</span>
          <span style={s.veriTag}>{veriAraligi.ilk} — {veriAraligi.son}</span>
        </div>
        <div style={s.veriAraligi_right}>
          <span style={s.veriMetaItem}>
            <span style={s.veriMetaLabel}>Son Güncelleme</span>
            <strong style={s.veriMetaVal}>{sonGuncelleme}</strong>
          </span>
        </div>
      </div>

      <div style={s.topGrid}>
        <div style={s.card}>
          <div style={s.cardEyebrow}>
            <Sparkles size={15} color={T.violet} />
            <span style={{ color: T.violet, fontWeight: 700, fontSize: 12 }}>Beklenen Verim Durumu</span>
          </div>
          <div style={s.bigNumber}>{avgSut.toFixed(1)} <span style={s.bigUnit}>L</span></div>
          <p style={s.subText}>Geçmiş üretim kayıtlarına göre hesaplanan ortalama süt verimi.</p>
          <div style={s.miniGrid}>
            {[
              { label: "Hedef Verim",  val: `${HEDEF_VERIM.toFixed(1)} L`, color: T.t1 },
              { label: "Hedef Farkı",  val: `${verimFarki >= 0 ? "+" : ""}${verimFarki.toFixed(1)} L`, color: verimFarki >= 0 ? T.green : T.red },
              { label: "En Yüksek",    val: `${maxSut.toFixed(1)} L`,      color: T.t1 },
              { label: "En Düşük",     val: `${minSut.toFixed(1)} L`,      color: T.t1 },
            ].map((m, i) => (
              <div key={i} style={s.miniBox}>
                <span style={s.miniLabel}>{m.label}</span>
                <strong style={{ ...s.miniVal, color: m.color }}>{m.val}</strong>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...s.card, borderTop: `4px solid ${riskInfo.color}`, background: `linear-gradient(160deg, ${riskInfo.color}08 0%, #fff 55%)` }}>
          <div style={{ ...s.riskIconWrap, background: `${riskInfo.color}14`, color: riskInfo.color }}>
            {riskInfo.icon}
          </div>
          <span style={s.miniLabel}>Genel Risk Skoru</span>
          <div style={{ ...s.bigNumber, color: riskInfo.color, marginTop: 4 }}>
            %{riskScore}
          </div>
          <div style={s.riskBg}>
            <div style={{ ...s.riskFill, width: `${riskScore}%`, background: riskInfo.color }} />
          </div>
          <strong style={{ fontSize: 15, color: riskInfo.color, display: "block", marginBottom: 6 }}>
            {riskInfo.text}
          </strong>
          <p style={s.subText}>{riskInfo.desc}</p>
        </div>
      </div>

      <div style={s.metricStrip}>
        {metrics.map((m, i) => (
          <div key={i} style={s.metricCard}>
            <div style={{ ...s.metricIcon, background: `${m.color}12`, color: m.color }}>{m.icon}</div>
            <span style={s.miniLabel}>{m.title}</span>
            <strong style={s.metricVal}>{m.value}</strong>
            <span style={{ ...s.miniLabel, marginTop: 2 }}>{m.desc}</span>
          </div>
        ))}
      </div>

      <div style={s.card}>
        <div style={s.sectionHead}>
          <div style={{ ...s.sectionIcon, background: `${T.green}12`, color: T.green }}>
            <Milk size={17} />
          </div>
          <div>
            <h2 style={s.sectionTitle}>Süt Verimi Zaman Serisi</h2>
            <p style={s.subText}>Kayıt sırasına göre ölçülen süt verimi değerleri ve hedef çizgisi.</p>
          </div>
        </div>
        {sutChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={sutChartData} margin={{ top: 20, right: 35, left: 10, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f4ff" />
              <XAxis
                dataKey="tarih"
                tick={{ fontSize: 11, fontFamily: font, fill: T.t3 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={28}
              />
              <YAxis
                tick={{ fontSize: 11, fontFamily: font, fill: T.t3 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={28}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => [`${v} L`, "Süt Verimi"]}
                labelFormatter={(l, payload) => payload?.[0]?.payload?.tarih || `Kayıt ${l}`}
              />
              <ReferenceLine
                y={HEDEF_VERIM}
                stroke={T.amber}
                strokeDasharray="5 3"
                strokeWidth={1.5}
                label={{ value: `Hedef ${HEDEF_VERIM}L`, position: "right", fontSize: 10, fill: T.amber, fontFamily: font }}
              />
              <Line
                type="monotone"
                dataKey="sut"
                stroke={T.violet}
                strokeWidth={2.5}
                dot={{ r: 3, fill: T.violet, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: T.violet }}
                name="Süt (L)"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={s.emptyChart}>Henüz üretim verisi yüklenmemiş.</div>
        )}
      </div>

      <div style={s.threeCol}>
        {trendCards.map((item, i) => (
          <div key={i} style={{ ...s.card, borderLeft: `4px solid ${item.color}` }}>
            <div style={{ ...s.trendIcon, background: `${item.color}10`, color: item.color }}>{item.icon}</div>
            <span style={s.eyebrow}>{item.title}</span>
            <div style={s.trendRow}>
              <strong style={{ color: item.color, fontSize: 15, fontWeight: 800 }}>{item.value}</strong>
              <span style={{ ...s.pill, background: `${item.color}12`, color: item.color }}>{item.percent}</span>
            </div>
            <p style={s.subText}>{item.desc}</p>
          </div>
        ))}
      </div>

      <div style={s.threeCol}>
        {insightCards.map((item, i) => (
          <div key={i} style={{ ...s.card, borderLeft: `4px solid ${item.color}` }}>
            <div style={{ ...s.trendIcon, background: `${item.color}10`, color: item.color }}>{item.icon}</div>
            <span style={s.eyebrow}>{item.title}</span>
            <strong style={{ color: item.color, fontSize: 15, fontWeight: 800, display: "block", margin: "4px 0 6px" }}>{item.value}</strong>
            <p style={s.subText}>{item.desc}</p>
          </div>
        ))}
      </div>

      <div style={s.card}>
        <div style={s.sectionHead}>
          <div style={{ ...s.sectionIcon, background: `${T.violet}12`, color: T.violet }}>
            <Wheat size={17} />
          </div>
          <div>
            <h2 style={s.sectionTitle}>Yem–Süt Dönüşüm Oranı</h2>
            <p style={s.subText}>Her litre süt için harcanan ortalama yem miktarı.</p>
          </div>
        </div>
        <div style={s.yemSutRow}>
          <div style={s.yemSutMain}>
            <span style={s.miniLabel}>Dönüşüm Oranı (kg / L)</span>
            <div style={{ ...s.bigNumber, color: T.violet }}>{yemSutOrani} <span style={s.bigUnit}>kg/L</span></div>
            <p style={{ ...s.subText, marginTop: 6 }}>{yemSutYorum}</p>
          </div>
          <div style={s.yemSutMeta}>
            {[
              { label: "Ort. Yem",    val: `${avgYem.toFixed(1)} kg`, color: "#ca8a04" },
              { label: "Ort. Süt",    val: `${avgSut.toFixed(1)} L`,  color: T.green   },
              { label: "Oran",        val: `${yemSutOrani} kg/L`,     color: T.violet  },
            ].map((m, i) => (
              <div key={i} style={s.miniBox}>
                <span style={s.miniLabel}>{m.label}</span>
                <strong style={{ ...s.miniVal, color: m.color }}>{m.val}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={s.card}>
        <div style={s.sectionHead}>
          <div style={{ ...s.sectionIcon, background: T.violetBg, color: T.violet }}>
            <SlidersHorizontal size={17} />
          </div>
          <div>
            <h2 style={s.sectionTitle}>Senaryo Testi</h2>
            <p style={s.subText}>Farklı ortam koşulları seçerek risk skoru, THI ve beklenen verim etkisini değerlendirin.</p>
          </div>
        </div>

        <div style={s.fourCol}>
          {[
            { label: "Sıcaklık", field: "sicaklik", unit: "°C", min: 10, max: 25, step: 0.5 },
            { label: "Nem",      field: "nem",      unit: "%",  min: 30, max: 72, step: 1   },
            { label: "Amonyak",  field: "amonyak",  unit: "ppm",min: 0,  max: 25, step: 1   },
            { label: "Yem",      field: "yem",      unit: "kg", min: 2,  max: 10, step: 0.1 },
          ].map((inp) => {
            const safe = isInSafeRange(inp.field, scenario[inp.field]);
            return (
              <div key={inp.field} style={{ ...s.sliderCard, borderColor: safe ? T.border : T.amber }}>
                <div style={s.sliderTop}>
                  <span style={{ color: T.t2, fontWeight: 700, fontSize: 13, fontFamily: font }}>{inp.label}</span>
                  <strong style={{ color: safe ? T.violet : T.amber, fontSize: 14, fontFamily: mono }}>{scenario[inp.field]} {inp.unit}</strong>
                </div>
                <input
                  type="range"
                  min={inp.min} max={inp.max} step={inp.step}
                  value={scenario[inp.field]}
                  onChange={(e) => handleScenarioChange(inp.field, e.target.value)}
                  style={{ width: "100%", accentColor: safe ? T.violet : T.amber, cursor: "pointer" }}
                />
                <div style={{ ...s.safeRangeTag, background: safe ? T.violetBg : T.amberBg, color: safe ? T.violet : T.amber, borderColor: safe ? T.violetBorder : "#fde68a" }}>
                  {safe ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                  {sliderSafeRanges[inp.field].label}
                </div>
              </div>
            );
          })}
        </div>

        <div style={s.scenarioResultRow}>
          {[
            { label: "Senaryo THI",    val: scenarioTHI.toFixed(1), color: scenarioTHI >= 72 ? T.amber : T.green },
            { label: "Risk Skoru",     val: `%${scenarioRiskScore}`, color: scenarioInfo.color },
            { label: "Beklenen Verim", val: `${scenarioVerim.toFixed(1)} L`, color: scenarioVerim >= HEDEF_VERIM ? T.green : T.violet },
          ].map((r, i) => (
            <div key={i} style={{ ...s.scenarioBox, borderColor: `${r.color}55`, backgroundColor: `${r.color}10` }}>
              <span style={{ color: r.color, fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: font }}>{r.label}</span>
              <strong style={{ fontSize: 26, fontWeight: 900, color: r.color, marginTop: 6, display: "block", fontFamily: font }}>{r.val}</strong>
            </div>
          ))}
        </div>

        <div
          style={{
            ...s.commentBox,
            backgroundColor: scenarioInfo.bg,
            borderLeft: `5px solid ${scenarioInfo.color}`,
            borderColor: scenarioInfo.border,
          }}
        >
          <strong style={{ color: scenarioInfo.color, fontSize: 15, fontWeight: 800, fontFamily: font }}>
            Senaryo Yorumu: {scenarioInfo.label}
          </strong>
          <p style={{ ...s.subText, marginTop: 6, color: "#334155" }}>{scenarioInfo.comment}</p>
        </div>
      </div>

      <div style={s.twoCol}>
        <div style={s.card}>
          <div style={s.sectionHead}>
            <div style={{ ...s.sectionIcon, background: "#fef3c7", color: T.amber }}>
              <AlertTriangle size={17} />
            </div>
            <h2 style={s.sectionTitle}>Risk Nedenleri</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {riskNedenleri.map((item, i) => (
              <div key={i} style={s.reasonRow}>
                <CheckCircle2 size={14} color={T.violet} style={{ flexShrink: 0 }} />
                <span style={{ color: T.t2, fontSize: 13, fontWeight: 600, fontFamily: font }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={s.card}>
          <div style={s.sectionHead}>
            <div style={{ ...s.sectionIcon, background: T.greenBg, color: T.green }}>
              <CalendarDays size={17} />
            </div>
            <h2 style={s.sectionTitle}>En İyi / En Düşük Verim</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {[
              { label: "En İyi Gün",   data: enIyiGun,   accent: T.green },
              { label: "En Düşük Gün", data: enKotuGun, accent: T.red   },
            ].map((d, i) => (
              <div key={i} style={{ ...s.dayBox, borderTop: `3px solid ${d.accent}` }}>
                <span style={s.eyebrow}>{d.label}</span>
                <strong style={{ fontSize: 22, fontWeight: 800, color: d.accent, display: "block", margin: "8px 0 4px", fontFamily: mono }}>
                  {d.data ? `${Number(d.data.sutVerimi || 0).toFixed(1)} L` : "—"}
                </strong>
                <span style={{ color: T.t3, fontSize: 12, fontFamily: font }}>{d.data?.tarih || "—"}</span>
              </div>
            ))}
          </div>

          {enIyiGunEnv && (
            <div style={s.enIyiEnvBox}>
              <div style={s.enIyiEnvHead}>
                <Sparkles size={13} color={T.green} />
                <span style={{ fontSize: 11, fontWeight: 700, color: T.green, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: font }}>
                  En İyi Günün Çevre Koşulları ({enIyiGun.tarih})
                </span>
              </div>
              <div style={s.enIyiEnvGrid}>
                {[
                  { label: "Sıcaklık", val: `${Number(enIyiGunEnv.sicaklik || 0).toFixed(1)}°C`, color: T.red    },
                  { label: "Nem",      val: `%${Number(enIyiGunEnv.nem || 0).toFixed(1)}`,        color: T.cyan   },
                  { label: "Amonyak",  val: `${Number(enIyiGunEnv.amonyak || 0).toFixed(1)} ppm`, color: T.amber },
                ].map((e, i) => (
                  <div key={i} style={s.enIyiEnvItem}>
                    <span style={{ ...s.miniLabel }}>{e.label}</span>
                    <strong style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: e.color }}>{e.val}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={s.twoCol}>
        <div style={s.card}>
          <div style={s.sectionHead}>
            <div style={{ ...s.sectionIcon, background: T.violetBg, color: T.violet }}>
              <Lightbulb size={17} />
            </div>
            <h2 style={s.sectionTitle}>Öneriler ve Eylemler</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {oneriler.map((item, i) => (
              <div key={i} style={s.reasonRow}>
                <div style={{ ...s.trendIcon, background: `${T.violet}12`, color: T.violet, marginBottom: 0 }}>{item.icon}</div>
                <div>
                  <strong style={{ color: T.t1, fontSize: 13, display: "block", fontFamily: font }}>{item.title}</strong>
                  <p style={{ ...s.subText, marginTop: 2 }}>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

const s = {
  page: {
    backgroundColor: T.bg,
    minHeight: "100vh",
    padding: "24px",
    fontFamily: font,
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    boxSizing: "border-box",
  },
  hero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    backgroundColor: T.card,
    padding: "24px",
    borderRadius: T.radiusLg,
    boxShadow: T.shadow,
  },
  heroTitle: {
    fontSize: "34px",
    fontWeight: 800,
    color: "#0f172a",
    margin: "8px 0",
    letterSpacing: "-0.02em",
    fontFamily: font,
  },
  heroText: {
    fontSize: "15px",
    color: "#64748b",
    fontWeight: 500,
    margin: "4px 0 0 0",
    lineHeight: "1.6",
    fontFamily: font,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: T.violetBg,
    color: T.violet,
    padding: "6px 12px",
    borderRadius: "100px",
    fontSize: "12px",
    fontWeight: 600,
  },
  refreshBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: T.violet,
    color: "#fff",
    border: "none",
    padding: "12px 20px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: font,
  },
  veriAraligiBanner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    backgroundColor: T.card,
    padding: "14px 20px",
    borderRadius: T.radius,
    boxShadow: T.shadow,
    border: `1px solid ${T.border}`,
  },
  veriAraligi_left: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  veriAraligi_right: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },
  veriTag: {
    backgroundColor: T.violetBg,
    color: T.violet,
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 600,
  },
  veriMetaItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  veriMetaLabel: {
    fontSize: "12px",
    color: T.t3,
    fontWeight: 700,
    fontFamily: font,
  },
  veriMetaVal: {
    fontSize: "16px",
    color: T.t1,
    fontWeight: 800,
    fontFamily: font,
  },
  veriDivider: {
    width: "1px",
    height: "24px",
    backgroundColor: T.border,
  },
  topGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
  },
  card: {
    backgroundColor: T.card,
    padding: "24px",
    borderRadius: T.radius,
    boxShadow: T.shadow,
    border: `1px solid ${T.border}`,
    position: "relative",
    boxSizing: "border-box",
  },
  cardEyebrow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "12px",
  },
  bigNumber: {
    fontSize: "44px",
    fontWeight: 800,
    color: T.t1,
    fontFamily: font,
    letterSpacing: "-0.02em",
  },
  bigUnit: {
    fontSize: "18px",
    fontWeight: 600,
    color: T.t2,
    fontFamily: font,
  },
  subText: {
    fontSize: "14px",
    color: "#64748b",
    fontWeight: 500,
    margin: "4px 0 0 0",
    lineHeight: "1.6",
    fontFamily: font,
  },
  miniGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "16px",
  },
  miniBox: {
    backgroundColor: T.bg,
    padding: "10px",
    borderRadius: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  miniLabel: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: 700,
    marginBottom: "4px",
    fontFamily: font,
  },
  miniVal: {
    fontSize: "18px",
    fontWeight: 800,
    fontFamily: font,
  },
  riskIconWrap: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "12px",
  },
  riskBg: {
    width: "100%",
    height: "6px",
    backgroundColor: T.bg,
    borderRadius: "100px",
    margin: "12px 0",
    overflow: "hidden",
  },
  riskFill: {
    height: "100%",
    borderRadius: "100px",
    transition: "width 0.4s ease-out",
  },
  metricStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "16px",
  },
  metricCard: {
    backgroundColor: T.card,
    padding: "16px",
    borderRadius: T.radius,
    boxShadow: T.shadow,
    border: `1px solid ${T.border}`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  metricIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "8px",
  },
  metricVal: {
    fontSize: "30px",
    fontWeight: 800,
    color: T.t1,
    margin: "4px 0",
    fontFamily: font,
  },
  sectionHead: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
  },
  sectionIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: "21px",
    fontWeight: 800,
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.01em",
    fontFamily: font,
  },
  emptyChart: {
    height: "260px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: T.t3,
    fontSize: "14px",
  },
  threeCol: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "20px",
  },
  eyebrow: {
    fontSize: "13px",
    fontWeight: 800,
    color: T.t3,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontFamily: font,
  },
  trendIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "10px",
  },
  trendRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    margin: "6px 0",
  },
  pill: {
    fontSize: "11px",
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: "100px",
    fontFamily: mono,
  },
  yemSutRow: {
    display: "flex",
    gap: "24px",
    flexWrap: "wrap",
  },
  yemSutMain: {
    flex: 1,
    minWidth: "200px",
  },
  yemSutMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    minWidth: "180px",
  },
  fourCol: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },
  sliderCard: {
    backgroundColor: T.bg,
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid transparent",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  sliderTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  safeRangeTag: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "10px",
    fontWeight: 600,
    padding: "4px 8px",
    borderRadius: "6px",
    border: "1px solid transparent",
  },
  scenarioResultRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
    marginBottom: "16px",
  },
  scenarioBox: {
    backgroundColor: T.violetBg,
    border: `1px solid ${T.violetBorder}`,
    padding: "14px",
    borderRadius: "12px",
    textAlign: "center",
  },
  commentBox: {
    backgroundColor: T.bg,
    padding: "14px 18px",
    borderRadius: "12px",
    borderLeft: `4px solid ${T.violet}`,
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
    gap: "20px",
  },
  reasonRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    backgroundColor: T.bg,
    padding: "10px 14px",
    borderRadius: "8px",
  },
  dayBox: {
    backgroundColor: T.bg,
    padding: "14px",
    borderRadius: "12px",
    textAlign: "center",
  },
  enIyiEnvBox: {
    backgroundColor: T.greenBg,
    border: "1px solid transparent",
    borderColor: "#bbf7d0",
    borderRadius: "12px",
    padding: "14px",
  },
  enIyiEnvHead: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "12px",
  },
  enIyiEnvGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
  },
  enIyiEnvItem: {
    backgroundColor: "#fff",
    padding: "8px",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
    border: "1px solid #e0f2fe",
  },
};

export default TahminAnalizpage;
