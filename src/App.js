import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Anasayfapage from "./page/anasayfapage";
import Kayitpage from "./page/kayitpage";
import Girispage from "./page/girispage";

import Dashboardpage from "./page/Dashboardpage";

import GenelOzetpage from "./page/GenelOzetpage";
import HayvanlarPage from "./page/hayvanlarpage";

import SensorVerileripage from "./page/SensorVerileripage";
import SensorDataPage from "./page/SensorDataPage";
import CanliAnalizPage from "./page/CanliAnalizPage";

import SütVerileripage from "./page/SütVerileripage";
import AnlikVerimAnalizpage from "./page/AnlikVerimAnalizpage";

import KorelasyonAnalizpage from "./page/KorelasyonAnalizpage";
import AnomaliAnalizpage from "./page/AnomaliAnalizpage";
import TahminAnalizpage from "./page/TahminAnalizpage";

import Raporlamapage from "./page/Raporlamapage";
import AyarlarPage from "./page/AyarlarPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Anasayfapage />} />
        <Route path="/kayit" element={<Kayitpage />} />
        <Route path="/login" element={<Girispage />} />

        <Route path="/dashboard" element={<Dashboardpage />}>
          <Route index element={<Navigate to="genel" />} />

          <Route path="genel" element={<GenelOzetpage />} />

          <Route path="hayvanlar" element={<HayvanlarPage />} />

          <Route path="sut" element={<SütVerileripage />} />

          <Route
            path="anlik-verim"
            element={<AnlikVerimAnalizpage />}
          />

          <Route path="analiz" element={<KorelasyonAnalizpage />} />

          <Route path="anomali" element={<AnomaliAnalizpage />} />

          <Route path="tahmin" element={<TahminAnalizpage />} />

          <Route path="sensor" element={<SensorVerileripage />} />

          <Route path="sensor-data" element={<SensorDataPage />} />

          <Route
            path="canli-analiz"
            element={<CanliAnalizPage />}
          />

          <Route path="rapor" element={<Raporlamapage />} />

          <Route path="ayarlar" element={<AyarlarPage />} />

          <Route
            path="saglik"
            element={
              <div style={{ padding: "20px", color: "white" }}>
                <h2>Sağlık Kayıtları Yakında</h2>
              </div>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;