import React, { Component } from 'react';
import * as d3 from 'd3';
import ReactFauxDOM from 'react-faux-dom';
import ReactDOM from 'react-dom';
import * as d3sankey from 'd3-sankey';

class Graph extends Component {
  drawChart() {
    let margin = {top: 20, right: 20, bottom: 30, left: 40},
      width = this.props.width - margin.left - margin.right,
      height = this.props.height - margin.top - margin.bottom;

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

    // const energy = this.props.data;
    const energy = require('../data/energy.json');
    // d3.json(this.props.data, function(error, energy) {
    //   if (error) {
    //     console.log('ERROR');
    //     throw error;
    //   }

      sankey(energy);

      link = link
        .data(energy.links)
        .enter().append("path")
          .attr("d", d3sankey.sankeyLinkHorizontal())
          .attr("stroke-width", function(d) { return Math.max(1, d.width); });

      link.append("title")
          .text(function(d) { return d.source.name + " → " + d.target.name + "\n" + format(d.value); });

      node = node
        .data(energy.nodes)
        .enter().append("g");

      node.append("rect")
          .attr("x", function(d) { return d.x0; })
          .attr("y", function(d) { return d.y0; })
          .attr("height", function(d) { return d.y1 - d.y0; })
          .attr("width", function(d) { return d.x1 - d.x0; })
          .attr("fill", function(d) { return color(d.name.replace(/ .*/, "")); })
          .attr("stroke", "#000");

      node.append("text")
          .attr("x", function(d) { return d.x0 - 6; })
          .attr("y", function(d) { return (d.y1 + d.y0) / 2; })
          .attr("dy", "0.35em")
          .attr("text-anchor", "end")
          .text(function(d) { return d.name; })
        .filter(function(d) { return d.x0 < width / 2; })
          .attr("x", function(d) { return d.x1 + 6; })
          .attr("text-anchor", "start");

      node.append("title")
          .text(function(d) { return d.name + "\n" + format(d.value); });
    // });

    return div.toReact();
  }

  drawBarChart() {
    let data = this.props.data
 
    let margin = {top: 20, right: 20, bottom: 30, left: 40},
      width = this.props.width - margin.left - margin.right,
      height = this.props.height - margin.top - margin.bottom;
 
    let x = d3.scaleBand()
      .rangeRound([0, width])
 
    let y = d3.scaleLinear()
      .range([height, 0])
 
    let xAxis = d3.axisBottom()
      .scale(x)
 
    let yAxis = d3.axisLeft()
      .scale(y)
      .ticks(10, "%");
 
    //Create the element
    const div = new ReactFauxDOM.Element('div')
     
    //Pass it to d3.select and proceed as normal
    let svg = d3.select(div).append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

 
    x.domain(data.map((d) => d.letter));
    y.domain([0, d3.max(data, (d) => d.frequency)]);
 
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis);
 
    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Frequency");
 
    svg.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.letter))
      .attr("width", 20)
      .attr("y", (d) => y(d.frequency))
      .attr("height", (d) => {return height - y(d.frequency)});
 
    //DOM manipulations done, convert to React
    return div.toReact()
  }

  render() {
    return this.drawChart();
  }
}

Graph.defaultProps = {
  chart: 'loading'
};

export default Graph;
