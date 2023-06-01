import logo from './logo.svg';
import './App.css';
import './custom.css'
import { InputGroup, Form, Row, Button, Col } from 'react-bootstrap'
import { useState } from 'react';

function App() {

  const [bitcoin, setBitcoin] = useState(null)
  const [brc20, setBrc20] = useState(null)
  const [isPurchase, setIsPurchase] = useState(false)
  const [walletAddress, onChangeWalletAddress] = useState('')

  const onChangeBitcoin = (e) => {
    setBrc20(e.target.value)
    setBitcoin(e.target.value)
  }

  const onChangeBrc20 = (e) => {
    setBrc20(e.target.value)
    setBitcoin(e.target.value)
  }

  const onPurchase = () => {
    if (!isPurchase)
      setIsPurchase(true)
  }

  const onCancel = () => {
    if (isPurchase)
      setIsPurchase(false)
  }

  const onConnectWallet = () => {

  }

  return (
    <div className='main-bg flex'>
      <div className='flex justify-end w-full'>
        <Button variant="primary" size="lg" onClick={onConnectWallet}>Connect Wallet</Button>
      </div>
      <div className="flex justify-center items-center w-full h-100vh">
        {isPurchase ? (
          <div className='content-bg flex flex-column w-50 h-70vh br-10 justify-around items-center pt-30 pb-30'>
            <Row className='flex justify-between items-center w-50'>
              <span className='text-white fs-32'>Send bitcoin here:</span>
              <InputGroup>
                <Form.Control
                  value={walletAddress}
                  onChange={onChangeWalletAddress}
                  aria-label="Large"
                  aria-describedby="inputGroup-sizing-sm"
                />
              </InputGroup>
            </Row>
            <Row>
              <Col>
                <Button variant="primary" size="lg">Confirm</Button>
              </Col>
              <Col>
                <Button variant="primary" size="lg" onClick={onCancel}>Cancel</Button>
              </Col>
            </Row>
          </div>
        ) : (
          <div className='content-bg flex flex-column w-50 h-70vh br-10 justify-around items-center pt-30 pb-30'>
            <Row className='flex justify-between items-center w-50'>
              <span className='text-white fs-32'>BitCoin:</span>
              <InputGroup>
                <Form.Control
                  type='number'
                  value={bitcoin}
                  onChange={onChangeBitcoin}
                  aria-label="Large"
                  aria-describedby="inputGroup-sizing-sm"
                />
              </InputGroup>
            </Row>
            <Row className='flex justify-between items-center  w-50'>
              <span className='text-white fs-32'>Brc20:</span>
              <InputGroup>
                <Form.Control
                  type='number'
                  value={brc20}
                  onChange={onChangeBrc20}
                  aria-label="Large"
                  aria-describedby="inputGroup-sizing-sm"
                />
              </InputGroup>
            </Row>
            <Button variant="primary" size="lg" onClick={onPurchase}>Purchase</Button>
          </div>
        )}
      </div>
    </div>

  );
}

export default App;
