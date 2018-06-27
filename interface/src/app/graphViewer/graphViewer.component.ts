import { Component, OnInit } from '@angular/core';
import { GraphViewerService } from './graphViewer.service';
const d3 = require('d3');

@Component({
  selector: 'app-graph-viewer',
  templateUrl: './graphViewer.component.html',
  styleUrls: ['./graphViewer.component.css']
})
export class GraphViewerComponent implements OnInit {
  nodeToAdd = {
    source: null,
    target: null,
    relations: null,
  };
  nodesGraphCache = {};
  svg;
  container;
  zoomDefinition;
  engine;
  nodes;
  links;
  width;
  height;
  restart;
  allenResult;
  graph = {
    nodes: [],
    links: []
  };
  constructor(private graphService: GraphViewerService) { 
    const a = { id: 'a', group: 1, nodeGroup: 0};
    const b = { id: 'b', group: 1, nodeGroup: 0};
    const c = { id: 'c', group: 1, nodeGroup: 0};
    const aToB = { source: a, target: b,  value: '1', name: 'starts', key: a.id + '-' + b.id };
    const bToC = { source: b, target: c,  value: '1', name: 'starts', key: b.id + '-' + c.id };

    this.graph.nodes.push( a );
    this.graph.nodes.push( b );
    this.graph.nodes.push( c );
    this.graph.links.push( aToB );
    this.graph.links.push( bToC );
  }
  addRelation() {
    let source = this.nodeToAdd.source;
    let target = this.nodeToAdd.target;
    let relations = this.nodeToAdd.relations;
    let sourceNode;
    let targetNode;
    let relationsLinks;
    
    const links = [];
    const nodes = [];

    for( let i = 0; i < this.graph.nodes.length; i++ ) {
      let node = this.graph.nodes[i];
      let id = node.id;
      let nodeN = { id: id, group: node.group, nodeGroup: node.nodeGroup };
      if ( id === source ) {
        sourceNode = nodeN;;
      } else if ( id === target ) {
        targetNode = nodeN;
      }
      this.nodesGraphCache[ id ] = nodeN;
      nodes.push( nodeN );
    }

    if ( !sourceNode ) {
      sourceNode =  { id: source, group: 1, nodeGroup: 0};
      this.nodesGraphCache[ source ] = sourceNode;
      nodes.push( sourceNode );
    }
    if ( !targetNode ) {
      targetNode =  { id: target, group: 1, nodeGroup: 0};
      this.nodesGraphCache[ target ] = targetNode;
      nodes.push( targetNode );
    }

    for ( let i = 0; i < this.graph.links.length;  i++) {
      let relation = this.graph.links.splice(i,1)[0];
      let sourceId = relation.source.id;
      let targetId = relation.target.id;
      let key = relation.key;
      let relationN =  { source: this.nodesGraphCache[sourceId], target: this.nodesGraphCache[targetId],  value: '1', name: relation.name, key: key }
      i--;
      if ( key.includes( source ) && key.includes( target ) ) {
        relationN.name = relations;
        relationsLinks = relationN;
      } 
      links.push( relationN );
    }

    if ( !relationsLinks ) {
      relationsLinks = { source: this.nodesGraphCache[source], target: this.nodesGraphCache[target],  value: '1', name: relations, key: source + '-' + target };
      links.push( relationsLinks );
    }

    this.graph.links = [];
    this.graph.nodes = [];
    this.restart();

    this.graph.links = links;
    this.graph.nodes = nodes;
    this.restart();
    this.nodesGraphCache = {};
  }
  allenResultIsConsistent() {
    return (this.allenResult.consistent) ? 'Graph is consistent, ' : 'Graph is not consistent, ';
  }
  allenResultTime() {
    return 'allen algorithm was executed in: ' + this.allenResult.time/1000 + 'ms';
  }
  allenResultNetwork() {
    let keys = Object.keys( this.allenResult.network );
    let message = '';
    for ( let key of keys ) {
      let node = this.allenResult.network[ key ];
      message += '[' + key + ']: '
      for ( let relation of node ) {
        message += '' + relation + ', '
      }
    }
    message = message.replace(/\,$/g, '');
    return message;
  }
  ngOnInit() {
    this.initialize();
  }
  executeAllen() {
    let grapDate = [];
    for ( let node of this.graph.nodes ) {
      grapDate.push([ node.id ])
    }
    for ( let link of this.graph.links ) {
      grapDate.push([link.source.id, link.name, link.target.id])
    }
    this.graphService.executeAllen( grapDate ).subscribe(( response ) => {
      this.allenResult = response;
    })
  }
  graphViewer() {
    const self = this;
    this.svg = d3.select( '#svg-viewer' );
    let width = +this.svg.attr('width');
    let height = +this.svg.attr('height');

    this.engine = d3.forceSimulation(self.graph.nodes)
      .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(200))
      .force("charge", d3.forceManyBody())
      .force('x', d3.forceX())
      .force('y', d3.forceY())
      .force("attraceForce",d3.forceManyBody().strength(-100))
      .on('tick', ticked);

