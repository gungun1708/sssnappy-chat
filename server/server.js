import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

// Connect to the backend server running on the new port 5001
const socket = io.connect("http://localhost:5001");

function App() {
  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);

  const sendMessage = () => {
    if (message.trim() !== "") {
      const messageData = {
        text: message,
        time: new Date().toLocaleTimeString()
      };

      // Emit message to backend server
      socket.emit("send_message", messageData);
      
      // Update local message list for yourself
      setMessageList((list) => [...list, messageData]);
      setMessage("");
    }
  };

  useEffect(() => {
    // NEW: Listen for the initial message history dump from the database
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
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '400px', margin: 'auto' }}>
      <h2>SSSnappy-Chat</h2>
      <div style={{ border: '1px solid #ccc', height: '300px', overflowY: 'scroll', padding: '10px', marginBottom: '10px', borderRadius: '4px' }}>
        {messageList.map((msg, index) => (
          <div key={index} style={{ margin: '5px 0', borderBottom: '1px dashed #eee', paddingBottom: '4px' }}>
            <span style={{ fontSize: '0.8rem', color: '#888' }}>[{msg.time}] </span>
            <span>{msg.text}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex' }}>
        <input 
          type="text" 
          value={message} 
          placeholder="Type a message..." 
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          style={{ flexGrow: 1, padding: '8px', borderRadius: '4px 0 0 4px', border: '1px solid #ccc' }}
        />
        <button onClick={sendMessage} style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '0 4px 4px 0', cursor: 'pointer' }}>
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
