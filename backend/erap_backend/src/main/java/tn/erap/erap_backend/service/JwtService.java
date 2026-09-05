package tn.erap.erap_backend.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tn.erap.erap_backend.entity.User;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {


  @Value("${jwt.secret}")
  private String secretKey;


  @Value("${jwt.expiration}")
  private long expiration;


  public String generateToken(User user) {

    return Jwts.builder()
      .setSubject(user.getEmail())
      .claim("role", user.getRole() != null ? user.getRole() : "agent")
      .setIssuedAt(new Date())
      .setExpiration(
        new Date(System.currentTimeMillis() + expiration)
      )
      .signWith(getSignKey())
      .compact();
  }


  // Transformation de la clé String en clé cryptographique
  private SecretKey getSignKey() {
    return Keys.hmacShaKeyFor(
      secretKey.getBytes()
    );
  }


  public Claims extractAllClaims(String token) {

    return Jwts.parserBuilder()
      .setSigningKey(getSignKey())
      .build()
      .parseClaimsJws(token)
      .getBody();
  }
  // Récupérer l'email du token
  public String extractUsername(String token) {

    return extractAllClaims(token)
      .getSubject();
  }


  // Vérifier si le token est expiré
  public boolean isTokenExpired(String token) {

    Date expirationDate = extractAllClaims(token)
      .getExpiration();

    return expirationDate.before(new Date());
  }


  // Vérifier si le token est valide
  public boolean isTokenValid(String token, User user) {

    String username = extractUsername(token);

    return username.equals(user.getEmail())
      && !isTokenExpired(token);
  }



}
