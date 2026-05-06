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

// --- SENSÖR VE DASHBOARD SAYFALARI ---
import SensorDataPage from "./page/SensorDataPage";

// --- SÜT VE ANALİZ SAYFALARI ---
import SütVerileripage from "./page/SütVerileripage"; 
import KorelasyonAnalizpage from "./page/KorelasyonAnalizpage";
import AnomaliAnalizpage from "./page/AnomaliAnalizpage"; 

// --- YAPAY ZEKA VE TAHMİN ---
import TahminAnalizpage from "./page/TahminAnalizpage"; 

// 🔥 YENİ: AYARLAR SAYFASI IMPORTU
import AyarlarPage from "./page/AyarlarPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Kamu Sayfaları */}
        <Route path="/" element={<Anasayfapage />} />
        <Route path="/kayit" element={<Kayitpage />} />
        <Route path="/login" element={<Girispage />} />

        {/* Dashboard ve Alt Sayfalar */}
        <Route path="/dashboard" element={<Dashboardpage />}>
          <Route index element={<Navigate to="genel" />} />
          
          <Route path="genel" element={<GenelOzetpage />} />
          <Route path="hayvanlar" element={<HayvanlarPage />} />
          <Route path="sut" element={<SütVerileripage />} />

          <Route path="analiz" element={<KorelasyonAnalizpage />} />
          <Route path="anomali" element={<AnomaliAnalizpage />} />
          <Route path="tahmin" element={<TahminAnalizpage />} />
          
          <Route path="sensor" element={<SensorVerileripage />} />
          <Route path="sensor-data" element={<SensorDataPage />} />

          <Route path="rapor" element={<Raporlamapage />} />

          {/* 🔥 YENİ: AYARLAR ROTASI */}
          <Route path="ayarlar" element={<AyarlarPage />} />
          
          <Route path="saglik" element={<div style={{padding: '20px'}}><h2>Sağlık Kayıtları Yakında</h2></div>} />
        </Route>

        {/* Tanımsız rotaları ana sayfaya yönlendir */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;