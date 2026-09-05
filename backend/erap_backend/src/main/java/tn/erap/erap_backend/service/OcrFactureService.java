package tn.erap.erap_backend.service;

import org.springframework.stereotype.Service;
import tn.erap.erap_backend.dto.OcrResult;
import tn.erap.erap_backend.exception.OcrException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class OcrFactureService {

  private static final Pattern DATE_GENERIC =
      Pattern.compile("\\b(\\d{1,2}[/\\-.]\\d{1,2}[/\\-.]\\d{2,4})\\b");
  private static final Pattern DATE_FACTURE =
      Pattern.compile("(?i)\\bdate\\s*(?:de)?\\s*factur\\w*\\s*[:\\-=]?\\s*(\\d{1,2}[/\\-.]\\d{1,2}[/\\-.]\\d{2,4})");
  private static final Pattern NUMERO =
      Pattern.compile("(?i)n[°o\\.]?\\s*[:\\-\\.]?\\s*(?:de\\s+)?facture\\w*\\s*[:\\-\\.]?\\s*(\\d{2,}[0-9A-Za-z\\-/]*)");
  private static final Pattern NUMERO_FALLBACK =
      Pattern.compile("\\b(\\d{6,})\\b");

  private static final Pattern MOIS_FACTURE =
      Pattern.compile("(?i)\\bmois\\s*[:\\-=]?\\s*(\\d{1,2})\\s*[/\\-.]?\\s*(\\d{2,4})\\b");

  private static final Pattern ANCIEN_INDEX =
      Pattern.compile("(?i)ancien\\s*index\\s*[:\\-=]?\\s*([\\d\\s.,]+)");
  private static final Pattern NOUVEAU_INDEX =
      Pattern.compile("(?i)nouveau\\s*index\\s*[:\\-=]?\\s*([\\d\\s.,]+)");
  private static final Pattern INDEX_COLONNE =
      Pattern.compile("(?i)index\\s*[:\\-=]?\\s*([\\d\\s.,]+)");
  private static final Pattern ANCIEN_NEXTPAGE =
      Pattern.compile("(?i)ancien\\b[^\\d]*\\b(\\d{3,})");
  private static final Pattern NOUVEAU_NEXTPAGE =
      Pattern.compile("(?i)nouveau\\b[^\\d]*\\b(\\d{3,})");
  private static final Pattern INDEX_AROUND_TOTALE =
      Pattern.compile("(\\d{4,})\\s+Total\\s+E\\s+(\\d{4,})");
  private static final Pattern DATE_MONTH_YEAR =
      Pattern.compile("\\b(\\d{1,2})\\s*[/\\-.]\\s*(\\d{4})\\b");

  private static final Pattern CONSO_KPI =
      Pattern.compile("(?i)consommation\\s*(?:\\([^)]*\\))?\\s*[:\\-=]?\\s*([\\d\\s.,]+)");
  private static final Pattern CONSO_LABEL =
      Pattern.compile("(?i)consommation\\s*[:\\-=]?\\s*([\\d\\s.,]+)");
  private static final Pattern CONSO_UNIT =
      Pattern.compile("(?i)([\\d\\s.,]+)\\s*(?:kwh|k\\s*wh)");
  private static final Pattern CONSO_PADDLE =
      Pattern.compile("(?i)consommation[^\\d]*(\\d{3,})");

  private static final Pattern NET_A_PAYER =
      Pattern.compile("(?i)net\\s*[àa]\\s*payer\\s*[:\\-=]?\\s*([\\d\\s.,]+)");
  private static final Pattern MONTANT_WORDS =
      Pattern.compile("(?i)((?:[a-zà-ÿ]+(?:[\\s-][a-zà-ÿ]+)*))\\s*(?:dinars?)\\b");
  private static final Pattern MONTANT_GENERIC =
      Pattern.compile("(?i)montant\\s*(?:total|facture)?\\s*[:\\-=]?\\s*([\\d\\s.,]+)");
  private static final Pattern MONEY_DECIMAL =
      Pattern.compile("\\b\\d{1,3}(?:[\\s.,]\\d{3})*,\\d{2,3}\\b");

  private static final Pattern COUPON_LINE =
      Pattern.compile("(?is)coupon[^\n]*\n.*?\\b(\\d{1,2})\\s*\\|\\s*(\\d{4})\\s*\\|\\s*([\\d\\s.,]+)");
  private static final Pattern COUPON_NUMERO =
      Pattern.compile("(?is)coupon[^\n]*\n.*?\\b(\\d{6,})\\b.*?\\b(\\d{1,2})\\s*\\|\\s*(\\d{4})\\s*\\|\\s*([\\d\\s.,]+)");

  private static final Pattern ANY_NUMBER =
      Pattern.compile("\\b([\\d]{4,}[\\d\\s.,]*)\\b");

  private static final Map<String, Integer> FRENCH_NUMBERS = new HashMap<>();

  static {
    FRENCH_NUMBERS.put("zéro", 0);
    FRENCH_NUMBERS.put("zero", 0);
    FRENCH_NUMBERS.put("un", 1);
    FRENCH_NUMBERS.put("deux", 2);
    FRENCH_NUMBERS.put("trois", 3);
    FRENCH_NUMBERS.put("quatre", 4);
    FRENCH_NUMBERS.put("cinq", 5);
    FRENCH_NUMBERS.put("six", 6);
    FRENCH_NUMBERS.put("sept", 7);
    FRENCH_NUMBERS.put("huit", 8);
    FRENCH_NUMBERS.put("neuf", 9);
    FRENCH_NUMBERS.put("dix", 10);
    FRENCH_NUMBERS.put("onze", 11);
    FRENCH_NUMBERS.put("douze", 12);
    FRENCH_NUMBERS.put("treize", 13);
    FRENCH_NUMBERS.put("quatorze", 14);
    FRENCH_NUMBERS.put("quinze", 15);
    FRENCH_NUMBERS.put("seize", 16);
    FRENCH_NUMBERS.put("vingt", 20);
    FRENCH_NUMBERS.put("trente", 30);
    FRENCH_NUMBERS.put("quarante", 40);
    FRENCH_NUMBERS.put("cinquante", 50);
    FRENCH_NUMBERS.put("soixante", 60);
    FRENCH_NUMBERS.put("soixantedix", 70);
    FRENCH_NUMBERS.put("septante", 70);
    FRENCH_NUMBERS.put("quatrevingt", 80);
    FRENCH_NUMBERS.put("octante", 80);
    FRENCH_NUMBERS.put("quatrevingtdix", 90);
    FRENCH_NUMBERS.put("nonante", 90);
    FRENCH_NUMBERS.put("cent", 100);
    FRENCH_NUMBERS.put("cents", 100);
    FRENCH_NUMBERS.put("mille", 1000);
  }

  public OcrResult extract(byte[] imageBytes) {
    Path temp = null;
    try {
      temp = Files.createTempFile("erap_ocr_", ".png");
      Files.write(temp, imageBytes);
      String json = runPaddleOcr(temp.toString());
      return parseStructured(json);
    } catch (IOException e) {
      throw new OcrException("Impossible de traiter l'image : " + e.getMessage());
    } finally {
      if (temp != null) {
        try {
          Files.deleteIfExists(temp);
        } catch (IOException ignored) {
        }
      }
    }
  }

  private String runPaddleOcr(String imagePath) {
    String scriptPath = findPaddleScript();
    try {
      ProcessBuilder pb = new ProcessBuilder("python", scriptPath, imagePath);
      pb.redirectErrorStream(true);
      Process process = pb.start();
      String output;
      try (InputStream in = process.getInputStream()) {
        output = new String(in.readAllBytes(), StandardCharsets.UTF_8);
      }
      boolean finished = process.waitFor(120, TimeUnit.SECONDS);
      if (!finished) {
        process.destroyForcibly();
        throw new OcrException("Analyse OCR trop longue.");
      }
      if (process.exitValue() != 0) {
        throw new OcrException("PaddleOCR a échoué (code " + process.exitValue() + ").");
      }
      return output.trim();
    } catch (IOException e) {
      throw new OcrException("Python/PaddleOCR introuvable. Détail : " + e.getMessage());
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new OcrException("Analyse OCR interrompue.");
    }
  }

  private String parsePaddleOutput(String jsonOutput) {
    try {
      String textsField = jsonOutput.trim();
      int idx = textsField.indexOf("\"texts\"");
      if (idx < 0) {
        return jsonOutput;
      }
      int arrStart = textsField.indexOf("[", idx);
      int arrEnd = textsField.lastIndexOf("]");
      if (arrStart < 0 || arrEnd < 0 || arrEnd <= arrStart) {
        return jsonOutput;
      }
      String arr = textsField.substring(arrStart + 1, arrEnd);
      StringBuilder sb = new StringBuilder();
      boolean inString = false;
      boolean escaped = false;
      StringBuilder current = new StringBuilder();
      for (char c : arr.toCharArray()) {
        if (escaped) {
          escaped = false;
          current.append(c);
          continue;
        }
        if (c == '\\') {
          escaped = true;
          continue;
        }
        if (c == '"') {
          if (inString) {
            String val = current.toString();
            if (!val.isEmpty()) {
              sb.append(val).append('\n');
            }
            current.setLength(0);
          }
          inString = !inString;
          continue;
        }
        if (inString) {
          current.append(c);
        }
      }
      return sb.toString();
    } catch (Exception e) {
      return jsonOutput;
    }
  }

  private String findPaddleScript() {
    String[] candidates = {
      "ml/ocr_paddle.py",
      "../ml/ocr_paddle.py",
      "../../ml/ocr_paddle.py"
    };
    for (String c : candidates) {
      if (Files.exists(Path.of(c))) {
        return Path.of(c).toAbsolutePath().toString();
      }
    }
    throw new OcrException("Script ocr_paddle.py introuvable.");
  }

  private OcrResult parse(String text) {
    OcrResult result = new OcrResult();
    result.setRawText(text == null ? "" : text.trim());
    if (text == null || text.isBlank()) {
      return result;
    }

    String rawLower = text.toLowerCase(Locale.ROOT);

    String couponMois = null;
    String couponAnnee = null;
    Double couponMontant = null;
    Matcher cm = COUPON_LINE.matcher(rawLower);
    if (cm.find()) {
      couponMois = cm.group(1);
      couponAnnee = cm.group(2);
      couponMontant = parseNumber(cm.group(3));
    }

    String cleaned = text.replaceAll("[\u0600-\u06FF]+", " ");
    cleaned = cleaned.replaceAll("[^\\x00-\\x7F]", "");
    cleaned = cleaned.replaceAll("(?<=\\S) (?=\\S)", "");
    cleaned = cleaned.replaceAll("\\s{2,}", " ");

    String numero = extractNumero(cleaned);
    result.setNumeroFacture(numero);

    String dateFacture = extractDateFacture(cleaned);
    result.setDateFacture(dateFacture);

    String mois = null;
    String annee = null;
    Matcher mm = MOIS_FACTURE.matcher(cleaned);
    if (mm.find()) {
      mois = mm.group(1);
      annee = mm.group(2);
    }
    if (mois == null) {
      Matcher dmy = DATE_MONTH_YEAR.matcher(cleaned);
      if (dmy.find()) {
        mois = dmy.group(1);
        annee = dmy.group(2);
      }
    }
    if (mois == null && couponMois != null) {
      mois = couponMois;
      annee = couponAnnee;
    }
    if (annee != null && annee.length() == 2) {
      annee = "20" + annee;
    }

    if (result.getDateFacture() == null && mois != null && annee != null) {
      try {
        int m = Integer.parseInt(mois);
        int y = Integer.parseInt(annee);
        YearMonth ym = YearMonth.of(y, m);
        result.setDateFacture(ym.atEndOfMonth().format(DateTimeFormatter.ISO_LOCAL_DATE));
      } catch (Exception ignored) {
      }
    }

    if (result.getDateFacture() == null) {
      Matcher dg = DATE_GENERIC.matcher(cleaned);
      if (dg.find()) {
        result.setDateFacture(normalizeDate(dg.group(1)));
      }
    }

    if (mois != null && annee != null) {
      try {
        int m = Integer.parseInt(mois);
        int y = Integer.parseInt(annee);
        YearMonth ym = YearMonth.of(y, m);
        result.setPeriodeDebut(ym.atDay(1).format(DateTimeFormatter.ISO_LOCAL_DATE));
        result.setPeriodeFin(ym.atEndOfMonth().format(DateTimeFormatter.ISO_LOCAL_DATE));
      } catch (Exception ignored) {
      }
    }

    Double ancienIdx = null;
    Double nouveauIdx = null;

    Matcher te = INDEX_AROUND_TOTALE.matcher(cleaned);
    if (te.find()) {
      ancienIdx = parseNumber(te.group(1));
      nouveauIdx = parseNumber(te.group(2));
    }
    if (ancienIdx == null) {
      Matcher ai = ANCIEN_INDEX.matcher(cleaned);
      if (ai.find()) {
        ancienIdx = parseNumber(ai.group(1));
      }
    }
    if (ancienIdx == null) {
      Matcher ai3 = INDEX_COLONNE.matcher(cleaned);
      if (ai3.find()) {
        ancienIdx = parseNumber(ai3.group(1));
      }
    }
    if (nouveauIdx == null) {
      Matcher ni = NOUVEAU_INDEX.matcher(cleaned);
      if (ni.find()) {
        nouveauIdx = parseNumber(ni.group(1));
      }
    }

    result.setAncienIndex(ancienIdx);
    result.setNouveauIndex(nouveauIdx);

    Double conso = null;
    if (ancienIdx != null && nouveauIdx != null && nouveauIdx > ancienIdx) {
      conso = nouveauIdx - ancienIdx;
    }
    if (conso == null || conso <= 0) {
      Matcher ck = CONSO_KPI.matcher(cleaned);
      if (ck.find()) {
        conso = parseNumber(ck.group(1));
      }
    }
    if (conso == null || conso <= 0) {
      Matcher cl = CONSO_LABEL.matcher(cleaned);
      if (cl.find()) {
        conso = parseNumber(cl.group(1));
      }
    }
    if (conso == null || conso <= 0) {
      Matcher cu = CONSO_UNIT.matcher(cleaned);
      if (cu.find()) {
        conso = parseNumber(cu.group(1));
      }
    }
    if (conso == null || conso <= 0) {
      Matcher cp = CONSO_PADDLE.matcher(cleaned);
      if (cp.find()) {
        conso = parseNumber(cp.group(1));
      }
    }
    result.setConsommation(conso);

    Double montant = null;
    Matcher npm = NET_A_PAYER.matcher(cleaned);
    if (npm.find()) {
      montant = parseNumber(npm.group(1));
    }
    if (montant == null) {
      Matcher mg = MONTANT_GENERIC.matcher(cleaned);
      if (mg.find()) {
        montant = parseNumber(mg.group(1));
      }
    }
    if (montant == null) {
      String cleanedLower = cleaned.toLowerCase(Locale.ROOT);
      int netIdx = cleanedLower.indexOf("net a payer");
      if (netIdx > 0) {
        String before = cleaned.substring(0, netIdx).trim();
        Matcher beforeNum = MONEY_DECIMAL.matcher(before);
        if (beforeNum.find()) {
          montant = parseNumber(beforeNum.group());
        }
      }
    }
    if (montant == null && couponMontant != null) {
      montant = couponMontant;
    }
    if (montant == null) {
      montant = parseFrenchAmount(cleaned);
    }
    if (montant == null) {
      Matcher md = MONEY_DECIMAL.matcher(cleaned);
      if (md.find()) {
        montant = parseNumber(md.group());
      }
    }
    result.setMontant(montant);

    String lower = text.toLowerCase(Locale.ROOT);
    if (lower.contains("payée") || lower.contains("payee") || lower.contains("réglée") || lower.contains("reglee")) {
      result.setStatut("Payée");
    } else if (lower.contains("impayée") || lower.contains("impayee") || lower.contains("en retard")) {
      result.setStatut("Impayée");
    } else {
      result.setStatut("En attente");
    }

    return result;
  }

  private OcrResult parseStructured(String jsonOutput) {
    try {
      OcrResult result = new OcrResult();
      String json = jsonOutput.trim();

      String numero = extractJsonString(json, "numeroFacture");
      if (numero != null) {
        result.setNumeroFacture(numero);
      }

      Integer mois = extractJsonInt(json, "mois");
      Integer annee = extractJsonInt(json, "annee");
      if (mois != null && annee != null) {
        try {
          YearMonth ym = YearMonth.of(annee, mois);
          result.setDateFacture(ym.atEndOfMonth().format(DateTimeFormatter.ISO_LOCAL_DATE));
          result.setPeriodeDebut(ym.atDay(1).format(DateTimeFormatter.ISO_LOCAL_DATE));
          result.setPeriodeFin(ym.atEndOfMonth().format(DateTimeFormatter.ISO_LOCAL_DATE));
        } catch (Exception ignored) {
        }
      }

      Double ancienIndex = extractJsonDouble(json, "ancienIndex");
      if (ancienIndex != null) {
        result.setAncienIndex(ancienIndex);
      }

      Double nouveauIndex = extractJsonDouble(json, "nouveauIndex");
      if (nouveauIndex != null) {
        result.setNouveauIndex(nouveauIndex);
      }

      Double conso = extractJsonDouble(json, "consommation");
      if (conso != null) {
        result.setConsommation(conso);
      }

      Double montant = extractJsonDouble(json, "montant");
      if (montant != null) {
        result.setMontant(montant);
      }

      Double netAPayer = extractJsonDouble(json, "netAPayer");
      if (netAPayer != null) {
        result.setMontant(netAPayer);
      }

      String codePayeur = extractJsonString(json, "codePayeur");
      if (codePayeur != null) {
        result.setCodePayeur(codePayeur);
      }

      result.setStatut("En attente");
      return result;
    } catch (Exception e) {
      throw new OcrException("Erreur parsing résultat OCR : " + e.getMessage());
    }
  }

  private String extractJsonString(String json, String key) {
    String pattern = "\"" + key + "\"";
    int idx = json.indexOf(pattern);
    if (idx < 0) return null;
    int colon = json.indexOf(':', idx + pattern.length());
    if (colon < 0) return null;
    int q1 = json.indexOf('"', colon + 1);
    if (q1 < 0) return null;
    int q2 = json.indexOf('"', q1 + 1);
    if (q2 < 0) return null;
    return json.substring(q1 + 1, q2);
  }

  private Integer extractJsonInt(String json, String key) {
    String pattern = "\"" + key + "\"";
    int idx = json.indexOf(pattern);
    if (idx < 0) return null;
    int colon = json.indexOf(':', idx + pattern.length());
    if (colon < 0) return null;
    String after = json.substring(colon + 1).trim();
    Matcher m = Pattern.compile("(-?\\d+)").matcher(after);
    if (m.find()) {
      try {
        return Integer.parseInt(m.group(1));
      } catch (NumberFormatException e) {
        return null;
      }
    }
    return null;
  }

  private Double extractJsonDouble(String json, String key) {
    String pattern = "\"" + key + "\"";
    int idx = json.indexOf(pattern);
    if (idx < 0) return null;
    int colon = json.indexOf(':', idx + pattern.length());
    if (colon < 0) return null;
    String after = json.substring(colon + 1).trim();
    if (after.startsWith("\"")) {
      int q2 = after.indexOf('"', 1);
      if (q2 < 0) return null;
      try {
        return Double.parseDouble(after.substring(1, q2).replace(",", "."));
      } catch (NumberFormatException e) {
        return null;
      }
    }
    String numStr = after.replaceFirst("^(-?\\d+\\.?\\d*).*", "$1");
    if (numStr.isEmpty() || numStr.equals("null")) return null;
    try {
      return Double.parseDouble(numStr.replace(",", "."));
    } catch (NumberFormatException e) {
      return null;
    }
  }

  private String extractNumero(String text) {
    Matcher m = NUMERO.matcher(text);
    if (m.find()) {
      return m.group(1).trim();
    }
    Matcher fb = NUMERO_FALLBACK.matcher(text);
    if (fb.find()) {
      return fb.group(1).trim();
    }
    return null;
  }

  private String extractDateFacture(String text) {
    Matcher m = DATE_FACTURE.matcher(text);
    if (m.find()) {
      return normalizeDate(m.group(1));
    }
    return null;
  }

  private String normalizeDate(String raw) {
    if (raw == null) {
      return null;
    }
    String[] parts = raw.split("[/\\-.]");
    if (parts.length != 3) {
      return raw.trim();
    }
    try {
      int year;
      int month;
      int day;
      if (parts[0].length() == 4) {
        year = Integer.parseInt(parts[0]);
        month = Integer.parseInt(parts[1]);
        day = Integer.parseInt(parts[2]);
      } else {
        day = Integer.parseInt(parts[0]);
        month = Integer.parseInt(parts[1]);
        year = Integer.parseInt(parts[2]);
        if (year < 100) {
          year += 2000;
        }
      }
      if (month < 1 || month > 12 || day < 1 || day > 31) {
        return raw.trim();
      }
      return String.format(Locale.ROOT, "%04d-%02d-%02d", year, month, day);
    } catch (NumberFormatException e) {
      return raw.trim();
    }
  }

  private Double parseNumber(String raw) {
    if (raw == null) {
      return null;
    }
    String value = raw.trim().replace(" ", "").replace(",", ".");
    if (value.isEmpty()) {
      return null;
    }
    try {
      return Double.parseDouble(value);
    } catch (NumberFormatException e) {
      try {
        return Double.parseDouble(value.replace(".", ""));
      } catch (NumberFormatException e2) {
        return null;
      }
    }
  }

  private Double parseFrenchAmount(String text) {
    Matcher m = MONTANT_WORDS.matcher(text);
    if (!m.find()) {
      return null;
    }
    return parseFrenchNumber(m.group(1));
  }

  private Double parseFrenchNumber(String phrase) {
    String p = phrase.toLowerCase(Locale.ROOT)
        .replace("quatre-vingt-dix", "quatrevingtdix")
        .replace("quatre-vingts", "quatrevingt")
        .replace("quatre-vingt", "quatrevingt")
        .replace("soixante-dix", "soixantedix")
        .replace(" et ", " ")
        .replace("et ", " ");
    double total = 0;
    double current = 0;
    boolean any = false;
    for (String token : p.split("[\\s-]+")) {
      if (token.isEmpty()) {
        continue;
      }
      Integer n = FRENCH_NUMBERS.get(token);
      if (n == null) {
        continue;
      }
      any = true;
      if (n == 100) {
        current = (current == 0 ? 1 : current) * 100;
      } else if (n == 1000) {
        total += (current == 0 ? 1 : current) * 1000;
        current = 0;
      } else {
        current += n;
      }
    }
    if (!any) {
      return null;
    }
    return total + current;
  }
}
