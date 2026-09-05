package tn.erap.erap_backend.service;

import org.springframework.stereotype.Service;
import tn.erap.erap_backend.entity.Local;
import tn.erap.erap_backend.repository.localRepo;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class localService {

  private final localRepo localRepo;

  public localService(localRepo localRepo) {
    this.localRepo = localRepo;
  }

  public List<Local> getAll() {
    return localRepo.findAll();
  }

  public Optional<Local> getById(Long id) {
    return localRepo.findById(id);
  }

  public Local create(Local local) {
    if (local.getDateCreation() == null) {
      local.setDateCreation(new Date());
    }
    return localRepo.save(local);
  }

  public Optional<Local> update(Long id, Local local) {
    if (!localRepo.existsById(id)) {
      return Optional.empty();
    }
    local.setId(id);
    return Optional.of(localRepo.save(local));
  }

  public boolean delete(Long id) {
    if (!localRepo.existsById(id)) {
      return false;
    }
    localRepo.deleteById(id);
    return true;
  }
}
