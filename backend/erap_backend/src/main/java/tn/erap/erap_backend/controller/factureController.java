package tn.erap.erap_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.erap.erap_backend.dto.ForecastResult;
import tn.erap.erap_backend.dto.OcrResult;
import tn.erap.erap_backend.entity.Facture;
import tn.erap.erap_backend.exception.OcrException;
import tn.erap.erap_backend.service.ConsommationEauGazService;
import tn.erap.erap_backend.service.ConsommationForecastService;
import tn.erap.erap_backend.service.OcrFactureService;
import tn.erap.erap_backend.service.factureService;

import java.io.IOException;
import java.util.List;

@RestController
public class factureController {

  private final factureService service;
  private final OcrFactureService ocrService;
  private final ConsommationForecastService forecastService;
  private final ConsommationEauGazService eauGazService;

  public factureController(factureService service, OcrFactureService ocrService,
                           ConsommationForecastService forecastService,
                           ConsommationEauGazService eauGazService) {
    this.service = service;
    this.ocrService = ocrService;
    this.forecastService = forecastService;
    this.eauGazService = eauGazService;
  }

  @GetMapping("/factures")
  public ResponseEntity<List<Facture>> getAll() {
    return ResponseEntity.ok(service.getAll());
  }

  @GetMapping("/factures/{id}")
  public ResponseEntity<Facture> getById(@PathVariable Long id) {
    return service.getById(id)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @PostMapping("/factures")
  public ResponseEntity<Facture> create(@RequestBody Facture facture) {
    return ResponseEntity.ok(service.create(facture));
  }

  @PostMapping("/factures/ocr")
  public ResponseEntity<OcrResult> ocr(@RequestParam("image") MultipartFile image) {
    if (image == null || image.isEmpty()) {
      throw new OcrException("Aucune image reçue : champ « image » manquant ou vide.");
    }
    try {
      return ResponseEntity.ok(ocrService.extract(image.getBytes()));
    } catch (IOException e) {
      throw new OcrException("Impossible de lire l'image : " + e.getMessage());
    }
  }

  @GetMapping("/factures/forecast")
  public ResponseEntity<List<ForecastResult>> forecast(
      @RequestParam int annee,
      @RequestParam(required = false) String local,
      @RequestParam(defaultValue = "1.0") double meteo,
      @RequestParam(defaultValue = "0.03") double growth,
      @RequestParam(defaultValue = "1.0") double activite) {
    return ResponseEntity.ok(forecastService.forecast(annee, local, meteo, growth, activite));
  }

  @GetMapping("/forecast/eau")
  public ResponseEntity<List<ForecastResult>> forecastEau(
      @RequestParam int annee,
      @RequestParam(required = false) String local,
      @RequestParam(defaultValue = "1.0") double meteo,
      @RequestParam(defaultValue = "0.03") double growth,
      @RequestParam(defaultValue = "1.0") double activite) {
    return ResponseEntity.ok(eauGazService.forecast("eau", annee, local, meteo, growth, activite));
  }

  @GetMapping("/forecast/gaz")
  public ResponseEntity<List<ForecastResult>> forecastGaz(
      @RequestParam int annee,
      @RequestParam(required = false) String local,
      @RequestParam(defaultValue = "1.0") double meteo,
      @RequestParam(defaultValue = "0.03") double growth,
      @RequestParam(defaultValue = "1.0") double activite) {
    return ResponseEntity.ok(eauGazService.forecast("gaz", annee, local, meteo, growth, activite));
  }

  @PutMapping("/factures/{id}")
  public ResponseEntity<Facture> update(@PathVariable Long id, @RequestBody Facture facture) {
    return service.update(id, facture)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @DeleteMapping("/factures/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    if (service.delete(id)) {
      return ResponseEntity.noContent().build();
    }
    return ResponseEntity.notFound().build();
  }
}
