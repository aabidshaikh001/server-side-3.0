import { ApiError } from "../apierror.js";
import { asynchandler } from "../asyncHandler.js";

const logout = asynchandler(async (req, res) => {
    try {
        // Define cookie options
        const cookiesOption = {
            httpOnly: true,  // Prevent client-side access to the cookie
            secure: process.env.NODE_ENV === 'production',  // Use secure cookies in production
            sameSite: 'strict',  // Help protect against CSRF attacks
        };

        // Clear the cookie by setting it to an empty string and setting the expiration
        return res.cookie('token', '', { ...cookiesOption, expires: new Date(0) }).status(200).json({
            message: "Logged out successfully",  // Improved message for clarity
            success: true,
        });
    } catch (error) {
        console.error("Error during logout:", error); // Log the error for debugging
        throw new ApiError(500, error.message || "Internal Server Error"); // Ensure a meaningful error message
    }
});

export default logout;
