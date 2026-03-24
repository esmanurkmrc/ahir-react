import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, ScatterChart, Scatter, 
  Line, ComposedChart, Area 
} from 'recharts';

const KorelasyonAnalizpage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysisData();
  }, []);

  const fetchAnalysisData = async () => {
    try {
      const [prodRes, envRes] = await Promise.all([
        axios.get("http://localhost:8080/api/productivity"),
        axios.get("http://localhost:8080/api/environment")
      ]);

      const combined = prodRes.data.map(prod => {
        const env = envRes.data.find(e => e.tarih === prod.tarih) || {};
        return { ...prod, ...env, tarih: prod.tarih };
      });

      setData(combined);
      setLoading(false);
    } catch (err) {
      console.error("Veri hatası:", err);
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Analizler Yükleniyor...</div>;

  return (
    <div style={{ padding: '30px', backgroundColor: '#fcfcfc', minHeight: '100vh', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
      
      <header style={{ marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
        <h2 style={{ margin: 0, color: '#2c3e50', fontWeight: '600' }}>🔬 Mikroklima ve Verim Analizi</h2>
        <p style={{ margin: '5px 0 0 0', color: '#7f8c8d', fontSize: '14px' }}>Çevresel sensör verilerinin süt verimi üzerindeki etkisi.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
        
        {/* 1. Sıcaklık ve Süt Verimi (Sadeleşmiş Mor ve Tok Lacivert) */}
        <div style={cardStyle}>
          <h4 style={cardTitleStyle}>Sıcaklık (°C) ve Süt Verimi (L) Takibi</h4>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="tarih" hide />
              <YAxis yAxisId="left" domain={['auto', 'auto']} stroke="#a855f7" label={{ value: '°C', angle: -90, position: 'insideLeft', fill: '#a855f7', fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} stroke="#1e1b4b" label={{ value: 'Litre', angle: 90, position: 'insideRight', fill: '#1e1b4b', fontSize: 12 }} />
              <Tooltip contentStyle={{ border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              {/* Dolgu Rengi (Fill) Çok Açık Purple */}
              <Area yAxisId="left" type="monotone" dataKey="sicaklik" fill="#faf5ff" stroke="#a855f7" strokeWidth={2} name="Sıcaklık" />
              <Line yAxisId="right" type="monotone" dataKey="sutVerimi" stroke="#1e1b4b" strokeWidth={3} dot={false} name="Süt Verimi" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 2. Amonyak Dağılım Analizi (Sade Kiremit Turuncusu) */}
        <div style={cardStyle}>
          <h4 style={cardTitleStyle}>Amonyak (ppm) Dağılım Analizi</h4>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
              <XAxis type="number" dataKey="amonyak" domain={['auto', 'auto']} name="Amonyak" unit=" ppm" tick={{ fontSize: 11 }} />
              <YAxis type="number" dataKey="sutVerimi" domain={['auto', 'auto']} name="Süt" unit=" L" tick={{ fontSize: 11 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Veri Noktaları" data={data} fill="#ea580c" fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* 3. Nem ve Verimlilik İlişkisi (Sadeleşmiş Bordo ve Tok Lacivert) */}
        <div style={cardStyle}>
          <h4 style={cardTitleStyle}>Nem (%) ve Verimlilik (L) İlişkisi</h4>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="tarih" hide />
              <YAxis yAxisId="left" domain={['auto', 'auto']} stroke="#dc2626" label={{ value: '%', angle: -90, position: 'insideLeft', fill: '#dc2626', fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} stroke="#1e1b4b" />
              <Tooltip />
              {/* Dolgu Rengi (Fill) Çok Açık Red */}
              <Area yAxisId="left" type="step" dataKey="nem" fill="#fef2f2" stroke="#dc2626" strokeWidth={2} name="Nem" />
              <Line yAxisId="right" type="monotone" dataKey="sutVerimi" stroke="#1e1b4b" strokeWidth={3} dot={false} name="Süt" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 4. Işık Şiddeti Etki Analizi (Sadeleşmiş Mor Noktalar) */}
        <div style={cardStyle}>
          <h4 style={cardTitleStyle}>Işık Şiddeti (Lux) Etki Analizi</h4>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" />
              <XAxis type="number" dataKey="isik" domain={['auto', 'auto']} name="Işık" unit=" Lux" tick={{ fontSize: 11 }} />
              <YAxis type="number" dataKey="sutVerimi" domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Işık Değerleri" data={data} fill="#a855f7" fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
};

const cardStyle = { 
  background: '#ffffff', 
  padding: '20px', 
  borderRadius: '12px', 
  border: '1px solid #ececec', // Çok hafif bir çerçeve
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.03)' // Neredeyse görünmez gölge
};

const cardTitleStyle = { 
  margin: '0 0 15px 0', 
  fontSize: '14px', 
  color: '#555', 
  fontWeight: '600',
  textTransform: 'uppercase', // Başlıkları küçültüp sadeleştirdik
  letterSpacing: '0.5px'
};

export default KorelasyonAnalizpage;