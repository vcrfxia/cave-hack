import React, { Component } from 'react';

import Graph from './Graph';

class GraphWindow extends Component {
  constructor(props) {   // width, height
    super(props);
    this.state = {
      dataName: 'cereal',
      focusNode: ''   // name of node to focus graph on; empty if none
    };
    // contains nodes (array of names), links (array of objects (source: name, target: name, value: double))
    this.allData = require('../data/' + this.state.dataName + '.json');
    this.allNodes = this.allData.nodes.map((val) => val['id']);
    this.allNodesSet = new Set(this.allNodes);
    this.forwardNodes = require('../data/' + this.state.dataName + '_forward_nodes.json');
    this.backwardNodes = require('../data/' + this.state.dataName + '_backward_nodes.json');

    this.data = this.allData;

    // this.updateFocusNode('Manuf_0001');
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

  render() {
    return (
      <div>
        <button onClick={ () => this.updateFocusNode('') }>Reset</button>
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
