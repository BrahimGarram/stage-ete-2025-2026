"""
Modele de prevision generique (eau / gaz) par LOCAL.
Charge un dataset CSV specifique, entraine une Random Forest,
et estime la consommation d'une annee cible.

Usage :
  python modele_prevision_eau_gaz.py --type eau --annee 2026 --local all
  python modele_prevision_eau_gaz.py --type gaz --annee 2026 --local all
"""
import os
import sys
import argparse
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

TYPE_CONFIG = {
    "eau": {"csv": "eau_dataset_locaux.csv", "unit": "m3", "label": "EAU"},
    "gaz": {"csv": "gaz_dataset_locaux.csv", "unit": "m3", "label": "GAZ"},
}

TARGET = "consommationTotale"


def load_and_prepare(csv_path):
    df = pd.read_csv(csv_path)
    LOCAL_REGION = {row["local"]: row["region"] for _, row in df.drop_duplicates("local").iterrows()}
    LOCALS = list(LOCAL_REGION.keys())

    df["consommationPrecedente"] = df.groupby("local")["consommationPrecedente"] \
        .transform(lambda s: s.fillna(s.median()))

    def _prix(local):
        sub = df[df["local"] == local]
        if len(sub) == 0:
            return 0.30
        return sub["montant"].sum() / sub["consommationTotale"].sum()

    LOCAL_PRIX = {local: _prix(local) for local in LOCALS}

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

    df_model = df.drop(columns=["region"])
    df_model = pd.get_dummies(df_model, columns=["local"], prefix="loc")

    FEATURES = [c for c in df_model.columns if c != TARGET]
    X = df_model[FEATURES].values
    y = df_model[TARGET].values

    MAX_YEAR = int(df_model["annee"].max())

    model = RandomForestRegressor(n_estimators=400, random_state=42, n_jobs=-1)
    model.fit(X, y)

    def _baseline(local):
        sub = df_model[df_model[f"loc_{local}"] == 1]
        last = sub.sort_values("annee").iloc[-1]
        return last

    def estimer(annee, local, meteo_factor=1.0, compteurs_growth=0.03, activite=1.0):
        last = _baseline(local)
        years_ahead = annee - int(last["annee"])
        nbComp = int(last["nbCompteurs"] * (1 + compteurs_growth) ** years_ahead)
        cagr = LOCAL_CAGR[local] * meteo_factor * activite
        projection = last[TARGET] * (1 + cagr) ** years_ahead
        margin = 0.15 + 0.02 * max(0, years_ahead - 5)
        bas = projection * (1 - margin)
        haut = projection * (1 + margin)
        warn = annee > MAX_YEAR + 10
        montant = round(projection * LOCAL_PRIX[local])
        montant_bas = round(bas * LOCAL_PRIX[local])
        montant_haut = round(haut * LOCAL_PRIX[local])
        return {
            "annee": annee, "local": local, "region": LOCAL_REGION[local],
            "nbCompteurs": nbComp,
            "estime": round(projection), "bas": round(bas), "haut": round(haut),
            "montant": montant, "montantBas": montant_bas, "montantHaut": montant_haut,
            "warn": warn, "meteo": meteo_factor,
            "growth": compteurs_growth, "activite": activite,
        }

    return LOCALS, LOCAL_REGION, LOCAL_CAGR, estimer, MAX_YEAR


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--type", required=True, choices=["eau", "gaz"])
    parser.add_argument("--annee", type=int, default=None)
    parser.add_argument("--local", default="all")
    parser.add_argument("--meteo", type=float, default=1.0)
    parser.add_argument("--growth", type=float, default=0.03)
    parser.add_argument("--activite", type=float, default=1.0)
    args = parser.parse_args()

    cfg = TYPE_CONFIG[args.type]
    csv_path = os.path.join(BASE_DIR, cfg["csv"])
    label = cfg["label"]

    LOCALS, LOCAL_REGION, LOCAL_CAGR, estimer, MAX_YEAR = load_and_prepare(csv_path)

    if args.annee is None:
        print(f"=== CAGR HISTORIQUE ({label}) ===")
        for local in LOCALS:
            print(f"  {local:20s} : {LOCAL_CAGR[local]*100:+.2f} %/an")
        print(f"\n=== ESTIMATION 2028 ({label}) ===")
        for local in LOCALS:
            n = estimer(2028, local)
            print(f"  {local:20s} : {n['estime']:>12,} {cfg['unit']}  |  {n['montant']:>10,} TND")
    else:
        locals_list = LOCALS if args.local.lower() == "all" else [args.local]
        for local in locals_list:
            r = estimer(args.annee, local, args.meteo, args.growth, args.activite)
            print(f"TYPE={label}|ANNEE={r['annee']}|LOCAL={r['local']}|REGION={r['region']}"
                  f"|ESTIME={r['estime']}|BAS={r['bas']}|HAUT={r['haut']}"
                  f"|MONTANT={r['montant']}|MONTANT_BAS={r['montantBas']}|MONTANT_HAUT={r['montantHaut']}"
                  f"|WARN={str(r['warn']).lower()}|METEO={r['meteo']}"
                  f"|GROWTH={r['growth']}|ACTIVITE={r['activite']}")
