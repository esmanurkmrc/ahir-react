import React from "react";
import { useNavigate } from "react-router-dom"; 
import "../CSS/anasayfa.css"; 
import videoBg from "../assets/video1.mp4"; 

function Anasayfapage() {
  const navigate = useNavigate(); 

  return (
    <div className="anasayfa-hero">
      <video autoPlay loop muted className="anasayfa-video">
        <source src={videoBg} type="video/mp4" /> 
      </video>

      <div className="anasayfa-overlay"></div>

      <div className="anasayfa-top-content">
        <h1 className="anasayfa-text-main">Ahır İçi Mikroklima</h1>
        <h2 className="anasayfa-text-sub">İzleme ve Analiz Sistemi</h2>
        
        
        <button 
          className="anasayfa-button" 
          onClick={() => navigate("/kayit")}
        >
          Sisteme Giriş Yap
        </button>
      </div>
    </div>
  );
}

export default Anasayfapage;