import React,{Component} from "react";
import {Link} from "react-router-dom";
import { logoutUser } from "../../actions/authActions";
import { connect } from "react-redux";


class Navbar extends Component{
    onLogout = e => {
        e.preventDefault();
        this.props.logoutUser();
    };
    
    render(){
        // const { user } = this.props.auth;
        return(
            <>
            <nav className="navbar navbar-expand-lg navbar-light " >
              <Link className="navbar-brand text-dark font-weight-bold" to="/" >Chatwith Our App</Link>
              <div style = {{float:'left'}} >
                {this.props.auth.isAuthenticated &&
                (<button
                  onClick={this.onLogout}
                  className="btn btn-large text- hoverable font-weight-bold float-right bg-transparent"
                  style={{float: 'right'}}>
                  Logout
                </button>)}
              </div>
            </nav>
            </>
        ) 
    }
}

// Navbar.PropTypes = {
//     logoutUser: PropTypes.func.isRequired,
//     auth: PropTypes.object.isRequired
//   };
  
const mapStateToProps = state => ({
    auth: state.auth
  });
  
export default connect(
    mapStateToProps,
    { logoutUser }
  )(Navbar);