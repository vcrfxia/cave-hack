import React, { Component } from 'react';
import Button from 'material-ui/Button';
import Radio from 'material-ui/Radio';

import Graph from './Graph';
import IntegrationReactSelect from './IntegrationReactSelect';
import PersistentDrawer from './PersistentDrawer';

const WIDTH_OPTIONS = ['time', 'cost']
const MAX_WIDTH_SCALE = { cereal: 10, perfume: 6, aircraft: 10 };
const AIRCRAFT_SKELETON_NODES = ['Part', 'Manuf', 'Trans', 'Retail'];
const AIRCRAFT_SKELETON_DATA = {
  nodes: [
    {
      id: 'Part'
    },
    {
      id: 'Manuf'
    },
    {
      id: 'Trans'
    },
    {
      id: 'Retail'
    }
  ],
  links: [
    {
      source: 0,
      target: 1,
      value: 1
    },
    {
      source: 1,
      target: 2,
      value: 1
    },
    {
      source: 2,
      target: 3,
      value: 1
    }
  ],
  directed: true,
  graph: {},
  multigraph: false
};

class GraphWindow extends Component {
  constructor(props) {   // width, height, dataName (string: cereal/perfume/aircraft), onHomeClicked
    super(props);
    this.state = {
      focusNode: '',   // name of node to focus graph on; empty if none,
      nodeAction: 'focus',
      removedNodes: new Set(),
      widthDisplay: 'time',
      drawerOpen: false
    };
    // contains nodes (array of names), links (array of objects (source: name, target: name, value: double))
    this.allData = {};
    this.allNodes = [];  // array of strings
    this.allNodesSet = new Set();   // set version of the above
    this.allNodesAsSuggestions = [];   // for autocomplete purposes
    this.forwardNodes = {};   // maps string to array of strings
    this.backwardNodes = {};
    this.nodeCosts = {};   // maps string to double (average cost)
    this.nodeTimes = {};

    this.data = {};   // data currently passed to Graph
  }

