import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { ForecastResult } from '../models/ForecastResult';

@Injectable({
  providedIn: 'root',
})
export class ForecastService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  forecast(annee: number, local?: string, meteo = 1.0, growth = 0.03, activite = 1.0): Observable<ForecastResult[]> {
    let params = new HttpParams()
      .set('annee', annee.toString())
      .set('meteo', meteo.toString())
      .set('growth', growth.toString())
      .set('activite', activite.toString());
    if (local && local !== 'all') {
      params = params.set('local', local);
    }
    return this.http.get<ForecastResult[]>(`${this.apiUrl}/factures/forecast`, { params });
  }
}
