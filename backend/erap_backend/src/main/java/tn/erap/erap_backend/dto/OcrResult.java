package tn.erap.erap_backend.dto;

public class OcrResult {
  private String numeroFacture;
  private String dateFacture;
  private String periodeDebut;
  private String periodeFin;
  private Double consommation;
  private Double montant;
  private String statut;
  private Double ancienIndex;
  private Double nouveauIndex;
  private String rawText;
  private String codePayeur;

  public String getNumeroFacture() {
    return numeroFacture;
  }

  public void setNumeroFacture(String numeroFacture) {
    this.numeroFacture = numeroFacture;
  }

  public String getDateFacture() {
    return dateFacture;
  }

  public void setDateFacture(String dateFacture) {
    this.dateFacture = dateFacture;
  }

  public String getPeriodeDebut() {
    return periodeDebut;
  }

  public void setPeriodeDebut(String periodeDebut) {
    this.periodeDebut = periodeDebut;
  }

  public String getPeriodeFin() {
    return periodeFin;
  }

  public void setPeriodeFin(String periodeFin) {
    this.periodeFin = periodeFin;
  }

  public Double getConsommation() {
    return consommation;
  }

  public void setConsommation(Double consommation) {
    this.consommation = consommation;
  }

  public Double getMontant() {
    return montant;
  }

  public void setMontant(Double montant) {
    this.montant = montant;
  }

  public String getStatut() {
    return statut;
  }

  public void setStatut(String statut) {
    this.statut = statut;
  }

  public Double getAncienIndex() {
    return ancienIndex;
  }

  public void setAncienIndex(Double ancienIndex) {
    this.ancienIndex = ancienIndex;
  }

  public Double getNouveauIndex() {
    return nouveauIndex;
  }

  public void setNouveauIndex(Double nouveauIndex) {
    this.nouveauIndex = nouveauIndex;
  }

  public String getRawText() {
    return rawText;
  }

  public void setRawText(String rawText) {
    this.rawText = rawText;
  }

  public String getCodePayeur() {
    return codePayeur;
  }

  public void setCodePayeur(String codePayeur) {
    this.codePayeur = codePayeur;
  }
}
