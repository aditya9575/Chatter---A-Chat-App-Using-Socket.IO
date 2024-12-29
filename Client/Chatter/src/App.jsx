import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

// const socket = io('http://localhost:7000');
const socket = io('https://chatterfrontend.vercel.app/');


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messageEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll effect
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket event listeners
  useEffect(() => {
    // Message handler
    socket.on('message', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    // User list handler
    socket.on('userList', (userList) => {
      setUsers(userList);
    });

    // Typing indicators
    socket.on('userTyping', (username) => {
      setTypingUsers((prev) => new Set(prev).add(username));
    });

    socket.on('userStoppedTyping', (username) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(username);
        return newSet;
      });
    });

    // Cleanup on unmount
    return () => {
      socket.off('message');
      socket.off('userList');
      socket.off('userTyping');
      socket.off('userStoppedTyping');
    };
  }, []);

  // Handle user login
  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim()) {
      socket.emit('login', username);
      setIsLoggedIn(true);
    }
  };

  // Handle user leaving chat
  const handleLeaveChat = () => {
    socket.emit('leaveChat');
    setIsLoggedIn(false);
    setMessages([]);
    setUsers([]);
    setUsername('');
  };

  // Handle sending messages
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      socket.emit('sendMessage', message);
      setMessage('');
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    socket.emit('typing');
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping');
    }, 1000);
  };

  // Login screen
  if (!isLoggedIn) {
    return (
      <div className="app-container">
        <header className="app-header">
          <h1>CHATTER</h1>
        </header>

        <div className="login-container">
          <form onSubmit={handleLogin} className="login-form">
            <h2>Join Chat</h2>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              maxLength={20}
              required
            />
            <button type="submit">Join</button>
          </form>
        </div>

        <footer className="app-footer">
          <p>© {new Date().getFullYear()} CHATTER BY FAB</p>
          <div className="social-links">
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </footer>
      </div>
    );
  }

  // Chat screen
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>CHATTER</h1>
        <span>Hello, {username}!</span>
        <button className="leave-button" onClick={handleLeaveChat}>
          Leave Chat
        </button>
      </header>

      <div className="chat-container">
        <div className="sidebar">
          <h3>Users</h3>
          <ul className="user-list">
            {users.map((user, index) => (
              <li key={index}>
                <span
                  className={`status-indicator ${
                    user.status === 'online' ? 'online' : 'offline'
                  }`}
                />
                {user.username}
                {user.status === 'offline' && 
                  <span className="offline-text">(offline)</span>
                }
              </li>
            ))}
          </ul>
        </div>

        <div className="chat-main">
          <div className="messages-container">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${
                  msg.type === 'notification' ? 'notification' : 
                  msg.username === username ? 'own-message' : 'other-message'
                }`}
              >
                {msg.type === 'notification' ? (
                  <p className="notification-text">{msg.text}</p>
                ) : (
                  <>
                    <div className="message-header">
                      <span className="username">{msg.username}</span>
                      <span className="timestamp">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="message-text">{msg.text}</p>
                  </>
                )}
              </div>
            ))}
            {typingUsers.size > 0 && (
              <div className="typing-indicator">
                {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
              </div>
            )}
            <div ref={messageEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="message-form">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleTyping}
              placeholder="Type a message..."
              maxLength={1000}
            />
            <button type="submit">Send</button>
          </form>
        </div>
      </div>

      <footer className="app-footer">
        <p>© {new Date().getFullYear()} CHATTER BY FAB</p>
        <div className="social-links">
          <a href="https://www.linkedin.com/in/aditya-m-0bb92b110/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a href="https://x.com/AdityaMehto3" target="_blank" rel="noopener noreferrer">Twitter</a>
          <a href="https://github.com/aditya9575" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </footer>
    </div>
  );
}

export default App;


