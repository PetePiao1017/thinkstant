import './Chatroom.scss'
import { useLocation } from 'react-router-dom'


const Chatroom = (props) => {
    const {state} = useLocation()
    return(
        <div className='chat-dialog'>
            <div className='chat-title'>
                <textarea id="story" name="story" rows="25" cols="33">
                    {state.detail}
                </textarea>
            </div>
        </div>
    )
}

export default Chatroom

