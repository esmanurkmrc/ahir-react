import React, { useState, useEffect } from "react";
import "../CSS/ayarlar.css";

function AyarlarPage() {
  const [user, setUser] = useState({
    id: null,
    ad: "",
    soyad: "",
    email: "",
    sifre: ""
  });

  const [alarms, setAlarms] = useState({
    kritikSicaklik: 26,
    kritikAmonyak: 25,
    kritikNem: 75
  });

  const [kayitMesaji, setKayitMesaji] = useState("");
  const [hataMesaji, setHataMesaji] = useState("");
  const [sonKayitZamani, setSonKayitZamani] = useState(null);
  const [baglantiDurumu, setBaglantiDurumu] = useState("AKTİF");

  useEffect(() => {
    // Örnek başlangıç verisi
    const localUser = localStorage.getItem("kullaniciAdi");

    if (localUser) {
      setUser((prev) => ({
        ...prev,
        ad: localUser
      }));
    }
  }, []);

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUser((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAlarmChange = (e) => {
    const { name, value } = e.target;
    setAlarms((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const profilKaydet = (e) => {
    e.preventDefault();

    try {
      setHataMesaji("");
      setKayitMesaji("Profil bilgileri başarıyla güncellendi.");
      setSonKayitZamani(new Date());
    } catch (error) {
      setKayitMesaji("");
      setHataMesaji("Profil bilgileri güncellenirken hata oluştu.");
    }
  };

  const alarmKaydet = (e) => {
    e.preventDefault();

    try {
      setHataMesaji("");
      setKayitMesaji("Alarm eşikleri başarıyla kaydedildi.");
      setSonKayitZamani(new Date());
    } catch (error) {
      setKayitMesaji("");
      setHataMesaji("Alarm ayarları kaydedilirken hata oluştu.");
    }
  };

  return (
    <div className="ayarlar-page">
      <div className="ayarlar-topbar">
        <div className="ayarlar-title-box">
          <h1>⚙️ Ayarlar Paneli</h1>
          <p>Sistem yapılandırmaları, kullanıcı bilgileri ve alarm eşikleri</p>
        </div>

        <div className="ayarlar-status-box">
          <div className="status-item">
            <span className={`status-dot ${baglantiDurumu === "AKTİF" ? "active" : "passive"}`}></span>
            <span>Sistem: <strong>{baglantiDurumu}</strong></span>
          </div>
          <div className="status-item">
            <span>
              Son kayıt:{" "}
              <strong>
                {sonKayitZamani ? sonKayitZamani.toLocaleTimeString() : "--"}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {(kayitMesaji || hataMesaji) && (
        <div className={`message-box ${kayitMesaji ? "success" : "error"}`}>
          {kayitMesaji || hataMesaji}
        </div>
      )}

      <div className="ayarlar-grid">
        {/* PROFİL */}
        <section className="settings-card">
          <header className="card-title">👤 PROFİL BİLGİLERİ</header>

          <form className="settings-form" onSubmit={profilKaydet}>
            <div className="form-row">
              <div className="form-group">
                <label>Ad</label>
                <input
                  type="text"
                  name="ad"
                  value={user.ad}
                  onChange={handleUserChange}
                  placeholder="Adınızı girin"
                />
              </div>

              <div className="form-group">
                <label>Soyad</label>
                <input
                  type="text"
                  name="soyad"
                  value={user.soyad}
                  onChange={handleUserChange}
                  placeholder="Soyadınızı girin"
                />
              </div>
            </div>

            <div className="form-group">
              <label>E-posta</label>
              <input
                type="email"
                name="email"
                value={user.email}
                onChange={handleUserChange}
                placeholder="ornek@mail.com"
              />
            </div>

            <div className="form-group">
              <label>Şifre</label>
              <input
                type="password"
                name="sifre"
                value={user.sifre}
                onChange={handleUserChange}
                placeholder="Yeni şifre girin"
              />
            </div>

            <button type="submit" className="save-btn">
              Profili Kaydet
            </button>
          </form>
        </section>

        {/* ALARM AYARLARI */}
        <section className="settings-card">
          <header className="card-title">🚨 ALARM EŞİKLERİ</header>

          <form className="settings-form" onSubmit={alarmKaydet}>
            <div className="form-group">
              <label>Kritik Sıcaklık (°C)</label>
              <input
                type="number"
                name="kritikSicaklik"
                value={alarms.kritikSicaklik}
                onChange={handleAlarmChange}
              />
            </div>

            <div className="form-group">
              <label>Kritik Amonyak (ppm)</label>
              <input
                type="number"
                name="kritikAmonyak"
                value={alarms.kritikAmonyak}
                onChange={handleAlarmChange}
              />
            </div>

            <div className="form-group">
              <label>Kritik Nem (%)</label>
              <input
                type="number"
                name="kritikNem"
                value={alarms.kritikNem}
                onChange={handleAlarmChange}
              />
            </div>

            <button type="submit" className="save-btn">
              Alarm Ayarlarını Kaydet
            </button>
          </form>
        </section>

        {/* SİSTEM ÖZETİ */}
        <section className="settings-card wide-card">
          <header className="card-title">📊 SİSTEM ÖZETİ</header>

          <div className="summary-grid">
            <div className="summary-box temp-box">
              <h3>Sıcaklık Alarmı</h3>
              <p>{alarms.kritikSicaklik} °C üstü riskli kabul edilir.</p>
            </div>

            <div className="summary-box ammonia-box">
              <h3>Amonyak Alarmı</h3>
              <p>{alarms.kritikAmonyak} ppm üstü kritik eşik olarak izlenir.</p>
            </div>

            <div className="summary-box humidity-box">
              <h3>Nem Alarmı</h3>
              <p>{alarms.kritikNem}% üstü ortam stresi oluşturabilir.</p>
            </div>

            <div className="summary-box neutral-box">
              <h3>Panel Durumu</h3>
              <p>Kullanıcı, alarm ve sistem ayarları bu ekrandan yönetilir.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AyarlarPage;