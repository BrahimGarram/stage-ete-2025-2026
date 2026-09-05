package tn.erap.erap_backend.exception;

public class DuplicateFactureException extends RuntimeException {

  public DuplicateFactureException(String message) {
    super(message);
  }
}
