import React from 'react';
import { Sparkles, MapPin, Compass, HeartHandshake } from 'lucide-react';

export default function HeroBanner() {
  return (
    <section className="hero-banner">
      <div className="hero-content">
        <div className="hero-tag">
          <Sparkles size={14} />
          <span>Corea del Sud 2027 • Oratorio Don Bosco Asti</span>
        </div>

        <h2 className="hero-title">
          In Cammino verso Seoul 2027
        </h2>

        <p className="hero-subtitle">
          Portale trasparente di gestione e monitoraggio delle iniziative di autofinanziamento
          della comunità salesiana di Asti. Ogni evento, cena e bancarella contribuisce ad
          abbattere direttamente la quota di viaggio per tutti i giovani partenti!
        </p>

        <div className="hero-motto">
          <HeartHandshake size={16} />
          <span>«Abbiate coraggio: io ho vinto il mondo!» (Gv 16,33) — Tema Ufficiale GMG Seoul 2027</span>
        </div>
      </div>
    </section>
  );
}
