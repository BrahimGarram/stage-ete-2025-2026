package tn.erap.erap_backend.config;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;


import java.util.List;


@Configuration
public class SecurityConfig {


  private final JwtAuthenticationFilter jwtFilter;


  public SecurityConfig(JwtAuthenticationFilter jwtFilter){
    this.jwtFilter = jwtFilter;
  }



  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http)
    throws Exception {


    return http

      // Activer CORS dans Spring Security
      .cors(cors -> {})

      .csrf(csrf -> csrf.disable())


      .sessionManagement(session ->
        session.sessionCreationPolicy(
          SessionCreationPolicy.STATELESS
        )
      )


      .authorizeHttpRequests(auth -> auth

        .requestMatchers(
          "/login"
        ).permitAll()

        // Gestion des utilisateurs : réservée à l'admin
        .requestMatchers(
          "/users",
          "/users/**",
          "/adduser"
        ).hasRole("ADMIN")

        // Locaux : accessibles au chef local et à l'admin
        .requestMatchers(
          "/locaux",
          "/locaux/**"
        ).hasAnyRole("CHEF_LOCAL", "ADMIN")

        // Compteurs : accessibles à l'agent et à l'admin
        .requestMatchers(
          "/compteurs",
          "/compteurs/**"
        ).hasAnyRole("AGENT", "ADMIN")

        // Factures : accessibles au chef de région et à l'admin
        .requestMatchers(
          "/factures",
          "/factures/**"
        ).hasAnyRole("CHEF_REGION", "ADMIN")

        .anyRequest().authenticated()
      )


      .addFilterBefore(
        jwtFilter,
        UsernamePasswordAuthenticationFilter.class
      )


      .build();

  }



  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {


    CorsConfiguration configuration = new CorsConfiguration();


    configuration.setAllowedOrigins(
      List.of("http://localhost:4200")
    );


    configuration.setAllowedMethods(
      List.of(
        "GET",
        "POST",
        "PUT",
        "DELETE",
        "OPTIONS"
      )
    );


    configuration.setAllowedHeaders(
      List.of("*")
    );


    configuration.setAllowCredentials(true);


    UrlBasedCorsConfigurationSource source =
      new UrlBasedCorsConfigurationSource();


    source.registerCorsConfiguration(
      "/**",
      configuration
    );


    return source;
  }

}
