import React from 'react';
import {BrowserRouter as Router, Route, Switch } from "react-router-dom";
import {Provider} from 'react-redux';
import store from './store';
import jwt_decode from "jwt-decode";
import setAuthToken from "./util/setAuthToken";
import { setCurrentUser, logoutUser } from "./actions/authActions";
import '../node_modules/bootstrap/dist/css/bootstrap.min.css'
import './App.css';

import Navbar from "./components/layout/Navbar";
// import Landing from "./components/layout/Landing";
import Register from "./components/auth/Register";
import Login from "./components/auth/Login";
import PrivateRoute from "./components/private-route/PrivateRoute";
import Chatroom from "./components/layout/Chatroom";
import DragDrop from "./components/layout/DragDrop";
import Payment from "./components/layout/Payment";
import EmailVerify from "./components/EmailVerify";


if (localStorage.jwtToken) {

  const token = localStorage.jwtToken;
  setAuthToken(token);
  const decoded = jwt_decode(token);
  store.dispatch(setCurrentUser(decoded));
  const currentTime = Date.now() / 1000; 
  if (decoded.exp < currentTime) {
    store.dispatch(logoutUser());
    window.location.href = "./login";
  }
}

function App() {
  return (
    <Provider store={store} >
      <Router>
        <div className="App">
          <Navbar/>
          <Route path="/" component = {DragDrop} exact />
          <Route path="/register" component={Register} exact/>
          <Route path="/login" component={Login} exact/>
          <Route exact path="/chatroom" component={Chatroom} />
          <Route path="/users/:id/verify/:token" element={<EmailVerify />} />
          <Switch>
              <PrivateRoute exact path="/payment" component={Payment} />
          </Switch>
        </div>
      </Router>
    </Provider>
    
  );
}

export default App;
