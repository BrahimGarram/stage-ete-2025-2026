package tn.erap.erap_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.erap.erap_backend.entity.Compteur;
import tn.erap.erap_backend.service.compteurService;

import java.util.List;

@RestController
public class compteurController {

  private final compteurService service;

  public compteurController(compteurService service) {
    this.service = service;
  }

  @GetMapping("/compteurs")
  public ResponseEntity<List<Compteur>> getAll() {
    return ResponseEntity.ok(service.getAll());
  }

  @GetMapping("/compteurs/{id}")
  public ResponseEntity<Compteur> getById(@PathVariable Long id) {
    return service.getById(id)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @PostMapping("/compteurs")
  public ResponseEntity<Compteur> create(@RequestBody Compteur compteur) {
    return ResponseEntity.ok(service.create(compteur));
  }

  @PutMapping("/compteurs/{id}")
  public ResponseEntity<Compteur> update(@PathVariable Long id, @RequestBody Compteur compteur) {
    return service.update(id, compteur)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @DeleteMapping("/compteurs/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    if (service.delete(id)) {
      return ResponseEntity.noContent().build();
    }
    return ResponseEntity.notFound().build();
  }
}
