package tn.erap.erap_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.erap.erap_backend.entity.Local;
import tn.erap.erap_backend.service.localService;

import java.util.List;

@RestController
public class localController {

  private final localService service;

  public localController(localService service) {
    this.service = service;
  }

  @GetMapping("/locaux")
  public ResponseEntity<List<Local>> getAll() {
    return ResponseEntity.ok(service.getAll());
  }

  @GetMapping("/locaux/{id}")
  public ResponseEntity<Local> getById(@PathVariable Long id) {
    return service.getById(id)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @PostMapping("/locaux")
  public ResponseEntity<Local> create(@RequestBody Local local) {
    return ResponseEntity.ok(service.create(local));
  }

  @PutMapping("/locaux/{id}")
  public ResponseEntity<Local> update(@PathVariable Long id, @RequestBody Local local) {
    return service.update(id, local)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @DeleteMapping("/locaux/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    if (service.delete(id)) {
      return ResponseEntity.noContent().build();
    }
    return ResponseEntity.notFound().build();
  }
}
