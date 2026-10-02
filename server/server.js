const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 

// Connect to MongoDB locally on your Mac
mongoose.connect('mongodb://localhost:27017/sssnappy-chat')
    .then(() => console.log('Successfully connected to MongoDB!'))
    .catch((error) => console.error('MongoDB connection error:', error));

// 1. Message Data Schema Layout with tracked usernames
const Message = mongoose.model('Message', new mongoose.Schema({
    text: { type: String, required: true },
    time: { type: String, required: true },
    senderId: { type: String, required: true },
    username: { type: String, default: "Anonymous" } 
}, { timestamps: true }));

// 2. User Authentication Profile Schema 
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true }
}, { timestamps: true }));

const app = express();
app.use(cors());
app.use(express.json()); // Essential to read incoming registration form fields

// --- HTTP API AUTHENTICATION ROUTERS ---

// A. USER REGISTRATION ENDPOINT ROUTE
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(400).json({ message: "Username is already taken" });
        }

        // Encrypt the password securely before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Server error during registration", error });
    }
});

// B. USER LOGIN ENDPOINT ROUTE
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: "Invalid username or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid username or password" });
        }

        res.status(200).json({ message: "Login successful!", username: user.username });
    } catch (error) {
        res.status(500).json({ message: "Server error during login", error });
    }
});

// --- SOCKET.IO STREAM TUNNEL ROUTER ENGINE ---
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.id}`);

    try {
        const previousMessages = await Message.find().sort({ createdAt: 1 });
        socket.emit('load_messages', previousMessages);
    } catch (error) {
        console.error("Error fetching message history:", error);
    }

    socket.on('send_message', async (data) => {
        try {
            const newMessage = new Message({
                text: data.text,
                time: data.time,
                senderId: data.senderId,
                username: data.username 
            });
            await newMessage.save();

            socket.broadcast.emit('receive_message', data);
        } catch (error) {
            console.error("Error saving message context to database:", error);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
