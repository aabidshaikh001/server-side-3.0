import { ApiError } from "../apierror.js";
import { User } from "../modal/user.modal.js";
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

async function checkPassword(req, res) {
    try {
        const { password, userId } = req.body;

        // Check if userId is provided and valid
        if (!userId) {
            return res.status(400).json(new ApiError("User ID is required"));
        }

        // Fetch user by userId
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(new ApiError("User not found"));
        }

        // Verify password
        const verifyPassword = await bcryptjs.compare(password, user.password);
        if (!verifyPassword) {
            return res.status(400).json(new ApiError("Incorrect password"));
        }

        // Create token data
        const tokenData = {
            id: user._id,
            email: user.email
        };

        // Sign JWT token
        const token = jwt.sign(tokenData, process.env.JWT_SECRET_KEY, { expiresIn: '1d' });

        // Cookie options (secure for production)
        const cookiesOption = {
            httpOnly: true,  // Prevent client-side access
            secure: process.env.NODE_ENV === 'production',  // Secure only in production (HTTPS)
            sameSite: 'strict' // Enhance security against CSRF
        };

        // Send token in cookie
        return res.cookie('token', token, cookiesOption).status(200).json({
            message: "Login successful",
            token: token,
            success: true
        });

    } catch (error) {
        // Handle errors and send proper response
        console.error("Error in checkPassword:", error); // Log the error for debugging
        return res.status(500).json(new ApiError("Server error", error.message || error));
    }
}

export default checkPassword;
