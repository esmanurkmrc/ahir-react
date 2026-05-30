import React, { useEffect, useState } from "react";
import "../CSS/anlikVerimAnaliz.css";

function AnlikVerimAnalizpage() {
  const SENSOR_API = "http://localhost:8080/api/sensor-data/son";
  const SUT_API = "http://localhost:8080/api/sut-verim";
  const SON_50_API = "http://localhost:8080/api/sut-verim";
  const ML_API = "http://localhost:8000/predict";
  const TRAIN_API = "http://localhost:8000/train-live";
  const MODEL_STATUS_API = "http://localhost:8000/model-status";

  const [sensor, setSensor] = useState(null);
  const [tahmin, setTahmin] = useState(null);
  const [kayitlar, setKayitlar] = useState([]);
  const [modelStatus, setModelStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [kayitLoading, setKayitLoading] = useState(false);
  const [trainLoading, setTrainLoading] = useState(false);
  const [listeAcik, setListeAcik] = useState(false);
  const [mesaj, setMesaj] = useState("");
  const [sonGuncelleme, setSonGuncelleme] = useState("-");

  const [form, setForm] = useState({
    kupeNo: "",
    sutVerimi: "",
    yemTuketimi: "",
    tarih: new Date().toISOString().split("T")[0],
  });

  const fetchSensor = async () => {
    try {
      const res = await fetch(SENSOR_API);
      if (res.ok) {
        const data = await res.json();
        setSensor(data);
        setSonGuncelleme(new Date().toLocaleTimeString("tr-TR"));
      }
    } catch (error) {
      console.error("Sensör verisi alınamadı:", error);
    }
  };

  const fetchSon50 = async () => {
    try {
      const res = await fetch(SON_50_API);
      if (res.ok) {
        const data = await res.json();
        const liste = Array.isArray(data) ? data : [];
        const siraliListe = liste
          .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
          .slice(0, 50);

        setKayitlar(siraliListe);
      }
    } catch (error) {
      console.error("Süt kayıtları alınamadı:", error);
    }
  };

  const fetchModelStatus = async () => {
    try {
      const res = await fetch(MODEL_STATUS_API);
      if (res.ok) {
        const data = await res.json();
        setModelStatus(data);
      }
    } catch (error) {
      console.error("Model durumu alınamadı:", error);
    }
  };

  const tahminYap = async () => {
    if (!sensor) return;

    setLoading(true);

    const payload = {
      sicaklik: Number(sensor.sicaklik || 0),
      nem: Number(sensor.nem || 0),
      amonyak: Number(sensor.amonyak || 0),
      isik: Number(sensor.isik || 0),
      yem_tuketimi: Number(form.yemTuketimi || 6),
    };

    try {
      const res = await fetch(ML_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setTahmin(data);
      }
    } catch (error) {
      console.error("ML tahmin hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  const modeliGuncelle = async () => {
    setTrainLoading(true);
    setMesaj("");

    try {
      const res = await fetch(TRAIN_API, { method: "POST" });

      if (res.ok) {
        const data = await res.json();
        setModelStatus(data);

        if (data.durum === "Model güncellendi") {
          setMesaj("Model son kayıtlarla güncellendi.");
          tahminYap();
        } else {
          setMesaj(data.mesaj || "Model işlemi tamamlandı.");
        }

        fetchModelStatus();
      } else {
        setMesaj("Model güncellenemedi.");
      }
    } catch (error) {
      console.error("Model güncelleme hatası:", error);
      setMesaj("FastAPI bağlantısı kurulamadı.");
    } finally {
      setTrainLoading(false);
    }
  };

  const kayitEkle = async (e) => {
    e.preventDefault();
    setKayitLoading(true);
    setMesaj("");

    const payload = {
      kupeNo: form.kupeNo,
      sutVerimi: Number(form.sutVerimi),
      yemTuketimi: Number(form.yemTuketimi),
      tarih: form.tarih,
    };

    try {
      const res = await fetch(SUT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMesaj("Süt verimi kaydedildi.");
        setForm({
          kupeNo: "",
          sutVerimi: "",
          yemTuketimi: "",
          tarih: new Date().toISOString().split("T")[0],
        });
        fetchSon50();
        setListeAcik(true);
      } else {
        setMesaj("Kayıt eklenemedi.");
      }
    } catch (error) {
      console.error("Kayıt hatası:", error);
      setMesaj("Backend bağlantı hatası.");
    } finally {
      setKayitLoading(false);
    }
  };

  useEffect(() => {
    fetchSensor();
    fetchSon50();
    fetchModelStatus();

    const interval = setInterval(() => {
      fetchSensor();
      fetchSon50();
      fetchModelStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (sensor) tahminYap();
  }, [sensor]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const thi = sensor
    ? 1.8 * Number(sensor.sicaklik || 0) +
      32 -
      (0.55 - 0.0055 * Number(sensor.nem || 0)) *
        (1.8 * Number(sensor.sicaklik || 0) - 26)
    : 0;

  const tahminiSut = tahmin
    ? Number(tahmin.tahmin_edilen_sut || tahmin.tahmin || 0).toFixed(1)
    : "--";

  const durum = tahmin ? tahmin.durum || "Analiz tamamlandı" : "Veri bekleniyor";

  const riskliMi =
    durum.toLowerCase().includes("risk") ||
    durum.toLowerCase().includes("düşük") ||
    thi >= 72 ||
    Number(sensor?.amonyak || 0) > 25;

  const getVerimYorumu = () => {
    if (!sensor) return "Anlık sensör verisi bekleniyor.";

    const sicaklik = Number(sensor.sicaklik || 0);
    const nem = Number(sensor.nem || 0);
    const amonyak = Number(sensor.amonyak || 0);
    const yem = Number(form.yemTuketimi || 6);

    if (sicaklik >= 30 && nem >= 70 && amonyak > 25) {
      return "Yüksek sıcaklık, yüksek nem ve amonyak artışı nedeniyle süt veriminde düşüş beklenmektedir.";
    }

    if (sicaklik >= 30 && nem >= 70) {
      return "Sıcaklık ve nem birlikte yükseldiği için ısı stresi riski oluşabilir. Bu durum süt verimini düşürebilir.";
    }

    if (amonyak > 25) {
      return "Amonyak seviyesi kritik sınırın üzerinde olduğu için hayvan konforu düşebilir ve süt veriminde azalma beklenebilir.";
    }

    if (thi >= 72) {
      return "THI değeri ısı stresi sınırına yakındır. Süt veriminde azalma eğilimi oluşabilir.";
    }

    if (yem < 5) {
      return "Yem tüketimi düşük olduğu için model süt veriminde düşüş bekleyebilir.";
    }

    if (sicaklik >= 18 && sicaklik <= 26 && nem < 70 && amonyak <= 25 && thi < 72) {
      return "Sıcaklık, nem ve amonyak uygun aralıkta olduğu için süt veriminde normal ya da artış yönlü durum beklenebilir.";
    }

    return "Anlık değerler genel olarak kabul edilebilir seviyededir. Süt veriminin normal seyretmesi beklenmektedir.";
  };

  const getSaglikYorumu = () => {
    if (!sensor) {
      return {
        risk: "Veri Bekleniyor",
        mesaj: "Sensör verisi alındığında sağlık ve konfor yorumu oluşturulacaktır.",
        oneriler: ["Sensör bağlantısını kontrol et"],
      };
    }

    const sicaklik = Number(sensor.sicaklik || 0);
    const nem = Number(sensor.nem || 0);
    const amonyak = Number(sensor.amonyak || 0);
    const isik = Number(sensor.isik || 0);

    if (amonyak > 25 && sicaklik >= 30 && nem >= 70) {
      return {
        risk: "Yüksek Risk",
        mesaj:
          "Amonyak, sıcaklık ve nem birlikte yüksek seviyededir. Bu durum solunum problemi, ısı stresi ve genel konfor düşüşü riski oluşturabilir.",
        oneriler: ["Havalandırmayı aç", "Fan sistemini çalıştır", "Ahır temizliğini kontrol et"],
      };
    }

    if (amonyak > 25) {
      return {
        risk: "Orta Risk",
        mesaj:
          "Amonyak seviyesi kritik sınırın üzerindedir. Uzun süre devam ederse hayvan sağlığı ve solunum konforu olumsuz etkilenebilir.",
        oneriler: ["Havalandırmayı artır", "Gübre temizliğini kontrol et"],
      };
    }

    if (sicaklik >= 30 && nem >= 70) {
      return {
        risk: "Orta Risk",
        mesaj:
          "Sıcaklık ve nem değerleri birlikte yükselmiştir. Isı stresi riski oluşabilir.",
        oneriler: ["Fanları çalıştır", "Su erişimini kontrol et"],
      };
    }

    if (thi >= 72) {
      return {
        risk: "Dikkat",
        mesaj:
          "THI değeri risk sınırına yaklaşmıştır. Hayvan konforu dikkatle izlenmelidir.",
        oneriler: ["Ortam sıcaklığını takip et", "Serinletme önlemlerini hazırla"],
      };
    }

    if (isik < 50) {
      return {
        risk: "Düşük Risk",
        mesaj:
          "Işık seviyesi düşüktür. Ortam takibi ve hayvan aktivitesi açısından aydınlatma kontrol edilmelidir.",
        oneriler: ["Aydınlatmayı kontrol et"],
      };
    }

    return {
      risk: "Risk Yok",
      mesaj:
        "Sensör değerleri normal aralıklardadır. Hayvan konforu uygun görünmektedir.",
      oneriler: ["Sistemi izlemeye devam et"],
    };
  };

  const getGrafikNoktalari = () => {
    const sonVeriler = kayitlar.slice(0, 10).reverse();

    if (sonVeriler.length === 0) return "";

    const degerler = sonVeriler.map((item) => Number(item.sutVerimi || 0));
    const max = Math.max(...degerler, 5);
    const min = Math.min(...degerler, 0);

    return degerler
      .map((deger, index) => {
        const x = sonVeriler.length === 1 ? 250 : (index / (sonVeriler.length - 1)) * 500;
        const y = 140 - ((deger - min) / (max - min || 1)) * 110;
        return `${x},${y}`;
      })
      .join(" ");
  };

  const verimYorumu = getVerimYorumu();
  const saglikYorumu = getSaglikYorumu();
  const grafikNoktalari = getGrafikNoktalari();

  return (
    <div className="anlik-verim-page">
      <div className="av-hero">
        <div>
          <span className="av-live-dot">Canlı ML Analizi</span>
          <h1>Anlık Verim Analizi</h1>
          <p>Sensör verisi, süt kaydı ve makine öğrenmesi tek ekranda.</p>
        </div>

        <div className={`av-prediction ${riskliMi ? "risk" : "safe"}`}>
          <span>Tahmini Süt</span>
          <strong>{tahminiSut} L</strong>
          <small>{durum}</small>
        </div>
      </div>

      <div className="av-metrics">
        <div>
          <span>Sıcaklık</span>
          <strong>{sensor ? Number(sensor.sicaklik || 0).toFixed(1) : "0.0"}°C</strong>
        </div>

        <div>
          <span>Nem</span>
          <strong>%{sensor ? Number(sensor.nem || 0).toFixed(1) : "0.0"}</strong>
        </div>

        <div>
          <span>Amonyak</span>
          <strong>{sensor ? Number(sensor.amonyak || 0).toFixed(1) : "0.0"} ppm</strong>
        </div>

        <div>
          <span>THI</span>
          <strong>{thi.toFixed(1)}</strong>
        </div>
      </div>

      <div className="av-main-grid">
        <form className="av-form-card" onSubmit={kayitEkle}>
          <div className="av-card-head">
            <div>
              <h2>Süt Verimi Kaydı</h2>
              <p>Gerçek günlük verimi gir.</p>
            </div>
            <span>Manuel</span>
          </div>

          <div className="av-form-grid">
            <label>
              Küpe No
              <input name="kupeNo" value={form.kupeNo} onChange={handleChange} placeholder="101" required />
            </label>

            <label>
              Süt Verimi (L)
              <input name="sutVerimi" type="number" step="0.1" value={form.sutVerimi} onChange={handleChange} placeholder="4.5" required />
            </label>

            <label>
              Yem (kg)
              <input name="yemTuketimi" type="number" step="0.1" value={form.yemTuketimi} onChange={handleChange} placeholder="4.2" required />
            </label>

            <label>
              Tarih
              <input name="tarih" type="date" value={form.tarih} onChange={handleChange} required />
            </label>
          </div>

          <button type="submit" disabled={kayitLoading}>
            {kayitLoading ? "Kaydediliyor..." : "Kaydet"}
          </button>

          {mesaj && <div className="av-message">{mesaj}</div>}
        </form>

        <div className="av-analysis-card">
          <div className="av-card-head">
            <div>
              <h2>ML Sonucu</h2>
              <p>{verimYorumu}</p>
            </div>
          </div>

          <div className="av-status-grid">
            <div>
              <span>Model</span>
              <strong>{loading ? "Çalışıyor" : modelStatus?.durum || "Hazır"}</strong>
            </div>

            <div>
              <span>Son 50 Veri</span>
              <strong>{kayitlar.length}/50</strong>
            </div>

            <div>
              <span>R²</span>
              <strong>{modelStatus?.r2_skoru !== null && modelStatus?.r2_skoru !== undefined ? modelStatus.r2_skoru : "-"}</strong>
            </div>

            <div>
              <span>Güncelleme</span>
              <strong>{sonGuncelleme}</strong>
            </div>
          </div>

          <div className="av-actions">
            <button onClick={tahminYap} disabled={loading || !sensor}>
              {loading ? "Analiz..." : "Tekrar Analiz Et"}
            </button>

            <button onClick={modeliGuncelle} disabled={trainLoading || kayitlar.length < 5}>
              {trainLoading ? "Güncelleniyor..." : "Modeli Güncelle"}
            </button>

            <button type="button" onClick={() => setListeAcik(!listeAcik)}>
              {listeAcik ? "Kayıtları Gizle" : "Süt Verimi Kayıtlarını Listele"}
            </button>
          </div>
        </div>
      </div>

      <div className="av-extra-grid">
        <div className="av-health-card">
          <div className="av-card-head">
            <div>
              <h2>Sağlık ve Konfor Yorumu</h2>
              <p>{saglikYorumu.risk}</p>
            </div>
          </div>

          <div className="av-health-content">
            <p>{saglikYorumu.mesaj}</p>

            <div className="av-health-actions">
              {saglikYorumu.oneriler.map((item, index) => (
                <span key={index}>{item}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="av-chart-card">
          <div className="av-card-head">
            <div>
              <h2>Son 10 Süt Verimi</h2>
              <p>Kayıtlara göre mini trend grafiği.</p>
            </div>
          </div>

          <div className="av-chart-box">
            {grafikNoktalari ? (
              <svg viewBox="0 0 500 160" preserveAspectRatio="none">
                <polyline points={grafikNoktalari} fill="none" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <div className="av-chart-empty">Grafik için kayıt bekleniyor.</div>
            )}
          </div>
        </div>
      </div>

      {listeAcik && (
        <div className="av-table-card">
          <div className="av-card-head">
            <div>
              <h2>Süt Verimi Kayıtları</h2>
              <p>Son kayıtlar model güncelleme için kullanılır.</p>
            </div>
          </div>

          <div className="av-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Küpe No</th>
                  <th>Süt</th>
                  <th>Yem</th>
                  <th>Tarih</th>
                </tr>
              </thead>

              <tbody>
                {kayitlar.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-row">
                      Henüz kayıt bulunamadı.
                    </td>
                  </tr>
                ) : (
                  kayitlar.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.kupeNo}</td>
                      <td>{Number(item.sutVerimi || 0).toFixed(1)} L</td>
                      <td>{Number(item.yemTuketimi || 0).toFixed(1)} kg</td>
                      <td>{item.tarih}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnlikVerimAnalizpage;