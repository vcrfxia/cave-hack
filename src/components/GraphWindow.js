import React, { Component } from 'react';
import Button from 'material-ui/Button';

import Graph from './Graph';

class GraphWindow extends Component {
  constructor(props) {   // width, height, dataName (string: cereal/perfume/aircraft), onHomeClicked
    super(props);
    this.state = {
      focusNode: '',   // name of node to focus graph on; empty if none,
      nodeAction: 'focus',
      removedNodes: new Set()
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

  // returns object mapping nodeName to demand at that node
  // flows will be set to the demand at their destination
  _computeDemands(nodeSet) {
    const demands = {};
    const computeNodeDemand = (node) => {
      if (node in demands) {
        return demands[node];
      }
      let d = 0;
      const out_nodes = this.forwardNodes[node].filter(x => nodeSet.has(x));
      if (out_nodes.length === 0) {
        const in_nodes = this.backwardNodes[node].filter(x => nodeSet.has(x));
        d = in_nodes.map(x => this.edgeDictionary[x][node]).reduce((a, b) => a + b, 0);
      }
      else {
        d = out_nodes.map(x => computeNodeDemand(x)).reduce((a, b) => a + b, 0);
      }
      demands[node] = d;
      return d;
    };
    Array.from(nodeSet).forEach(node => { computeNodeDemand(node); });
    return demands;
  }

  updateNodeAction(newAction) {
    this.setState({ nodeAction: newAction });
  }

  resetGraphClicked() {
    this.updateFocusNode('');
    this.setState({ removedNodes: new Set() });
  }

  actOnNode(nodeName) {
    if (this.state.nodeAction === 'focus') {
      this.updateFocusNode(nodeName);
    } else if (this.state.nodeAction === 'remove') {
      this.removeNode(nodeName);
    } else {
      console.log('invalid node action attempted.');
    }
  }

  removeNode(nodeName) {
    if (!this.allNodesSet.has(nodeName)) {
      return;
    }
    const { removedNodes } = this.state;
    if (!this.state.removedNodes.has(nodeName)) {
      const removeNodeRecursive = (name) => {
        removedNodes.add(name);
        // remove everything downstream
        this.forwardNodes[name].forEach(nextName => {
          if (!removedNodes.has(nextName)) {
            removeNodeRecursive(nextName);
          }
        });
        // only remove upstream nodes if all other outputs are gone as well
        this.backwardNodes[name].forEach(prevName => {
          if (!removedNodes.has(prevName) &&
              this.forwardNodes[prevName].every(nextNode => removedNodes.has(nextNode))) {
            removeNodeRecursive(prevName);
          }
        });
      }
      removeNodeRecursive(nodeName);
    } else {
      const restoreNodeRecursive = (name) => {
        if (removedNodes.delete(name)) {
          // restore all connected nodes
          this.forwardNodes[name].forEach(nextName => {
            if (removedNodes.has(nextName)) {
              restoreNodeRecursive(nextName);
            }
          })
          this.backwardNodes[name].forEach(prevName => {
            if (removedNodes.has(prevName)) {
              restoreNodeRecursive(prevName);
            }
          })
        }
      }
      restoreNodeRecursive(nodeName);
    }
    this.setState({ removedNodes });
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
        const newDemands = this._computeDemands(relevantNodes);
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
              value: newDemands[targetName]
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

  render() {
    return (
      <div>
        <div className="nav-buttons">
          <Button variant="raised" color="secondary" onClick={ this.props.onHomeClicked.bind(this) }>Back to Home</Button>
          &nbsp;
          <Button variant="raised" color="secondary" onClick={ this.resetGraphClicked.bind(this) }>Reset Graph</Button>
        </div>
        <div className="option-buttons">
          <Button
              variant={ this.state.nodeAction === 'focus' ? "flat" : "raised" }
              disabled={ this.state.nodeAction === 'focus' }
              color="secondary"
              onClick={ () => this.updateNodeAction('focus') }>
            Focus on Node
          </Button>
          <Button
              variant={ this.state.nodeAction === 'remove' ? "flat" : "raised" }
              disabled={ this.state.nodeAction === 'remove' }
              color="secondary"
              onClick={ () => this.updateNodeAction('remove') }>
            Remove Node
          </Button>
        </div>
        <Graph
          width={ this.props.width }
          height={ this.props.height }
          data={ this.data }
          focusNode={ this.state.focusNode }
          removedNodes={ this.state.removedNodes }
          onFocusNodeChange={ (name) => this.actOnNode(name) }
        />
      </div>
    );
  }
}

export default GraphWindow;
