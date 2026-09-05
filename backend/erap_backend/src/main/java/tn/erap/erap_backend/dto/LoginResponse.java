package tn.erap.erap_backend.dto;

import tn.erap.erap_backend.entity.User;
import tn.erap.erap_backend.enums.Role;

public record LoginResponse(Long id, String email, String name, String prenom, Role role, String token) {

  public static LoginResponse fromUser(User user, String token) {
     Role role = user.getRole();
    if (role == null ) {
      role = Role.AGENT;
    }
    return new LoginResponse(
      user.getId(),
      user.getEmail(),
      user.getNom(),
      user.getPrenom(),
      role,
      token
    );
  }
}
