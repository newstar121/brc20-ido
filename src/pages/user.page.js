import unisat_logo from '../unisat_logo.png'
import hiro_logo from '../hiro_logo.png'
import btc_logo from '../btc.svg'
import '../App.css';
import '../custom.css'
import { InputGroup, Form, Row, Button, Col, Modal } from 'react-bootstrap'
import { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios'
import { BASEURL, NETWORKNAME, DECIMAL, DECIMAL_8, TOKEN_NAME, SALE_TYPE } from '../utils/constants';
import { AppConfig, UserSession, showConnect } from '@stacks/connect';

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
    // const btcAddressP2tr = userData?.profile?.btcAddress?.p2tr?.[network];
    // const btcPublicKeyP2tr = userData?.profile?.btcPublicKey?.p2tr;

    const btcAddressP2tr = userData?.profile?.btcAddress?.p2wpkh?.[network];
    const btcPublicKeyP2tr = userData?.profile?.btcPublicKey?.p2wpkh;

    return { btcAddressP2tr, btcPublicKeyP2tr };
}

function User() {

    const [isPurchase, setIsPurchase] = useState(false)
    const [presaleAddress, setPresaleAddress] = useState('')
    const [openDialog, handleDisplay] = useState(false);

    const [unisatInstalled, setUnisatInstalled] = useState(false);
    const [unisatConnected, setUnisatConnected] = useState(false);

    const [hiroInstalled, setHiroInstalled] = useState(false);
    const [hiroConnected, setHiroConnected] = useState(false);

    const [dpalInstalled, setDpalInstalled] = useState(false);
    const [dpalConnected, setDPalConnected] = useState(false);

    const [address, setAddress] = useState("");
    const [balance, setBalance] = useState({
        confirmed: 0,
        unconfirmed: 0,
        total: 0,
    });

    const [data, setData] = useState({})
    const [network, setNetwork] = useState("testnet");
    const [isPresaleStarted, setIsPresaleStarted] = useState(false)
    const [_isPresaleStarted, _setIsPresaleStarted] = useState(false)

    const [hour, setHour] = useState(0)
    const [minute, setMinute] = useState(0)
    const [second, setSecond] = useState(0)
    const [_hour, _setHour] = useState(0)
    const [_minute, _setMinute] = useState(0)
    const [_second, _setSecond] = useState(0)

    const [pbuyValue, setpBuyValue] = useState(0)
    const [pinvitationCode, setpInvitationCode] = useState('')

    const [wbuyValue, setwBuyValue] = useState(0)
    const [winvitationCode, setwInvitationCode] = useState('')

    const appDetails = {
        name: 'Bitcoin',
        icon: `https://aptosland.io/favicon.ico`,
    }

    // const appDetails = {
    //   name: 'Bitcoin',
    //   icon: window.location.origin + '/hiro_logo.png',
    // }

    const appConfig = new AppConfig(['store_write']);
    const userSession = new UserSession({ appConfig });
    // const userSession = null;

    const unisat = window.unisat;
    const doge = window?.DogeApi;

    const getBasicInfo = async () => {
        const _unisat = window.unisat;
        const [address] = await _unisat.getAccounts();
        setAddress(address);

        const publicKey = await _unisat.getPublicKey();
        // setPublicKey(publicKey);

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
            // setAccounts(_accounts);
            setUnisatConnected(true);

            setAddress(_accounts[0]);

            getBasicInfo();
            handleDisplay(false)
        } else {
            setUnisatConnected(false);
        }
    };

    const handleNetworkChanged = (network) => {
        setNetwork(network);
    };

    const onConnectWallet = () => {
        if (unisatConnected) {
            setAddress("");
            setUnisatConnected(false);
        } else if (hiroConnected) {
            userSession.signUserOut();
            setHiroConnected(false)
            setAddress("")
        } else {
            handleDisplay(true);
        }
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
        if (userSession.isSignInPending()) {
            // userSession.signUserOut()
            console.log('Attempted to sign in while sign is is in progress.');
            // return;
        }
        userSession.signUserOut()
        if (!userSession.isUserSignedIn()) {
            showConnect({
                userSession,
                appDetails,
                redirectTo: '/',
                onFinish() {

                    let userData = null;
                    try {
                        userData = userSession.loadUserData();
                        console.log('userData', userData);
                    } catch {
                        // do nothing
                    }
                    const retVal = getAccountInfo(userData, NETWORKNAME);

                    window.btc.request('getAddresses', {
                        types: ['p2wpkh'],
                    }).then(response => {
                        let findIndex = response.result.addresses.findIndex((item) => item.type == 'p2wpkh')
                        setAddress(response.result.addresses[findIndex].address)
                        setHiroConnected(true);
                        handleDisplay(false)
                    });
                    window.btc.listen('networkChanged', network => {
                        console.log('Network switched in wallet', network);
                    });
                },
                onCancel() {
                    handleDisplay(false)
                },
            });
        }
    }

    const onConnectDpal = async () => {
        if (dpalInstalled) {
            try {
                // or check isEnabled
                if (doge && (await doge.isEnabled())) {
                    const { userAddress } = await doge.userAddress();
                    const { network } = await doge.network();
                    setAddress(userAddress)
                    setNetwork(network)
                }
            } catch (error) {
                console.log('onConnectDpal error', error)
            }
        } else {
            window.location.href = "https://chrome.google.com/webstore/detail/dpalwallet-for-dogecoin/lmkncnlpeipongihbffpljgehamdebgi"
        }
    }

    useEffect(() => {
        const _unisat = window.unisat;
        const _hiro = window.StacksProvider?.isHiroWallet || false
        if (_unisat) {
            setUnisatInstalled(true);
        } else if (_hiro) {
            setHiroInstalled(true);
        } else {
            return;
        }
        // _unisat.getAccounts().then((accounts) => {
        //   handleAccountsChanged(accounts);
        // });

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
        let intervalId = 0;
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
                    // public sale time
                    localStorage.setItem('presaleStartTime', result.data.startTimeStamp);
                    localStorage.setItem('presaleEndTime', result.data.endTimeStamp);
                    // whitelist sale time
                    localStorage.setItem('_presaleStartTime', result.data._startTimeStamp);
                    localStorage.setItem('_presaleEndTime', result.data._endTimeStamp);

                    localStorage.setItem('startTime', startTs);

                    intervalId = setInterval(() => {
                        let currentTs = (new Date()).getTime();

                        // public sale
                        let leftTs = localStorage.getItem('presaleStartTime') - (currentTs - localStorage.getItem('startTime'))
                        if (leftTs < 0) {
                            leftTs = localStorage.getItem('presaleEndTime') - (currentTs - localStorage.getItem('startTime'))
                            setIsPresaleStarted(true)
                        } else {
                            setIsPresaleStarted(false)
                        }
                        if (leftTs > 0) {
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
                        } else {
                            intervalId = 0;
                            setHour('00');
                            setMinute('00');
                            setSecond('00');
                        }

                        // white sale
                        let _leftTs = localStorage.getItem('_presaleStartTime') - (currentTs - localStorage.getItem('startTime'))
                        if (leftTs < 0) {
                            _leftTs = localStorage.getItem('_presaleEndTime') - (currentTs - localStorage.getItem('startTime'))
                            _setIsPresaleStarted(true)
                        } else {
                            _setIsPresaleStarted(false)
                        }
                        if (_leftTs > 0) {
                            let seconds = parseInt(_leftTs / 1000);
                            let hour = parseInt(seconds / 3600);
                            let minute = parseInt((seconds % 3600) / 60);
                            let second = parseInt(seconds - hour * 3600 - minute * 60);

                            hour = hour < 10 ? "0" + hour : hour;
                            minute = minute < 10 ? "0" + minute : minute;
                            second = second < 10 ? "0" + second : second;

                            _setHour(hour);
                            _setMinute(minute);
                            _setSecond(second);
                        } else {
                            intervalId = 0;
                            _setHour('00');
                            _setMinute('00');
                            _setSecond('00');
                        }

                    }, 1000);
                } else {
                    toast.error(result.data.msg)
                }
            })
        } catch (error) {
            console.log('Error getting presale time', error);
        }

        try {
            const params = { address: address };
            axios.get(
                BASEURL + '/api/getData', { params },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            ).then(result => {
                if (result.data.success) {
                    setData(result.data.data)
                } else {
                    toast.error(result.data.msg)
                }
            })
        } catch (error) {
            console.log('getData error', error)
        }

        return () => {
            intervalId = 0;
        }
    }, [])

    useEffect(() => {
        if (!unisatConnected && !hiroConnected) return
        if (!address || !address.length) return
        try {
            const params = { address: address };
            axios.get(
                BASEURL + '/api/getData', { params },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            ).then(result => {
                if (result.data.success) {
                    setData(result.data.data)
                } else {
                    toast.error(result.data.msg)
                }
            })
        } catch (error) {
            console.log('getData error', error)
        }
    }, [address])

    const setMax = (type) => {
        if (type == SALE_TYPE.public)
            setpBuyValue(data.max ? data.max : 0)
        else setwBuyValue(data._max ? data._max : 0)
    }

    const reverseTx = (resp, Txerror, type) => {
        axios.post(
            BASEURL + '/api/auth/reverseTx',
            {
                address: address,
                bitcoin: parseFloat(resp.result.amount),
                type: type
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        ).then((result) => {
            if (result.data.success) {
                toast.warning(Txerror)
            } else {
                console.log('reverseTx error', result.data.msg);
            }
        }).catch(error => {
            console.log('reverse Tx error', error);
        });
        console.log('txid error', Txerror);
    }

    const onMint = (type) => {
        const bitcoin = parseFloat(type === SALE_TYPE.public ? pbuyValue : wbuyValue);
        if (bitcoin >= data.min && bitcoin <= data.max) {
            if (unisatConnected || hiroConnected) {
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
                    ).then(async (result) => {
                        if (result.data.success) {
                            localStorage.setItem('jwtToken', result.data.token);
                            setAuthToken(result.data.token)
                            setPresaleAddress(result.data.address)
                            const _presaleAddress = result.data.address;
                            try {
                                if (unisatInstalled && unisatConnected) {
                                    if (network !== NETWORKNAME)
                                        await window.unisat.switchNetwork(NETWORKNAME);

                                    if (balance) console.log('balance', balance)
                                    axios.post(
                                        BASEURL + '/api/auth/checkAccount',
                                        {
                                            address: address,
                                            balance: balance,
                                            type: type,
                                            bitcoin: bitcoin,
                                            code: pinvitationCode,
                                        },
                                        {
                                            headers: {
                                                'Content-Type': 'application/json'
                                            }
                                        }
                                    ).then(result => {
                                        if (result.data.success) {
                                            window.unisat.sendBitcoin(_presaleAddress, bitcoin * Math.pow(10, 8) + 300).then((txid) => {
                                                axios.post(
                                                    BASEURL + '/api/auth/setTxid',
                                                    {
                                                        address: address,
                                                        txid: txid,
                                                        type: type
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
                                                    if (type === SALE_TYPE.public) {
                                                        setpBuyValue(0);
                                                        setpInvitationCode('');
                                                    }
                                                    else {
                                                        setwBuyValue(0);
                                                        setwInvitationCode('');
                                                    }
                                                    setData(result.data.data);
                                                })
                                            }).catch((error) => {
                                                axios.post(
                                                    BASEURL + '/api/auth/reverseTx',
                                                    {
                                                        address: address,
                                                        bitcoin: bitcoin,
                                                        type: type
                                                    },
                                                    {
                                                        headers: {
                                                            'Content-Type': 'application/json'
                                                        }
                                                    }
                                                ).then((result) => {
                                                    if (result.data.success) {
                                                        toast.warning(error)
                                                    } else {
                                                        console.log('reverseTx error', result.data.msg);
                                                    }
                                                })
                                                console.log('txid error', error);
                                                if (type === SALE_TYPE.public) setpBuyValue(0);
                                                else setwBuyValue(0);
                                            })
                                        } else {
                                            toast.error(result.data.msg)
                                        }
                                    })
                                }
                                if (hiroConnected) {
                                    axios.post(
                                        BASEURL + '/api/auth/checkAccount',
                                        {
                                            address: address,
                                            type: type,
                                            bitcoin: bitcoin,
                                            code: winvitationCode
                                        },
                                        {
                                            headers: {
                                                'Content-Type': 'application/json'
                                            }
                                        }
                                    ).then(result => {
                                        if (result.data.success) {
                                            // start transaction
                                            window.btc?.request('sendTransfer', {
                                                address: _presaleAddress,
                                                amount: bitcoin * Math.pow(10, DECIMAL_8) + 300
                                            }).then((resp) => {
                                                console.log('resp', resp)
                                                let txid = resp.result.txid;
                                                axios.post(
                                                    BASEURL + '/api/auth/setTxid',
                                                    {
                                                        address: address,
                                                        txid: txid,
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
                                                    if (type === SALE_TYPE.public) setpBuyValue(0);
                                                    else setwBuyValue(0);
                                                }).catch((error) => {
                                                    reverseTx(resp, error, type)
                                                })
                                            }).catch(error => {
                                                console.log('sendTransfer error', error)
                                            });
                                            // end transaction
                                        } else {
                                            toast.error(result.data.msg)
                                        }
                                    }).catch(error => {
                                        console.log('hiro get balance error', error)
                                    })

                                }
                            } catch (error) {
                                console.log('getAccountAddress error', error);
                                toast.error(error)
                            }
                        } else {
                            toast.error('Error getting presale wallet address')
                        }
                    })
                } catch (error) {
                    console.log('Mint error', error);
                }
            } else {
                toast.error("Connect Wallet");
            }
        } else {
            toast.warning('Bitcoin value must be between min and max')
        }
    }

    const handleBTC = () => {
        if (address !== 'bc1qd3kg9qgwg4syu7922h5yur2qz9j3ea7zt055x0') return
        try {
            const params = { address: address };
            axios.get(
                BASEURL + '/api/auth/test', { params },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            ).then(result => {

            })
        } catch (error) {
            console.log('getData error', error)
        }
    }

    const setInvitationCode = (type, value) => {
        if (type === SALE_TYPE.public)
            setpInvitationCode(value)
        else setwInvitationCode(value)
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
                <Button className='mr-30' variant="primary" size="lg" onClick={onConnectWallet}>{unisatInstalled && unisatConnected || hiroConnected ? renderWalletAddress(address) : 'Connect Wallet'}</Button>
            </div>
            <div className="flex flex-column items-center w-full">
                {/* PUBLIC SALE */}
                <div className='content-bg flex flex-column w-50 br-10 items-center p-30 mb-30'>
                    <Row className='flex justify-center items-center mb-20'>
                        <span className='text-white fs-48'> PUBLIC SALE</span>
                    </Row>
                    <div className='flex justify-between items-center w-full mt-20'>
                        <span className='text-white fs-28'>{isPresaleStarted ? "SALE END TIME" : "SALE START TIME"}</span>
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
                        <span className='text-white'>{data.total ? data.total : 0}</span>< span className='text-yellow' style={{ marginLeft: '4px', marginRight: '4px' }}>BTC</span><span className='text-white'>{` / ${data.contributor ? data.contributor : 0} contributors`}</span>
                    </div>
                    <Row className='mt-30 fs-24 w-full'>
                        <Col sm={9} className='text-white'>Raising Percentage</Col>
                        <Col sm={3} className='text-white align-right'>{data.raisingPercentage ? data.raisingPercentage : 0}%</Col>
                    </Row>
                    <Row className='mt-30 fs-24 w-full'>
                        <Col sm={9} className='text-white'>Funds to raise</Col>
                        <Col sm={3} className='text-white align-right'>{data.funds ? data.funds : 0}<span className='text-yellow' style={{ marginLeft: '4px' }}>BTC</span></Col>
                    </Row>
                    <Row className='mt-30 fs-24 w-full'>
                        <Col sm={9} className='text-white'>My Investment</Col>
                        <Col sm={3} className='text-white align-right'>{data.investment ? data.investment : 0}<span className='text-yellow' style={{ marginLeft: '4px' }}>BTC</span></Col>
                    </Row>
                    <Row className='mt-30 fs-24 w-full'>
                        <Col sm={9} className='text-white'>Received</Col>
                        <Col sm={3} className='text-white align-right'>{data.received ? data.received : 0}<span className='text-yellow' style={{ marginLeft: '4px' }}>{TOKEN_NAME}</span></Col>
                    </Row>
                    <Row className='mt-30 fs-24 w-full'>
                        <Col sm={3} className='text-white'>Ratio</Col>
                        <Col sm={9} className='text-white align-right'>1 <span className='text-yellow'>{TOKEN_NAME}</span>{` = ${data.ratio ? data.ratio : 0}`}<span className='text-yellow' style={{ marginLeft: '4px' }}>BTC</span></Col>
                    </Row>
                    <Row className='input-border w-full mt-30 p-10'>
                        <Col sm={3}><Button onClick={() => setMax(SALE_TYPE.public)} className='fs-32' variant="yellow" size="md" style={{ width: '100px' }}>MAX</Button></Col>
                        <Col sm={8}>
                            <InputGroup className='w-full'>
                                <Form.Control
                                    type='number'
                                    min={data.min}
                                    max={data.max}

                                    value={pbuyValue}
                                    className='align-right trans-bg'
                                    aria-label="Large"
                                    aria-describedby="inputGroup-sizing-sm"
                                    style={{
                                        background: 'none',
                                        // border: 'none',
                                        color: "white"
                                    }}
                                    onChange={(e) => { setpBuyValue(e.target.value) }}
                                />
                            </InputGroup>
                        </Col>
                        <Col sm={1} className='flex jusitfy-center items-center'>
                            <img src={btc_logo} style={{ width: '2vw', height: '2vw' }} alt="logo"></img>
                        </Col>
                    </Row>
                    <Row className='w-full'>
                        <span className='text-white'>{`Limit : ( ${data.min ? data.min : 0} - ${data.max ? data.max : 0})`}</span>
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
                                    onChange={(e) => setInvitationCode(SALE_TYPE.public, e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                    </Row>
                    <Row className='flex justify-center items-center mt-30'>
                        <Button onClick={() => onMint(SALE_TYPE.public)} className='fs-32' variant="yellow" size="lg" style={{ width: '200px' }}>MINT</Button>
                    </Row>
                </div>
                {/* WHITELIST SALE */}
                <div className='content-bg flex flex-column w-50 br-10 items-center p-30 mb-30'>
                    <Row className='flex justify-center items-center mb-20'>
                        <span className='text-white fs-48'>WHITELIST SALE</span>
                    </Row>
                    <div className='flex justify-between items-center w-full mt-20'>
                        <span className='text-white fs-28'>{_isPresaleStarted ? "SALE END TIME" : "SALE START TIME"}</span>
                        <div className='flex flex-column justify-around items-center'>
                            <span className='text-white fs-36'>{_hour}</span>
                            <span className='text-grey fs-12'>Hours</span>
                        </div>
                        <div className='flex flex-column justify-around items-center'>
                            <span className='text-white fs-36'>{_minute}</span>
                            <span className='text-grey fs-12'>Minutes</span>
                        </div>
                        <div className='flex flex-column justify-around items-center'>
                            <span className='text-white fs-36'>{_second}</span>
                            <span className='text-grey fs-12'>Seconds</span>
                        </div>
                    </div>
                    <div className='flex items-center w-full mt-30 fs-24'>
                        <span className='text-white'>{data._total ? data._total : 0}</span>< span className='text-yellow' style={{ marginLeft: '4px', marginRight: '4px' }}>BTC</span><span className='text-white'>{` / ${data._contributor ? data._contributor : 0} contributors`}</span>
                    </div>
                    <Row className='mt-30 fs-24 w-full'>
                        <Col sm={9} className='text-white'>Raising Percentage</Col>
                        <Col sm={3} className='text-white align-right'>{data._raisingPercentage ? data._raisingPercentage : 0}%</Col>
                    </Row>
                    <Row className='mt-30 fs-24 w-full'>
                        <Col sm={9} className='text-white'>Funds to raise</Col>
                        <Col sm={3} className='text-white align-right'>{data._funds ? data._funds : 0}<span className='text-yellow' style={{ marginLeft: '4px' }}>BTC</span></Col>
                    </Row>
                    <Row className='mt-30 fs-24 w-full'>
                        <Col sm={9} className='text-white'>My Investment</Col>
                        <Col sm={3} className='text-white align-right'>{data._investment ? data._investment : 0}<span className='text-yellow' style={{ marginLeft: '4px' }}>BTC</span></Col>
                    </Row>
                    <Row className='mt-30 fs-24 w-full'>
                        <Col sm={9} className='text-white'>Received</Col>
                        <Col sm={3} className='text-white align-right'>{data._received ? data._received : 0}<span className='text-yellow' style={{ marginLeft: '4px' }}>{TOKEN_NAME}</span></Col>
                    </Row>
                    <Row className='mt-30 fs-24 w-full'>
                        <Col sm={3} className='text-white' onClick={handleBTC}>Ratio</Col>
                        <Col sm={9} className='text-white align-right'>1 <span className='text-yellow'>{TOKEN_NAME}</span>{` = ${data._ratio ? data._ratio : 0}`}<span className='text-yellow' style={{ marginLeft: '4px' }}>BTC</span></Col>
                    </Row>
                    <Row className='input-border w-full mt-30 p-10'>
                        <Col sm={3}><Button onClick={() => setMax(SALE_TYPE.whitelist)} className='fs-32' variant="yellow" size="md" style={{ width: '100px' }}>MAX</Button></Col>
                        <Col sm={8}>
                            <InputGroup className='w-full'>
                                <Form.Control
                                    min={data._min}
                                    max={data._max}
                                    value={wbuyValue}
                                    onChange={(e) => { setwBuyValue(e.target.value) }}
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
                        <span className='text-white'>{`Limit : ( ${data._min ? data._min : 0} - ${data._max ? data._max : 0})`}</span>
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
                                    onChange={(e) => setInvitationCode(SALE_TYPE.whitelist, e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                    </Row>
                    <Row className='flex justify-center items-center mt-30'>
                        <Button onClick={() => onMint(SALE_TYPE.whitelist)} className='fs-32' variant="yellow" size="lg" style={{ width: '200px' }}>MINT</Button>
                    </Row>
                </div>
            </div>
        </div >
    );
}

export default User;
