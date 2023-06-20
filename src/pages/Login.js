import React from 'react';
import { Form, Button } from 'react-bootstrap';
import '../App.css';
import '../custom.css'
import { useState } from 'react';
import { useNavigate } from "react-router-dom";

const Login = ({ onSignIn }) => {

  const [username, setUserName] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();

  return (
    <div>
      <div className="flex items-center">
        <div className="card text-left p-30">
          <h4>Hello! let's get started</h4>
          <h6 className="font-weight-light">Sign in to continue.</h6>
          <Form className="pt-3">
            <Form.Group className="flex mb-30 search-field">
              <Form.Control
                value={username}
                onChange={(e) => setUserName(e.target.value)}
                type="email" placeholder="Username" size="lg" className="h-auto" />
            </Form.Group>
            <Form.Group className="flex search-field">
              <Form.Control
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password" placeholder="Password" size="lg" className="h-auto" />
            </Form.Group>
            <div className="mt-3 flex items-center justify-around">
              <Button onClick={() => { navigate("/") }} variant="primary" size="lg" >Back</Button>
              <Button onClick={() => onSignIn(username, password)} variant="primary" size="lg" >Sign In</Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  )
}

export default Login
