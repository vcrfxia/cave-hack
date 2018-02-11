import { Component } from 'react';
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import * as d3sankey from 'd3-sankey';
import {linkHorizontal} from "d3-shape";

const GRAY = '#CCC';
const TYPE_COLORS = {
  'Manuf': '#F0F',
  'Trans': '#00F',
  'Retail': '#0F0',
  'Dist': '#F00'
};
const ORDINAL_COLORS = d3.scaleOrdinal(d3.schemeCategory10);
const MAX_WIDTH_SCALE = 10;

class Graph extends Component {
  // props:
  // height, width
  // data
  // nodeWidths (maps node name to float), nodeCosts, nodeTimes
  // removedNodes (set of names)
  // onFocusNodeChange (callback, takes new name as argument)

  _getColorForNode(nodeName) {
    const nodeType = nodeName.substring(0, nodeName.indexOf('_'));
    if (this.props.removedNodes.has(nodeName)) {
      return GRAY;
    }
    if (nodeType === 'Part') {
      return ORDINAL_COLORS(nodeName);
    } else {
      return TYPE_COLORS[nodeType];
    }
  }
  _getColorForLink(sourceName, targetName) {
    if (this.props.removedNodes.has(targetName)) {
      return GRAY;
    }
    return this._getColorForNode(sourceName);
  }

  // compute sum of outgoing widths
  _getFlowOffset(node) {
    const outgoingWidth = node.sourceLinks.map(val => val.width).reduce((a, b) => a + b, 0);
    const offset = outgoingWidth === 0 ? 0 : (node.y1 - node.y0 - outgoingWidth) / 2;
    return offset;
  }

  _getTrapezoidCoordinates(node, maxWidth) {
    const offset = this._getFlowOffset(node);

    // adjust width of trapezoid based on cost
    node.x1 = node.x0 + (node.x1 - node.x0) * MAX_WIDTH_SCALE * (this.props.nodeWidths[node.id] / maxWidth);

    const vertices = [];
    vertices.push(String(node.x0) + ',' + String(node.y0));   // upper left
    vertices.push(String(node.x0) + ',' + String(node.y1));   // lower left
    vertices.push(String(node.x1) + ',' + String(node.y1 - offset));   // lower right
    vertices.push(String(node.x1) + ',' + String(node.y0 + offset));   // upper right
    return vertices.join(' ');
  }

  _getHorizontalSource(d) {
    const offset = this._getFlowOffset(d.source);
    return [d.source.x1, d.y0 + offset];
  }
  _getHorizontalTarget(d) {
    return [d.target.x0, d.y1];
  }

  _getCustomLinkHorizontal() {
    return linkHorizontal()
              .source(this._getHorizontalSource.bind(this))
              .target(this._getHorizontalTarget.bind(this));
  }

  // sankey plotting code from: https://bl.ocks.org/mbostock/ca9a0bb7ba204d12974bca90acc507c0
  drawChart() {
    let margin = {top: 20, right: 20, bottom: 30, left: 40},
      width = this.props.width - margin.left - margin.right,
      height = this.props.height - margin.top - margin.bottom;

    // set up to adjust width of nodes based on cost/time
    const maxWidth = Math.max(...Object.values(this.props.nodeWidths));

    // create faux DOM
    const div = new ReactFauxDOM.Element('div')

    let svg = d3.select(div).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    var formatNumber = d3.format(",.0f"),
        format = function(desc, val) { return "\n" + desc + ": " + formatNumber(val); };

    var sankey = d3sankey.sankey()
        .nodeWidth(15)
        .nodePadding(10)
        .extent([[1, 1], [width - 1, height - 6]]);

    var link = svg.append("g")
        .attr("class", "links")
        .attr("fill", "none")
        .attr("stroke-opacity", 0.2)
      .selectAll("path");

    var node = svg.append("g")
        .attr("class", "nodes")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
      .selectAll("g");

    sankey(this.props.data);

    node = node
      .data(this.props.data.nodes)
      .enter().append("g");

    node.append("polygon")
        .attr("points", function(d) { return this._getTrapezoidCoordinates(d, maxWidth); }.bind(this))
        .attr("fill", function(d) { return this._getColorForNode(d.id); }.bind(this))
        // .attr("stroke", "#000")
        .on("click", function(d) { this.props.onFocusNodeChange(d.id); }.bind(this));

    node.append("text")
        .attr("x", function(d) { return d.x0 - 6; })
        .attr("y", function(d) { return (d.y1 + d.y0) / 2; })
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .text(function(d) { return d.id; })
      .filter(function(d) { return d.x0 < width / 2; })
        .attr("x", function(d) { return d.x1 + 6; })
        .attr("text-anchor", "start");

    link = link
      .data(this.props.data.links)
      .enter().append("path")
        .attr("d", this._getCustomLinkHorizontal())
        .attr("stroke", function(d) { return this._getColorForLink(d.source.id, d.target.id); }.bind(this))
        .attr("stroke-width", function(d) { return Math.max(1, d.width); });

    link.append("title")
        .text(function(d) { return d.source.id + " → " + d.target.id + format('Volume', d.value); });

    node.append("title")
        .text(function(d) { return d.id + format('Input Volume', d.value) + 
                              format('Cost', this.props.nodeCosts[d.id]) +
                              format('Time', this.props.nodeTimes[d.id]); }.bind(this));

    // export as actual DOM
    return div.toReact();
  }

  render() {
    return this.drawChart();
  }
}

export default Graph;
