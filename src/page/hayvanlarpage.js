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

  const [tur, setTur] = useState("inek");
  const [editId, setEditId] = useState(null);

  // Backend’den hayvanları çek
  const hayvanlariGetir = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/hayvanlar");
      setHayvanlar(response.data);
    } catch (error) {
      console.error("Hayvanlar alınamadı", error);
      alert("Veriler çekilirken bir hata oluştu. Lütfen bağlantınızı kontrol edin.");
    }
  };

  const handleChange = (e) => {
    setYeniHayvan({
      ...yeniHayvan,
      [e.target.name]: e.target.value,
    });
  };

  const hayvanEkle = async () => {
    try {
      if (editId) {
        // Güncelleme
        await axios.put(`http://localhost:8080/api/hayvanlar/${editId}`, yeniHayvan);
        setEditId(null);
      } else {
        // Yeni ekleme
        await axios.post(`http://localhost:8080/api/hayvanlar/${tur}`, yeniHayvan);
      }

      hayvanlariGetir(); // İşlem sonrası listeyi yenile
      setYeniHayvan({
        kupeNo: "", irk: "", cinsiyet: "", dogumTarihi: "",
        durum: "", sonAgirlik: "", gunlukSutVerimi: "", asiTakvimi: "",
      });
    } catch (error) {
      console.error("Hata oluştu", error);
      alert("İşlem sırasında bir hata oluştu.");
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
    // Düzenle butonuna basınca sayfa en üste (forma) yumuşak geçiş yapar
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const iptalEt = () => {
    setEditId(null);
    setYeniHayvan({
      kupeNo: "", irk: "", cinsiyet: "", dogumTarihi: "",
      durum: "", sonAgirlik: "", gunlukSutVerimi: "", asiTakvimi: "",
    });
  };

  return (
    <div className="hayvan-container">
      <h1>🐄 Hayvan Yönetimi</h1>

      <div className="layout-wrapper">
        {/* --- SOL TARAF: FORM --- */}
        <div className="hayvan-ekle">
          <h2>{editId ? "✍️ Hayvanı Güncelle" : "➕ Yeni Hayvan Ekle"}</h2>
          
          <div className="input-group">
            <input type="text" name="kupeNo" placeholder="Küpe No" value={yeniHayvan.kupeNo} onChange={handleChange} />
            <input type="text" name="irk" placeholder="Irk" value={yeniHayvan.irk} onChange={handleChange} />
            
            <select name="cinsiyet" value={yeniHayvan.cinsiyet} onChange={handleChange}>
              <option value="">Cinsiyet Seçin</option>
              <option value="Disi">Dişi</option>
              <option value="Erkek">Erkek</option>
            </select>

            <input type="date" name="dogumTarihi" value={yeniHayvan.dogumTarihi} onChange={handleChange} />
            <input type="text" name="durum" placeholder="Sağlık Durumu (Örn: Sağlıklı)" value={yeniHayvan.durum} onChange={handleChange} />
            <input type="number" name="sonAgirlik" placeholder="Son Ağırlık (kg)" value={yeniHayvan.sonAgirlik} onChange={handleChange} />
            <input type="number" name="gunlukSutVerimi" placeholder="Günlük Süt (L)" value={yeniHayvan.gunlukSutVerimi} onChange={handleChange} />
            <input type="text" name="asiTakvimi" placeholder="Aşı Takvimi" value={yeniHayvan.asiTakvimi} onChange={handleChange} />

            {/* Düzenleme modunda tür değiştirilemez, sadece eklerken gösterilir */}
            {!editId && (
              <select value={tur} onChange={(e) => setTur(e.target.value)} className="tur-select">
                <option value="inek">İnek</option>
                <option value="koyun">Koyun</option>
                <option value="keci">Keçi</option>
              </select>
            )}
          </div>

          <button className="save-btn" onClick={hayvanEkle}>
            {editId ? "Değişiklikleri Kaydet" : "Hayvanı Sisteme Ekle"}
          </button>
          
          {editId && (
            <button className="cancel-btn" onClick={iptalEt}>
              İptal
            </button>
          )}
        </div>

        {/* --- SAĞ TARAF: LİSTE --- */}
        <div className="hayvan-listesi">
          <div className="liste-ust-bar">
            <h2>Kayıtlı Hayvanlar</h2>
            <button className="listele-btn" onClick={hayvanlariGetir}>
              🔍 Verileri Listele
            </button>
          </div>

          {hayvanlar.length > 0 ? (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
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
                      <td><strong>{hayvan.kupeNo}</strong></td>
                      <td>{hayvan.irk}</td>
                      <td>{hayvan.cinsiyet === "Disi" ? "Dişi" : "Erkek"}</td>
                      <td>
                        <span className={`status-badge ${hayvan.durum?.toLowerCase().includes('sağlıklı') ? 'healthy' : 'warning'}`}>
                          {hayvan.durum}
                        </span>
                      </td>
                      <td>{hayvan.sonAgirlik} kg</td>
                      <td>{hayvan.gunlukSutVerimi} L</td>
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
              <p>Tabloyu görüntülemek için yukarıdaki <strong>"Verileri Listele"</strong> butonuna tıklayın.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HayvanlarPage;