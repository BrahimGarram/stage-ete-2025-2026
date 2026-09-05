package tn.erap.erap_backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.erap.erap_backend.dto.LoginResponse;
import tn.erap.erap_backend.dto.loginRequest;
import tn.erap.erap_backend.entity.User;
import tn.erap.erap_backend.service.JwtService;
import tn.erap.erap_backend.service.userService;
import java.util.List;

@RestController
public class userController {

  private final userService service;
  private final JwtService jwtService;

  public userController(userService service, JwtService jwt) {
    this.service = service;
    this.jwtService = jwt;
  }

  @PostMapping("/adduser")
  public User addUser(@RequestBody User user) {
    return service.createUser(user);
  }

  @PostMapping("/login")
  public ResponseEntity<LoginResponse> loginUser(@RequestBody loginRequest loginRequest) {
    User user = service.loginUser(loginRequest.getEmail(), loginRequest.getPassword());
    if (user == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    String token = jwtService.generateToken(user);
    return ResponseEntity.ok(LoginResponse.fromUser(user, token));
  }

  @GetMapping("/users")
  public ResponseEntity<List<User>> getUsers() {
    return ResponseEntity.ok(service.getAllUsers());
  }

  @PutMapping("/users/{id}")
  public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
    return service.updateUser(id, user)
      .map(ResponseEntity::ok)
      .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @DeleteMapping("/users/{id}")
  public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
    if (service.deleteUser(id)) {
      return ResponseEntity.noContent().build();
    }
    return ResponseEntity.notFound().build();
  }
}
