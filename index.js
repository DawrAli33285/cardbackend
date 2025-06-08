require('dotenv').config(); 

const express = require('express');
const http = require('http');
const cors = require('cors');
const {Server}=require('socket.io')
const cron = require('node-cron');
const mongoose = require('mongoose'); 
const { v4: uuidv4 } = require('uuid');
const axios=require('axios')

const matchRoutes=require('./routes/match/match')
const matchSettingsModel=require('./models/user/matchsettings')

const liveStreamRoutes=require('./routes/livestream/livestream')
const subscriptionRoutes=require('./routes/subscription/subscription')
const adminRoutes=require('./routes/admin/admin')
let users=[];
let messages=[];



require('./models/user/match');
require('./models/user/user');


const connection = require('./connection/connection');
const userAuthRoutes = require('./routes/user/auth');
const userProfileRoutes = require('./routes/user/profile');
const matchModel = require('./models/user/match');
const userModel = require('./models/user/user');
const chatModel = require('./models/user/chat');
const gameModel = require('./models/user/game');

const app = express();
const server = http.createServer(app);
const io = new Server(server,{
  cors:{
    methods:['POST','GET'],
    origin:'*'
  }
});


io.on('connection',(socket)=>{
  console.log(`User ${socket.id} connected`)

  socket.on('connectUser',(data)=>{
    let userData={
      email:data.email,
      socketId:socket.id,
      userName:data.userName
    }
  let alreadyExist=users.find(u=>u.socketId==socket.id)
if(alreadyExist){
  return;
}
    users=[...users,userData]
    io.emit('getUsers',users)
  })


  
 
  socket.on("getMatches", (data) => {
    
    
    let activeMatches = users.filter(user => 
        user?.matchAgainst && 
        user?.liveStreamRoomId && 
        user?.accepted === true &&
        user?.matchAgainst?.accepted === true
    );
    
    
    let uniqueMatches = [];
    let processedRoomIds = new Set();
    
    activeMatches.forEach(match => {
        if (!processedRoomIds.has(match.liveStreamRoomId)) {
            uniqueMatches.push(match);
            processedRoomIds.add(match.liveStreamRoomId);
        }
    });
    
   
    io.emit('getMatches',uniqueMatches);
});

socket.on('findMatch',async(data)=>{
let matchSettings=await matchSettingsModel.findOne({})
  const existingUserIndex = users.findIndex(u => u.socketId === socket.id);
let game=await gameModel.findOne({name:data.tch})
 let currentUserData={ 
  rank:data?.rank,
  tch:data.tch,
  cancelled:data.cancelled,
  userName:data?.userName,
  avatar:data?.avatar,
  mode:data.mode,
  socketId:socket.id,
  email:data.email,
  rejectedBy:[],
  image:game.image
}


if (data?.cancelled === false) {

  if (existingUserIndex >= 0) {
    users.splice(existingUserIndex, 1);
  }
  

  users.unshift(currentUserData);
  
  console.log(`User ${currentUserData.userName} moved to priority position`);
} else {
  if (existingUserIndex >= 0) {
    users[existingUserIndex] = currentUserData;
  } else {
    users.push(currentUserData);
  }
}
  let validRank=data?.rank+matchSettings?.matchmakingCriteria


const isCasualMode = data.mode === "Casual";


const validOpponents = users.filter(u => {
  const isSameUser = u.socketId === socket.id;
  const wasRejected = u.rejectedBy?.some(r => r.socketId === socket.id);
  const sameMode = u.mode === data.mode;
  const matchAgainst=u?.matchAgainst

  if (isCasualMode) {
    return sameMode &&
           !isSameUser && 
           !wasRejected &&
           !matchAgainst
           ;
  }
  
 
  return sameMode && 
         u.rank >= 0 &&
         u.rank <= validRank &&
         u.tch === data.tch &&
         !isSameUser &&
         !matchAgainst &&
         !wasRejected;
});


let findOpponentIndex = -1;

if (validOpponents.length > 0) {
  const randomIndex = Math.floor(Math.random() * validOpponents.length);
  const randomOpponent = validOpponents[randomIndex];
  findOpponentIndex = users.findIndex(u => u.socketId === randomOpponent.socketId);
}


  if(findOpponentIndex>=0){
    const findOpponent = {
      ...users[findOpponentIndex],
      matchAgainst: {
        socketId: socket.id,
        email: data.email,
        userName:data.userName
      }
    };

    const updatedCurrentUser = {
      ...currentUserData,
      matchAgainst: {
        socketId: findOpponent.socketId,
        email: findOpponent.email,
        userName:findOpponent.userName
      }
    };

    users = users.map(user => {
      if (user.socketId === socket.id) return updatedCurrentUser;
      if (user.socketId === findOpponent.socketId) return findOpponent;
      return user;
    });

  let userIndex=users.find(u=>u.socketId==socket.id)
  
 

  io.to(findOpponent?.socketId).emit("findMatch",currentUserData)
  io.to(socket.id).emit("findMatch",findOpponent)
}
 
})
socket.on("startMatch", async() => {
  const currentUserIndex = users.findIndex(u => u.socketId === socket.id);
  
  if (currentUserIndex === -1) return

  let updatedUser = {
    ...users[currentUserIndex],
    accepted: true
  };


  if (users[currentUserIndex]?.liveStreamRoomId) {
  
    delete updatedUser.liveStreamRoomId;
  }

  const opponentIndex = users.findIndex(u => 
    u.socketId === updatedUser.matchAgainst?.socketId
  );

  if (opponentIndex === -1) {
    return console.error('Opponent not found');
  }

  let opponent = { ...users[opponentIndex] };


  if (opponent?.liveStreamRoomId) {

    delete opponent.liveStreamRoomId;
  }


  if (opponent?.roomId) {
    updatedUser = {
      ...updatedUser,
      roomId: opponent?.roomId
    };
    socket.join(opponent?.roomId);
  } else {
    let roomId = uuidv4();
    updatedUser = {
      ...updatedUser,
      roomId: roomId
    };
    socket.join(roomId);
  }

  


  users[currentUserIndex] = updatedUser;


  if (updatedUser?.accepted && opponent?.accepted) {
   
    if (updatedUser?.liveStreamRoomId || opponent?.liveStreamRoomId) {
     
      
      
      const existingRoomId = updatedUser?.liveStreamRoomId || opponent?.liveStreamRoomId;
      
     
      users[currentUserIndex] = {
        ...users[currentUserIndex],
        liveStreamRoomId: existingRoomId
      };
      
      users[opponentIndex] = {
        ...users[opponentIndex],  
        liveStreamRoomId: existingRoomId
      };

     
      io.to(opponent.socketId).emit("startMatch", {
        connUserId: socket.id,
        liveStreamRoomId: existingRoomId
      });

      io.emit("getMatches");
      return;
    }

   
    
    const url = 'https://api.100ms.live/v2/rooms';
    const body = {
      "name": `Match-${updatedUser?.userName}-vs-${opponent?.userName}`,
      "description": `Live match between ${updatedUser?.userName} and ${opponent?.userName}`,
      "template_id": "6831ed6a100d25e5fea481dd",
      "large_room": true
    };
    
    const config = {
      headers: {
        'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NDgzNTQ4MTQsImV4cCI6MTc0OTU2NDQxNCwianRpIjoiZGJiMzg3ZjAtOWY1Yi00MzI4LThjM2ItN2ZlZTZhYmI1ZjViIiwidHlwZSI6Im1hbmFnZW1lbnQiLCJ2ZXJzaW9uIjoyLCJuYmYiOjE3NDgzNTQ4MTQsImFjY2Vzc19rZXkiOiI2ODMxZWQxZTE0NWNiNGU4NDQ5YWY4MzAifQ.mWaOXUuhUocHESLX9mA3fT0D6qqmemQF3kYyZL7K4JA',
        'Content-Type': 'application/json'
      }
    };

    try {
      const response = await axios.post(url, body, config);
      const liveStreamRoomId = response.data.id;
      
     
      
    
      users[currentUserIndex] = {
        ...users[currentUserIndex],
        liveStreamRoomId: liveStreamRoomId
      };
      
      users[opponentIndex] = {
        ...users[opponentIndex],  
        liveStreamRoomId: liveStreamRoomId
      };

   
   
      io.to(opponent.socketId).emit("startMatch", {
        connUserId: socket.id,
        liveStreamRoomId: liveStreamRoomId
      });

     
      socket.emit("startMatch", {
        connUserId: opponent.socketId,
        liveStreamRoomId: liveStreamRoomId
      });

      io.emit("getMatches");
      io.emit('getUsers',users)
    } catch (error) {
      console.error("Error creating livestream room:", error);
    }
  }
});

socket.on("liveStream",(data)=>{
  let playerOne=users.find(u=>u?.socketId==data)

 socket.join(playerOne?.roomId)
  io.to(playerOne?.roomId).emit("liveStream",{roomId:playerOne?.roomId,userName:data.userName})

})


socket.on("lobby_countdown_timer",(data)=>{
  io.emit("lobby_countdown_timer",data)
})

socket.on("shareToken",(data)=>{
  let user=users.find(u=>u?.email==data.email)
  io.to(user?.matchAgainst?.socketId).emit("shareToken",{authToken:data?.authToken})
})

socket.on("addUserAsSpectator",(data)=>{
  let userIndex=users.findIndex(u=>u?.socketId==socket.id)
  let playerOne=users.find(u=>u.socketId==data)
  users[userIndex]={
...users[userIndex],
roomId:playerOne.roomId,
spectator:true
  }
})

socket.on("conn-init",(data)=>{
  let user=users.find(u=>u.socketId==data.connUserId)

let newdata={
  connUserId:socket.id,
  liveStreamRoomId:user?.liveStreamRoomId
}

io.to(data.connUserId).emit("conn-init",newdata)


})




socket.on("sendMessage",async(data)=>{
  console.log("sendMessage")
  console.log(users)

  let user=users.find(u=>u?.email==data?.email)
 

let match=await matchModel.findOne({roomId:user.roomId})
let validUser=await userModel.findOne({userName:user.userName})

console.log("match Found on sendMessage")
console.log(match)

console.log("valid User Found")
console.log(validUser)

let matchSettings=await matchSettingsModel.findOne({})
console.log("match Settings")
console.log(matchSettings)
let flagged=false;
if(matchSettings.enable_automatic_filtering){
  let foundWord=matchSettings.blocked_words.filter(u=>u.toLowerCase()?.includes(data.message?.toLowerCase()))
  if(foundWord?.length>0){
    flagged=true
  let userFound=await userModel.findOne({_id:data._id})
  let prevWarnings=userFound.warnings
  let warnings=Number(userFound.warnings)+1
    await userModel.findByIdAndUpdate(data._id,{
$set:{
  warnings,
  status:"Muted",
  mutedOn:Date.now(),
  prevWarnings
}
    })
  }
}
let newdata={
  message:data.message,
  socketId:user?.socketId||socket.id,
  roomId:user?.roomId,    
  by:user?.userName,
  spectator:false,
  flagged,
  match:match?._id
}
let chatmodelresult=await chatModel.create({
  match:match?._id,
 by:validUser?._id ,
 spectator:false,
 flagged,
  message:data.message
})
newdata={
  ...newdata,
  _id:chatmodelresult._id
}
messages.push(newdata)

if(flagged){
  newdata.message="This message has been deleted"
  io.to(user.socketId).emit("handleUserStatus",{status:"Muted"})
}

io.to(user.roomId).emit("sendMessage",newdata)
io.emit('getUsers',users)
io.emit("getChats",messages)
})


socket.on("manualMatch",async(data)=>{
 
  
  const existingUserIndex = users.findIndex(u => u.userName === data.player1);



let findOpponentIndex = users.findIndex(u=>u.userName==data.player2);




  if(findOpponentIndex>=0){
   

    const url = 'https://api.100ms.live/v2/rooms';
    const body = {
      "name": `Match-${users[existingUserIndex]?.userName}-vs-${users[findOpponentIndex]?.userName}`,
      "description": `Live match between ${users[existingUserIndex]?.userName} and ${users[findOpponentIndex]?.userName}`,
      "template_id": "6831ed6a100d25e5fea481dd",
      "large_room": true
    };
    
    const config = {
      headers: {
        'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NDgzNTQ4MTQsImV4cCI6MTc0OTU2NDQxNCwianRpIjoiZGJiMzg3ZjAtOWY1Yi00MzI4LThjM2ItN2ZlZTZhYmI1ZjViIiwidHlwZSI6Im1hbmFnZW1lbnQiLCJ2ZXJzaW9uIjoyLCJuYmYiOjE3NDgzNTQ4MTQsImFjY2Vzc19rZXkiOiI2ODMxZWQxZTE0NWNiNGU4NDQ5YWY4MzAifQ.mWaOXUuhUocHESLX9mA3fT0D6qqmemQF3kYyZL7K4JA',
        'Content-Type': 'application/json'
      }
    };


    const response = await axios.post(url, body, config);
    const liveStreamRoomId = response.data.id;
    



   
    
    const matchRoomId  = uuidv4();
   
    const findOpponent = {
      ...users[findOpponentIndex],
      accepted:true,
      liveStreamRoomId,
      roomId:matchRoomId,
      matchAgainst: {
        socketId: users[existingUserIndex].socketId,
        email: users[existingUserIndex].email,
        userName:users[existingUserIndex].userName,
        accepted:true,
        roomId:matchRoomId,
      }
    };

    const updatedCurrentUser = {
      ...users[existingUserIndex],
      accepted:true,
      liveStreamRoomId,
      roomId:matchRoomId,
      matchAgainst: {
        socketId: users[findOpponentIndex].socketId,
        email: users[findOpponentIndex].email,
        userName:users[findOpponentIndex].userName,
        accepted:true,
        roomId:matchRoomId,
      }
    };

    users[findOpponentIndex]=findOpponent
    users[existingUserIndex]=updatedCurrentUser
socket.join(matchRoomId)
  io.to(users[findOpponentIndex].socketId).emit("manualMatch",users[existingUserIndex])
  io.to(users[existingUserIndex].socketId).emit("manualMatch",users[findOpponentIndex])
  io.emit('getUsers',users)
  
  
}
 
     
  
  
})


socket.on("manualOpponentRoomJoin",(data)=>{
  socket.join(data)
})

socket.on("sendSpectatorMessage", async (data) => {
  let user = users.find(u => u?.socketId == data?.socketId);

  let matchSettings = await matchSettingsModel.findOne({});
  let flagged = false;
  
  if (matchSettings.enable_automatic_filtering) {
    let foundWord = matchSettings.blocked_words.filter(u => u.toLowerCase()?.includes(data.message?.toLowerCase()));
    if (foundWord?.length > 0) {
      flagged = true;
      let userFound = await userModel.findOne({ _id: data._id });
      let prevWarnings = userFound.warnings;
      let warnings = Number(userFound.warnings) + 1;
      await userModel.findByIdAndUpdate(data._id, {
        $set: {
          warnings,
          status: "Muted",
          mutedOn: Date.now(),
          prevWarnings
        }
      });
    }
  }
  
  let match = await matchModel.findOne({ roomId: user.roomId });

  
  let validUser = await userModel.findOne({ userName: data.userName });
  
  let chatmodelresult=await chatModel.create({
    match: match._id,
    by: validUser?._id,
    spectator: true,
    flagged,  
    message: data.message
  });

  let newdata = {
    message: data.message,
    socketId: user.socketId,
    by: data?.userName ? data?.userName : 'Spectator',
    spectator: true,
    flagged, 
    match: match?._id,
      _id:chatmodelresult._id
    
  };

  messages.push(newdata);
  
  if (flagged) {
    newdata.message = "This message has been deleted";
    io.to(user.socketId).emit("handleUserStatus",{status:"Muted"})
  }
  
  io.to(user.roomId).emit("sendSpectatorMessage", newdata);
  io.emit("getChats", messages);
});
socket.on("newGame",(data)=>{
  io.emit("newGame",data)
})

socket.on("updatedSpectatorInteractionControls",(data)=>{
  io.emit("updatedSpectatorInteractionControls",data)
})

socket.on("handleWarning",(data)=>{
  let isUserAvaiable=users.findIndex(u=>u.email==data)
  if(isUserAvaiable===-1)return
  io.to(users[isUserAvaiable].socketId).emit("handleWarning")
})

socket.on("handleUserStatus",(data)=>{
  let userIndex=users.findIndex(u=>u?.email==data.email)
  if(userIndex===-1)return
  io.to(users[userIndex].socketId).emit("handleUserStatus",data)
})

socket.on("updatedMatchSettings",(data)=>{
  io.emit("updatedMatchSettings",data)
})

socket.on("deleteGame",(data)=>{
  io.emit("deleteGame",data)
})

socket.on("updateGameStatus",(data)=>{
  io.emit("updateGameStatus",data)
})
socket.on("matchQue",(data)=>{{
  let matchFoundAgainstIndex=users.findIndex(u=>u.userName==data.username)
let currentUserIndex=users.findIndex(u=>u?.socketId==socket.id)

users[currentUserIndex]={
  ...users[currentUserIndex],
  matchAgainst:{...users[currentUserIndex]?.matchAgainst,accepted:false}
}


}})

socket.on("acceptMatch",(data)=>{

  let matchFoundAgainst=users.find(u=>u.userName==data.username)

  let currentUserIndex=users.findIndex(u=>u?.socketId==socket.id)
  
  let currentUser={
    ...users[currentUserIndex],
    matchAgainst:{...users[currentUserIndex]?.matchAgainst,accepted:true}
  }
  users[currentUserIndex]=currentUser
if(users[currentUserIndex]?.liveStreamRoomId){
  delete users[currentUserIndex]?.liveStreamRoomId
}
 
if(matchFoundAgainst?.matchAgainst?.accepted==true && currentUser?.matchAgainst?.accepted==true){
  io.to(matchFoundAgainst?.socketId).emit("acceptedByBothPlayers")
  io.to(currentUser?.socketId).emit("acceptedByBothPlayers")
}
})



socket.on("getChats",()=>{
  io.emit("getChats",messages)
})

socket.on("findOpponent",()=>{
 
  let user=users.find(u=>u.socketId==socket.id)
  let opponent=users?.find(u=>u?.socketId==user?.matchAgainst?.socketId)
  let secondOpponent=users?.find(u=>u?.matchAgainst?.socketId==user?.socketId)
  let data={
    opponent,
    roomId:secondOpponent?.roomId?secondOpponent.roomId:opponent?.roomId
  }
  if(!opponent){
return;
  }
  io.to(socket.id).emit("findOpponent",data)
})

socket.on("clearMatchQue", (data) => {
 
  let currentUserIndex = users.findIndex(u => u?.socketId === socket.id);
  let matchAgainstUserIndex=users.findIndex(u=>u?.matchAgainst?.socketId==socket.id)

  if (currentUserIndex !== -1) {
     
      if (users[currentUserIndex]?.matchAgainst) {
        socket.leave(users[currentUserIndex]?.roomId)
          delete users[currentUserIndex]?.matchAgainst;
          delete users[currentUserIndex]?.roomId
      }
      
      if(matchAgainstUserIndex!==-1){
        socket.leave(users[matchAgainstUserIndex]?.roomId)
        delete users[matchAgainstUserIndex]?.matchAgainst
        delete users[matchAgainstUserIndex]?.roomId
        
        io.to(users[matchAgainstUserIndex]?.socketId).emit("resetOpponent")
      }
  } else {
      console.log(`User with socketId ${socket.id} not found`);
  }
});


socket.on("finishMatch",()=>{
  let userIndex=users.findIndex(u=>u.socketId==socket.id)
  io.to(users[userIndex].roomId).emit("finishMatch")
delete users[userIndex].accepted
delete users[userIndex].matchAgainst
delete users[userIndex].roomId
delete users[userIndex].liveStreamRoomId

})

socket.on("getUsers",()=>{
  io.to(socket.id).emit("getUsers",users)
})


socket.on('endMatch',()=>{
  let user=users.find(u=>u.socketId==socket.id)
  io.to(user?.matchAgainst.socketId).emit('endMatch')
})
socket.on('disconnect',()=>{
  let fileteredUsers=users.filter(u=>u.socketId!=socket.id)

  console.log(`User ${socket.id} disconnected`)
  let userThatDisconnected=users.find(u=>u.socketId==socket.id)


  if(userThatDisconnected?.roomId){
    socket.leave(userThatDisconnected?.roomId)
  }

 
  users=fileteredUsers

messages=messages.filter(u=>u?.by!=userThatDisconnected)

  io.emit("getMatches")
  io.emit('getUsers',users)
  io.emit("getChats",messages)
})
});




