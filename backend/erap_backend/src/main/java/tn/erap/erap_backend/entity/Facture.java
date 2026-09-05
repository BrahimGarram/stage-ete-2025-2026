package tn.erap.erap_backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Facture {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private String numeroFacture;
  private Date dateFacture;
  private Date periodeDebut;
  private Date periodeFin;
  private Double consommation;
  private Double montant;
  private String statut;
  private Double ancienIndex;
  private Double nouveauIndex;

  @ManyToOne
  @JoinColumn(name = "compteur_id")
  @JsonIgnoreProperties("factures")
  private Compteur compteur;
}
