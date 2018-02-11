import React, { Component } from 'react';
import Button from 'material-ui/Button';

import Graph from './Graph';

class GraphWindow extends Component {
  constructor(props) {   // width, height, dataName (string: cereal/perfume/aircraft), onHomeClicked
    super(props);
    this.state = {
      focusNode: ''   // name of node to focus graph on; empty if none
    };
    // contains nodes (array of names), links (array of objects (source: name, target: name, value: double))
    this.allData = {};
    this.allNodes = [];  // array of strings
    this.allNodesSet = new Set();   // set version of the above
    this.forwardNodes = {};   // maps string to array of strings
    this.backwardNodes = {};

    this.data = {};   // data currently passed to Graph
  }

  _fetchData(dataName) {
    this.allData = require('../data/' + dataName + '.json');
    this.allNodes = this.allData.nodes.map((val) => val['id']);
    this.allNodesSet = new Set(this.allNodes);
    this.edgeDictionary = require('../data/' + dataName + '_edge_dictionary.json')
    this.forwardNodes = require('../data/' + dataName + '_forward_nodes.json');
    this.backwardNodes = require('../data/' + dataName + '_backward_nodes.json');

    this.data = this.allData;
  }

  componentWillMount() {
    this._fetchData(this.props.dataName);
  }

  componentWillReceiveProps(props) {
    if (props.dataName !== this.props.dataName) {
      this._fetchData(props.dataName);
    }
  }

  _isValidNodeName(name) {
    return this.allNodesSet.has(name);
  }

  updateFocusNode(focusNode) {
    if (focusNode !== this.state.focusNode) {
      if (focusNode === '') {
        this.data = this.allData;
      } else if (this._isValidNodeName(focusNode)) {
        const relevantNodes = new Set();
        relevantNodes.add(focusNode);

        // search forwards
        let queue = [];
        queue.push(focusNode);
        while (queue.length > 0) {
          const node = queue.pop();
          for (let i = 0; i < this.forwardNodes[node].length; i++) {
            const nextNode = this.forwardNodes[node][i];
            if (!relevantNodes.has(nextNode)) {
              relevantNodes.add(nextNode);
              queue.push(nextNode);
            }
          }
        }
        // search backwards
        queue = [];
        queue.push(focusNode);
        while (queue.length > 0) {
          const node = queue.pop();
          for (let i = 0; i < this.backwardNodes[node].length; i++) {
            const nextNode = this.backwardNodes[node][i];
            if (!relevantNodes.has(nextNode)) {
              relevantNodes.add(nextNode);
              queue.push(nextNode);
            }
          }
        }

        // construct horizontal slice
        const newNodes = Array.from(relevantNodes);
        const newNodeToInd = {};
        newNodes.forEach((val, ind) => { newNodeToInd[val] = ind; });
        const newLinks = [];
        this.allData.links.forEach((link) => {
          const sourceName = link.source.id;
          const targetName = link.target.id;
          if (relevantNodes.has(sourceName) && relevantNodes.has(targetName)) {
            newLinks.push({
              source: newNodeToInd[sourceName],
              target: newNodeToInd[targetName],
              value: link.value
            });
          }
        });
        this.data = {
          nodes: newNodes.map((val) => { return { id: val }; }),
          links: newLinks,
          directed: true,
          graph: {},
          multigraph: false
        };
      } else {  // invalid name
        window.alert('invalid node name');
        return;
      }
      this.setState({ focusNode });
    }
  }

  computeDemands(nodeList) {
    const demands = {}
    computeNodeDemand (node) {
      if (node in demands) {
        return demands[node];
      }
      let d = 0;
      const out_nodes = this.forwardNodes[node].filter(x => nodeList.has(x));
      if (out_nodes.length == 0) {
        const in_nodes = this.backwardNodes[node].filter(x => nodeList.has(x));
        d = in_nodes.map(x => this.edgeDictionary[x][node]).reduce((a, b) => a + b, 0);
      }
      else {
        d = out_nodes.map(x => computeNodeDemand(x)).reduce((a, b) => a + b, 0);
      }
      demands[node] = d;
      return d;
    }
    return demands
  }

  render() {
    return (
      <div>
        <div className="nav-buttons">
          <Button variant="raised" color="secondary" onClick={ this.props.onHomeClicked.bind(this) }>Back to Home</Button>
          &nbsp;
          <Button variant="raised" color="secondary" onClick={ () => this.updateFocusNode('') }>Reset Graph</Button>
        </div>
        <Graph
          width={ this.props.width }
          height={ this.props.height }
          data={ this.data }
          focusNode={ this.state.focusNode }
          onFocusNodeChange={ (name) => this.updateFocusNode(name) }
        />
      </div>
    );
  }
}

export default GraphWindow;
