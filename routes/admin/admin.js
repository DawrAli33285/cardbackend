const router=require('express').Router();

const {getUserProfiles,createAnnouncements,getAnnouncements,getUser,getUsers,getSpectatorChats,getAllChats,updateMatchSettings,getChats,updateMatchDispute,createMatchDispute,getmatchDisputes,deleteGame,getMatchSettings,updateGame,getGames,updateUser,createGame}=require('../../controller/admin/admin')
const imageMiddleware=require('../../middleware/image')


router.get('/getUserProfiles',getUserProfiles)
router.get('/getUser/:userId',getUser)
router.patch('/updateUser/:userId',updateUser)
router.post('/create-game',imageMiddleware.single('image'),createGame)
router.get('/get-games',getGames)
router.patch('/updateGame/:id',updateGame)
router.delete('/deleteGame/:id',deleteGame)
router.get('/getMatchSettings',getMatchSettings)
router.patch('/updateMatchSettings',updateMatchSettings)
router.get('/get-matchDisputes',getmatchDisputes)
router.post('/create-matchDisputes',createMatchDispute)
router.patch('/update-matchDispute/:id',updateMatchDispute)
router.get('/get-chats',getChats)
router.get('/getSpectatorChats',getSpectatorChats)
router.get('/getUsers',getUsers)
router.get('/getallchatlogs',getAllChats)
router.post('/create-announcements',createAnnouncements)
router.get('/get-announcements',getAnnouncements)

module.exports=router;