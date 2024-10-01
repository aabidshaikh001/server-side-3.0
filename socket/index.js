// server.js
import express from 'express';
import { Server } from 'socket.io';
import https from 'https';   // Use https instead of http
import fs from 'fs';         // To read SSL certificates
import getuserDetailsfromtoken from '../helper/getuserDetails.js';
import { User } from '../modal/user.modal.js';
import { Conversation, Message } from '../modal/conversation.modal.js';
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables
dotenv.config();

// Create the express app
const app = express();

// CORS Middleware for express
app.use(cors({
    origin: 'https://woopab.vercel.app',
    credentials: true,
}));

// SSL credentials (replace these paths with your actual certificate and key paths)
const sslOptions = {
    key: fs.readFileSync('/path/to/your/server.key'),   // Path to private key
    cert: fs.readFileSync('/path/to/your/server.cert'), // Path to SSL certificate
};

// Create HTTPS server
const server = https.createServer(sslOptions, app);

// Initialize Socket.io with HTTPS server
const io = new Server(server, {
    cors: {
        origin: 'https://woopab.vercel.app',
        credentials: true,
    },
});

// Track online users
const onlineUser = new Set();

// Socket.io connection
io.on('connection', async (socket) => {
    console.log("User connected:", socket.id);

    // Token validation and user retrieval
    try {
        const token = socket.handshake.auth.token;
        const user = await getuserDetailsfromtoken(token);
        if (!user) {
            console.log('Invalid token or user not found');
            return socket.disconnect();  // Disconnect if token is invalid
        }

        // Create a room for the user and track them online
        socket.join(user?._id.toString());
        onlineUser.add(user?._id.toString());

        // Emit updated online user list
        io.emit('onlineUser', Array.from(onlineUser));

        // Handle message page requests
        socket.on('message-page', async (userId) => {
            try {
                const userDetails = await User.findById(userId).select("-password");
                const payload = {
                    _id: userDetails?._id,
                    name: userDetails?.name,
                    email: userDetails?.email,
                    online: onlineUser.has(userId),
                    profilePic: userDetails?.profilePic,
                };
                socket.emit('message-user', payload);

                let getConversationMessage = await Conversation.findOne({
                    "$or": [
                        { sender: user?._id, receiver: userId },
                        { sender: userId, receiver: user?._id },
                    ]
                }).populate('message').sort({ updatedAt: -1 });

                if (getConversationMessage) {
                    socket.emit('message', getConversationMessage.message);
                } else {
                    const newConversation = new Conversation({
                        sender: user?._id,
                        receiver: userId,
                    });
                    await newConversation.save();
                    socket.emit('message', []);  // No previous messages
                }
            } catch (error) {
                console.error("Error on message-page:", error);
                socket.emit('error', 'Unable to load messages.');
            }
        });

        // Handle new message events
        socket.on('new message', async (data) => {
            try {
                let conversation = await Conversation.findOne({
                    "$or": [
                        { sender: data?.sender, receiver: data?.receiver },
                        { sender: data?.receiver, receiver: data?.sender },
                    ],
                });

                if (!conversation) {
                    const createConversation = new Conversation({
                        sender: data?.sender,
                        receiver: data?.receiver,
                    });
                    conversation = await createConversation.save();
                }

                const message = new Message({
                    text: data.text,
                    imageUrl: data.imageUrl,
                    videoUrl: data.videoUrl,
                    msgByuserId: data?.msgByuserId,
                });
                const saveMessage = await message.save();

                await Conversation.updateOne(
                    { _id: conversation?._id },
                    { "$push": { message: saveMessage?._id } }
                );

                const getConversationMessage = await Conversation.findOne({
                    "$or": [
                        { sender: data?.sender, receiver: data?.receiver },
                        { sender: data?.receiver, receiver: data?.sender },
                    ],
                }).populate('message').sort({ updatedAt: -1 });

                io.to(data?.sender).emit('message', getConversationMessage?.message || []);
                io.to(data?.receiver).emit('message', getConversationMessage?.message || []);
            } catch (error) {
                console.error("Error sending message:", error);
                socket.emit('error', 'Unable to send message.');
            }
        });

        socket.on('disconnect', () => {
            onlineUser.delete(user?._id?.toString());
            console.log('User disconnected:', socket.id);
        });

    } catch (error) {
        console.error("Error during socket connection:", error);
        socket.emit('error', 'Invalid token or user.');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on https://localhost:${PORT}`);
});

export { app, server };
