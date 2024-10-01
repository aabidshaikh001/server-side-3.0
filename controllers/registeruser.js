import { ApiError } from "../apierror.js";
import { Apiresponse } from "../apiresponse.js";
// import { asynchandler } from "../asyncHandler.js";
import { User } from "../modal/user.modal.js";
import bcryptjs from 'bcryptjs'
 
async function registerUser (req,res){
try {
    const {name, email, password, profilePic} = req.body
//check email
const checkEmail = await User.findOne({email})
console.log(email);

if (checkEmail) {
    throw new ApiError(400,"Already user Exist"||error)
}
//password into hashpasword
const salt = await bcryptjs.genSalt(10)
const hashpassword = await bcryptjs.hash(password,salt)
//all the details saved in db
const payload ={
    name,
    email,
    password:hashpassword,
    profilePic
} 
const user = new User(payload)
const userSave = await user.save() //deatils saved to db
return res.status(201).json(
    new Apiresponse(200, userSave, "user registerd succefully")
  )
  

} catch (error) {
   throw new ApiError(400,error.message || error)
}
}

export default registerUser