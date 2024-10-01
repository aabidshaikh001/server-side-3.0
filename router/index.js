import express,{Router} from 'express'
import registerUser from '../controllers/registeruser.js'
import checkEmail from '../controllers/checkemail.js'
import checkPassword from '../controllers/passwordcheck.js'
import userDetails from '../controllers/userdetails.js'
import logout from '../controllers/logout.js'
import updateuserdetails from '../controllers/updateuserdetails.js'
import searchUser from '../controllers/Searchcontroller.js'
const router = Router()
//creating user APi
router.post('/register',registerUser)
//check user email for login
router.post('/email',checkEmail)
//check user password for login
router.post('/password',checkPassword)
//check login user details
router.get('/user-details',userDetails)
//logout
router.get('/logout',logout)
//update user details
router.post('/update-user',updateuserdetails)
//search user
router.post('/search-user',searchUser)


export default router