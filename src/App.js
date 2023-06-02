import logo from './logo.svg';
import unisat_logo from './unisat_logo.png'
import hiro_logo from './hiro_logo.png'
import './App.css';
import './custom.css'
import { InputGroup, Form, Row, Button, Col, Modal } from 'react-bootstrap'
import { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios'

const BASEURL = 'http://localhost:5005'
const NETNAME = 'testnet'

const setAuthToken = token => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = token;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

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
    setBrc20(e.target.value)
    setBitcoin(e.target.value)
  }

  const onChangeBrc20 = (e) => {
    setBrc20(e.target.value)
    setBitcoin(e.target.value)
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
        let netName = await window.unisat.getNetwork();
        if(netName !== NETNAME)
          await window.unisat.switchNetwork(NETNAME);

        let txid = await window.unisat.sendBitcoin(presaleAddress, bitcoin * Math.pow(10, 8));
        
        axios.post(
          BASEURL + '/api/auth/buyTokens', 
          {
            address: address,
            bitcoin: bitcoin,
            brc20: brc20,
            txid: txid
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        ).then(result => {
          if (result.data.success) {
            toast.success('Success')
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
    const result = await unisat.requestAccounts();
    handleAccountsChanged(result);
  }

  const onConnectHiro = () => {

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

  return (
    <div className='main-bg flex flex-column w-full h-100vh'>
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
      <div className="flex justify-center items-center w-full">
        {isPurchase ? (
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
        )}
      </div>
    </div>

  );
}

export default App;
