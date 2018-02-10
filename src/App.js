import React, { Component } from 'react';

import './App.css';
import GraphWindow from './components/GraphWindow';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      width: 960,
      height: 600,
    };
  }

  render() {
    return (
      <div>
        Welcome!
        <GraphWindow
          width={this.state.width}
          height={this.state.height}
        />
      </div>
    );
  }
}

export default App;
