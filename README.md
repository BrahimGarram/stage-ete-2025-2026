<div align="center">

# ETAP
### Gestion de Factures & Estimation de Consommation

Plateforme web full-stack développée pour l'**ETAP** (Entreprise Tunisienne d'Activités Pétrolières)
permettant de gérer les factures énergétiques et d'estimer la consommation future grâce à l'intelligence artificielle.

<br>

![Angular](https://img.shields.io/badge/Angular_19-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Sass](https://img.shields.io/badge/SCSS-CC6699?style=for-the-badge&logo=sass&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot_4-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![Java](https://img.shields.io/badge/Java_17-E8A33D?style=for-the-badge&logo=openjdk&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

</div>

<br>

## Aperçu

| Composant | Technologie |
|---|---|
| Frontend | Angular 19, TypeScript, SCSS |
| Backend | Spring Boot 4, Java 17 |
| Base de données | MySQL |
| OCR | PaddleOCR (Python) |
| ML / Estimation | scikit-learn, Pandas, NumPy |
| Sécurité | JWT (JSON Web Tokens) |

<br>

## Fonctionnalités

<table>
<tr>
<td valign="top" width="33%">

### 🧾 Gestion des factures
- CRUD complet (création, lecture, mise à jour, suppression)
- Recherche et filtrage par statut, numéro, région
- KPIs : nombre de factures, consommation totale, montant total

</td>
<td valign="top" width="33%">

### 🔍 Extraction OCR
- Import d'images de factures bilingues arabe / français
- Extraction automatique via **PaddleOCR** : numéro, période, index, consommation, montant, code payeur
- Pré-remplissage du formulaire et vérification avant enregistrement
- Sélection automatique du compteur par `codePayeur`

</td>
<td valign="top" width="33%">

### 📈 Estimation prédictive
- 3 ressources : Électricité (kWh), Eau (m³), Gaz (m³)
- Modèle **Random Forest** + projection par **CAGR historique**
- Fourchette de confiance (basse / haute) pour chaque estimation
- 12 locaux à travers 5 régions tunisiennes
- Avertissement d'extrapolation pour les années lointaines

</td>
</tr>
</table>

### Sécurité
- Authentification JWT
- Contrôle d'accès par rôle (`ADMIN` / `CHEF_REGION`)
- CORS configuré pour le développement

<br>

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
│   ├── modele_prevision.py
│   ├── modele_prevision_eau_gaz.py
│   ├── ocr_paddle.py
│   ├── consommation_dataset_locaux.csv
│   ├── eau_dataset_locaux.csv
│   └── gaz_dataset_locaux.csv
│
└── rapport/                    # Rapport de stage (LaTeX)
    └── rapport.tex
```

<br>

## Prérequis

- Java 17 + Maven
- Node.js 18+ + npm
- Python 3.10+ + pip
- MySQL 8+
- PaddleOCR + PaddlePaddle

```bash
pip install paddlepaddle paddleocr scikit-learn pandas numpy
```

<br>

## Installation & démarrage

<details open>
<summary><b>1. Base de données</b></summary>

```sql
CREATE DATABASE erap_db;
-- Importer le schéma et les données
```
</details>

<details open>
<summary><b>2. Backend (Spring Boot)</b> — http://localhost:8080</summary>

```bash
cd backend/erap_backend
./mvnw spring-boot:run
```
</details>

<details open>
<summary><b>3. Frontend (Angular)</b> — http://localhost:4200</summary>

```bash
cd frontend
npm install
ng serve
```
</details>

<details open>
<summary><b>4. Scripts Python</b></summary>

Les scripts sont exécutés automatiquement par le backend via `ProcessBuilder`. Assurez-vous que `python` est dans le `PATH`, ou configurez `erap.forecast.python` dans `application.properties`.

</details>

<br>

## Endpoints API

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/factures` | Liste des factures |
| `POST` | `/factures` | Créer une facture |
| `PUT` | `/factures/{id}` | Modifier une facture |
| `DELETE` | `/factures/{id}` | Supprimer une facture |
| `POST` | `/factures/ocr` | Extraire les données d'une image |
| `GET` | `/factures/forecast?annee=&local=&meteo=` | Estimation électricité |
| `GET` | `/forecast/eau?annee=&local=` | Estimation eau |
| `GET` | `/forecast/gaz?annee=&local=` | Estimation gaz |
| `POST` | `/auth/login` | Connexion |

<br>

## Régions & locaux

| Région | Locaux |
|---|---|
| Tunis | Tunis, Ariana, Manouba |
| Bizerte | Bizerte |
| Cap Bon | Nabeul, Cap Bon, Kasserine |
| Sahel | Sousse, Monastir, Kairouan |
| Sud | Sfax, Gabès |

<br>

## Modèle d'estimation

- **Algorithme** : Random Forest Regressor (400 arbres)
- **Projection** : CAGR historique sur les 10 dernières années
- **Fourchette** : ± 15 % (élargie de +2 % par an au-delà de 5 ans)
- **Prix unitaire** : calculé par local depuis le dataset

```
projection = dernière_conso × (1 + cagr × météo × activité) ^ années_avant
```

<br>

## Auteurs

**Mohamed Brahim Garram** — ESPRIT
Encadrant : **Hafedh Dargham** — ETAP

<br>

<div align="center">

**Année académique 2025–2026**

</div>
