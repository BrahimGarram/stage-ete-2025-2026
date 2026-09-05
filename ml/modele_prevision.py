"""
Modele de prevision de consommation par LOCAL (Colab-ready + mode CLI pour le backend).
Charge consommation_dataset_locaux.csv, entraine une Random Forest,
et estime la conso d'une annee cible pour un ou tous les locaux.
Utilise le CAGR historique pour projeter les annees futures.

Modes :
  - Sans argument : demo (imprime l'evaluation + estimations 2028).
  - Avec --annee   : sort une ligne par local, format delimiter pour le backend :
      ANNEE=..|LOCAL=..|REGION=..|ESTIME=..|BAS=..|HAUT=..|WARN=..|METEO=..|GROWTH=..|ACTIVITE=..
"""
import os
import sys
import argparse
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score, mean_absolute_percentage_error

CSV = os.path.join(os.path.dirname(os.path.abspath(__file__)), "consommation_dataset_locaux.csv")
TARGET = "consommationTotale"

# ---------- 1. Chargement & preparation ----------
df = pd.read_csv(CSV)

LOCAL_REGION = {row["local"]: row["region"] for _, row in df.drop_duplicates("local").iterrows()}
LOCALS = list(LOCAL_REGION.keys())

# Prix moyen du kWh par local (TND/kWh) - calcule depuis le dataset
def _prix_kwh(local):
    sub = df[df["local"] == local]
    if len(sub) == 0:
        return 0.25
    return (sub["montant"].sum()) / (sub["consommationTotale"].sum())

LOCAL_PRIX = {local: _prix_kwh(local) for local in LOCALS}

df["consommationPrecedente"] = df.groupby("local")["consommationPrecedente"] \
    .transform(lambda s: s.fillna(s.median()))

# Calcul du CAGR historique par local (sur les 10 dernieres annees)
def _cagr(local):
    sub = df[df["local"] == local].sort_values("annee")
    if len(sub) < 2:
        return 0.03
    last_10 = sub.tail(10)
    first_conso = last_10.iloc[0][TARGET]
    last_conso = last_10.iloc[-1][TARGET]
    n = len(last_10) - 1
    if first_conso <= 0 or last_conso <= 0 or n == 0:
        return 0.03
    return (last_conso / first_conso) ** (1.0 / n) - 1

LOCAL_CAGR = {local: _cagr(local) for local in LOCALS}

df = df.drop(columns=["region"])
df = pd.get_dummies(df, columns=["local"], prefix="loc")

FEATURES = [c for c in df.columns if c != TARGET]
X = df[FEATURES].copy()
X_arr = X.values
y = df[TARGET].copy()

MAX_YEAR = int(df["annee"].max())
HORIZON_WARN = 10

# ---------- 2. Entrainement ----------
model = RandomForestRegressor(n_estimators=400, random_state=42, n_jobs=-1)
model.fit(X_arr, y)

# ---------- 3. Fourchette de confiance ----------
def predict_interval(row_arr, low=5, high=95):
    preds = np.array([t.predict(row_arr) for t in model.estimators_]).ravel()
    return preds.mean(), np.percentile(preds, low), np.percentile(preds, high)

# ---------- 4. Baseline par local ----------
def _baseline(local):
    sub = df[df[f"loc_{local}"] == 1]
    last = sub.sort_values("annee").iloc[-1]
    means = sub[["tempMoyenne", "pluviometrie",
                 "degresJoursChauffage", "degresJoursClimatisation"]].mean()
    return last, means

# ---------- 5. Estimation ----------
def estimer(annee, local,
            meteo_factor=1.0,
            compteurs_growth=0.03,
            activite=1.0):
    last, means = _baseline(local)
    years_ahead = annee - int(last["annee"])

    # Croissance reelle du parc compteurs
    nbComp = int(last["nbCompteurs"] * (1 + compteurs_growth) ** years_ahead)

    # CAGR historique du local (ajuste par meteo et activite)
    cagr = LOCAL_CAGR[local] * meteo_factor * activite

    # Projection = derniere conso connue * (1 + cagr) ^ nb_annees
    projection = last[TARGET] * (1 + cagr) ** years_ahead

    # Fourchette : +/- 15% (plus large si extrapolation lointaine)
    margin = 0.15 + 0.02 * max(0, years_ahead - 5)
    bas = projection * (1 - margin)
    haut = projection * (1 + margin)

    warn = annee > MAX_YEAR + HORIZON_WARN
    montant = round(projection * LOCAL_PRIX[local])
    montant_bas = round(bas * LOCAL_PRIX[local])
    montant_haut = round(haut * LOCAL_PRIX[local])

    return {"annee": annee, "local": local, "region": LOCAL_REGION[local],
            "nbCompteurs": nbComp,
            "estime": round(projection), "bas": round(bas), "haut": round(haut),
            "montant": montant, "montantBas": montant_bas, "montantHaut": montant_haut,
            "warn": warn, "meteo": meteo_factor,
            "growth": compteurs_growth, "activite": activite}

# ---------- 6. Execution ----------
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--annee", type=int, default=None, help="annee a estimer")
    parser.add_argument("--local", default="all",
                        help="Nom du local ou 'all' pour tous")
    parser.add_argument("--meteo", type=float, default=1.0)
    parser.add_argument("--growth", type=float, default=0.03)
    parser.add_argument("--activite", type=float, default=1.0)
    args = parser.parse_args()

    if args.annee is None:
        test_years = [2022, 2023, 2024]
        mask_test = df["annee"].isin(test_years)
        Xtr, ytr = X[~mask_test], y[~mask_test]
        Xte, yte = X[mask_test], y[mask_test]
        model.fit(Xtr.values, ytr)
        pred = model.predict(Xte.values)
        print("=== EVALUATION (test 2022-2024) ===")
        print(f"MAE  : {mean_absolute_error(yte, pred):,.0f}")
        print(f"MAPE : {mean_absolute_percentage_error(yte, pred)*100:.1f} %")
        print(f"R2   : {r2_score(yte, pred):.3f}")
        model.fit(X_arr, y)
        print("\n=== CAGR HISTORIQUE PAR LOCAL ===")
        for local in LOCALS:
            print(f"  {local:20s} : {LOCAL_CAGR[local]*100:+.2f} %/an")
        print("\n=== ESTIMATION 2028 (scenario normal vs rude) ===")
        for local in LOCALS:
            n = estimer(2028, local, meteo_factor=1.0)
            r = estimer(2028, local, meteo_factor=1.20)
            print(f"{local:20s} | normal : {n['estime']:>12,} "
                  f"[{n['bas']:>12,} .. {n['haut']:>12,}]"
                  f"   | rude : {r['estime']:>12,}")
    else:
        locals_list = LOCALS if args.local.lower() == "all" else [args.local]
        for local in locals_list:
            r = estimer(args.annee, local, args.meteo, args.growth, args.activite)
            print(f"ANNEE={r['annee']}|LOCAL={r['local']}|REGION={r['region']}|ESTIME={r['estime']}|"
                  f"BAS={r['bas']}|HAUT={r['haut']}|MONTANT={r['montant']}|"
                  f"MONTANT_BAS={r['montantBas']}|MONTANT_HAUT={r['montantHaut']}|"
                  f"WARN={str(r['warn']).lower()}|"
                  f"METEO={r['meteo']}|GROWTH={r['growth']}|ACTIVITE={r['activite']}")
