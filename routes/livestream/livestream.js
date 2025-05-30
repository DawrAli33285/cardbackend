const router=require('express').Router();
const {getRoomCodes,getCodeAndToken,getRoomToken}=require('../../controller/livestream/livestream')

router.get('/room-codes/rooms/:id',getRoomCodes)
router.post('/room-token',getRoomToken)
router.get('/getCodeAndToken/:id/:roleName',getCodeAndToken)

module.exports=router;