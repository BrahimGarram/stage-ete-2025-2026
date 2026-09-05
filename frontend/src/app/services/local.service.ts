import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { Local } from '../models/Local';

@Injectable({
  providedIn: 'root',
})
export class LocalService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Local[]> {
    return this.http.get<Local[]>(`${this.apiUrl}/locaux`);
  }

  getById(id: number): Observable<Local> {
    return this.http.get<Local>(`${this.apiUrl}/locaux/${id}`);
  }

  create(local: Local): Observable<Local> {
    return this.http.post<Local>(`${this.apiUrl}/locaux`, local);
  }

  update(id: number, local: Local): Observable<Local> {
    return this.http.put<Local>(`${this.apiUrl}/locaux/${id}`, local);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/locaux/${id}`);
  }
}
