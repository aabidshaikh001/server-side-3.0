import { ApiError } from "../apierror.js";
import { asynchandler } from "../asyncHandler.js";
import getuserDetailsfromtoken from "../helper/getuserDetails.js";
import { User } from "../modal/user.modal.js";

const updateuserdetails = asynchandler(async(req,res)=>{
    try {
        const token = req.cookies.token || ""
        const user = await getuserDetailsfromtoken(token)
        const {name, profilePic} = req.body
        const updateUser = await User.updateOne({_id : user._id},{name,
            profilePic
        })
        const userInformation = await User.findById(user._id)
        return res.status(200).json({
            message:'user update success',
            data:userInformation,
            success:true
        })
    } catch (error) {
        throw new ApiError(500,error)
    }
})

export default updateuserdetails