import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css'; // Connects the modern layout stylesheet classes

// Connect to the backend server running on port 5001
const socket = io.connect("http://localhost:5001");

function App() {
  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);

  const sendMessage = () => {
    if (message.trim() !== "") {
      // FIX: Clean, proper message data packet tagged with your unique socket id
      const messageData = {
        text: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        senderId: socket.id 
      };

      // Emit message to backend server
      socket.emit("send_message", messageData);
      
      // Update local message list for yourself
      setMessageList((list) => [...list, messageData]);
      setMessage("");
    }
  };

  useEffect(() => {
    // Listen for the initial message history dump from the database
    socket.on("load_messages", (messages) => {
      setMessageList(messages);
    });

    // Listen for incoming messages broadcasted by the server
    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });

    // Clean up listeners when the component closes
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
          // Dynamic conditional check: shifts bubbles based on who typed them
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
