package tn.erap.erap_backend.service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import tn.erap.erap_backend.entity.User;
import tn.erap.erap_backend.enums.Role;
import tn.erap.erap_backend.repository.userRepo;
import java.util.List;
import java.util.Optional;

@Service
public class userService {

  private final userRepo userRepo;
  private final PasswordEncoder passwordEncoder;

  public userService(userRepo userRepo, PasswordEncoder passwordEncoder) {
    this.userRepo = userRepo;
    this.passwordEncoder = passwordEncoder;
  }

  public List<User> getAllUsers() {
    return userRepo.findAll();
  }

  public User createUser(User user) {
    if (user.getRole() == null  ) {
      user.setRole(Role.AGENT);
    }
    user.setPassword(passwordEncoder.encode(user.getPassword()));
    return userRepo.save(user);
  }

  public User updateUser(User user) {
    if (user.getPassword() != null && !user.getPassword().isBlank()) {
      user.setPassword(passwordEncoder.encode(user.getPassword()));
    }
    return userRepo.save(user);
  }

  public Optional<User> updateUser(Long id, User user) {
    Optional<User> existing = userRepo.findById(id);
    if (existing.isEmpty()) {
      return Optional.empty();
    }
    user.setId(id);
    if (user.getPassword() != null && !user.getPassword().isBlank()) {
      user.setPassword(passwordEncoder.encode(user.getPassword()));
    }
    return Optional.of(userRepo.save(user));
  }

  public boolean deleteUser(Long id) {
    if (!userRepo.existsById(id)) {
      return false;
    }
    userRepo.deleteById(id);
    return true;
  }

  public User loginUser(String email, String password) {
    User user = userRepo.findByEmail(email);
    if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
      return null;
    }
    return user;
  }



}
