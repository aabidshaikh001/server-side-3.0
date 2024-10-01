// server.js
import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import getuserDetailsfromtoken from '../helper/getuserDetails.js';
import { User } from '../modal/user.modal.js';
import { Conversation, Message } from '../modal/conversation.modal.js';
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['PORT', 'DATABASE_URL']; // Add more as needed
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    throw new Error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
}

const app = express();

// CORS Middleware for express
app.use(cors({
    origin: 'https://client-side-2-0.vercel.app',
    credentials: true,
}));

// Create HTTP server and Socket.io server
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'https://client-side-2-0.vercel.app',
        credentials: true,
    },
});

// Track online users
const onlineUsers = new Set();

// Centralized error handling middleware
const handleError = (socket, errorMessage) => {
    console.error(errorMessage);
    socket.emit('error', errorMessage);
};

// Socket.io connection
io.on('connection', async (socket) => {
    console.log("User connected:", socket.id);

    try {
        const token = socket.handshake.auth.token;
        const user = await getuserDetailsfromtoken(token);
        if (!user) {
            return handleError(socket, 'Invalid token or user not found');
        }

        // Create a room for the user and track them online
        socket.join(user._id.toString());
        onlineUsers.add(user._id.toString());

        // Emit updated online user list
        io.emit('onlineUser', Array.from(onlineUsers));

        // Handle message page requests
        socket.on('message-page', async (userId) => {
            try {
                const userDetails = await User.findById(userId).select("-password").lean();
                const payload = {
                    _id: userDetails?._id,
                    name: userDetails?.name,
                    email: userDetails?.email,
                    online: onlineUsers.has(userId),
                    profilePic: userDetails?.profilePic,
                };
                socket.emit('message-user', payload);

                let conversation = await Conversation.findOne({
                    "$or": [
                        { sender: user._id, receiver: userId },
                        { sender: userId, receiver: user._id },
                    ]
                }).populate('message').sort({ updatedAt: -1 }).lean();

                if (conversation) {
                    socket.emit('message', conversation.message);
                } else {
                    const newConversation = new Conversation({
                        sender: user._id,
                        receiver: userId,
                    });
                    await newConversation.save();
                    socket.emit('message', []);  // No previous messages
                }
            } catch (error) {
                handleError(socket, 'Unable to load messages.');
            }
        });

        // Handle new message events
        socket.on('new message', async (data) => {
            try {
                let conversation = await Conversation.findOne({
                    "$or": [
                        { sender: data.sender, receiver: data.receiver },
                        { sender: data.receiver, receiver: data.sender },
                    ],
                });

                if (!conversation) {
                    conversation = await new Conversation({
                        sender: data.sender,
                        receiver: data.receiver,
                    }).save();
                }

                const message = new Message({
                    text: data.text,
                    imageUrl: data.imageUrl,
                    videoUrl: data.videoUrl,
                    msgByuserId: data.msgByuserId,
                });
                const savedMessage = await message.save();

                await Conversation.updateOne(
                    { _id: conversation._id },
                    { "$push": { message: savedMessage._id } }
                );

                const updatedConversation = await Conversation.findOne({
                    "$or": [
                        { sender: data.sender, receiver: data.receiver },
                        { sender: data.receiver, receiver: data.sender },
                    ],
                }).populate('message').sort({ updatedAt: -1 }).lean();

                io.to(data.sender).emit('message', updatedConversation.message || []);
                io.to(data.receiver).emit('message', updatedConversation.message || []);
            } catch (error) {
                handleError(socket, 'Unable to send message.');
            }
        });

        socket.on('disconnect', () => {
            onlineUsers.delete(user._id.toString());
            console.log('User disconnected:', socket.id);
        });

    } catch (error) {
        handleError(socket, 'Invalid token or user.');
    }
});

// Start the server
const PORT = process.env.PORT || 3000; // Default port for local development
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
const shutdown = () => {
    console.log('Shutting down server...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export { app, server };
