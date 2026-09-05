package tn.erap.erap_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.erap.erap_backend.entity.Compteur;

@Repository
public interface compteurRepo extends JpaRepository<Compteur, Long> {
}
