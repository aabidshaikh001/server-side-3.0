import { ApiError } from "../apierror.js";
import { Apiresponse } from "../apiresponse.js";
import { asynchandler } from "../asyncHandler.js"
import getuserDetailsfromtoken from "../helper/getuserDetails.js";
const userDetails = asynchandler(async(req,res)=>{
    try {
        const token =  req.cookies.token || ""
        const user = await getuserDetailsfromtoken(token)
        return res.status(200).json(
         {  message:"user details",
           data:user}
        )
    } catch (error) {
       return res.status(500).json({
        message: error,
        error:true
       })
    }
})
export default userDetails