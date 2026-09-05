# ERAP — Gestion de Factures & Estimation de Consommation

Plateforme web full-stack développée pour l'**ETAP** (Entreprise Tunisienne d'Activités Pétrolières) permettant de gérer les factures énergétiques et d'estimer la consommation future grâce à l'intelligence artificielle.

---

## Aperçu

| Composant | Technologie |
|-----------|-------------|
| Frontend | Angular 19, TypeScript, SCSS |
| Backend | Spring Boot 4, Java 17 |
| Base de données | MySQL |
| OCR | PaddleOCR (Python) |
| ML / Estimation | scikit-learn, Pandas, NumPy |
| Sécurité | JWT (JSON Web Tokens) |

---

## Fonctionnalités

### Gestion des factures
- CRUD complet (création, lecture, mise à jour, suppression)
- Recherche et filtrage par statut, numéro, région
- KPIs : nombre de factures, consommation totale, montant total

### Extraction OCR
- Import d'images de factures (bilingue arabe/français)
- Extraction automatique via **PaddleOCR** : numéro, période, index, consommation, montant, code payeur
- Pré-remplissage du formulaire et vérification avant enregistrement
- Sélection automatique du compteur par `codePayeur`

### Estimation prédictive
- **3 types de ressources** : Électricité (kWh), Eau (m³), Gaz (m³)
- Modèle **Random Forest** + projection par **CAGR historique**
- Fourchette de confiance (bas / haute) pour chaque estimation
- 12 locaux à travers 5 régions tunisiennes
- Calcul du montant estimé (TND)
- Onglets séparés avec graphiques et cartes de résultats
- Avertissement d'extrapolation pour les années lointaines

### Sécurité
- Authentification JWT
- Contrôle d'accès par rôle (ADMIN / CHEF_REGION)
- CORS configuré pour le développement

---

## Architecture du projet

```
erap_project/
├── backend/                    # API REST (Spring Boot)
│   └── erap_backend/
│       └── src/main/java/tn/erap/erap_backend/
│           ├── controller/     # FactureController, AuthController
│           ├── service/        # FactureService, ConsommationForecastService, OcrFactureService
│           ├── dto/            # ForecastResult
│           ├── entity/         # Facture, Compteur, Local, Utilisateur
│           └── security/       # JWT filter, SecurityConfig
│
├── frontend/                   # Interface web (Angular)
│   └── src/app/
│       ├── features/
│       │   ├── region/         # Composant principal (onglets elec/eau/gaz)
│       │   └── login/          # Authentification
│       ├── models/             # ForecastResult, Facture, etc.
│       ├── services/           # FactureService, AuthService, ForecastService
│       └── app.routes.ts       # Routing
│
├── ml/                         # Scripts Python (ML & OCR)
│   ├── modele_prevision.py         # Estimation électricité (CAGR + RF)
│   ├── modele_prevision_eau_gaz.py # Estimation eau/gaz
│   ├── ocr_paddle.py               # Extraction OCR PaddleOCR
│   ├── consommation_dataset_locaux.csv  # Dataset électricité
│   ├── eau_dataset_locaux.csv      # Dataset eau
│   └── gaz_dataset_locaux.csv      # Dataset gaz
│
└── rapport/                    # Rapport de stage (LaTeX)
    └── rapport.tex
```

---

## Prérequis

- **Java 17** + Maven
- **Node.js 18+** + npm
- **Python 3.10+** + pip
- **MySQL 8+**
- **PaddleOCR** + **PaddlePaddle**

```bash
pip install paddlepaddle paddleocr scikit-learn pandas numpy
```

---

## Installation & Démarrage

### 1. Base de données

```sql
CREATE DATABASE erap_db;
-- Importer le schéma et les données
```

### 2. Backend (Spring Boot)

```bash
cd backend/erap_backend
./mvnw spring-boot:run
```

Le serveur démarre sur `http://localhost:8080`.

### 3. Frontend (Angular)

```bash
cd frontend
npm install
ng serve
```

L'application est accessible sur `http://localhost:4200`.

### 4. Scripts Python

Les scripts sont exécutés automatiquement par le backend via `ProcessBuilder`. Assurez-vous que `python` est dans le `PATH` ou configurez `erap.forecast.python` dans `application.properties`.

---

## Endpoints API

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/factures` | Liste des factures |
| `POST` | `/factures` | Créer une facture |
| `PUT` | `/factures/{id}` | Modifier une facture |
| `DELETE` | `/factures/{id}` | Supprimer une facture |
| `POST` | `/factures/ocr` | Extraire les données d'une image |
| `GET` | `/factures/forecast?annee=&local=&meteo=` | Estimation électricité |
| `GET` | `/forecast/eau?annee=&local=` | Estimation eau |
| `GET` | `/forecast/gaz?annee=&local=` | Estimation gaz |
| `POST` | `/auth/login` | Connexion |

---

## Régions & Locaux

| Région | Locaux |
|--------|--------|
| Tunis | Tunis, Ariana, Manouba |
| Bizerte | Bizerte |
| Cap Bon | Nabeul, Cap Bon, Kasserine |
| Sahel | Sousse, Monastir, Kairouan |
| Sud | Sfax, Gabès |

---

## Modèle d'estimation

- **Algorithme** : Random Forest Regressor (400 arbres)
- **Projection** : CAGR historique sur les 10 dernières années
- **Formule** : `projection = dernière_conso × (1 + cagr × météo × activité) ^ années_avant`
- **Fourchette** : ±15% (élargie de +2% par an au-delà de 5 ans)
- **Prix unitaire** : calculé par local depuis le dataset

---

## Auteurs

**Mohamed Brahim Garram** — ESPRIT
Encadrant : **Hafedh Dargham** — ETAP

---

## Année académique

2025–2026
