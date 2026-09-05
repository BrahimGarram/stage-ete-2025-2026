package tn.erap.erap_backend.config;


import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import tn.erap.erap_backend.service.JwtService;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;


@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {


  private final JwtService jwtService;


  public JwtAuthenticationFilter(JwtService jwtService){
    this.jwtService = jwtService;
  }



  @Override
  protected void doFilterInternal(
    HttpServletRequest request,
    HttpServletResponse response,
    FilterChain filterChain)
    throws ServletException, IOException {



    String authHeader = request.getHeader("Authorization");


    // Pas de token
    if(authHeader == null || !authHeader.startsWith("Bearer ")){
      filterChain.doFilter(request,response);
      return;
    }


    String token = authHeader.substring(7);


    try {


      // vérifier expiration
      if(jwtService.isTokenExpired(token)){
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        return;
      }


      // vérifier signature + récupérer email
      String email = jwtService.extractUsername(token);

      // récupérer le rôle contenu dans le token
      Claims claims = jwtService.extractAllClaims(token);
      List<GrantedAuthority> authorities = new ArrayList<>();
      Object roleClaim = claims.get("role");
      if (roleClaim != null && !roleClaim.toString().isBlank()) {
        authorities.add(
          new SimpleGrantedAuthority("ROLE_" + roleClaim.toString().trim().toUpperCase())
        );
      }

      // informer Spring que l'utilisateur est authentifié
      UsernamePasswordAuthenticationToken authentication =
        new UsernamePasswordAuthenticationToken(
          email,
          null,
          authorities
        );


      SecurityContextHolder
        .getContext()
        .setAuthentication(authentication);



      filterChain.doFilter(request,response);



    }catch(Exception e){

      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

    }


  }
}
