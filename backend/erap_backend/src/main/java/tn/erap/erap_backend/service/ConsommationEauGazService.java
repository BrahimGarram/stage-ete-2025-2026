package tn.erap.erap_backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tn.erap.erap_backend.dto.ForecastResult;
import tn.erap.erap_backend.exception.ForecastException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class ConsommationEauGazService {

  private final String python;

  public ConsommationEauGazService(
      @Value("${erap.forecast.python:python}") String python) {
    this.python = python;
  }

  public List<ForecastResult> forecast(String type, int annee, String local,
                                       double meteo, double growth, double activite) {
    String localArg = (local == null || local.isBlank()) ? "all" : local;

    Path script = Paths.get(System.getProperty("user.dir"), "..", "..", "ml", "modele_prevision_eau_gaz.py");
    if (!Files.exists(script)) {
      throw new ForecastException("Script introuvable : " + script.toAbsolutePath());
    }

    List<String> cmd = new ArrayList<>();
    cmd.add(python);
    cmd.add(script.toAbsolutePath().toString());
    cmd.add("--type");
    cmd.add(type);
    cmd.add("--annee");
    cmd.add(String.valueOf(annee));
    cmd.add("--local");
    cmd.add(localArg);
    cmd.add("--meteo");
    cmd.add(String.valueOf(meteo));
    cmd.add("--growth");
    cmd.add(String.valueOf(growth));
    cmd.add("--activite");
    cmd.add(String.valueOf(activite));

    try {
      ProcessBuilder pb = new ProcessBuilder(cmd);
      pb.redirectErrorStream(true);
      Process process = pb.start();
      String output;
      try (InputStream in = process.getInputStream()) {
        output = new String(in.readAllBytes(), StandardCharsets.UTF_8);
      }
      boolean finished = process.waitFor(120, TimeUnit.SECONDS);
      if (!finished) {
        process.destroyForcibly();
        throw new ForecastException("Prévision trop lente (délai de 120 s dépassé).");
      }
      if (process.exitValue() != 0) {
        throw new ForecastException("Échec du modèle : " + output.trim());
      }
      return parse(output);
    } catch (IOException e) {
      throw new ForecastException("Python introuvable : " + e.getMessage());
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new ForecastException("Prévision interrompue.");
    }
  }

  private List<ForecastResult> parse(String output) {
    List<ForecastResult> results = new ArrayList<>();
    for (String line : output.split("\\R")) {
      line = line.trim();
      if (line.isEmpty() || !line.startsWith("TYPE=")) {
        continue;
      }
      ForecastResult r = new ForecastResult();
      for (String pair : line.split("\\|")) {
        int idx = pair.indexOf('=');
        if (idx < 0) continue;
        String key = pair.substring(0, idx).trim();
        String val = pair.substring(idx + 1).trim();
        switch (key) {
          case "TYPE" -> r.setType(val);
          case "ANNEE" -> r.setAnnee(Integer.parseInt(val));
          case "LOCAL" -> r.setLocal(val);
          case "REGION" -> r.setRegion(val);
          case "ESTIME" -> r.setEstime(Long.parseLong(val));
          case "BAS" -> r.setBas(Long.parseLong(val));
          case "HAUT" -> r.setHaut(Long.parseLong(val));
          case "MONTANT" -> r.setMontant(Long.parseLong(val));
          case "MONTANT_BAS" -> r.setMontantBas(Long.parseLong(val));
          case "MONTANT_HAUT" -> r.setMontantHaut(Long.parseLong(val));
          case "WARN" -> r.setWarn(Boolean.parseBoolean(val));
          case "METEO" -> r.setMeteo(Double.parseDouble(val));
          case "GROWTH" -> r.setGrowth(Double.parseDouble(val));
          case "ACTIVITE" -> r.setActivite(Double.parseDouble(val));
          default -> { /* ignore */ }
        }
      }
      results.add(r);
    }
    if (results.isEmpty()) {
      throw new ForecastException("Aucun résultat retourné par le modèle.");
    }
    return results;
  }
}
