import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ScatterChart, Scatter, AreaChart, Area, ReferenceLine, Label 
} from 'recharts';

const SensorVerileripage = () => {
  const [data, setData] = useState([]);
  const [viewType, setViewType] = useState("daily"); // daily veya weekly

  useEffect(() => {
    fetchSensorData();
  }, [viewType]);

  const fetchSensorData = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/environment");
      let rawData = res.data;

      if (viewType === "weekly") {
        const weeklyGrouped = [];
        for (let i = 0; i < rawData.length; i += 7) {
          const chunk = rawData.slice(i, i + 7);
          
          // 7 günlük ortalamaları hesapla (Amonyak dahil)
          const avgSicaklik = chunk.reduce((sum, item) => sum + (item.sicaklik || 0), 0) / chunk.length;
          const avgNem = chunk.reduce((sum, item) => sum + (item.nem || 0), 0) / chunk.length;
          const avgAmonyak = chunk.reduce((sum, item) => sum + (item.amonyak || 0), 0) / chunk.length;
          
          weeklyGrouped.push({
            tarih: `${chunk[0].tarih}`, 
            sicaklik: parseFloat(avgSicaklik.toFixed(2)),
            nem: parseFloat(avgNem.toFixed(2)),
            amonyak: parseFloat(avgAmonyak.toFixed(2))
          });
        }
        setData(weeklyGrouped);
      } else {
        setData(rawData);
      }
    } catch (err) {
      console.error("Veri çekilemedi", err);
    }
  };

  return (
    <div style={{ padding: '25px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* HEADER BÖLÜMÜ */}
      <header style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: '25px', background: '#fff', padding: '20px', borderRadius: '15px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '24px', fontWeight: 'bold' }}>🌐 Mikroklima Analiz Merkezi</h2>
          <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>Sensör verilerinin teknik ve kritik eşik analizi.</p>
        </div>
        
        {/* SENİN BUTON YAPIN */}
        <div style={{ display: 'flex', background: '#f1f5f9', padding: '5px', borderRadius: '10px' }}>
          <button 
            onClick={() => setViewType("daily")}
            style={{ ...btnStyle, backgroundColor: viewType === 'daily' ? '#fff' : 'transparent', color: viewType === 'daily' ? '#2ecc71' : '#94a3b8', boxShadow: viewType === 'daily' ? '0 2px 10px rgba(0,0,0,0.1)' : 'none' }}
          >Günlük Görünüm</button>
          <button 
            onClick={() => setViewType("weekly")}
            style={{ ...btnStyle, backgroundColor: viewType === 'weekly' ? '#fff' : 'transparent', color: viewType === 'weekly' ? '#2ecc71' : '#94a3b8', boxShadow: viewType === 'weekly' ? '0 2px 10px rgba(0,0,0,0.1)' : 'none' }}
          >Haftalık Analiz</button>
        </div>
      </header>

      {/* 1. AMONYAK ANALİZİ - TAM GENİŞLİK */}
      <div style={{ background: '#fff', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', marginBottom: '25px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
           <h4 style={{ margin: 0, color: '#334155' }}>🔥 Amonyak (NH3) Kritik Seviye Analizi</h4>
           <div style={{ padding: '5px 12px', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fee2e2' }}>
              <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 'bold' }}>KRİTİK EŞİK: 25 ppm</span>
           </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="amonyakGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="tarih" tick={{fontSize: 10}} hide={viewType === "daily"} />
            <YAxis tick={{fontSize: 11}} />
            <Tooltip />
            <ReferenceLine y={25} stroke="#ef4444" strokeDasharray="8 4" strokeWidth={2}>
               <Label value="RİSK LİMİTİ" position="right" fill="#ef4444" fontSize={10} fontWeight="bold" />
            </ReferenceLine>
            <Area type="monotone" dataKey="amonyak" stroke="#ef4444" strokeWidth={3} fill="url(#amonyakGrad)" name="Amonyak (ppm)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '25px' }}>
        
        {/* SOL KOLON: SICAKLIK VE NEM */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <div style={cardStyle}>
            <h4 style={cardTitleStyle}>🌡️ Sıcaklık Değişim Trendi</h4>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff7675" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ff7675" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="tarih" hide={viewType === "daily"} />
                <YAxis unit="°C" stroke="#b2bec3" tick={{fontSize: 11}} />
                <Tooltip />
                <Area type="monotone" dataKey="sicaklik" stroke="#d63031" strokeWidth={3} fill="url(#tempGrad)" name="Sıcaklık" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={cardStyle}>
            <h4 style={cardTitleStyle}>💧 Nem Seviyesi Takibi</h4>
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="tarih" hide={viewType === "daily"} />
                <YAxis unit="%" stroke="#b2bec3" tick={{fontSize: 11}} />
                <Tooltip />
                <Line type="monotone" dataKey="nem" stroke="#0984e3" strokeWidth={4} dot={viewType === "weekly"} name="Nem Oranı" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SAĞ KOLON: KORELASYON */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ ...cardStyle, height: '100%' }}>
            <h4 style={cardTitleStyle}>📊 Sıcaklık vs Nem İlişkisi</h4>
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" dataKey="sicaklik" name="Sıcaklık" unit="°C" tick={{fontSize: 11}} />
                <YAxis type="number" dataKey="nem" name="Nem" unit="%" tick={{fontSize: 11}} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Veri Noktası" data={data} fill="#6c5ce7" />
              </ScatterChart>
            </ResponsiveContainer>
            
            <div style={{ marginTop: '25px', padding: '15px', background: '#e8f4fd', borderRadius: '12px', border: '1px solid #d1e9f9' }}>
              <h5 style={{ margin: '0 0 5px 0', color: '#2980b9' }}>💡 Teknik Analiz Notu</h5>
              <p style={{ fontSize: '13px', margin: 0, color: '#34495e', lineHeight: '1.5' }}>
                {viewType === "daily" 
                  ? "Günlük veriler anlık değişimleri göstermektedir." 
                  : "Haftalık ortalamalarda sıcaklık arttıkça nemin düştüğü korelasyonu gözlemlenebilir."}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// --- STİL NESNELERİ ---
const btnStyle = { padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: '0.3s' };
const cardStyle = { background: '#fff', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' };
const cardTitleStyle = { margin: '0 0 20px 0', color: '#334155', fontSize: '16px', fontWeight: '600' };

export default SensorVerileripage;