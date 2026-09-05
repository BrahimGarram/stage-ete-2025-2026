package tn.erap.erap_backend.service;

import org.springframework.stereotype.Service;
import tn.erap.erap_backend.entity.Compteur;
import tn.erap.erap_backend.entity.Local;
import tn.erap.erap_backend.repository.compteurRepo;
import tn.erap.erap_backend.repository.localRepo;

import java.util.List;
import java.util.Optional;

@Service
public class compteurService {

  private final compteurRepo compteurRepo;
  private final localRepo localRepo;

  public compteurService(compteurRepo compteurRepo, localRepo localRepo) {
    this.compteurRepo = compteurRepo;
    this.localRepo = localRepo;
  }

  public List<Compteur> getAll() {
    return compteurRepo.findAll();
  }

  public Optional<Compteur> getById(Long id) {
    return compteurRepo.findById(id);
  }

  public Compteur create(Compteur compteur) {
    resolveLocal(compteur);
    return compteurRepo.save(compteur);
  }

  public Optional<Compteur> update(Long id, Compteur compteur) {
    if (!compteurRepo.existsById(id)) {
      return Optional.empty();
    }
    compteur.setId(id);
    resolveLocal(compteur);
    return Optional.of(compteurRepo.save(compteur));
  }

  public boolean delete(Long id) {
    if (!compteurRepo.existsById(id)) {
      return false;
    }
    compteurRepo.deleteById(id);
    return true;
  }

  private void resolveLocal(Compteur compteur) {
    if (compteur.getLocal() != null && compteur.getLocal().getId() != null) {
      Optional<Local> local = localRepo.findById(compteur.getLocal().getId());
      compteur.setLocal(local.orElse(null));
    }
  }
}
