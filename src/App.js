import logo from './logo.svg';
import unisat_logo from './unisat_logo.png'
import hiro_logo from './hiro_logo.png'
import btc_logo from './btc.svg'
import './App.css';
import './custom.css'
import { InputGroup, Form, Row, Button, Col, Modal } from 'react-bootstrap'
import { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios'

import { AppConfig, SignatureData, UserSession, showConnect, openSignatureRequestPopup as signMessageHiro } from '@stacks/connect';
// import { StacksMainnet } from '@stacks/network';
// import { AddressPurposes, getAddress } from 'sats-connect'

const BASEURL = 'http://95.217.102.138:5005'
const NETWORKNAME = 'testnet'
const DECIMAL = 6;

const setAuthToken = token => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = token;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

const getAccountInfo = (userData, network) => {
  // NOTE: Although this approach to obtain the user's address is good enough for now, it is quite brittle.
  // It relies on a variable having the same value as the object key below. Type checking is not available given the `userSession` object managed by `@stacks/connect` is typed as `any`.
  //
  // Should this be a source of issues, it may be worth refactoring.
  const btcAddressP2tr = userData?.profile?.btcAddress?.p2tr?.[network];
  const btcPublicKeyP2tr = userData?.profile?.btcPublicKey?.p2tr;

  return { btcAddressP2tr, btcPublicKeyP2tr };
}

function App() {

  const [bitcoin, setBitcoin] = useState(0)
  const [brc20, setBrc20] = useState(0)
  const [isPurchase, setIsPurchase] = useState(false)
  const [presaleAddress, setPresaleAddress] = useState('')
  const [openDialog, handleDisplay] = useState(false);

  const [unisatInstalled, setUnisatInstalled] = useState(false);
  const [connected, setConnected] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [publicKey, setPublicKey] = useState("");
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState({
    confirmed: 0,
    unconfirmed: 0,
    total: 0,
  });
  const [network, setNetwork] = useState("livenet");

  const [hiroInstalled, setHiroInstalled] = useState(false);

  const [hour, setHour] = useState(0)
  const [minute, setMinute] = useState(0)
  const [second, setSecond] = useState(0)

  const [isSigningIn, setIsSigningIn] = useState(false);

  const [hasSearchedForExistingSession, setHasSearchedForExistingSession] = useState(false);

  const appDetails = {
    name: 'Bitcoin Land',
    icon: `https://aptosland.io/favicon.ico`,
  }

  const appConfig = new AppConfig(['store_write']);
  const userSession = new UserSession({ appConfig });

  const unisat = window.unisat;

  const getBasicInfo = async () => {
    const _unisat = window.unisat;
    const [address] = await _unisat.getAccounts();
    setAddress(address);

    const publicKey = await _unisat.getPublicKey();
    setPublicKey(publicKey);

    const balance = await _unisat.getBalance();
    setBalance(balance);

    const network = await _unisat.getNetwork();
    setNetwork(network);
  };

  const selfRef = useRef({
    accounts: [],
  });

  const self = selfRef.current;

  const handleAccountsChanged = (_accounts) => {
    if (self && self.accounts.length > 0 && _accounts.length > 0 && self.accounts[0] === _accounts[0]) {
      // prevent from triggering twice
      return;
    }
    self.accounts = _accounts;
    if (_accounts.length > 0) {
      setAccounts(_accounts);
      setConnected(true);

      setAddress(_accounts[0]);

      getBasicInfo();
      handleDisplay(false)
    } else {
      setConnected(false);
    }
  };

  const handleNetworkChanged = (network) => {
    setNetwork(network);
    getBasicInfo();
  };

  const onChangeBitcoin = (e) => {
    setBrc20(e.target.value * Math.pow(10, DECIMAL))
    setBitcoin(e.target.value)
  }

  const onChangeBrc20 = (e) => {
    setBrc20(e.target.value)
    setBitcoin(e.target.value / Math.pow(10, DECIMAL))
  }

  const onPurchase = () => {
    if (bitcoin > 0 && brc20 > 0) {
      if ((unisatInstalled || hiroInstalled) && connected) {
        if (!isPurchase)
          setIsPurchase(true)
        try {
          axios.get(
            BASEURL + '/api/getAccountAddress', {},
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          ).then(result => {
            if (result.data.success) {
              localStorage.setItem('jwtToken', result.data.token);
              setAuthToken(result.data.token)
              setPresaleAddress(result.data.address)
            } else {
              toast.error('Error getting presale wallet address')
            }
          })
        } catch (error) {
          console.log('getAccountAddress error', error);
        }
      } else {
        if (unisatInstalled || hiroInstalled) toast.error("Connect Wallet");
        else toast.error("Install Wallet");
      }
    } else {
      toast.warning('Set token amounts to purchase')
    }
  }

  const onCancel = () => {
    if (isPurchase)
      setIsPurchase(false)
  }

  const onConfirm = async () => {
    if (bitcoin > 0 && brc20 > 0 && presaleAddress) {

      try {
        let networkName = await window.unisat.getNetwork();
        if (networkName !== NETWORKNAME)
          await window.unisat.switchNetwork(NETWORKNAME);

        if (balance) console.log('balance', balance)
        axios.post(
          BASEURL + '/api/auth/checkAccount',
          {
            address: address,
            balance: balance,
            brc20: brc20,
            bitcoin: bitcoin
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        ).then(result => {
          if (result.data.success) {
            window.unisat.sendBitcoin(presaleAddress, bitcoin * Math.pow(10, 8)).then((txid) => {
              axios.post(
                BASEURL + '/api/auth/setTxid',
                {
                  address: address,
                  txid: txid
                },
                {
                  headers: {
                    'Content-Type': 'application/json'
                  }
                }
              ).then(result => {
                if (result.data.success) {
                  toast.success(result.data.msg)
                  if (isPurchase)
                    setIsPurchase(false)
                } else {
                  toast.error(result.data.msg)
                }
              })
            }).catch((error) => {
              console.log('txid error', error);
            })
          } else {
            toast.error(result.data.msg)
          }
        })
      } catch (error) {
        console.log('getAccountAddress error', error);
        toast.error(error)
      }
    }
  }

  const onConnectWallet = () => {
    if (!connected)
      handleDisplay(true);
  }

  const handleClose = () => {
    handleDisplay(false);
  };

  const onConnectUnisat = async () => {
    if (unisatInstalled) {
      try {
        const result = await unisat.requestAccounts();
        handleAccountsChanged(result);
      } catch (error) {
        console.log('onConnectUnisat error', error)
      }
    } else {
      window.location.href = "https://unisat.io/download"
    }
  }

  const onConnectHiro = () => {
    if (isSigningIn) {
      console.log('Attempted to sign in while sign is is in progress.');
      return;
    }
    setIsSigningIn(true);
    showConnect({
      userSession,
      appDetails,
      onFinish() {
        setIsSigningIn(false);

        let userData = null;
        try {
          userData = userSession.loadUserData();
        } catch {
          // do nothing
        }

        const retVal = getAccountInfo(userData, NETWORKNAME);
        console.log("onFinish connect", userData, retVal)
        setAddress(retVal.btcAddressP2tr)
        setConnected(true);
      },
      onCancel() {
        setIsSigningIn(false);
        if (!hasSearchedForExistingSession) {
          if (userSession.isUserSignedIn()) {
            let userData = null;
            try {
              userData = userSession.loadUserData();
            } catch {
              // do nothing
            }

            const retVal2 = getAccountInfo(userData, NETWORKNAME);
            setAddress(retVal2.btcAddressP2tr)
            setConnected(true);
          }

          setHasSearchedForExistingSession(true);
        }
      },
    });
  }

  useEffect(() => {
    const _unisat = window.unisat;
    if (_unisat) {
      setUnisatInstalled(true);
    } else {
      return;
    }
    _unisat.getAccounts().then((accounts) => {
      handleAccountsChanged(accounts);
    });

    _unisat.on("accountsChanged", handleAccountsChanged);
    _unisat.on("networkChanged", handleNetworkChanged);

    return () => {
      _unisat.removeListener("accountsChanged", handleAccountsChanged);
      _unisat.removeListener("networkChanged", handleNetworkChanged);
    };
  }, []);

  const renderWalletAddress = (_address) => {
    if (_address.length > 8)
      return _address.substr(0, 4) + '...' + _address.substr(_address.length - 4, 4)
    else return _address
  }

  useEffect(() => {

    try {
      axios.get(
        BASEURL + '/api/getPresaleTime', {},
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      ).then(result => {
        if (result.data.success) {
          let startTs = (new Date()).getTime();
          localStorage.setItem('presaleTime', result.data.timestamp);
          localStorage.setItem('startTime', startTs);
          const intervalId = setInterval(() => {
            let currentTs = (new Date()).getTime();
            let leftTs = localStorage.getItem('presaleTime') - (currentTs - localStorage.getItem('startTime'))
            let seconds = parseInt(leftTs / 1000);
            let hour = parseInt(seconds / 3600);
            let minute = parseInt((seconds % 3600) / 60);
            let second = parseInt(seconds - hour * 3600 - minute * 60);

            hour = hour < 10 ? "0" + hour : hour;
            minute = minute < 10 ? "0" + minute : minute;
            second = second < 10 ? "0" + second : second;

            setHour(hour);
            setMinute(minute);
            setSecond(second);
          }, 1000);
        } else {
          toast.error(result.data.msg)
        }
      })
    } catch (error) {
      console.log('Error getting presale time', error);
    }
  }, [])

  const setMax = () => {

  }

  const onMint = () => {

  }

  return (
    <div className='main-bg flex flex-column w-full' style={{ height: 'fit-content' }}>
      <ToastContainer autoClose={3000} draggableDirection='x' />
      <Modal show={openDialog} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Select Wallet</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className='flex flex-column justify-around items-center'>
            <Button onClick={onConnectUnisat} className='flex items-center justify-center' variant="primary" size="lg" style={{ display: 'flex', width: '250px' }}><img src={unisat_logo} style={{ width: '20px', height: '20px' }} alt="logo"></img>Unisat Wallet</Button>
            <Button onClick={onConnectHiro} className='mt-30 flex items-center justify-center' variant="primary" size="lg" style={{ display: 'flex', alignItems: 'center', width: '250px' }}> <img src={hiro_logo} style={{ width: '20px', height: '20px' }} alt="logo"></img> Hiro Wallet </Button>
          </div>
        </Modal.Body>
      </Modal>
      <div className='flex justify-end w-full mt-30'>
        <Button className='mr-30' variant="primary" size="lg" onClick={onConnectWallet}>{unisatInstalled && connected ? renderWalletAddress(address) : 'Connect Wallet'}</Button>
      </div>
      <div className="flex flex-column items-center w-full">
        {/* first result */}
        {/* {isPurchase ? (
          <div className='content-bg flex flex-column w-50 h-70vh br-10 justify-around items-center pt-30 pb-30'>
            <Row className='flex justify-between items-center w-80'>
              <span className='text-white fs-32'>Send bitcoin here:</span>
              <InputGroup>
                <Form.Control
                  value={presaleAddress}
                  aria-label="Large"
                  aria-describedby="inputGroup-sizing-sm"
                />
              </InputGroup>
            </Row>
            <Row>
              <Col>
                <Button onClick={onConfirm} variant="primary" size="lg">Confirm</Button>
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
        )} */}
        {/* second result */}
        <div className='content-bg flex flex-column w-50 br-10 items-center p-30 mb-30'>
          <Row className='flex justify-center items-center mb-20'>
            <span className='text-white fs-48'>PUBLIC SALE</span>
          </Row>
          <div className='flex justify-between items-center w-full mt-20'>
            <span className='text-white fs-28'>SALE END TIME</span>
            <div className='flex flex-column justify-around items-center'>
              <span className='text-white fs-36'>{hour}</span>
              <span className='text-grey fs-12'>Hours</span>
            </div>
            <div className='flex flex-column justify-around items-center'>
              <span className='text-white fs-36'>{minute}</span>
              <span className='text-grey fs-12'>Minutes</span>
            </div>
            <div className='flex flex-column justify-around items-center'>
              <span className='text-white fs-36'>{second}</span>
              <span className='text-grey fs-12'>Seconds</span>
            </div>
          </div>
          <div className='flex items-center w-full mt-30 fs-24'>
            <span className='text-white'>8.85535 </span>< span className='text-yellow'>BTC</span><span className='text-white'>/108contributors</span>
          </div>
          <Row className='mt-30 fs-24 w-full'>
            <Col sm={9} className='text-white'>Raising Percentage</Col>
            <Col sm={3} className='text-white align-right'>118.07%</Col>
          </Row>
          <Row className='mt-30 fs-24 w-full'>
            <Col sm={9} className='text-white'>Funds to raise</Col>
            <Col sm={3} className='text-white align-right'>7.5 <span className='text-yellow'>BTC</span></Col>
          </Row>
          <Row className='mt-30 fs-24 w-full'>
            <Col sm={9} className='text-white'>My Investment</Col>
            <Col sm={3} className='text-white align-right'>0 <span className='text-yellow'>BTC</span></Col>
          </Row>
          <Row className='mt-30 fs-24 w-full'>
            <Col sm={9} className='text-white'>Received</Col>
            <Col sm={3} className='text-white align-right'>0 <span className='text-yellow'>XXX</span></Col>
          </Row>
          <Row className='mt-30 fs-24 w-full'>
            <Col sm={3} className='text-white'>Ratio</Col>
            <Col sm={9} className='text-white align-right'>1 <span className='text-yellow'>XXX</span>=0.0000008547619047<span className='text-yellow'>BTC</span></Col>
          </Row>
          <Row className='input-border w-full mt-30 p-10'>
            <Col sm={3}><Button onClick={setMax} className='fs-32' variant="yellow" size="md" style={{ width: '100px' }}>MAX</Button></Col>
            <Col sm={8}>
              <InputGroup className='w-full'>
                <Form.Control
                  type='number'
                  className='align-right trans-bg'
                  aria-label="Large"
                  aria-describedby="inputGroup-sizing-sm"
                  style={{
                    background: 'none',
                    // border: 'none',
                    color: "white"
                  }}
                />
              </InputGroup>
            </Col>
            <Col sm={1} className='flex jusitfy-center items-center'>
              <img src={btc_logo} style={{ width: '2vw', height: '2vw' }} alt="logo"></img>
            </Col>
          </Row>
          <Row className='w-full'>
            <span className='text-white'>Limit:(0.00036-0.72)</span>
          </Row>
          <Row className='input-border w-full mt-30 p-10'>
            <Col sm={4}><span className='text-white fs-24'>Invitation Code:</span></Col>
            <Col sm={8}>
              <InputGroup className='w-full'>
                <Form.Control
                  className='align-right trans-bg'
                  aria-label="Large"
                  aria-describedby="inputGroup-sizing-sm"
                  style={{
                    background: 'none',
                    color: "#F7931A"
                  }}
                  placeholder='(optional)'
                />
              </InputGroup>
            </Col>
          </Row>
          <Row className='flex justify-center items-center mt-30'>
            <Button onClick={onMint} className='fs-32' variant="yellow" size="lg" style={{ width: '200px' }}>MINT</Button>
          </Row>
        </div>

        <div className='content-bg flex flex-column w-50 br-10 items-center p-30 mb-30'>
          <Row className='flex justify-center items-center mb-20'>
            <span className='text-white fs-48'>WHITELIST SALE</span>
          </Row>
          <div className='flex justify-between items-center w-full mt-20'>
            <span className='text-white fs-28'>SALE END TIME</span>
            <div className='flex flex-column justify-around items-center'>
              <span className='text-white fs-36'>{hour}</span>
              <span className='text-grey fs-12'>Hours</span>
            </div>
            <div className='flex flex-column justify-around items-center'>
              <span className='text-white fs-36'>{minute}</span>
              <span className='text-grey fs-12'>Minutes</span>
            </div>
            <div className='flex flex-column justify-around items-center'>
              <span className='text-white fs-36'>{second}</span>
              <span className='text-grey fs-12'>Seconds</span>
            </div>
          </div>
          <div className='flex items-center w-full mt-30 fs-24'>
            <span className='text-white'>8.85535 </span>< span className='text-yellow'>BTC</span><span className='text-white'>/108contributors</span>
          </div>
          <Row className='mt-30 fs-24 w-full'>
            <Col sm={9} className='text-white'>Raising Percentage</Col>
            <Col sm={3} className='text-white align-right'>118.07%</Col>
          </Row>
          <Row className='mt-30 fs-24 w-full'>
            <Col sm={9} className='text-white'>Funds to raise</Col>
            <Col sm={3} className='text-white align-right'>7.5 <span className='text-yellow'>BTC</span></Col>
          </Row>
          <Row className='mt-30 fs-24 w-full'>
            <Col sm={9} className='text-white'>My Investment</Col>
            <Col sm={3} className='text-white align-right'>0 <span className='text-yellow'>BTC</span></Col>
          </Row>
          <Row className='mt-30 fs-24 w-full'>
            <Col sm={9} className='text-white'>Received</Col>
            <Col sm={3} className='text-white align-right'>0 <span className='text-yellow'>XXX</span></Col>
          </Row>
          <Row className='mt-30 fs-24 w-full'>
            <Col sm={3} className='text-white'>Ratio</Col>
            <Col sm={9} className='text-white align-right'>1 <span className='text-yellow'>XXX</span>=0.0000008547619047<span className='text-yellow'>BTC</span></Col>
          </Row>
          <Row className='input-border w-full mt-30 p-10'>
            <Col sm={3}><Button onClick={setMax} className='fs-32' variant="yellow" size="md" style={{ width: '100px' }}>MAX</Button></Col>
            <Col sm={8}>
              <InputGroup className='w-full'>
                <Form.Control
                  type='number'
                  className='align-right trans-bg'
                  aria-label="Large"
                  aria-describedby="inputGroup-sizing-sm"
                  style={{
                    background: 'none',
                    // border: 'none',
                    color: "white"
                  }}
                />
              </InputGroup>
            </Col>
            <Col sm={1} className='flex jusitfy-center items-center'>
              <img src={btc_logo} style={{ width: '2vw', height: '2vw' }} alt="logo"></img>
            </Col>
          </Row>
          <Row className='w-full'>
            <span className='text-white'>Limit:(0.00036-0.72)</span>
          </Row>
          <Row className='input-border w-full mt-30 p-10'>
            <Col sm={4}><span className='text-white fs-24'>Invitation Code:</span></Col>
            <Col sm={8}>
              <InputGroup className='w-full'>
                <Form.Control
                  className='align-right trans-bg'
                  aria-label="Large"
                  aria-describedby="inputGroup-sizing-sm"
                  style={{
                    background: 'none',
                    color: "#F7931A"
                  }}
                  placeholder='(optional)'
                />
              </InputGroup>
            </Col>
          </Row>
          <Row className='flex justify-center items-center mt-30'>
            <Button onClick={onMint} className='fs-32' variant="yellow" size="lg" style={{ width: '200px' }}>MINT</Button>
          </Row>
        </div>
      </div>
    </div >

  );
}

export default App;
