package tn.erap.erap_backend.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Role {
  ADMIN("admin"),
  AGENT("agent"),
  CHEF_LOCAL("chef_local"),
  CHEF_REGION("chef_region");

  private final String value;

  Role(String value) {
    this.value = value;
  }

  @JsonValue
  public String getValue() {
    return value;
  }

  @JsonCreator
  public static Role fromValue(String value) {
    if (value == null || value.isBlank()) {
      return AGENT;
    }

    String normalized = value.trim().toLowerCase().replace('-', '_');

    for (Role role : values()) {
      if (role.value.equals(normalized) || role.name().equalsIgnoreCase(normalized)) {
        return role;
      }
    }

    throw new IllegalArgumentException("Rôle invalide : " + value);
  }
}
