const router=require('express').Router();

const {createMatch,updateMatch,getGames}=require('../../controller/match/match')

router.post('/createMatch',createMatch)
router.patch('/update-Match/:roomId',updateMatch)
router.get('/get-activegames',getGames)

module.exports=router;