import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Anasayfapage from "./page/anasayfapage";
import Kayitpage from "./page/kayitpage";
import Girispage from "./page/girispage";
import Dashboardpage from "./page/Dashboardpage"; // Dashboard'u import ettik

function App() {
  return (
    <Router>
      <Routes>
        {/* Ana sayfa yolu */}
        <Route path="/" element={<Anasayfapage />} />
        
        {/* Kayıt sayfası yolu */}
        <Route path="/kayit" element={<Kayitpage />} />
        
        {/* Giriş sayfası yolu */}
        <Route path="/login" element={<Girispage />} />

        {/* Dashboard sayfası yolu - Yeni Eklendi */}
        <Route path="/dashboard" element={<Dashboardpage />} />
      </Routes>
    </Router>
  );
}

export default App;