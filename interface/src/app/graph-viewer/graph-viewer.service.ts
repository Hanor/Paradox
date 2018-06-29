import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GraphViewerService {
  URL: string = '/api';
  httpOptions;
  constructor(private http: HttpClient ) {}

  executeAllen( graphData: any ): Observable<any> {
    return this.http.post<any>(this.URL + '/paradox', {graph: graphData});
  }
}
