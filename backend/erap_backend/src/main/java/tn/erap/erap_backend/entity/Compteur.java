package tn.erap.erap_backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Compteur {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private String numeroSerie;
  private String type;
  private String marque;
  private Date dateInstallation;
  private String etat;

  @ManyToOne
  @JoinColumn(name = "local_id")
  @JsonIgnoreProperties("compteurs")
  private Local local;

  @OneToMany(mappedBy = "compteur", cascade = CascadeType.REMOVE)
  @JsonIgnoreProperties("compteur")
  private List<Facture> factures = new ArrayList<>();
}