    let container = this.svg.append('g').attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');
    let link = container.append('g').attr('stroke', '#fff').attr('class', 'links').selectAll('path');
    let node = container.append('g').attr('class', 'nodes').selectAll('circle');
    let textLink = container.append('g').attr('class', 'text').selectAll('text');
    let textNode = container.append('g').attr('class', 'text').selectAll('text');

    this.restart = function restart() {

      // Apply the general update pattern to the nodes.
      node = node.data(self.graph.nodes, d => d.id);
      node.exit().remove();
      node = node.enter().append('circle').attr('r', 15)
        .attr("nodeGroup", d => d.nodeGroup )
        .merge(node)
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

      textNode = textNode.data(self.graph.nodes, d => d.id);
      textNode.exit().remove();
      textNode = textNode.enter().append('text')
		    .text(d => d.id)
        .attr("text-anchor", "middle")
        .attr("nodeGroup", d => d.nodeGroup );

      // Apply the general update pattern to the links.
      link = link.data(self.graph.links, d => d.source.id + '-' + d.target.id);
      link.exit().remove();
      link = link.enter().append('path').attr('id', d => d.source.id + '-' + d.target.id).merge(link);

      textLink = textLink.data(self.graph.links, d => d.source.id + '-' + d.target.id);
      textLink.exit().remove();
      textLink = textLink.enter().append('text')
        .attr('class', 'relation-text')
        .attr('text-anchor', 'middle')
        .attr('dy', -15)
        .append('textPath')
          .attr('startOffset', '50%')
          .attr('xlink:href', d =>'#' + d.source.id + '-' + d.target.id)
          .text(d =>  d.name);

      // Update and restart the simulation.
      self.engine.nodes(self.graph.nodes);
      self.engine.force('link').links(self.graph.links);
      self.engine.alpha(1).restart();
    }

    this.restart();

    function dragstarted(d) {
      if (!d3.event.active) self.engine.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }
    
    function dragended(d) {
      if (!d3.event.active) self.engine.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    function ticked() {
      node.attr('cx', d => d.x);
      node.attr('cy', d => d.y);
      textNode.attr('x', d => d.x);
      textNode.attr('y', d => d.y + 40);

      link.attr('d', (d) => {
        let dr = 0
        return 'M' +  d.source.x + ',' +  d.source.y + 'A' +  dr + ',' + dr + ' 0 0,1 ' +  d.target.x + ',' +  d.target.y;
      });
    }
  }
  initialize() {
    this.graphViewer();
    this.executeAllen();
  }
  resetNetwork() {
    this.graph.nodes.splice(0, this.graph.nodes.length);
    this.graph.links.splice(0, this.graph.links.length);
    this.restart();
  }
  zoomed() {
    const container = this.container;
    function zoomed() {
      container.attr('transform', d3.event.transform );
    }
    d3.zoom().scaleExtent([1, 10]).on('zoom', zoomed);
  }
}