cron.schedule('*/5 * * * *', async () => {
  try {

     
    const matchSettings = await matchSettingsModel.findOne(); 
    if (!matchSettings || !matchSettings.duration) {
      console.log('⚠️ No match settings found or duration not set');
      return;
    }
    
    const muteDurationMinutes = matchSettings.duration;
    const currentTime = new Date();
    

    const cutoffTime = new Date(currentTime.getTime() - (muteDurationMinutes * 60 * 1000));
   
    
    
    const mutedUsers = await userModel.find({
      status: 'MUTED',
      mutedOn: { $lte: cutoffTime } 
    });
    
    if (mutedUsers.length === 0) {
      console.log('✅ No users found to unmute');
      return;
    }
    
    console.log(`🔓 Found ${mutedUsers.length} users to unmute`);
    
  
    const unmutedUsers = await userModel.updateMany(
      {
        status: 'MUTED',
        mutedOn: { $lte: cutoffTime }
      },
      {
        $set: {
          status: 'ACTIVE'
        },
        $unset: {
          mutedOn: 1 
        }
      }
    );
    

    mutedUsers.forEach(user => {
      const mutedDuration = Math.floor((currentTime - new Date(user.mutedOn)) / (1000 * 60));
      console.log(`🔓 Unmuted user: ${user.userName} (${user.email}) - Was muted for ${mutedDuration} minutes`);
    });
    
  } catch (error) {
    console.error('❌ Error in auto-unmute cron job:', error);
  }
});



// Middleware setup
app.use(cors()); 
app.use(express.json({
  verify: (req, res, buffer) => {
    req['rawBody'] = buffer; 
  }
}));

// Routes
app.use(userAuthRoutes);
app.use(subscriptionRoutes)
app.use(userProfileRoutes);
app.use(liveStreamRoutes)
app.use(adminRoutes)
app.use(matchRoutes)
// Mongoose connection
connection
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => console.error('MongoDB Connection Failed:', err));

// Start the server 
const PORT = process.env.PORT || 5000; 
server.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});


