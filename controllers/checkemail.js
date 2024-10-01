import { ApiError } from "../apierror.js";
import { Apiresponse } from "../apiresponse.js";
import { asynchandler } from "../asyncHandler.js"
import { User } from "../modal/user.modal.js";
//login part
const checkEmail = asynchandler(async(req,res)=>{
    try {
        const {email} = req.body
        const checkEmail = await User.findOne({email}).select("-password")
        if(!checkEmail){
            return res.status(400).json(
                new ApiError(401,"","user not exist")
            )
        }
        return res.status(200).json(
            new Apiresponse(200,checkEmail,"email verify")
        )
    } catch (error) {
        new ApiError(500,error || error.message)
    }
})
export default checkEmail