//if this code is not working please try a code on destop
import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import { Client } from 'ssh2';  // Import SSH2
import getuserDetailsfromtoken from '../helper/getuserDetails.js';
import { User } from '../modal/user.modal.js';
import { Conversation, Message } from '../modal/conversation.modal.js';
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables
dotenv.config();

const app = express();

// CORS Middleware for express
app.use(cors({
    origin:'https://woopab.vercel.app',
    credentials: true,
}));

// Create HTTP server and Socket.io server
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin:'https://woopab.vercel.app',
        credentials: true,
    },
});

// Track online users
const onlineUser = new Set();

// Helper function to establish SSH connection
const executeSSHCommand = (command) => {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            console.log('SSH Client :: ready');
            conn.exec(command, (err, stream) => {
                if (err) return reject(err);
                let output = '';
                stream.on('close', (code, signal) => {
                    console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
                    conn.end();
                    resolve(output);
                }).on('data', (data) => {
                    output += data.toString();
                }).stderr.on('data', (data) => {
                    console.error('STDERR: ' + data);
                });
            });
        }).connect({
            host: 'your-remote-server.com',
            port: 22,
            username: 'your-username',
            privateKey: require('fs').readFileSync('/path/to/private-key.pem')
        });
    });
};

// Socket.io connection
io.on('connection', async (socket) => {
    console.log("User connected:", socket.id);

    try {
        const token = socket.handshake.auth.token;
        const user = await getuserDetailsfromtoken(token);
        if (!user) {
            console.log('Invalid token or user not found');
            return socket.disconnect();
        }

        socket.join(user?._id.toString());
        onlineUser.add(user?._id.toString());

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
                    socket.emit('message', []);
                }
            } catch (error) {
                console.error("Error on message-page:", error);
                socket.emit('error', 'Unable to load messages.');
            }
        });

        // Handle new message events with SSH integration
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

                // Execute an SSH command when a new message is sent
                const sshResult = await executeSSHCommand('echo "New message sent!"');
                console.log("SSH command output:", sshResult);

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
    console.log(`Server running on port ${PORT}`);
});

export { app, server };
