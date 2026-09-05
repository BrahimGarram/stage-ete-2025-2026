<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ERAP — Gestion de Factures &amp; Estimation de Consommation</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{
    --bg: #10161B;
    --panel: #161E24;
    --panel-2: #1C262D;
    --line: #2B363D;
    --text: #DDE4E8;
    --muted: #8B99A1;
    --amber: #E8A33D;
    --teal: #3FA796;
    --danger: #C8654A;
  }
  *{box-sizing:border-box;}
  html{scroll-behavior:smooth;}
  body{
    margin:0;
    background:
      linear-gradient(180deg, rgba(232,163,61,0.05), transparent 400px),
      var(--bg);
    color:var(--text);
    font-family:'Space Grotesk', sans-serif;
    line-height:1.55;
  }
  .mono{font-family:'IBM Plex Mono', monospace;}
  a{color:var(--amber);}
  .wrap{max-width:1040px;margin:0 auto;padding:0 28px;}

  /* ===== HERO ===== */
  .hero{
    border-bottom:1px solid var(--line);
    padding:64px 0 44px;
    position:relative;
    overflow:hidden;
  }
  .hero .wrap{display:grid;grid-template-columns:1.5fr 1fr;gap:40px;align-items:end;}
  .kicker{
    font-family:'IBM Plex Mono', monospace;
    color:var(--teal);
    font-size:13px;
    letter-spacing:0.02em;
    margin:0 0 14px;
  }
  .kicker::before{content:"◈ ";}
  h1.title{
    font-size:clamp(42px,7vw,68px);
    line-height:0.98;
    margin:0 0 14px;
    font-weight:700;
    letter-spacing:-0.02em;
  }
  h1.title span{color:var(--amber);}
  .lede{color:var(--muted); font-size:17px; max-width:52ch; margin:0;}
  .gauges{display:flex; flex-direction:column; gap:14px;}
  .gauge{
    border:1px solid var(--line);
    background:var(--panel);
    padding:14px 16px;
    display:flex;
    justify-content:space-between;
    align-items:baseline;
    border-left:3px solid var(--teal);
  }
  .gauge:nth-child(2){border-left-color:var(--amber);}
  .gauge:nth-child(3){border-left-color:var(--danger);}
  .gauge .val{font-family:'IBM Plex Mono', monospace; font-size:22px; font-weight:600;}
  .gauge .lbl{font-size:12.5px; color:var(--muted);}

  /* ===== STACK STRIP ===== */
  .stack-strip{
    border-bottom:1px solid var(--line);
    background:var(--panel);
    padding:22px 0;
  }
  .stack-strip .wrap{
    display:flex; flex-wrap:wrap; gap:0;
  }
  .chip{
    display:flex; align-items:center; gap:10px;
    padding:8px 20px;
    border-right:1px solid var(--line);
    font-size:13.5px;
  }
  .chip:last-child{border-right:none;}
  .chip img{width:20px;height:20px;display:block;}
  .chip .role{color:var(--muted); font-size:11px; font-family:'IBM Plex Mono', monospace; display:block;}

  /* ===== SECTION ===== */
  section{padding:56px 0; border-bottom:1px solid var(--line);}
  section:last-of-type{border-bottom:none;}
  .sec-head{display:flex; align-items:baseline; gap:14px; margin-bottom:28px;}
  .sec-num{font-family:'IBM Plex Mono', monospace; color:var(--amber); font-size:14px;}
  h2{font-size:26px; margin:0; font-weight:600; letter-spacing:-0.01em;}
  h3{font-size:17px; margin:0 0 8px; font-weight:600;}
  p{color:var(--text);}

  /* feature panels — technical drawing style, corner brackets */
  .grid3{display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--line); border:1px solid var(--line);}
  .panel{background:var(--panel); padding:22px; position:relative;}
  .panel::before{
    content:""; position:absolute; top:8px; left:8px; width:10px; height:10px;
    border-top:1.5px solid var(--teal); border-left:1.5px solid var(--teal);
  }
  .panel ul{margin:10px 0 0; padding-left:18px; color:var(--muted); font-size:14px;}
  .panel li{margin-bottom:5px;}

  /* directory tree */
  .tree{
    background:var(--panel-2);
    border:1px solid var(--line);
    padding:22px 26px;
    font-family:'IBM Plex Mono', monospace;
    font-size:13px;
    color:var(--muted);
    overflow-x:auto;
    white-space:pre;
  }
  .tree .dir{color:var(--teal);}
  .tree .comment{color:#5C6B73;}

  /* terminal blocks */
  .term{
    background:#0C1115;
    border:1px solid var(--line);
    font-family:'IBM Plex Mono', monospace;
    font-size:13px;
    margin:14px 0;
  }
  .term .bar{
    display:flex; gap:6px; padding:9px 12px; border-bottom:1px solid var(--line);
  }
  .term .bar span{width:8px;height:8px; border-radius:50%; background:#333;}
  .term pre{margin:0; padding:16px; overflow-x:auto; color:#B8E6D5;}
  .term .step-label{
    color:var(--muted); font-size:12px; padding:10px 16px 0;
  }

  /* tables as spec sheets */
  table{width:100%; border-collapse:collapse; font-size:14px;}
  th{
    text-align:left; font-family:'IBM Plex Mono', monospace; font-size:11.5px;
    color:var(--amber); text-transform:lowercase; letter-spacing:0.03em;
    padding:10px 14px; border-bottom:1px solid var(--line);
  }
  td{padding:11px 14px; border-bottom:1px solid var(--line); color:var(--text);}
  tr:last-child td{border-bottom:none;}
  td.mono, code{font-family:'IBM Plex Mono', monospace; color:var(--teal); font-size:13px;}
  .method{
    font-family:'IBM Plex Mono', monospace; font-size:11.5px; padding:2px 8px;
    border:1px solid var(--line); color:var(--muted);
  }
  .method.get{color:var(--teal); border-color:var(--teal);}
  .method.post{color:var(--amber); border-color:var(--amber);}
  .method.put{color:#7FA6E0; border-color:#7FA6E0;}
  .method.delete{color:var(--danger); border-color:var(--danger);}

  /* formula box */
  .formula{
    background:var(--panel-2); border:1px solid var(--line); border-left:3px solid var(--amber);
    padding:20px 24px; font-family:'IBM Plex Mono', monospace; font-size:14px; color:var(--amber);
    margin:18px 0; overflow-x:auto;
  }
  .spec-list{list-style:none; margin:0; padding:0;}
  .spec-list li{
    display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--line); font-size:14px;
  }
  .spec-list li:last-child{border-bottom:none;}
  .spec-list .k{color:var(--muted);}

  footer{padding:40px 0 60px;}
  footer .wrap{display:flex; justify-content:space-between; flex-wrap:wrap; gap:20px; align-items:center;}
  .sig{font-size:14px;}
  .sig .name{color:var(--text); font-weight:600;}
  .sig .role{color:var(--muted); font-size:13px;}
  .badge-year{
    font-family:'IBM Plex Mono', monospace; border:1px solid var(--line); padding:8px 14px; color:var(--muted); font-size:13px;
  }

  @media (max-width: 760px){
    .hero .wrap{grid-template-columns:1fr;}
    .grid3{grid-template-columns:1fr;}
    .chip{padding:8px 12px; font-size:12.5px;}
  }
</style>
</head>
<body>

  <header class="hero">
    <div class="wrap">
      <div>
        <p class="kicker mono">ETAP — ENTREPRISE TUNISIENNE D'ACTIVITÉS PÉTROLIÈRES</p>
        <h1 class="title">ERAP<br><span>/</span> factures &amp; estimation</h1>
        <p class="lede">Plateforme web full-stack de gestion des factures énergétiques et d'estimation de la consommation future par intelligence artificielle.</p>
      </div>
      <div class="gauges">
        <div class="gauge"><span class="lbl">ressources suivies</span><span class="val">03</span></div>
        <div class="gauge"><span class="lbl">locaux couverts</span><span class="val">12</span></div>
        <div class="gauge"><span class="lbl">régions</span><span class="val">05</span></div>
      </div>
    </div>
  </header>

  <div class="stack-strip">
    <div class="wrap">
      <div class="chip"><img src="https://cdn.simpleicons.org/angular/DD0031" alt="Angular"><span>Angular 19<span class="role">frontend</span></span></div>
      <div class="chip"><img src="https://cdn.simpleicons.org/typescript/3178C6" alt="TypeScript"><span>TypeScript<span class="role">frontend</span></span></div>
      <div class="chip"><img src="https://cdn.simpleicons.org/sass/CC6699" alt="Sass"><span>SCSS<span class="role">frontend</span></span></div>
      <div class="chip"><img src="https://cdn.simpleicons.org/springboot/6DB33F" alt="Spring Boot"><span>Spring Boot 4<span class="role">backend</span></span></div>
      <div class="chip"><img src="https://cdn.simpleicons.org/openjdk/E8A33D" alt="Java"><span>Java 17<span class="role">backend</span></span></div>
      <div class="chip"><img src="https://cdn.simpleicons.org/mysql/4479A1" alt="MySQL"><span>MySQL<span class="role">base de données</span></span></div>
      <div class="chip"><img src="https://cdn.simpleicons.org/python/3776AB" alt="Python"><span>PaddleOCR<span class="role">ocr</span></span></div>
      <div class="chip"><img src="https://cdn.simpleicons.org/scikitlearn/F7931E" alt="scikit-learn"><span>scikit-learn<span class="role">ml</span></span></div>
      <div class="chip"><img src="https://cdn.simpleicons.org/pandas/150458" alt="Pandas"><span>Pandas / NumPy<span class="role">ml</span></span></div>
      <div class="chip"><img src="https://cdn.simpleicons.org/jsonwebtokens/DDDDDD" alt="JWT"><span>JWT<span class="role">sécurité</span></span></div>
    </div>
  </div>

  <div class="wrap">

    <section id="fonctionnalites">
      <div class="sec-head"><span class="sec-num">01</span><h2>Fonctionnalités</h2></div>
      <div class="grid3">
        <div class="panel">
          <h3>Gestion des factures</h3>
          <ul>
            <li>CRUD complet</li>
            <li>Recherche et filtrage par statut, numéro, région</li>
            <li>KPIs : nombre de factures, consommation totale, montant total</li>
          </ul>
        </div>
        <div class="panel">
          <h3>Extraction OCR</h3>
          <ul>
            <li>Import d'images bilingues arabe / français</li>
            <li>Extraction PaddleOCR : numéro, période, index, consommation, montant, code payeur</li>
            <li>Pré-remplissage et vérification avant enregistrement</li>
            <li>Sélection automatique du compteur par <code>codePayeur</code></li>
          </ul>
        </div>
        <div class="panel">
          <h3>Estimation prédictive</h3>
          <ul>
            <li>Électricité, eau, gaz — 12 locaux, 5 régions</li>
            <li>Random Forest + projection par CAGR historique</li>
            <li>Fourchette de confiance basse / haute</li>
            <li>Avertissement d'extrapolation sur les années lointaines</li>
          </ul>
        </div>
      </div>
    </section>

    <section id="architecture">
      <div class="sec-head"><span class="sec-num">02</span><h2>Architecture du projet</h2></div>
      <div class="tree">erap_project/
├── <span class="dir">backend/</span>                    <span class="comment"># API REST (Spring Boot)</span>
│   └── erap_backend/src/main/java/tn/erap/erap_backend/
│       ├── controller/     <span class="comment"># FactureController, AuthController</span>
│       ├── service/        <span class="comment"># FactureService, ConsommationForecastService, OcrFactureService</span>
│       ├── dto/            <span class="comment"># ForecastResult</span>
│       ├── entity/         <span class="comment"># Facture, Compteur, Local, Utilisateur</span>
│       └── security/       <span class="comment"># JWT filter, SecurityConfig</span>
│
├── <span class="dir">frontend/</span>                   <span class="comment"># Interface web (Angular)</span>
│   └── src/app/
│       ├── features/       <span class="comment"># region/ (onglets elec-eau-gaz), login/</span>
│       ├── models/         <span class="comment"># ForecastResult, Facture, etc.</span>
│       ├── services/       <span class="comment"># FactureService, AuthService, ForecastService</span>
│       └── app.routes.ts
│
├── <span class="dir">ml/</span>                         <span class="comment"># Scripts Python (ML &amp; OCR)</span>
│   ├── modele_prevision.py
│   ├── modele_prevision_eau_gaz.py
│   ├── ocr_paddle.py
│   └── *.csv                <span class="comment"># datasets élec / eau / gaz</span>
│
└── <span class="dir">rapport/</span>                    <span class="comment"># Rapport de stage (LaTeX)</span>
    └── rapport.tex</div>
    </section>

    <section id="installation">
      <div class="sec-head"><span class="sec-num">03</span><h2>Installation &amp; démarrage</h2></div>

      <p class="step-label mono" style="color:var(--muted);margin:0 0 6px;">01 · base de données</p>
      <div class="term">
        <div class="bar"><span></span><span></span><span></span></div>
        <pre>CREATE DATABASE erap_db;
-- Importer le schéma et les données</pre>
      </div>

      <p class="step-label mono" style="color:var(--muted);margin:0 0 6px;">02 · backend (Spring Boot) — http://localhost:8080</p>
      <div class="term">
        <div class="bar"><span></span><span></span><span></span></div>
        <pre>cd backend/erap_backend
./mvnw spring-boot:run</pre>
      </div>

      <p class="step-label mono" style="color:var(--muted);margin:0 0 6px;">03 · frontend (Angular) — http://localhost:4200</p>
      <div class="term">
        <div class="bar"><span></span><span></span><span></span></div>
        <pre>cd frontend
npm install
ng serve</pre>
      </div>

      <p class="step-label mono" style="color:var(--muted);margin:0 0 6px;">04 · scripts Python</p>
      <div class="term">
        <div class="bar"><span></span><span></span><span></span></div>
        <pre>pip install paddlepaddle paddleocr scikit-learn pandas numpy
<span style="color:#5C6B73"># exécutés automatiquement par le backend via ProcessBuilder
# python doit être dans le PATH, ou configuré via erap.forecast.python</span></pre>
      </div>
    </section>

    <section id="endpoints">
      <div class="sec-head"><span class="sec-num">04</span><h2>Endpoints API</h2></div>
      <table>
        <tr><th>méthode</th><th>endpoint</th><th>description</th></tr>
        <tr><td><span class="method get">GET</span></td><td class="mono">/factures</td><td>Liste des factures</td></tr>
        <tr><td><span class="method post">POST</span></td><td class="mono">/factures</td><td>Créer une facture</td></tr>
        <tr><td><span class="method put">PUT</span></td><td class="mono">/factures/{id}</td><td>Modifier une facture</td></tr>
        <tr><td><span class="method delete">DELETE</span></td><td class="mono">/factures/{id}</td><td>Supprimer une facture</td></tr>
        <tr><td><span class="method post">POST</span></td><td class="mono">/factures/ocr</td><td>Extraire les données d'une image</td></tr>
        <tr><td><span class="method get">GET</span></td><td class="mono">/factures/forecast</td><td>Estimation électricité</td></tr>
        <tr><td><span class="method get">GET</span></td><td class="mono">/forecast/eau</td><td>Estimation eau</td></tr>
        <tr><td><span class="method get">GET</span></td><td class="mono">/forecast/gaz</td><td>Estimation gaz</td></tr>
        <tr><td><span class="method post">POST</span></td><td class="mono">/auth/login</td><td>Connexion</td></tr>
      </table>
    </section>

    <section id="regions">
      <div class="sec-head"><span class="sec-num">05</span><h2>Régions &amp; locaux</h2></div>
      <table>
        <tr><th>région</th><th>locaux</th></tr>
        <tr><td>Tunis</td><td>Tunis, Ariana, Manouba</td></tr>
        <tr><td>Bizerte</td><td>Bizerte</td></tr>
        <tr><td>Cap Bon</td><td>Nabeul, Cap Bon, Kasserine</td></tr>
        <tr><td>Sahel</td><td>Sousse, Monastir, Kairouan</td></tr>
        <tr><td>Sud</td><td>Sfax, Gabès</td></tr>
      </table>
    </section>

    <section id="modele">
      <div class="sec-head"><span class="sec-num">06</span><h2>Modèle d'estimation</h2></div>
      <ul class="spec-list">
        <li><span class="k">Algorithme</span><span>Random Forest Regressor (400 arbres)</span></li>
        <li><span class="k">Projection</span><span>CAGR historique sur les 10 dernières années</span></li>
        <li><span class="k">Fourchette de confiance</span><span>± 15 %, élargie de +2 % / an au-delà de 5 ans</span></li>
        <li><span class="k">Prix unitaire</span><span>calculé par local depuis le dataset</span></li>
      </ul>
      <div class="formula">projection = dernière_conso × (1 + cagr × météo × activité) ^ années_avant</div>
    </section>

  </div>

  <footer>
    <div class="wrap">
      <div class="sig">
        <div class="name">Mohamed Brahim Garram</div>
        <div class="role">ESPRIT — encadrant : Hafedh Dargham, ETAP</div>
      </div>
      <div class="badge-year">Année académique 2025–2026</div>
    </div>
  </footer>

</body>
</html>
