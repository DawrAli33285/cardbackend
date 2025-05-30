const router=require('express').Router();
const {register,login}=require('../../controller/user/auth/auth')
const multerMiddleWare=require('../../middleware/image')
router.post('/register',register)
router.post('/login',login)


module.exports=router;