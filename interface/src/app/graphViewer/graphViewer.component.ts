import { Component, OnInit } from '@angular/core';
import { GraphViewerService } from './graphViewer.service';
const d3 = require('d3');

@Component({
  selector: 'app-graph-viewer',
  templateUrl: './graphViewer.component.html',
  styleUrls: ['./graphViewer.component.css']
})
export class GraphViewerComponent implements OnInit {
  svg;
  container;
  zoomDefinition;
  engine;
  graph = {
    nodes: [],
    links: []
  };
  constructor(private graphService: GraphViewerService) { 
    this.graph.nodes.push({ id: 'a', group: '1' })
    this.graph.nodes.push({ id: 'b', group: '1' })
    this.graph.links.push({ source: 'a', target: 'b',  value: '1', name: 'before' })
  }

  ngOnInit() {
    // this.graphService.executeAllen({}).subscribe((x) => {
    //   console.log(x)
    // });
    this.initialize();
  }
  graphViewer() {
    this.svg = d3.select( '#svg-viewer' );
    this.container = this.svg.append( 'g' );
    let width = +this.svg.attr('width');
    let height = +this.svg.attr('height');
    var view = this.svg.append('rect')
      .attr('class', 'view')
      .attr('x', 0.5)
      .attr('y', 0.5)
      .attr('width', width - 1)
      .attr('height', height - 1);
    //this.svg.call( this.zoomed() );

    let forceLink = d3.forceLink()
      .distance(300)
      .strength(1)
      .id(function(d) { return d.id; })
    this.engine = d3.forceSimulation()
      .force('link', forceLink)
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide( function(d){return d.r + 8 }).iterations(16) );
  }
  initialize() {
    this.graphViewer();
    this.initializeEngine();
    // this.graph.nodes.push({ id: 'h', group: '1' })
    // this.initializeEngine();
    //this.graphViewer();
  }
  initializeEngine() {
    const selectPath = this.container.append( 'g' ).attr('class', 'links')
      .selectAll('path')
      .data(this.graph.links)
    const selectNodes = this.container.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(this.graph.nodes)
    
    selectPath.exit().remove();
    selectNodes.exit().remove();

    const enterLinks = selectPath.enter();
    const enterNodes = selectNodes.enter();
    const link = enterLinks.append('path')
      .attr('fill', 'none')
      .attr('id', function(d) {
          return d.name
      })

    enterLinks.append('text')
      .attr('class', 'relation-text')
      .attr('text-anchor', 'middle')
      .attr('dy', -15)
      .append('textPath')
        .attr('startOffset', '50%')
        .attr('xlink:href', function(d) {
            return '#' + d.name 
        })
        .text(function(d) {
            return d.name
        });
    const node = enterNodes
        .append('circle')
        .attr('r', 15)
        .attr('dx', 20)
        .attr('dy', 20)
        .attr('fill', function(d) { return 'red' })
        // .call(d3.drag()
        //     .on('start', dragstarted)
        //     .on('drag', dragged)
        //     .on('end', dragended));

    node.append("title").text(function(d) { return d.id; });
    this.ticketEngine( node, link )
  }
  ticketEngine( node, link ) {
    this.engine.nodes(this.graph.nodes).on("tick", ticked);
    this.engine.force("link").links(this.graph.links);
    this.engine.alpha(1).restart();
  
    function ticked() {
      link.attr("d", function(d) {
          var dx = d.target.x - d.source.x,
              dy = d.target.y - d.source.y,
              dr = 0
          return "M" +  d.source.x + "," +  d.source.y + "A" +  dr + "," + dr + " 0 0,1 " +  d.target.x + "," +  d.target.y;
      });
      node.attr("cx", function(d) { return d.x; });
      node.attr("cy", function(d) { return d.y; });
    }
  }
  zoomed() {
    const container = this.container;
    function zoomed() {
      container.attr('transform', d3.event.transform );
    }
    d3.zoom().scaleExtent([1, 10]).on('zoom', zoomed);
  }
}
