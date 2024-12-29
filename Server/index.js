const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "https://chatterfrontend.vercel.app/",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());

// Store all users (both online and offline)
const users = new Map(); // Map<socketId, {username, status}>
const userStatuses = new Map(); // Map<username, status>

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('login', (username) => {
    users.set(socket.id, { username, status: 'online' });
    userStatuses.set(username, 'online');
    
    // Emit updated user list with all users and their statuses
    io.emit('userList', Array.from(userStatuses.entries()).map(([username, status]) => ({
      username,
      status
    })));

    io.emit('message', {
      type: 'notification',
      text: `${username} joined the chat`,
      timestamp: new Date()
    });
  });

  socket.on('sendMessage', (message) => {
    const user = users.get(socket.id);
    if (user) {
      io.emit('message', {
        type: 'message',
        username: user.username,
        text: message,
        timestamp: new Date()
      });
    }
  });

  socket.on('leaveChat', () => {
    const user = users.get(socket.id);
    if (user) {
      userStatuses.set(user.username, 'offline'); // Set status to offline
      io.emit('message', {
        type: 'notification',
        text: `${user.username} left the chat`,
        timestamp: new Date()
      });
      
      // Emit updated user list with the user now shown as offline
      io.emit('userList', Array.from(userStatuses.entries()).map(([username, status]) => ({
        username,
        status
      })));
      
      users.delete(socket.id);
      console.log('A user disconnected');

    }
  });

  socket.on('typing', () => {
    const user = users.get(socket.id);
    if (user) {
      socket.broadcast.emit('userTyping', user.username);
    }
  });

  socket.on('stopTyping', () => {
    const user = users.get(socket.id);
    if (user) {
      socket.broadcast.emit('userStoppedTyping', user.username);
    }
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      userStatuses.set(user.username, 'offline'); // Set status to offline
      users.delete(socket.id);
      
      // Emit updated user list with the user now shown as offline
      io.emit('userList', Array.from(userStatuses.entries()).map(([username, status]) => ({
        username,
        status
      })));

      io.emit('message', {
        type: 'notification',
        text: `${user.username} disconnected`,
        timestamp: new Date()
      });
    }
  });
});

app.get("/" , (req,res)=>{
    return res.send("This is chatter backend")
})

const PORT = process.env.PORT || 7000;
http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




