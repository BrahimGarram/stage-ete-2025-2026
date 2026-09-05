package tn.erap.erap_backend.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import tn.erap.erap_backend.enums.Role;
import java.util.Date;
@Entity
@Getter
@Setter
@NoArgsConstructor
public class User {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  private String nom;
  private String prenom;
  @Column(nullable = false,unique = true)
  private String email;
  @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
  @Column(nullable = false)
  private String password;
  @Column(nullable = false,unique = true)
  private int phone;
  private boolean actif;
  @Column(nullable = false)
  private Role role = Role.AGENT;
  private Date dateCreation;

  @PrePersist
  public void prePersist() {
    if (dateCreation == null) {
      dateCreation = new Date();
    }
  }
}
