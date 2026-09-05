package tn.erap.erap_backend.service;

import org.springframework.stereotype.Service;
import tn.erap.erap_backend.entity.Compteur;
import tn.erap.erap_backend.entity.Facture;
import tn.erap.erap_backend.exception.DuplicateFactureException;
import tn.erap.erap_backend.repository.compteurRepo;
import tn.erap.erap_backend.repository.factureRepo;

import java.util.List;
import java.util.Optional;

@Service
public class factureService {

  private final factureRepo factureRepo;
  private final compteurRepo compteurRepo;

  public factureService(factureRepo factureRepo, compteurRepo compteurRepo) {
    this.factureRepo = factureRepo;
    this.compteurRepo = compteurRepo;
  }

  public List<Facture> getAll() {
    return factureRepo.findAll();
  }

  public Optional<Facture> getById(Long id) {
    return factureRepo.findById(id);
  }

  public Facture create(Facture facture) {
    resolveCompteur(facture);
    ensureUniqueNumero(null, facture.getNumeroFacture());
    return factureRepo.save(facture);
  }

  public Optional<Facture> update(Long id, Facture facture) {
    if (!factureRepo.existsById(id)) {
      return Optional.empty();
    }
    facture.setId(id);
    resolveCompteur(facture);
    ensureUniqueNumero(id, facture.getNumeroFacture());
    return Optional.of(factureRepo.save(facture));
  }

  public boolean delete(Long id) {
    if (!factureRepo.existsById(id)) {
      return false;
    }
    factureRepo.deleteById(id);
    return true;
  }

  private void ensureUniqueNumero(Long ignoreId, String numero) {
    if (numero == null || numero.isBlank()) {
      return;
    }
    String normalized = numero.trim();
    if (factureRepo.existsByNumeroFactureIgnoreCase(normalized)) {
      if (ignoreId != null) {
        Optional<Facture> current = factureRepo.findById(ignoreId);
        if (current.isPresent()) {
          String currentNumero = current.get().getNumeroFacture();
          if (currentNumero != null && normalized.equalsIgnoreCase(currentNumero.trim())) {
            return;
          }
        }
      }
      throw new DuplicateFactureException("Le numéro de facture « " + normalized + " » existe déjà.");
    }
  }

  private void resolveCompteur(Facture facture) {
    if (facture.getCompteur() != null && facture.getCompteur().getId() != null) {
      Optional<Compteur> compteur = compteurRepo.findById(facture.getCompteur().getId());
      facture.setCompteur(compteur.orElse(null));
    }
  }
}
