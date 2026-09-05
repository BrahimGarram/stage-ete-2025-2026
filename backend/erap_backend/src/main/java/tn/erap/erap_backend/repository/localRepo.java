package tn.erap.erap_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.erap.erap_backend.entity.Local;

@Repository
public interface localRepo extends JpaRepository<Local, Long> {
}
