const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

// Connect to MongoDB locally on your Mac
mongoose.connect('mongodb://localhost:27017/sssnappy-chat')
    .then(() => console.log('Successfully connected to MongoDB!'))
    .catch((error) => console.error('MongoDB connection error:', error));

// Create an inline database message schema model structure
const Message = mongoose.model('Message', new mongoose.Schema({
    text: { type: String, required: true },
    time: { type: String, required: true },
    senderId: { type: String, required: true }
}, { timestamps: true }));

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Fetch old messages history from MongoDB database dump
    try {
        const previousMessages = await Message.find().sort({ createdAt: 1 });
        socket.emit('load_messages', previousMessages);
    } catch (error) {
        console.error("Error fetching message history:", error);
    }

    // Intercept and save chat text streams live
    socket.on('send_message', async (data) => {
        try {
            const newMessage = new Message({
                text: data.text,
                time: data.time,
                senderId: data.senderId
            });
            await newMessage.save();

            // Broadcast message live out to other active windows
            socket.broadcast.emit('receive_message', data);
        } catch (error) {
            console.error("Error saving message context to database:", error);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Port configured to 5001 to completely clear out AirPlay service lanes
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
