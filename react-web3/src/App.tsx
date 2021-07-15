import React, { useState } from 'react';
import './App.css';
import { Button, Message } from "semantic-ui-react";
import { useWeb3Context } from './contexts/Web3';
import { unlockAccount } from "./api/web3"
import useAsync from "./components/useAsync"
function App() {

  const {
    state: { account },
    updateAccount
  } = useWeb3Context();

  const { pending, error, call } = useAsync(unlockAccount)

  async function onClickConnect() {
    const { error, data } = await call(null);

    if (error) {
      console.error()
    }
    if (data) {
      updateAccount(data)
    }
  }

  return (
    <div className="App">
      <div className="main">
          <div className="wallet">
          <h1>Multi Signature Wallet</h1>
          <div className="activeAccount"> Account: { account } </div>
          <div className="buttonDiv">

            <Message warning>Metamask is not connected</Message>
            <Button 
                color='teal'
                onClick={() => {onClickConnect()}}
                disabled={pending}
                loading={pending}
            >
              Connect to Metamask
            </Button>
          </div>
        </div> 
      </div>   
    </div>
  );
}

export default App;
