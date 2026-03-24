import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from 'xlsx';

const SütVerileripage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isListVisible, setIsListVisible] = useState(false);

  useEffect(() => {
    fetchProductionData();
  }, []);

  const fetchProductionData = async () => {
    try {
      const res = await axios.get("http://localhost:8080/api/productivity");
      setData(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Veri çekilemedi", err);
      setLoading(false);
    }
  };

  // --- İSTATİSTİKSEL HESAPLAMALAR ---
  const totalSut = data.reduce((acc, curr) => acc + (curr.sutVerimi || 0), 0);
  const avgSut = data.length > 0 ? (totalSut / data.length).toFixed(1) : 0;
  const maxSut = data.length > 0 ? Math.max(...data.map(d => d.sutVerimi)) : 0;
  const avgEfficiency = data.length > 0 
    ? (data.reduce((acc, curr) => acc + (curr.sutVerimi / curr.yemTuketimi), 0) / data.length).toFixed(2) 
    : 0;

  // --- RAPORLAMA FONKSİYONLARI ---
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Sut Uretim Analiz Raporu", 14, 15);
    doc.setFontSize(10);
    doc.text(`Toplam Uretim: ${totalSut.toFixed(1)} L | Ortalama: ${avgSut} L`, 14, 22);
    
    const tableRows = data.map(item => [
      item.tarih, 
      `${item.sutVerimi} L`, 
      `${item.yemTuketimi} kg`, 
      (item.sutVerimi / item.yemTuketimi).toFixed(2)
    ]);

    autoTable(doc, {
      head: [['Tarih', 'Sut Miktari', 'Yem Miktari', 'Verim Orani']],
      body: tableRows,
      startY: 30,
      headStyles: { fillColor: [59, 130, 246] }
    });
    doc.save("Sut_Analiz_Raporu.pdf");
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sut_Verileri");
    XLSX.writeFile(workbook, "Uretim_Analizi.xlsx");
  };

  if (loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>📊 Veriler Analiz Ediliyor...</div>;

  return (
    <div style={{ padding: '25px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* ÜST BAŞLIK */}
      <header style={headerStyle}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '24px', fontWeight: '800' }}>🥛 Üretim & Verimlilik Paneli</h2>
          <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>Süt üretimi ve yem dönüşüm oranlarının anlık takibi.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setIsListVisible(!isListVisible)} style={listBtnStyle(isListVisible)}>
            {isListVisible ? "⬆️ Kayıtları Gizle" : "🔍 Kayıtları Listele"}
          </button>
          <button onClick={exportExcel} style={excelBtnStyle}>📊 Excel</button>
          <button onClick={exportPDF} style={pdfBtnStyle}>📄 PDF</button>
        </div>
      </header>

      {/* --- KPI ÖZET KARTLARI --- */}
      <div style={kpiGridStyle}>
        <div style={kpiCardStyle('#3b82f6')}>
          <span style={kpiLabelStyle}>Toplam Süt Üretimi</span>
          <div style={kpiValueStyle}>{totalSut.toFixed(1)} <small style={{fontSize: '14px'}}>Litre</small></div>
        </div>
        <div style={kpiCardStyle('#10b981')}>
          <span style={kpiLabelStyle}>Günlük Ortalama</span>
          <div style={kpiValueStyle}>{avgSut} <small style={{fontSize: '14px'}}>L/Gün</small></div>
        </div>
        <div style={kpiCardStyle('#f59e0b')}>
          <span style={kpiLabelStyle}>En Yüksek Günlük</span>
          <div style={kpiValueStyle}>{maxSut} <small style={{fontSize: '14px'}}>Litre</small></div>
        </div>
        <div style={kpiCardStyle('#6366f1')}>
          <span style={kpiLabelStyle}>Yem/Süt Dönüşümü</span>
          <div style={kpiValueStyle}>{avgEfficiency} <small style={{fontSize: '14px'}}>Skor</small></div>
        </div>
      </div>

      {/* --- ANA GRAFİKLER --- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '25px' }}>
        
        {/* Süt Verimi Alan Grafiği */}
        <div style={cardStyle}>
          <h4 style={cardTitleStyle}>📈 Günlük Üretim Trendi</h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="sutGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="tarih" hide />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <Tooltip contentStyle={{borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
              <Area type="monotone" dataKey="sutVerimi" stroke="#3b82f6" strokeWidth={3} fill="url(#sutGrad)" name="Süt (L)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Yem-Süt Scatter Analizi */}
        <div style={cardStyle}>
          <h4 style={cardTitleStyle}>🎯 Yem vs Süt Korelasyonu</h4>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" dataKey="yemTuketimi" name="Yem" unit="kg" tick={{fontSize: 12}} />
              <YAxis type="number" dataKey="sutVerimi" name="Süt" unit="L" tick={{fontSize: 12}} />
              <ZAxis range={[60, 100]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Verimlilik" data={data} fill="#8884d8" shape="circle" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* --- TABLO LİSTELEME --- */}
      {isListVisible && (
        <div style={{ ...cardStyle, padding: '0', overflow: 'hidden', animation: 'fadeIn 0.5s ease' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9' }}>
            <h4 style={{ margin: 0, color: '#334155' }}>📋 Detaylı Üretim Kayıtları</h4>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={thStyle}>Tarih</th>
                  <th style={thStyle}>Süt (L)</th>
                  <th style={thStyle}>Yem (kg)</th>
                  <th style={thStyle}>Verim Oranı</th>
                </tr>
              </thead>
              <tbody>
                {data.slice().reverse().map((row, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={tdStyle}>{row.tarih}</td>
                    <td style={tdStyle}>{row.sutVerimi} L</td>
                    <td style={tdStyle}>{row.yemTuketimi} kg</td>
                    <td style={{ ...tdStyle, fontWeight: 'bold', color: '#10b981' }}>
                       {(row.sutVerimi / row.yemTuketimi).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// --- STİLLER ---
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background: '#fff', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' };
const kpiGridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px', marginBottom: '30px' };
const kpiCardStyle = (color) => ({ background: '#fff', padding: '20px', borderRadius: '18px', borderLeft: `6px solid ${color}`, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' });
const kpiLabelStyle = { fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' };
const kpiValueStyle = { fontSize: '26px', color: '#1e293b', fontWeight: '800', marginTop: '8px' };
const cardStyle = { background: '#fff', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' };
const cardTitleStyle = { margin: '0 0 20px 0', fontSize: '16px', color: '#475569', fontWeight: '700' };
const thStyle = { padding: '15px 20px', fontSize: '12px', color: '#64748b', textAlign: 'left', background: '#f8fafc' };
const tdStyle = { padding: '15px 20px', fontSize: '14px', color: '#1e293b' };
const listBtnStyle = (active) => ({ padding: '10px 20px', background: active ? '#334155' : '#54a0ff', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' });
const excelBtnStyle = { padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' };
const pdfBtnStyle = { padding: '10px 20px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' };

export default SütVerileripage;