import React, { useState } from "react";
import axios from "axios";
import "../CSS/hayvanlar.css";

function HayvanlarPage() {
  const [hayvanlar, setHayvanlar] = useState([]);

  const [yeniHayvan, setYeniHayvan] = useState({
    kupeNo: "",
    irk: "",
    cinsiyet: "",
    dogumTarihi: "",
    durum: "",
    sonAgirlik: "",
    gunlukSutVerimi: "",
    asiTakvimi: "",
  });

  const [verimKaydi, setVerimKaydi] = useState({
    tarih: "",
    saat: "",
    hayvanId: "",
    yemTuketimi: "",
    sutVerimi: "",
  });

  const [tur, setTur] = useState("inek");
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const hayvanlariGetir = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8080/api/hayvanlar");
      setHayvanlar(response.data);
    } catch (error) {
      console.error("Hayvanlar alınamadı", error);
      alert("Veriler çekilirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setYeniHayvan({
      ...yeniHayvan,
      [e.target.name]: e.target.value,
    });
  };

  const handleVerimChange = (e) => {
    setVerimKaydi({
      ...verimKaydi,
      [e.target.name]: e.target.value,
    });
  };

  const hayvanEkle = async () => {
    try {
      if (editId) {
        await axios.put(`http://localhost:8080/api/hayvanlar/${editId}`, yeniHayvan);
        setEditId(null);
      } else {
        await axios.post(`http://localhost:8080/api/hayvanlar/${tur}`, yeniHayvan);
      }

      hayvanlariGetir();

      setYeniHayvan({
        kupeNo: "",
        irk: "",
        cinsiyet: "",
        dogumTarihi: "",
        durum: "",
        sonAgirlik: "",
        gunlukSutVerimi: "",
        asiTakvimi: "",
      });
    } catch (error) {
      console.error("Hata oluştu", error);
      alert("İşlem sırasında bir hata oluştu.");
    }
  };

  const verimKaydiEkle = async () => {
    if (
      !verimKaydi.tarih ||
      !verimKaydi.saat ||
      !verimKaydi.hayvanId ||
      !verimKaydi.yemTuketimi ||
      !verimKaydi.sutVerimi
    ) {
      alert("Lütfen süt/yem kaydı için tüm alanları doldurun.");
      return;
    }

    try {
      const sut = Number(verimKaydi.sutVerimi);

      await axios.post("http://localhost:8080/api/analysis-productivity", {
        tarih: verimKaydi.tarih,
        saat: verimKaydi.saat,
        hayvanId: Number(verimKaydi.hayvanId),
        yemTuketimi: Number(verimKaydi.yemTuketimi),
        sutVerimi: sut,
        durum: sut < 3 ? "Düşük Verim" : sut < 4 ? "Orta Verim" : "Normal Verim",
      });

      alert("Süt ve yem verisi kaydedildi.");

      setVerimKaydi({
        tarih: "",
        saat: "",
        hayvanId: "",
        yemTuketimi: "",
        sutVerimi: "",
      });
    } catch (error) {
      console.error("Verim kaydı eklenemedi", error);
      alert("Süt/yem kaydı eklenirken hata oluştu.");
    }
  };

  const hayvanSil = async (id) => {
    if (window.confirm("Bu hayvan kaydını silmek istediğinize emin misiniz?")) {
      try {
        await axios.delete(`http://localhost:8080/api/hayvanlar/${id}`);
        hayvanlariGetir();
      } catch (error) {
        console.error("Silme hatası", error);
      }
    }
  };

  const hayvanDuzenle = (hayvan) => {
    setYeniHayvan({ ...hayvan });
    setEditId(hayvan.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const iptalEt = () => {
    setEditId(null);
    setYeniHayvan({
      kupeNo: "",
      irk: "",
      cinsiyet: "",
      dogumTarihi: "",
      durum: "",
      sonAgirlik: "",
      gunlukSutVerimi: "",
      asiTakvimi: "",
    });
  };

  return (
    <div className="hayvan-page">
      <div className="hayvan-hero">
        <div>
          <span className="hero-badge">🐄 Akıllı Çiftlik Yönetimi</span>
          <h1>Hayvan Yönetimi</h1>
          <p>
            Hayvan kayıtlarını yönet, süt ve yem verilerini sisteme ekle,
            üretim takibini tek ekrandan kontrol et.
          </p>
        </div>

      </div>

      <div className="hayvan-grid">
        <div className="form-card">
          <div className="card-header">
            <div>
              <h2>{editId ? "Hayvan Bilgilerini Güncelle" : "Yeni Hayvan Ekle"}</h2>
              <p>Kimlik, sağlık ve üretim bilgilerini gir.</p>
            </div>
            <span>{editId ? "Düzenleme" : "Yeni Kayıt"}</span>
          </div>

          <div className="input-grid">
            <input type="text" name="kupeNo" placeholder="Küpe No" value={yeniHayvan.kupeNo} onChange={handleChange} />
            <input type="text" name="irk" placeholder="Irk" value={yeniHayvan.irk} onChange={handleChange} />

            <select name="cinsiyet" value={yeniHayvan.cinsiyet} onChange={handleChange}>
              <option value="">Cinsiyet Seçin</option>
              <option value="Disi">Dişi</option>
              <option value="Erkek">Erkek</option>
            </select>

            <input type="date" name="dogumTarihi" value={yeniHayvan.dogumTarihi} onChange={handleChange} />
            <input type="text" name="durum" placeholder="Sağlık Durumu" value={yeniHayvan.durum} onChange={handleChange} />
            <input type="number" name="sonAgirlik" placeholder="Son Ağırlık (kg)" value={yeniHayvan.sonAgirlik} onChange={handleChange} />
            <input type="number" name="gunlukSutVerimi" placeholder="Günlük Süt (L)" value={yeniHayvan.gunlukSutVerimi} onChange={handleChange} />
            <input type="text" name="asiTakvimi" placeholder="Aşı Takvimi" value={yeniHayvan.asiTakvimi} onChange={handleChange} />

            {!editId && (
              <select value={tur} onChange={(e) => setTur(e.target.value)}>
                <option value="inek">İnek</option>
                <option value="koyun">Koyun</option>
                <option value="keci">Keçi</option>
              </select>
            )}
          </div>

          <div className="button-row">
            <button className="primary-btn" onClick={hayvanEkle}>
              {editId ? "Değişiklikleri Kaydet" : "Hayvanı Sisteme Ekle"}
            </button>

            {editId && (
              <button className="secondary-btn" onClick={iptalEt}>
                İptal
              </button>
            )}
          </div>
        </div>

        <div className="form-card verim-card">
          <div className="card-header">
            <div>
              <h2>Manuel Süt/Yem Kaydı</h2>
              <p>Geçmiş analiz ve ML için üretim verisi ekle.</p>
            </div>
            <span>Verim</span>
          </div>

          <div className="input-grid">
            <input type="date" name="tarih" value={verimKaydi.tarih} onChange={handleVerimChange} />
            <input type="time" name="saat" value={verimKaydi.saat} onChange={handleVerimChange} />
            <input type="number" name="hayvanId" placeholder="Hayvan ID" value={verimKaydi.hayvanId} onChange={handleVerimChange} />
            <input type="number" name="yemTuketimi" placeholder="Yem Tüketimi (kg)" value={verimKaydi.yemTuketimi} onChange={handleVerimChange} />
            <input type="number" name="sutVerimi" placeholder="Süt Verimi (L)" value={verimKaydi.sutVerimi} onChange={handleVerimChange} />
          </div>

          <button className="primary-btn full-btn" onClick={verimKaydiEkle}>
            Süt/Yem Kaydını Ekle
          </button>
        </div>
      </div>

      <div className="list-card">
        <div className="list-header">
          <div>
            <h2>Kayıtlı Hayvanlar</h2>
            <p>Sisteme eklenen hayvanların temel bilgileri.</p>
          </div>

          <button className="list-btn" onClick={hayvanlariGetir}>
            {loading ? "Yükleniyor..." : "Verileri Listele"}
          </button>
        </div>

        {hayvanlar.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Küpe No</th>
                  <th>Irk</th>
                  <th>Cinsiyet</th>
                  <th>Durum</th>
                  <th>Ağırlık</th>
                  <th>Süt</th>
                  <th>İşlem</th>
                </tr>
              </thead>

              <tbody>
                {hayvanlar.map((hayvan) => (
                  <tr key={hayvan.id}>
                    <td>{hayvan.id}</td>
                    <td><strong>{hayvan.kupeNo}</strong></td>
                    <td>{hayvan.irk}</td>
                    <td>{hayvan.cinsiyet === "Disi" ? "Dişi" : "Erkek"}</td>
                    <td>
                      <span className={`status-badge ${hayvan.durum?.toLowerCase().includes("sağlıklı") ? "healthy" : "warning"}`}>
                        {hayvan.durum || "Belirsiz"}
                      </span>
                    </td>
                    <td>{hayvan.sonAgirlik || "-"} kg</td>
                    <td>{hayvan.gunlukSutVerimi || "-"} L</td>
                    <td className="actions">
                      <button className="edit-btn" onClick={() => hayvanDuzenle(hayvan)}>Güncelle</button>
                      <button className="delete-btn" onClick={() => hayvanSil(hayvan.id)}>Sil</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div>📋</div>
            <h3>Henüz tablo görüntülenmiyor</h3>
            <p>Hayvan kayıtlarını görmek için “Verileri Listele” butonuna tıklayın.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default HayvanlarPage;