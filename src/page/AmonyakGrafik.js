import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, Label, Area, AreaChart
} from 'recharts';

const AmonyakGrafik = ({ data }) => {
  // Eğer veri yoksa boş dönmesin diye kontrol
  if (!data || data.length === 0) {
    return <div style={{ padding: '20px', color: '#7f8c8d' }}>Grafik verisi yükleniyor...</div>;
  }

  return (
    <div style={{ 
      background: '#fff', 
      padding: '25px', 
      borderRadius: '15px', 
      boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
      border: '1px solid #edf2f7' 
    }}>
      {/* Başlık ve Durum Bilgisi */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
        <div>
          <h3 style={{ fontSize: '18px', color: '#2d3748', margin: 0, fontWeight: '700' }}>
            💨 Amonyak (NH3) Mikroklima Analizi
          </h3>
          <p style={{ fontSize: '13px', color: '#718096', marginTop: '4px' }}>
            Haftalık değişim ve kritik eşik takibi
          </p>
        </div>
        
        {/* Karar Destek Bilgi Kutusu */}
        <div style={{ 
          padding: '8px 15px', 
          backgroundColor: '#fef2f2', 
          borderRadius: '8px', 
          border: '1px solid #fee2e2' 
        }}>
          <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 'bold' }}>
            Kritik Sınır: 25 ppm
          </span>
        </div>
      </div>
      
      <div style={{ width: '100%', height: 350 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAmonyak" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2ecc71" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#2ecc71" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            
            <XAxis 
              dataKey="tarih" 
              tick={{ fontSize: 12, fill: '#a0aec0' }} 
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            
            <YAxis 
              domain={[0, (dataMax) => Math.max(dataMax + 5, 40)]} 
              tick={{ fontSize: 12, fill: '#a0aec0' }}
              axisLine={false}
              tickLine={false}
            />
            
            <Tooltip 
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                fontSize: '14px'
              }}
              itemStyle={{ fontWeight: 'bold' }}
            />
            
            {/* --- KRİTİK EŞİK ÇİZGİSİ (REFERENCE LINE) --- */}
            <ReferenceLine 
              y={25} 
              stroke="#e53e3e" 
              strokeDasharray="8 4" 
              strokeWidth={2}
            >
              <Label 
                value="KRİTİK RİSK BÖLGESİ" 
                position="right" 
                fill="#e53e3e" 
                fontSize={10} 
                fontWeight="800"
                offset={10}
              />
            </ReferenceLine>

            {/* Amonyak Veri Çizgisi */}
            <Line 
              type="monotone" 
              dataKey="amonyak" 
              name="Amonyak (ppm)"
              stroke="#2ecc71" 
              strokeWidth={4} 
              dot={{ r: 5, fill: '#2ecc71', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 8, strokeWidth: 0, fill: '#27ae60' }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Analiz Notu Bölümü */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#f8fafc', 
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span style={{ fontSize: '20px' }}>💡</span>
        <p style={{ fontSize: '12px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
          <strong>Veri Bilimi Notu:</strong> Amonyak seviyesi 25 ppm değerini aştığında, 
          hayvanlarda solunum yolu stresi başlar ve bu durum doğrudan <strong>süt veriminde düşüşe</strong> neden olur. 
          Grafikteki dalgalanmaları bu eşiğe göre takip ediniz.
        </p>
      </div>
    </div>
  );
};

export default AmonyakGrafik;