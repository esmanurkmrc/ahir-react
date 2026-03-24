import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Sayfa Importları
import Anasayfapage from "./page/anasayfapage";
import Kayitpage from "./page/kayitpage";
import Girispage from "./page/girispage";
import Dashboardpage from "./page/Dashboardpage";
import HayvanlarPage from "./page/hayvanlarpage";
import GenelOzetpage from "./page/GenelOzetpage"; 
import SensorVerileripage from "./page/SensorVerileripage"; 
import Raporlamapage from "./page/Raporlamapage"; 

// --- SÜT VE ANALİZ SAYFALARI IMPORTLARI ---
import SütVerileripage from "./page/SütVerileripage"; 
import KorelasyonAnalizpage from "./page/KorelasyonAnalizpage";
import AnomaliAnalizpage from "./page/AnomaliAnalizpage"; // SİSTEM ZEKASI SAYFASI EKLENDİ

function App() {
  return (
    <Router>
      <Routes>
        {/* Kamu Alanı Sayfaları */}
        <Route path="/" element={<Anasayfapage />} />
        <Route path="/kayit" element={<Kayitpage />} />
        <Route path="/login" element={<Girispage />} />

        {/* Dashboard ve Nested (İç İçe) Yollar */}
        <Route path="/dashboard" element={<Dashboardpage />}>
          {/* Dashboard açıldığında direkt genel özete yönlendir */}
          <Route index element={<Navigate to="genel" />} />
          
          <Route path="genel" element={<GenelOzetpage />} />
          <Route path="hayvanlar" element={<HayvanlarPage />} />
          
          <Route path="sut" element={<SütVerileripage />} />

          {/* --- KORELASYON ANALİZİ YOLU --- */}
          <Route path="analiz" element={<KorelasyonAnalizpage />} />

          {/* --- SİSTEM ZEKASI (ANOMALİ) YOLU BURAYA EKLENDİ --- */}
          <Route path="anomali" element={<AnomaliAnalizpage />} />
          
          <Route path="sensor" element={<SensorVerileripage />} />
          <Route path="rapor" element={<Raporlamapage />} />
          
          <Route path="saglik" element={<div className="placeholder-section" style={{padding: '20px'}}><h2>Sağlık Kayıtları Yakında</h2></div>} />
        </Route>

        {/* Tanımlanmamış yolları ana sayfaya yönlendir */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;