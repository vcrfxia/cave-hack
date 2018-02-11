import React, { Component } from 'react';

import './App.css';
import GraphWindow from './components/GraphWindow';

const DATASETS = ['cereal', 'perfume', 'aircraft'];

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      width: 960,
      height: 600,
      dataName: '',   // name of data set to visualize; empty if none
    };
  }

  onSelectDataset(dataName) {
    this.setState({ dataName });
  }

  shouldShowGraph() {
    return this.state.dataName !== '';
  }

  renderSelectDataset() {
    return (
      <div>
        Select a dataset:
        {
          DATASETS.map(
            (name, ind) =>
              <div key={ ind }>
                <button onClick={ () => this.onSelectDataset(name)}>{ name }</button>
              </div>
          )
        }
      </div>
    );
  }

  renderGraph() {
    return (
      <GraphWindow
        width={ this.state.width }
        height={ this.state.height }
        dataName={ this.state.dataName }
        onHomeClicked={() => this.onSelectDataset('')}
      />
    );
  }

  render() {
    return (
      <div>
        Supply Chain Visualization
        { this.shouldShowGraph() ? this.renderGraph() : this.renderSelectDataset() }
      </div>
    );
  }
}

export default App;
