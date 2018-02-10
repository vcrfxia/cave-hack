import { Component } from 'react';
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import * as d3sankey from 'd3-sankey';

class Graph extends Component {
  // props: height, width, data, onFocusNodeChange

  // sankey plotting code from: https://bl.ocks.org/mbostock/ca9a0bb7ba204d12974bca90acc507c0
  drawChart() {
    let margin = {top: 20, right: 20, bottom: 30, left: 40},
      width = this.props.width - margin.left - margin.right,
      height = this.props.height - margin.top - margin.bottom;

    // create faux DOM
    const div = new ReactFauxDOM.Element('div')

    let svg = d3.select(div).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    var formatNumber = d3.format(",.0f"),
        format = function(d) { return formatNumber(d) + " TWh"; },
        color = d3.scaleOrdinal(d3.schemeCategory10);

    var sankey = d3sankey.sankey()
        .nodeWidth(15)
        .nodePadding(10)
        .extent([[1, 1], [width - 1, height - 6]]);

    var link = svg.append("g")
        .attr("class", "links")
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("stroke-opacity", 0.2)
      .selectAll("path");

    var node = svg.append("g")
        .attr("class", "nodes")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
      .selectAll("g");

    sankey(this.props.data);

    link = link
      .data(this.props.data.links)
      .enter().append("path")
        .attr("d", d3sankey.sankeyLinkHorizontal())
        .attr("stroke-width", function(d) { return Math.max(1, d.width); });

    link.append("title")
        .text(function(d) { return d.source.id + " → " + d.target.id + "\n" + format(d.value); });

    node = node
      .data(this.props.data.nodes)
      .enter().append("g");

    node.append("rect")
        .attr("x", function(d) { return d.x0; })
        .attr("y", function(d) { return d.y0; })
        .attr("height", function(d) { return d.y1 - d.y0; })
        .attr("width", function(d) { return d.x1 - d.x0; })
        .attr("fill", function(d) { return color(d.id.replace(/ .*/, "")); })
        .attr("stroke", "#000")
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

    node.append("title")
        .text(function(d) { return d.id + "\n" + format(d.value); });

    // export as actual DOM
    return div.toReact();
  }

  render() {
    return this.drawChart();
  }
}

export default Graph;
