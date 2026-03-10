import React, { useState } from "react";
import "../CSS/kayit.css";
import bgImage from "../assets/resim1.jpg"; 

function Kayitpage() {
  const [formData, setFormData] = useState({
    ad: "",      // Java'daki 'ad' ile aynı
    soyad: "",   // Java'daki 'soyad' ile aynı
    email: "",   // Java'daki 'email' ile aynı
    sifre: ""    // Java'daki 'sifre' ile aynı
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Portun 8080 olduğundan ve Backend'in çalıştığından emin ol
      const response = await fetch("http://localhost:8080/api/users/kayit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Sisteme başarıyla kayıt olundu!");
      } else {
        const errorData = await response.json();
        alert("Kayıt işlemi başarısız: " + (errorData.message || "Bilinmeyen hata"));
      }
    } catch (error) {
      console.error("Hata:", error);
      alert("Sunucu bağlantı hatası! Lütfen Backend'in çalıştığından emin olun.");
    }
  };

  return (
    <div className="kayit-hero" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="kayit-overlay"></div>
      
      <div className="kayit-content">
        <h1 className="kayit-main-title">AKILLI AHIR MİKROKLİMA</h1>
        <h2 className="anasayfa-text-sub">İzleme ve Analiz Sistemi</h2>
        <h2 className="kayit-sub-title">Kullanıcı Kaydı</h2>

        <div className="kayit-glass-card">
          <div className="kayit-icon">📝</div>
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
            <button type="submit" className="kayit-btn">Kaydı Tamamla</button>
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