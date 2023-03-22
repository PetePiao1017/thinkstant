import './Chatroom.scss'


const Chatroom = () => {
    return(
        <div className='chat-dialog'>
            <div className='chat-title'>
                {/* <img src='3.png' className='avatar'></img>
                <h3 className='heading'>Chat with Resume (Hicham) (2).pdf</h3>
                <button className='reset_btn'>Reset</button> */}
                <textarea id="story" name="story" rows="25" cols="33">
                    It was a dark and stormy night...
                </textarea>
            </div>
        </div>
    )
}

export default Chatroom

