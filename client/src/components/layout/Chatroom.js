import "./Chatroom.css";
import { useLocation } from "react-router-dom";

const Chatroom = (props) => {
  const { state } = useLocation();
  return (
    <div className="container">
      <div className="chat-dialog">
        <textarea name="story" rows="25" cols="133">
          {state.detail}
        </textarea>
      </div>
    </div>
  );
};

export default Chatroom;
