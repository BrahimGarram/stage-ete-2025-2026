import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { Facture } from '../models/Facture';
import { OcrResult } from '../models/OcrResult';
import { ForecastResult } from '../models/ForecastResult';

@Injectable({
  providedIn: 'root',
})
export class FactureService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Facture[]> {
    return this.http.get<Facture[]>(`${this.apiUrl}/factures`);
  }

  getById(id: number): Observable<Facture> {
    return this.http.get<Facture>(`${this.apiUrl}/factures/${id}`);
  }

  create(facture: Facture): Observable<Facture> {
    return this.http.post<Facture>(`${this.apiUrl}/factures`, facture);
  }

  update(id: number, facture: Facture): Observable<Facture> {
    return this.http.put<Facture>(`${this.apiUrl}/factures/${id}`, facture);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/factures/${id}`);
  }

  ocrExtract(file: File): Observable<OcrResult> {
    const formData = new FormData();
    formData.append('image', file, file.name);
    return this.http.post<OcrResult>(`${this.apiUrl}/factures/ocr`, formData);
  }

  forecast(params: {
    annee: number;
    local?: string;
    meteo?: number;
    growth?: number;
    activite?: number;
  }): Observable<ForecastResult[]> {
    const query = new URLSearchParams();
    query.set('annee', String(params.annee));
    if (params.local) query.set('local', params.local);
    if (params.meteo != null) query.set('meteo', String(params.meteo));
    if (params.growth != null) query.set('growth', String(params.growth));
    if (params.activite != null) query.set('activite', String(params.activite));
    return this.http.get<ForecastResult[]>(`${this.apiUrl}/factures/forecast?${query.toString()}`);
  }

  forecastEau(params: {
    annee: number;
    local?: string;
    meteo?: number;
    growth?: number;
    activite?: number;
  }): Observable<ForecastResult[]> {
    const query = new URLSearchParams();
    query.set('annee', String(params.annee));
    if (params.local) query.set('local', params.local);
    if (params.meteo != null) query.set('meteo', String(params.meteo));
    if (params.growth != null) query.set('growth', String(params.growth));
    if (params.activite != null) query.set('activite', String(params.activite));
    return this.http.get<ForecastResult[]>(`${this.apiUrl}/forecast/eau?${query.toString()}`);
  }

  forecastGaz(params: {
    annee: number;
    local?: string;
    meteo?: number;
    growth?: number;
    activite?: number;
  }): Observable<ForecastResult[]> {
    const query = new URLSearchParams();
    query.set('annee', String(params.annee));
    if (params.local) query.set('local', params.local);
    if (params.meteo != null) query.set('meteo', String(params.meteo));
    if (params.growth != null) query.set('growth', String(params.growth));
    if (params.activite != null) query.set('activite', String(params.activite));
    return this.http.get<ForecastResult[]>(`${this.apiUrl}/forecast/gaz?${query.toString()}`);
  }
}
