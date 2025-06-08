const {createSession,webhook}=require('../../controller/subscription/subscription')
const {auth}=require('../../middleware/auth')
const router=require('express').Router();

router.post('/create-session',auth,createSession)
router.post('/stripe-webhook',webhook)

module.exports=router;