import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io.connect("http://localhost:5001");

function App() {
  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);

  const sendMessage = () => {
    if (message.trim() !== "") {
      const messageData = {
        text: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        senderId: socket.id // Tagging the message packet with your unique connection ID
      };

      socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]);
      setMessage("");
    }
  };

  useEffect(() => {
    socket.on("load_messages", (messages) => {
      setMessageList(messages);
    });

    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });

    return () => {
      socket.off("load_messages");
      socket.off("receive_message");
    };
  }, []);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>SSSnappy-Chat</h2>
      </div>
      
      <div className="chat-messages-box">
        {messageList.map((msg, index) => {
          // Check if the item's senderId matches your own active socket channel ID
          const isMyMessage = msg.senderId === socket.id;
          
          return (
            <div 
              key={index} 
              className={`chat-message-row ${isMyMessage ? 'my-message' : 'other-message'}`}
            >
              <div className="chat-bubble">
                <span>{msg.text}</span>
                <span className="chat-bubble-time">{msg.time}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="chat-input-panel">
        <input 
          type="text" 
          value={message} 
          className="chat-input-field"
          placeholder="Type a message..." 
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage} className="chat-send-btn">
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
