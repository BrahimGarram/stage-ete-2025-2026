import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { Compteur } from '../models/Compteur';

@Injectable({
  providedIn: 'root',
})
export class CompteurService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Compteur[]> {
    return this.http.get<Compteur[]>(`${this.apiUrl}/compteurs`);
  }

  getById(id: number): Observable<Compteur> {
    return this.http.get<Compteur>(`${this.apiUrl}/compteurs/${id}`);
  }

  create(compteur: Compteur): Observable<Compteur> {
    return this.http.post<Compteur>(`${this.apiUrl}/compteurs`, compteur);
  }

  update(id: number, compteur: Compteur): Observable<Compteur> {
    return this.http.put<Compteur>(`${this.apiUrl}/compteurs/${id}`, compteur);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/compteurs/${id}`);
  }
}
