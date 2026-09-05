package tn.erap.erap_backend.entity;

public record UserResponse(Long id, String email, String name) {
  public static UserResponse fromUser(User user) {
    return new UserResponse(user.getId(), user.getEmail(), user.getNom());
  }
}
