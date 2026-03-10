import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Link ve useNavigate eklendi
import "../CSS/giris.css";

function Girispage() {
  const [formData, setFormData] = useState({
    email: "",
    sifre: ""
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:8080/api/users/giris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const user = await response.json();
        
        // Giriş yapan kullanıcının adını Dashboard'da göstermek için kaydediyoruz
        localStorage.setItem("kullaniciAdi", user.ad); 
        
        alert("Giriş Başarılı! Hoş geldin " + user.ad);
        navigate("/dashboard"); // Dashboard'a yönlendir
      } else {
        alert("E-posta veya şifre hatalı.");
      }
    } catch (error) {
      console.error("Hata:", error);
      alert("Sunucuya bağlanılamadı! Backend'in çalıştığından emin olun.");
    }
  };

  return (
    <div className="giris-body">
      <div className="giris-container">
        <div className="giris-glass-card">
          <div className="giris-header">
            <h1 className="logo-text">AKILLI AHIR</h1>
            <p className="sub-text">İzleme ve Analiz Sistemi</p>
            <h2 className="title">Kullanıcı Girişi</h2>
          </div>

          <form className="giris-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <input 
                type="email" 
                name="email" 
                placeholder="E-posta Adresi" 
                value={formData.email}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="input-group">
              <input 
                type="password" 
                name="sifre" 
                placeholder="Şifre" 
                value={formData.sifre}
                onChange={handleChange}
                required 
              />
            </div>
            
            <button type="submit" className="giris-button">Giriş Yap</button>
          </form>

          <div className="giris-footer">
            <p>Hesabınız yok mu? <Link to="/kayit">Kayıt Ol</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Girispage;