package tn.erap.erap_backend.dto;

public class ForecastResult {

  private int annee;
  private String type;
  private String local;
  private String region;
  private long estime;
  private long bas;
  private long haut;
  private long montant;
  private long montantBas;
  private long montantHaut;
  private boolean warn;
  private double meteo;
  private double growth;
  private double activite;

  public int getAnnee() {
    return annee;
  }

  public void setAnnee(int annee) {
    this.annee = annee;
  }

  public String getType() {
    return type;
  }

  public void setType(String type) {
    this.type = type;
  }

  public String getLocal() {
    return local;
  }

  public void setLocal(String local) {
    this.local = local;
  }

  public String getRegion() {
    return region;
  }

  public void setRegion(String region) {
    this.region = region;
  }

  public long getEstime() {
    return estime;
  }

  public void setEstime(long estime) {
    this.estime = estime;
  }

  public long getBas() {
    return bas;
  }

  public void setBas(long bas) {
    this.bas = bas;
  }

  public long getHaut() {
    return haut;
  }

  public void setHaut(long haut) {
    this.haut = haut;
  }

  public long getMontant() {
    return montant;
  }

  public void setMontant(long montant) {
    this.montant = montant;
  }

  public long getMontantBas() {
    return montantBas;
  }

  public void setMontantBas(long montantBas) {
    this.montantBas = montantBas;
  }

  public long getMontantHaut() {
    return montantHaut;
  }

  public void setMontantHaut(long montantHaut) {
    this.montantHaut = montantHaut;
  }

  public boolean isWarn() {
    return warn;
  }

  public void setWarn(boolean warn) {
    this.warn = warn;
  }

  public double getMeteo() {
    return meteo;
  }

  public void setMeteo(double meteo) {
    this.meteo = meteo;
  }

  public double getGrowth() {
    return growth;
  }

  public void setGrowth(double growth) {
    this.growth = growth;
  }

  public double getActivite() {
    return activite;
  }

  public void setActivite(double activite) {
    this.activite = activite;
  }
}
