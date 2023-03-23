import { useState } from "react";
import { useHistory } from "react-router-dom";
import React from 'react';
import './DragDrop.css';
import axios from 'axios';
import { ProgressBar,Alert, Modal, Button} from "react-bootstrap";

// drag drop file component
const DragDropFile = () => {
    // drag state
    const history = useHistory();
    const [dragActive, setDragActive] = useState(false);                
    const [progress, setProgress] = useState()
    const [error, setError] = useState();
    const [selectedFiles, setSelectedFiles] = useState([])
    const [isShow, setIsShow] = useState(false)
    // ref
    const inputRef = React.useRef(null);
    
    const submitHandler = e => {
        e.preventDefault()
        //clear error message
        setError("");
        let countSize = 0
        let formData = new FormData() 
        for(let i =0; i < selectedFiles.length; i++) {
          countSize += selectedFiles[i].size
          formData.append("files", selectedFiles[i]);
        }

        if (countSize >= 5242880){
          setIsShow(true)
        }
        else{
          axios.post('/api/users/upload_file', formData, {
          headers: {
              "Content-type": "multipart/form-date",
            },
            onUploadProgress:data =>{
              //set the progress value  to show the progress bar
              setProgress(Math.round((100 * data.loaded) / data.total))
            },
          })
          .then(res => {
            if(res.data.status === 'success'){
                history.push({
                  pathname:'/chatroom',
                  state: {detail: res.data.result}
                })
            }
          })
          .catch((error) => {
            const { code } = error?.response?.data;
            switch (code) {
              case "FILE_MISSING":
                setError("Please select a file before uploading!");
                break;
              case "LIMIT_FILE_SIZE":
                setError("File size is too large. Please upload files below 1MB!");
                break;
              case "INVALID_TYPE":
                setError(
                  "This file type is not supported! Only .png, .jpg and .jpeg files are allowed"
                );
                break;
      
              default:
                setError("Sorry! Something went wrong. Please try again later");
                break;
            }
          });
        }
        
      }

    // handle drag events
    const handleDrag = function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    };
    
    // // triggers when file is dropped
    const handleDrop = function(e) {
      setError("");
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

  
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const chosenFiles = Array.prototype.slice.call(e.dataTransfer.files)
        setSelectedFiles(chosenFiles)
      }
    };
    
    // triggers when file is selected with click
    const handleChange = function(e) {
    setError("");
      e.preventDefault();
      if (e.target.files && e.target.files[0]) {
        const chosenFiles = Array.prototype.slice.call(e.target.files)
        setSelectedFiles(chosenFiles)
      }
    };
    
  // triggers the input when the button is clicked
    const onButtonClick = () => {
      inputRef.current.click();
    };
    //Fake the modal
    const initModal = () => {
      setIsShow(false)
    }
    // go to signin
    const gotoLogin = () => {
      history.push('/login')
    }
    return (
      <div className="col-md-12">
        
        <header>
            <h2 className="text-dark subtitle" >
            Chat With Our App
            </h2>
        </header>
        <form id="form-file-upload" onDragEnter={handleDrag} onSubmit={submitHandler} method = 'post' encType = 'multipart/form-data'>
            <input ref={inputRef} type="file" id="input-file-upload" multiple={true} onChange={handleChange} />
            <label id="label-file-upload" htmlFor="input-file-upload" className={dragActive ? "drag-active" : "" }>
            <div>
                <h4>Drag and drop your file here</h4>
                <button className="upload-button" onClick={onButtonClick}></button>
            </div> 
            </label>
            { dragActive && <div id="drag-file-element" onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}></div> }
            <button type='submit' className ='btn btn-success submit-btn'>Submit</button>
        </form>
        <div className="error">
            {error && <Alert variant="danger">{error}</Alert>}
            {!error && progress && (
            <ProgressBar className="progressbar" now={progress} label={`${progress}%`} />)}
        </div>
        <div className="container mt-3">
            <Modal show={isShow}>
              <Modal.Header closeButton onClick={initModal}>
                <Modal.Title>Your File is too Large!</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <h4>
                Please SignIn to get a service.
                </h4>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="danger" onClick={initModal}>
                  Close
                </Button>
                <Button variant="dark" onClick={gotoLogin}>
                  Go to Login
                </Button>
              </Modal.Footer>
            </Modal>
        </div>
      </div>
      
    );
  };

  export default DragDropFile