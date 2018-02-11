import React, { Component } from 'react';
import logo from './logo.svg';
import Button from 'material-ui/Button';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import createMuiTheme from 'material-ui/styles/createMuiTheme';

import './App.css';
import GraphWindow from './components/GraphWindow';

const muiTheme = createMuiTheme({
  palette: {
    primary: {
      light: '#fff64f',
      main: '#ffc400',
      dark: '#c79400',
      contrastText: '#000',
    },
    secondary: {
      light: '#aab6fe',
      main: '#7986cb',
      dark: '#49599a',
      contrastText: '#000',
    },
  }
});
const DATASETS = ['cereal', 'perfume', 'aircraft'];

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      width: 960,
      height: 800,
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
        <div className="App-header mdc-typography">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Supply Chain Visualization</h1>
        </div>
        <div className="select-dataset">
          Select a dataset:
          <br />
          <div className="select-dataset-buttons">
            {
              DATASETS.map(
                (name, ind) =>
                  <div key={ ind } className="select-dataset-button mdc-button">
                    <Button variant="raised" color="primary" onClick={ () => this.onSelectDataset(name)}>{ name }</Button>
                  </div>
              )
            }
          </div>
        </div>
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
      <MuiThemeProvider theme={muiTheme}>
        <div>
          { this.shouldShowGraph() ? this.renderGraph() : this.renderSelectDataset() }
        </div>
      </MuiThemeProvider>
    );
  }
}

export default App;
