import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

@Injectable({
  providedIn: 'root',
})
export class GraphOptionsService {
    state$ = new BehaviorSubject( null );
    constructor() { }
}