import React, { useState } from "react";
import "../CSS/kayit.css";
import bgImage from "../assets/kayit.jpeg";

function Kayitpage() {
  const [formData, setFormData] = useState({
    ad: "",
    soyad: "",
    email: "",
    sifre: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "http://localhost:8080/api/users/kayit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formData)
        }
      );

      if (response.ok) {
        alert("Sisteme başarıyla kayıt olundu!");
      } else {
        const errorData = await response.json();
        alert(
          "Kayıt işlemi başarısız: " +
            (errorData.message || "Bilinmeyen hata")
        );
      }
    } catch (error) {
      console.error("Hata:", error);
      alert(
        "Sunucu bağlantı hatası! Backend çalışıyor mu kontrol edin."
      );
    }
  };

  return (
    <div className="kayit-page">

      <img src={bgImage} alt="Arka Plan" className="kayit-bg-image" />

      <div className="kayit-form-area">

        <div className="kayit-glass-card">

          <h2 className="kayit-title">Kullanıcı Kaydı</h2>

          <form className="kayit-form" onSubmit={handleSubmit}>

            <input
              type="text"
              name="ad"
              placeholder="Adınız"
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="soyad"
              placeholder="Soyadınız"
              onChange={handleChange}
              required
            />

            <input
              type="email"
              name="email"
              placeholder="E-posta Adresi"
              onChange={handleChange}
              required
            />

            <input
              type="password"
              name="sifre"
              placeholder="Şifre"
              onChange={handleChange}
              required
            />

            <button type="submit" className="kayit-btn">
              Kaydı Tamamla
            </button>

          </form>

          <p className="kayit-footer">
            Zaten üye misiniz? <a href="/login">Giriş Yap</a>
          </p>

        </div>
      </div>
    </div>
  );
}

export default Kayitpage;