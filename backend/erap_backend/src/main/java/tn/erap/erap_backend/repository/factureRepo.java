package tn.erap.erap_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.erap.erap_backend.entity.Facture;

@Repository
public interface factureRepo extends JpaRepository<Facture, Long> {
  boolean existsByNumeroFactureIgnoreCase(String numeroFacture);
}
