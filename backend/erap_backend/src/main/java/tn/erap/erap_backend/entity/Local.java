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
public class Local {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private String nom;
  private String adresse;
  private String ville;
  private String region;
  private String description;
  private Date dateCreation;

  @OneToMany(mappedBy = "local", cascade = CascadeType.REMOVE)
  @JsonIgnoreProperties("local")
  private List<Compteur> compteurs = new ArrayList<>();

  @PrePersist
  public void prePersist() {
    if (dateCreation == null) {
      dateCreation = new Date();
    }
  }
}
