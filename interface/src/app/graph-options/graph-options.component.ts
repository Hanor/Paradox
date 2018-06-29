import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { GraphOptionsService } from 'src/app/graph-options/graph-options.service';

@Component({
  selector: 'app-nav-bar-options',
  templateUrl: './graph-options.component.html',
  styleUrls: ['./graph-options.component.scss']
})
export class GraphOptionsComponent {
  nodeToInput = new InputNode();
  state = new State( 'relation', this.nodeToInput )
  constructor ( private graphService: GraphOptionsService ) {}

  addRelation() {
    this.state.name = 'relation';
    this.state.element = this.nodeToInput;
    this.graphService.state$.next( this.state );
  }
  resetNetwork() {
    this.state.name = 'reset';
    this.graphService.state$.next( this.state );
  }
  execute() {
    this.state.name = 'execute';
    this.graphService.state$.next( this.state );
  }
}

class InputNode {
  source = null;
  target = null;
  relations = null;
}

class State {
  name: string;
  element: any;
  constructor( name, element ) {
    this.name = name;
    this.element = element;
  }
}