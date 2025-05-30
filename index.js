require('dotenv').config(); 

const express = require('express');
const http = require('http');
const cors = require('cors');
const {Server}=require('socket.io')
const mongoose = require('mongoose'); 
const { v4: uuidv4 } = require('uuid');
const axios=require('axios')

const liveStreamRoutes=require('./routes/livestream/livestream')
let users=[];



require('./models/user/match');
require('./models/user/user');


const connection = require('./connection/connection');
const userAuthRoutes = require('./routes/user/auth');
const userProfileRoutes = require('./routes/user/profile');

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
      socketId:socket.id
    }
  
    users=[...users,userData]

  })

  socket.on("getMatches",(data)=>{
   

    let matches=users.map((value,index,array)=>{
console.log("GET MATCHES USER")
      console.log(users)
   
      if(value?.matchAgainst){

  let uniqueMatches=array.filter(u=>u?.email!=value?.matchAgainst?.email && u?.liveStreamRoomId)
 
  io.to(socket.id).emit('getMatches',uniqueMatches)
      }else{  
        let emptyArray=[]
        io.to(socket.id).emit('getMatches',emptyArray)
      }
    })
  })

socket.on('findMatch',(data)=>{
  const existingUserIndex = users.findIndex(u => u.socketId === socket.id);

 let currentUserData={ 
  rank:data?.rank,
  tch:data.tch,
  userName:data?.userName,
  avatar:data?.avatar,
  mode:data.mode,
  socketId:socket.id,
  email:data.email,
  rejectedBy:[]
}


if (existingUserIndex >= 0) {
  users[existingUserIndex] = currentUserData;
} else {
  users.push(currentUserData);
}

  let validRank=data?.rank+3


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
  if (currentUserIndex === -1) return;


  let updatedUser = {
    ...users[currentUserIndex],
    accepted: true
  };
  
  if(users[currentUserIndex]?.liveStreamRoomId){
    delete users[currentUserIndex]?.liveStreamRoomId
  }

 
  const opponent = users.find(u => 
    u.socketId === updatedUser.matchAgainst?.socketId
  );

  if (!opponent) {
    return console.error('Opponent not found');
  }
 
  if(opponent?.roomId){
updatedUser={
  ...updatedUser,
  roomId:opponent?.roomId
}
socket.join(opponent?.roomId)
  }else{
    let roomId = uuidv4();
    updatedUser={
      ...updatedUser,
      roomId:roomId
    }
    socket.join(roomId)
  }

  users[currentUserIndex] = updatedUser;
  if (updatedUser?.accepted && opponent?.accepted) {
    const url = 'https://api.100ms.live/v2/rooms';
    const body = {
     "name":`${updatedUser?.userName}`,
    "description":`${updatedUser?.userName}`,
    "template_id":"6831ed6a100d25e5fea481dd",
    "large_room":true
    };
    const config = {
      headers: {
        'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NDgzNTQ4MTQsImV4cCI6MTc0OTU2NDQxNCwianRpIjoiZGJiMzg3ZjAtOWY1Yi00MzI4LThjM2ItN2ZlZTZhYmI1ZjViIiwidHlwZSI6Im1hbmFnZW1lbnQiLCJ2ZXJzaW9uIjoyLCJuYmYiOjE3NDgzNTQ4MTQsImFjY2Vzc19rZXkiOiI2ODMxZWQxZTE0NWNiNGU4NDQ5YWY4MzAifQ.mWaOXUuhUocHESLX9mA3fT0D6qqmemQF3kYyZL7K4JA',
        'Content-Type': 'application/json'
      }
    };
    const response = await axios.post(url, body, config);
    updatedUser={
      ...updatedUser,
      liveStreamRoomId:response.data.id
    }
    console.log("ROOM CREATED ID IS")
    console.log(response.data)


    users[currentUserIndex] = updatedUser;
console.log("USER WITH ROOMID")
console.log(users[currentUserIndex])

    io.to(opponent.socketId).emit("startMatch", {
      connUserId: socket.id,
      liveStreamRoomId:response.data.id
    });


    io.emit("getMatches")
    //matches



    // users = users.map(u => ({
    //   ...u,
    //   accepted: false
    // }));
  }
});


socket.on("liveStream",(data)=>{
  let playerOne=users.find(u=>u?.socketId==data)

 socket.join(playerOne.roomId)
  io.to(playerOne.roomId).emit("liveStream",{roomId:playerOne.roomId,userName:data.userName})

})

socket.on("shareTracks",(data)=>{
io.to(data.roomId).emit("shareTracks",data)
})

socket.on("shareToken",(data)=>{
  let user=users.find(u=>u?.email==data.email)
  io.to(user?.matchAgainst?.socketId).emit("shareToken",{authToken:data?.authToken})
})

socket.on("conn-init",(data)=>{
  let user=users.find(u=>u.socketId==data.connUserId)

let newdata={
  connUserId:socket.id,
  liveStreamRoomId:user.liveStreamRoomId
}

io.to(data.connUserId).emit("conn-init",newdata)


})


socket.on("signal",(data)=>{
 
  let newdata={
    connUserId:socket.id,
    signal:data.signal
  }

  io.to(data.connUserId).emit("signal",newdata)

 
})


socket.on("sendMessage",(data)=>{
  let user=users.find(u=>u?.email==data?.email)
  let newdata={
    message:data.message,
    socketId:user.socketId,
    by:user?.userName
  }

  console.log("SEND MESSAGE")
  console.log(newdata)
io.to(user.roomId).emit("sendMessage",newdata)
})

socket.on("sendSpectatorMessage",(data)=>{
  let user=users.find(u=>u?.socketId==data?.socketId)
  let newdata={
    message:data.message,
    socketId:user.socketId,
    by:data?.userName?data?.userName:'Spectator'
  }

io.to(user.roomId).emit("sendSpectatorMessage",newdata)
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

 
if(matchFoundAgainst?.matchAgainst?.accepted==true && currentUser?.matchAgainst?.accepted==true){
  io.to(matchFoundAgainst?.socketId).emit("acceptedByBothPlayers")
  io.to(currentUser?.socketId).emit("acceptedByBothPlayers")
}
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


socket.on('disconnect',()=>{
  let fileteredUsers=users.filter(u=>u.socketId!=socket.id)

  console.log(`User ${socket.id} disconnected`)
  let userThatDisconnected=users.find(u=>u.socketId==socket.id)


  if(userThatDisconnected?.roomId){
    socket.leave(userThatDisconnected?.roomId)
  }

  if(userThatDisconnected?.matchAgainst?.socketId){
    io.to(userThatDisconnected?.matchAgainst?.socketId).emit("closeVideo",{socketId:socket.id})
    io.to(userThatDisconnected?.roomId).emit("spectatorleave")
  }
  users=fileteredUsers

  io.emit("getMatches")
})
});

// Middleware setup
app.use(cors()); 
app.use(express.json()); 

// Routes
app.use(userAuthRoutes);
app.use(userProfileRoutes);
app.use(liveStreamRoutes)
// Mongoose connection
connection
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch((err) => console.error('MongoDB Connection Failed:', err));

// Start the server 
const PORT = process.env.PORT || 5000; 
server.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});


