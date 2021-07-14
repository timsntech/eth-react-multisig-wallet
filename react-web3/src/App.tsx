import React from 'react';
import './App.css';
import { Button, Message } from "semantic-ui-react";

function App() {

  const account = "0x1233443556"

  return (
    <div className="App">
      <div className="main">
          <div className="wallet">
          <h1>Multi Signature Wallet</h1>
          <div className="activeAccount"> Account: {account} </div>
          <div className="buttonDiv">
            <Button color='teal'>Connect to Metamask</Button>
          </div>
        </div> 
      </div>   
    </div>
  );
}

export default App;
