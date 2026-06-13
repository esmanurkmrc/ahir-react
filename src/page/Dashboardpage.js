import React, { useState, useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import "../CSS/dashboard.css";

function Dashboardpage() {
 const navigate = useNavigate();
 const location = useLocation();

 const [kullaniciIsmi, setKullaniciIsmi] = useState("");
 const [sonGuncelleme, setSonGuncelleme] = useState("-");

 const [stats, setStats] = useState({
   amonyak: 0,
   sicaklik: 0,
   nem: 0,
   riskSkoru: 0,
   gunlukSutVerimi: 0,
   durumMesaji: "Sistem Aktif",
 });

 const [thi, setThi] = useState(0);

 const currentPath = location.pathname.split("/").pop();
 const genelSayfaMi = currentPath === "genel";

 const hesaplaTHI = (sicaklik, nem) => {
   const T = Number(sicaklik || 0);
   const RH = Number(nem || 0);
   return 1.8 * T + 32 - (0.55 - 0.0055 * RH) * (1.8 * T - 26);
 };

 const hesaplaRiskSkoru = (thi, amonyak, sicaklik) => {
   let risk = 0;

   if (thi >= 75) risk += 50;
   else if (thi >= 72) risk += 30;
   else if (thi >= 68) risk += 10;

   const nh3 = Number(amonyak || 0);
   if (nh3 > 35) risk += 30;
   else if (nh3 > 25) risk += 20;
   else if (nh3 > 15) risk += 10;

   const temp = Number(sicaklik || 0);
   if (temp >= 35) risk += 20;
   else if (temp >= 30) risk += 10;
   else if (temp >= 27) risk += 5;

   return Math.min(risk, 100);
 };

 const fetchStats = async () => {
   try {
     const response = await fetch("http://localhost:8080/api/sensor-data/son");

     if (response.ok) {
       const data = await response.json();

       const thiDegeri = hesaplaTHI(data.sicaklik, data.nem);
       setThi(thiDegeri);

       const riskDegeri = hesaplaRiskSkoru(thiDegeri, data.amonyak, data.sicaklik);
       setStats({ ...data, riskSkoru: riskDegeri });

       setSonGuncelleme(new Date().toLocaleTimeString("tr-TR"));
     }
   } catch (error) {
     console.error("Veri senkronizasyon hatası:", error);
   }
 };

 useEffect(() => {
   const isim = localStorage.getItem("kullaniciAdi");
   setKullaniciIsmi(isim || "Mühendis");

   fetchStats();

   const interval = setInterval(fetchStats, 30000);

   return () => clearInterval(interval);
 }, []);

 const getAmonyakColor = (val) =>
   Number(val) > 25 ? "#ff4757" : "#2ed573";

 const getRiskColor = (val) => {
   const risk = Number(val || 0);
   if (risk >= 75) return "#ff4757";
   if (risk >= 50) return "#ffa502";
   return "#2ed573";
 };

 const getRiskText = (val) => {
   const risk = Number(val || 0);
   if (risk >= 75) return "Kritik Risk";
   if (risk >= 50) return "Orta Risk";
   return "Normal";
 };

 const getThiColor = (val) => {
   if (val >= 75) return "#ff4757";
   if (val >= 72) return "#ffa502";
   return "#2ed573";
 };

 const getThiText = (val) => {
   if (val >= 75) return "Kritik Isı Stresi";
   if (val >= 72) return "Isı Stresi Riski";
   return "Normal Konfor";
 };

 const getThiIcon = (val) => {
   if (val >= 75) return "🔴";
   if (val >= 72) return "🟡";
   return "🟢";
 };

 const getKritikUyarilar = () => {
   const uyarilar = [];

   if (thi >= 72) {
     uyarilar.push({
       baslik: "THI kritik seviyeye yaklaştı",
       aciklama: `Mevcut THI değeri ${thi.toFixed(1)} olarak hesaplandı.`,
       renk: getThiColor(thi),
     });
   }

   if (Number(stats.amonyak || 0) > 25) {
     uyarilar.push({
       baslik: "Amonyak seviyesi yüksek",
       aciklama: `NH3 değeri ${Number(stats.amonyak || 0).toFixed(1)} ppm seviyesinde.`,
       renk: "#ff4757",
     });
   }

   if (Number(stats.sicaklik || 0) >= 30) {
     uyarilar.push({
       baslik: "Sıcaklık kritik seviyede",
       aciklama: `Ahır içi sıcaklık ${Number(stats.sicaklik || 0).toFixed(1)} °C.`,
       renk: "#ff4757",
     });
   }

   if (uyarilar.length === 0) {
     uyarilar.push({
       baslik: "Sistem normal çalışıyor",
       aciklama: "Kritik seviyede çevresel risk tespit edilmedi.",
       renk: "#2ed573",
     });
   }

   return uyarilar;
 };

 const kritikUyarilar = getKritikUyarilar();

 const handleLogout = () => {
   localStorage.removeItem("kullaniciAdi");
   navigate("/login");
 };

 return (
   <div
     className="dashboard-container"
     style={{
       display: "flex",
       height: "100vh",
       backgroundColor: "#f1f2f6",
     }}
   >
     <aside
       style={{
         width: "280px",
         minWidth: "280px",
         height: "100vh",
         backgroundColor: "#2f3542",
         color: "#ffffff",
         display: "flex",
         flexDirection: "column",
         boxShadow: "4px 0 10px rgba(0,0,0,0.2)",
         overflow: "hidden",
       }}
     >
       <div
         style={{
           padding: "28px 20px",
           textAlign: "center",
           background: "#222f3e",
         }}
       >
         <h1
           style={{
             fontSize: "18px",
             margin: 0,
             fontWeight: "700",
             letterSpacing: "1px",
             lineHeight: "1.4",
           }}
         >
           AKILLI AHIR <br />
           <span
             style={{
               fontSize: "11px",
               color: "#54a0ff",
               fontWeight: "400",
             }}
           >
             MİKROKLİMA İZLEME VE ANALİZ SİSTEMİ
           </span>
         </h1>
       </div>

       <nav
         style={{
           flex: 1,
           marginTop: "12px",
           overflowY: "auto",
           paddingBottom: "10px",
         }}
       >
         <button
           onClick={() => navigate("/dashboard/genel")}
           style={navLinkStyle(currentPath === "genel")}
         >
           📊 Genel Analiz
         </button>

         <button
           onClick={() => navigate("/dashboard/anomali")}
           style={navLinkStyle(currentPath === "anomali")}
         >
           🧠 Sistem Zekası
         </button>

         <button
           onClick={() => navigate("/dashboard/tahmin")}
           style={navLinkStyle(currentPath === "tahmin")}
         >
           ✨ Karar Destek Sistemi
         </button>

         <button
           onClick={() => navigate("/dashboard/hayvanlar")}
           style={navLinkStyle(currentPath === "hayvanlar")}
         >
           🐄 Sürü Yönetimi
         </button>

         <button
           onClick={() => navigate("/dashboard/sut")}
           style={navLinkStyle(currentPath === "sut")}
         >
           🥛 Süt Verileri
         </button>

         <button
           onClick={() => navigate("/dashboard/anlik-verim")}
           style={navLinkStyle(currentPath === "anlik-verim")}
         >
           🤖 Anlık Verim Analizi
         </button>

         <button
           onClick={() => navigate("/dashboard/analiz")}
           style={navLinkStyle(currentPath === "analiz")}
         >
           🔬 Korelasyon Analizi
         </button>

         <button
           onClick={() => navigate("/dashboard/sensor")}
           style={navLinkStyle(currentPath === "sensor")}
         >
           🌡️ Sensör Ağı
         </button>

         <button
           onClick={() => navigate("/dashboard/sensor-data")}
           style={navLinkStyle(currentPath === "sensor-data")}
         >
           📡 Sensör İzleme Paneli
         </button>

         <button
           onClick={() => navigate("/dashboard/canli-analiz")}
           style={navLinkStyle(currentPath === "canli-analiz")}
         >
           📈 Canlı Analiz
         </button>

         <button
           onClick={() => navigate("/dashboard/rapor")}
           style={navLinkStyle(currentPath === "rapor")}
         >
           📋 Rapor Çıktısı
         </button>

         <button
           onClick={() => navigate("/dashboard/ayarlar")}
           style={navLinkStyle(currentPath === "ayarlar")}
         >
           ⚙️ Ayarlar
         </button>
       </nav>

       <div style={{ padding: "16px 18px" }}>
         <button onClick={handleLogout} style={logoutButtonStyle}>
           OTURUMU KAPAT
         </button>
       </div>
     </aside>

     <main
       style={{
         flexGrow: 1,
         overflowY: "auto",
         display: "flex",
         flexDirection: "column",
       }}
     >
       <header
         style={{
           padding: "20px 40px",
           backgroundColor: "#fff",
           borderBottom: "1px solid #dcdde1",
           display: "flex",
           justifyContent: "space-between",
           alignItems: "center",
           gap: "20px",
         }}
       >
         <div style={{ color: "#2f3542", fontWeight: "600" }}>
           <span style={{ color: "#747d8c" }}>Sistem Durumu:</span>{" "}
           <span style={{ color: "#2ed573" }}>● Çevrimiçi</span>
         </div>

         <div style={{ color: "#2f3542", fontWeight: "500" }}>
           Operatör:{" "}
           <strong style={{ color: "#54a0ff" }}>{kullaniciIsmi}</strong> 👋
         </div>
       </header>

       {genelSayfaMi && (
         <>
           <div style={{ padding: "24px 40px 0 40px" }}>
             <div style={topStatsGridStyle}>
               <div style={topCardStyle}>
                 <div style={cardTopRowStyle}>
                   <span style={topCardLabelStyle}>AMONYAK (NH3)</span>
                   <span
                     style={{
                       ...dotStyle,
                       backgroundColor: getAmonyakColor(stats.amonyak),
                     }}
                   ></span>
                 </div>

                 <h2
                   style={{
                     color: getAmonyakColor(stats.amonyak),
                     margin: "8px 0 4px",
                   }}
                 >
                   {Number(stats.amonyak || 0).toFixed(1)}
                   <small style={unitStyle}> ppm</small>
                 </h2>

                 <p style={cardInfoStyle}>Kritik sınır: 25 ppm</p>
               </div>

               <div
                 style={{
                   ...topCardStyle,
                   borderLeft: `5px solid ${getThiColor(thi)}`,
                   boxShadow: `0 8px 28px ${getThiColor(thi)}22`,
                 }}
               >
                 <div style={cardTopRowStyle}>
                   <span style={topCardLabelStyle}>KONFOR ENDEKSİ (THI)</span>
                   <span>{getThiIcon(thi)}</span>
                 </div>

                 <h2
                   style={{
                     color: getThiColor(thi),
                     margin: "8px 0 4px",
                   }}
                 >
                   {thi.toFixed(1)}
                 </h2>

                 <p
                   style={{
                     ...cardInfoStyle,
                     color: getThiColor(thi),
                     fontWeight: "800",
                   }}
                 >
                   {getThiText(thi)}
                 </p>

                 <div style={progressTrackStyle}>
                   <div
                     style={{
                       ...progressFillStyle,
                       width: `${Math.min((thi / 90) * 100, 100)}%`,
                       backgroundColor: getThiColor(thi),
                     }}
                   ></div>
                 </div>

                 <p style={cardInfoStyle}>Kritik eşik: THI 72</p>
               </div>

               <div style={topCardStyle}>
                 <span style={topCardLabelStyle}>SİSTEM RİSKİ</span>

                 <h2
                   style={{
                     color: getRiskColor(stats.riskSkoru),
                     margin: "8px 0 4px",
                   }}
                 >
                   %{Number(stats.riskSkoru || 0)}
                 </h2>

                 <p
                   style={{
                     ...cardInfoStyle,
                     color: getRiskColor(stats.riskSkoru),
                     fontWeight: "800",
                   }}
                 >
                   {getRiskText(stats.riskSkoru)}
                 </p>

                 <div style={progressTrackStyle}>
                   <div
                     style={{
                       ...progressFillStyle,
                       width: `${Number(stats.riskSkoru || 0)}%`,
                       backgroundColor: getRiskColor(stats.riskSkoru),
                     }}
                   ></div>
                 </div>
               </div>

               <div style={topCardStyle}>
                 <span style={topCardLabelStyle}>CANLI ÖLÇÜMLER</span>

                 <div style={liveMeasureGridStyle}>
                   <div style={liveMeasureItemStyle}>
                     <strong style={liveMeasureValueStyle}>
                       {Number(stats.sicaklik || 0).toFixed(1)}°C
                     </strong>
                     <small style={liveMeasureLabelStyle}>Sıcaklık</small>
                   </div>

                   <div style={liveMeasureItemStyle}>
                     <strong style={liveMeasureValueStyle}>
                       %{Number(stats.nem || 0).toFixed(1)}
                     </strong>
                     <small style={liveMeasureLabelStyle}>Nem</small>
                   </div>

                   <div style={liveMeasureTimeItemStyle}>
                     <strong style={liveMeasureValueStyle}>
                       {sonGuncelleme}
                     </strong>
                     <small style={liveMeasureLabelStyle}>Son Veri</small>
                   </div>
                 </div>
               </div>
             </div>
           </div>

           <div
             style={{
               padding: "22px 40px 0 40px",
               display: "grid",
               gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
               gap: "16px",
             }}
           >
             {kritikUyarilar.map((uyari, index) => (
               <div
                 key={index}
                 style={{
                   backgroundColor: "#fff",
                   borderRadius: "16px",
                   padding: "18px",
                   borderLeft: `5px solid ${uyari.renk}`,
                   boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                 }}
               >
                 <div
                   style={{
                     color: uyari.renk,
                     fontWeight: "800",
                     fontSize: "14px",
                     marginBottom: "6px",
                   }}
                 >
                   {uyari.baslik}
                 </div>

                 <div
                   style={{
                     color: "#57606f",
                     fontSize: "13px",
                     lineHeight: "1.5",
                   }}
                 >
                   {uyari.aciklama}
                 </div>
               </div>
             ))}
           </div>
         </>
       )}

       <div style={{ padding: "28px 40px 40px 40px", flexGrow: 1 }}>
         <Outlet />
       </div>
     </main>
   </div>
 );
}

const topStatsGridStyle = {
 display: "grid",
 gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
 gap: "16px",
};

const topCardStyle = {
 backgroundColor: "#ffffff",
 padding: "18px",
 borderRadius: "18px",
 minHeight: "135px",
 border: "1px solid rgba(0,0,0,0.06)",
 boxShadow: "0 10px 28px rgba(0,0,0,0.06)",
};

const cardTopRowStyle = {
 display: "flex",
 justifyContent: "space-between",
 alignItems: "center",
};

const topCardLabelStyle = {
 fontSize: "12px",
 color: "#64748b",
 fontWeight: "800",
 letterSpacing: "0.3px",
};

const unitStyle = {
 fontSize: "13px",
 color: "#64748b",
};

const cardInfoStyle = {
 margin: "4px 0",
 color: "#64748b",
 fontSize: "13px",
};

const progressTrackStyle = {
 height: "6px",
 width: "100%",
 backgroundColor: "#e2e8f0",
 marginTop: "10px",
 borderRadius: "10px",
 overflow: "hidden",
};

const progressFillStyle = {
 height: "100%",
 transition: "0.5s ease",
};

const liveMeasureGridStyle = {
 display: "grid",
 gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
 gap: "10px",
 marginTop: "14px",
};

const liveMeasureItemStyle = {
 backgroundColor: "#f8fafc",
 border: "1px solid #e2e8f0",
 borderRadius: "12px",
 padding: "12px",
 display: "flex",
 flexDirection: "column",
 justifyContent: "center",
 alignItems: "center",
 gap: "5px",
 minWidth: "0",
 color: "#0f172a",
 textAlign: "center",
};

const liveMeasureTimeItemStyle = {
 ...liveMeasureItemStyle,
 gridColumn: "1 / -1",
};

const liveMeasureValueStyle = {
 color: "#0f172a",
 fontSize: "16px",
 fontWeight: "800",
 lineHeight: "1.2",
 whiteSpace: "nowrap",
};

const liveMeasureLabelStyle = {
 color: "#64748b",
 fontSize: "12px",
 fontWeight: "600",
};

const dotStyle = {
 width: "10px",
 height: "10px",
 borderRadius: "50%",
 boxShadow: "0 0 5px rgba(0,0,0,0.3)",
};

const navLinkStyle = (isActive) => ({
 width: "100%",
 padding: "13px 25px",
 backgroundColor: isActive ? "#54a0ff" : "transparent",
 color: isActive ? "#fff" : "#a4b0be",
 border: "none",
 textAlign: "left",
 cursor: "pointer",
 fontSize: "14px",
 fontWeight: isActive ? "bold" : "500",
 transition: "all 0.3s ease",
});

const logoutButtonStyle = {
 width: "100%",
 padding: "12px",
 backgroundColor: "transparent",
 color: "#ff4757",
 border: "1px solid #ff4757",
 borderRadius: "8px",
 cursor: "pointer",
 fontWeight: "bold",
 letterSpacing: "1px",
};

export default Dashboardpage;