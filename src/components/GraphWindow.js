import React, { Component } from 'react';

import Graph from './Graph';

class GraphWindow extends Component {
  constructor(props) {   // width, height
    super(props);
    this.state = {
      data: require('../data/cereal.json')
    };
  }

  render() {
    return (
      <div>
        Insert tools here
        <Graph 
          width={ this.props.width }
          height={ this.props.height }
          data={ this.state.data }
        />
      </div>
    );
  }
}

export default GraphWindow;
