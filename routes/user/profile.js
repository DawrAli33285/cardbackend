const { auth } = require('../../middleware/auth');
const {updateProfile,updateAvatar,deleteUser,getProfile}=require('../../controller/user/profile/profile')
const router=require('express').Router();
const multerMiddleWare=require('../../middleware/image')
router.patch('/updateProfile',auth,updateProfile)
router.patch('/updateAvatar',multerMiddleWare.single('avatar'),auth,updateAvatar)
router.delete('/deleteUser',auth,deleteUser)
router.get('/getProfile',auth,getProfile)
module.exports=router;