  _fetchData(dataName) {
    this.allData = require('../data/' + dataName + '.json');
    this.allNodes = this.allData.nodes.map((val) => val['id']);
    this.allNodesSet = new Set(this.allNodes);
    this.allNodesAsSuggestions = this.allNodes.map(val => ({
      value: val,
      label: val,
    }));
    // should only visualize Parts for aircraft data, since otherwise there are too many parts
    // TODO: combine all the Parts nodes into a single node, to allow for visualization of other ndoes as well
    if (dataName === 'aircraft') {
      this.allNodesAsSuggestions = this.allNodesAsSuggestions.filter(val => val['value'].includes('Part'));
    }
    this.edgeDictionary = require('../data/' + dataName + '_edge_dictionary.json');
    this.forwardNodes = require('../data/' + dataName + '_forward_nodes.json');
    this.backwardNodes = require('../data/' + dataName + '_backward_nodes.json');
    this.nodeCosts = require('../data/' + dataName + '_costs.json');
    this.nodeTimes = require('../data/' + dataName + '_times.json');

    if (dataName === 'aircraft' && this.state.focusNode === '') {
      this.data = Object.assign({}, AIRCRAFT_SKELETON_DATA);
    } else {
      this.data = this.allData;
    }
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

  _getNodeWidths() {
    switch (this.state.widthDisplay) {
      case 'time':
        return this.nodeTimes;
      case 'cost':
        return this.nodeCosts;
      default:
        console.log('invalid width display.');
    }
    return null;
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

  _computeAverageCost(currentNode) {
    let sum = 0;
    for (const key in this.demands) {
      sum += this.nodeCosts[key] * this.demands[key];
    }
    return sum / this.demands[currentNode];
  }

  nodeActionChanged(newAction) {
    this.setState({ nodeAction: newAction });
  }

  widthDisplayChanged(e) {
    this.setState({ widthDisplay: e.target.value });
  }

  resetGraphClicked() {
    this.updateFocusNode('');
    this.setState({ removedNodes: new Set() });
  }

  drawerOpened() {
    this.setState({ drawerOpen: true });
  }
  drawerClosed() {
    this.setState({ drawerOpen: false });
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
        if (this.state.dataName === 'aircraft') {
          this.data = Object.assign({}, AIRCRAFT_SKELETON_DATA);
        } else {
          this.data = this.allData;
        }
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
        this.demands = newDemands
        const newNodeToInd = {};
        newNodes.forEach((val, ind) => { newNodeToInd[val] = ind; });
        const newLinks = [];
        this.allData.links.forEach((link) => {
          const sourceName = link.source.hasOwnProperty('id') ? link.source.id : this.allNodes[link.source];
          const targetName = link.target.hasOwnProperty('id') ? link.target.id : this.allNodes[link.target];
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

        this.setState({ drawerOpen: true });
      } else if (AIRCRAFT_SKELETON_NODES.has(focusNode)) {
        return;
      } else {  // invalid name
        window.alert('invalid node name');
        return;
      }
      this.setState({ focusNode });
    }
  }

  renderTopBarButtons() {
    return (
      <div>
        <div className="nav-buttons">
          <Button variant="raised" color="primary" onClick={ this.props.onHomeClicked.bind(this) }>Back to Home</Button>
          &nbsp;
          <Button variant="raised" color="primary" onClick={ this.resetGraphClicked.bind(this) }>Reset Graph</Button>
        </div>
        <div className="option-buttons">
          <Button
              variant={ this.state.nodeAction === 'focus' ? "flat" : "raised" }
              disabled={ this.state.nodeAction === 'focus' }
              color="primary"
              onClick={ () => this.nodeActionChanged('focus') }>
            Focus on Node
          </Button>
          <Button
              variant={ this.state.nodeAction === 'remove' ? "flat" : "raised" }
              disabled={ this.state.nodeAction === 'remove' }
              color="primary"
              onClick={ () => this.nodeActionChanged('remove') }>
            Remove Node
          </Button>
        </div>
      </div>
    );
  }

  renderDisplayOptions() {
    return (
      <div className="radio-options">
        Node width represents: &nbsp;
        { WIDTH_OPTIONS.map(
          (option, ind) => {
            return (
              <div key={ ind } className="radio-option">
                <Radio
                  value={ option }
                  checked={ this.state.widthDisplay === option }
                  onChange={ this.widthDisplayChanged.bind(this) }
                />{ option } &nbsp;
              </div>
            )
          }
        )}
      </div>
    );
  }

  renderSearchBar() {
    return (
      <div className="search-bar">
        <IntegrationReactSelect
          onSelect={ this.actOnNode.bind(this) }
          options={ this.allNodesAsSuggestions }/>
      </div>
    );
  }

  renderNodeStatistics() {
    if (this.state.focusNode !== '') {
      return (
        <div className="node-statistics">
          Statistics about { this.state.focusNode }: <br/>
          Node cost: { this.nodeCosts[this.state.focusNode] } <br/>
          Average cost of products through this node: { this._computeAverageCost(this.state.focusNode).toFixed(2) } <br/>
          Node average time: { this.nodeTimes[this.state.focusNode] } <br/>
          Node demand: { this.demands[this.state.focusNode] } <br/>
        </div>
      )
    }
    return '';
  }

  render() {
    return (
      <div>
        { this.renderTopBarButtons() }
        { this.renderDisplayOptions() }
        { this.renderSearchBar() }
        <Graph
          width={ this.props.width }
          height={ this.props.height }
          maxWidthScale={ MAX_WIDTH_SCALE[this.props.dataName] }
          data={ this.data }
          focusNode={ this.state.focusNode }
          nodeWidths={ this._getNodeWidths() }
          nodeCosts={ this.nodeCosts }
          nodeTimes={ this.nodeTimes }
          removedNodes={ this.state.removedNodes }
          onFocusNodeChange={ (name) => this.actOnNode(name) }
        />
        <div className="drawer-div">
          <PersistentDrawer
            open={ this.state.drawerOpen }
            contents={ this.renderNodeStatistics() }
            onDrawerClose={this.drawerClosed.bind(this)}
            onDrawerOpen={this.drawerOpened.bind(this)}/>
        </div>
      </div>
    );
  }
}

export default GraphWindow;
