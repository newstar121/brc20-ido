import unisat_logo from '../unisat_logo.png'
import hiro_logo from '../hiro_logo.png'
import { InputGroup, Form, Row, Button, Col, Modal } from 'react-bootstrap'
import { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './Login';
import axios from 'axios'
import { BASEURL } from '../utils/constants';
// import bcrypt from 'bcrypt'

const setAuthToken = token => {
    if (token) {
        axios.defaults.headers.common['Authorization'] = token;
    } else {
        delete axios.defaults.headers.common['Authorization'];
    }
};

function Admin() {

    const [openDialog, handleDisplay] = useState(false);
    const [isSign, setIsSign] = useState(false)

    const handleClose = () => {
        handleDisplay(false);
    };

    const onSignIn = () => (username, password) => {
        
        // const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync());
        
        const params = { 
            username : username,
            password : password
        };

        axios.get(
            BASEURL + '/api/login', { params },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        ).then(result => {
            if (result.data.success) {
                setIsSign(true)
                window.localStorage.setItem('adminJwtToken', result.data.token)
            } else {
                setIsSign(false)
                window.localStorage.removeItem('adminJwtToken')
            }
        }).catch(error => {
            console.log('admin user login error', error);
        })
    }

    useEffect(() => {
        let jwtToken = window.localStorage.getItem('adminJwtToken')
        if (jwtToken) {
            setIsSign(true)
        } else {
            setIsSign(false)
        }
        return () => {
            window.localStorage.removeItem('adminJwtToken');
        }
    }, [])

    return (
        <div className='main-bg flex flex-column w-full h-100vh'>
            <ToastContainer autoClose={3000} draggableDirection='x' />
            <Modal show={openDialog} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Select Wallet</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className='flex flex-column justify-around items-center'>
                        <Button className='flex items-center justify-center' variant="primary" size="lg" style={{ display: 'flex', width: '250px' }}><img src={unisat_logo} style={{ width: '20px', height: '20px' }} alt="logo"></img>Unisat Wallet</Button>
                        <Button className='mt-30 flex items-center justify-center' variant="primary" size="lg" style={{ display: 'flex', alignItems: 'center', width: '250px' }}> <img src={hiro_logo} style={{ width: '20px', height: '20px' }} alt="logo"></img> Hiro Wallet </Button>
                    </div>
                </Modal.Body>
            </Modal>
            <div className='flex justify-end w-full mt-30'>
                <Button className='mr-30' variant="primary" size="lg">Connect Wallet</Button>
            </div>
            {isSign ? (
                <div className='content-bg flex flex-column w-50 br-10 items-center p-30 mb-30'>

                </div>
            ) : (
                <Login onSignIn={onSignIn()} />
            )}
        </div >
    )
}

export default Admin;