const gameModel = require("../../models/user/game")
const userModel = require("../../models/user/user")
const matchSettingsModel=require('../../models/user/matchsettings')
const {cloudinaryUpload}=require('../../middleware/cloudinary')
const path=require('path')
const fs=require('fs')
const matchDisputeModel = require("../../models/user/matchdispues")
const matchModel = require("../../models/user/match")
const chatModel = require("../../models/user/chat")
const announcementModel = require("../../models/user/announcements")



module.exports.getUserProfiles=async(req,res)=>{
    try{
let users=await userModel.find({}).populate('recentMatchHistory').populate('friendList')
return res.status(200).json({
    users
})
    }catch(e){
        return res.status(400).json({
            error:"Something wrong please try again"
        })
    }
}

module.exports.getUser=async(req,res)=>{
    let {userId}=req.params;
    try{
        let user=await userModel.findOne({_id:userId}).populate('recentMatchHistory').populate('friendList')
        return res.status(200).json({
            user
        })
            }catch(e){
                return res.status(400).json({
                    error:"Something wrong please try again"
                })
            }
}


module.exports.updateUser=async(req,res)=>{
    let {...data}=req.body;
    let {userId}=req.params;


    try{
        if(data.status=="Muted"){
            data.mutedOn=Date.now();
        }
        
  
let user=await userModel.findByIdAndUpdate(userId,{
    $set:data
},{new:true})

console.log(user)

return res.status(200).json({
    message:"Successfully updated"
})
    }catch(e){
        console.log("ERROR e.message")
        console.log(e.message)
        return res.status(400).json({
            error:"Something wrong please try again"
        })
    }
}


module.exports.createGame = async (req, res) => {
    let { ...data } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).json({
            error: "No file uploaded"
        });
    }

    try {
        const dirPath = '/tmp/public/files/images';
        
       
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

       
        const fileExtension = path.extname(file.originalname);
        const uniqueFileName = `${req.file.originalname}${fileExtension}`;
        const filePath = path.join(dirPath, uniqueFileName);

 
        fs.writeFileSync(filePath, file.buffer);

       
        data.imagePath = filePath;

        let image=await cloudinaryUpload(filePath)
        data.image=image.url

       let game=await gameModel.create(data);

        return res.status(200).json({
            message: "Game created successfully",
            game,
            imagePath: filePath 
        });
    } catch (e) {
        console.error('Error creating game:', e.message);
        return res.status(500).json({
            error: "Internal server error"
        });
    }
};

module.exports.getGames=async(req,res)=>{
    try{
let games=await gameModel.find({})
return res.status(200).json({
    games
})
    }catch(e){
        console.log(e.message)
        return res.status(400).json({
            error:"Something wrong please try again"
        })
    }
}

module.exports.updateGame=async(req,res)=>{
    let {id}=req.params;
    let {...data}=req.body;
    try{
await gameModel.findByIdAndUpdate(id,{
    $set:data
})

return res.status(200).json(
    {
        message:'Game updated sucessfully'
    }
)
    }catch(e){
        console.log(e.message)
        return res.status(400).json({
            error:"Something wrong please try again"
        })
    }
}




module.exports.deleteGame=async(req,res)=>{
    let {id}=req.params;
    try{
await gameModel.findByIdAndDelete(id)

return res.status(200).json(
    {
        message:'Game deleted sucessfully'
    }
)
    }catch(e){
        console.log(e.message)
        return res.status(400).json({
            error:"Something wrong please try again"
        })
    }
}



module.exports.getMatchSettings=async(req,res)=>{
    try{

    let settings=await matchSettingsModel.findOne({})
return res.status(200).json({
    settings
})
    }catch(e){
        console.log(e.message)
        return res.status(400).json({
            error:"Something wrong please try again"
        })
    }
}












module.exports.updateMatchSettings=async(req,res)=>{
    let {...data}=req.body;
    try{

    let settings=await matchSettingsModel.updateOne({},{
        $set:data
    },{upsert:true})
return res.status(200).json({
   message:"Match settings updated sucessfully"
})
    }catch(e){
        console.log(e.message)
        return res.status(400).json({
            error:"Something wrong please try again"
        })
    }
}

module.exports.getmatchDisputes=async(req,res)=>{
    try{
        let matchDisputes = await matchDisputeModel.find({})
        .populate('user')
        .populate({
          path: 'match',
          populate: [  
            {
              path: 'playerOne',
              model: 'user'
            },
            {
              path: 'playerTwo',
              model: 'user'
            },
            {
                path:'winBy',
                model:'user'
            }
          ]
        });

return res.status(200).json({
    matchDisputes
})
    }catch(e){
        console.log(e.message)
        return res.status(400).json({
            error:"Something wrong please try again"
        }) 
    }
}



 module.exports.createMatchDispute=async(req,res)=>{
    let {...data}=req.body;
    
    try{
let matchAlreadyCreated=await matchModel.findOne({roomId:data.roomId})
console.log(matchAlreadyCreated)
if(matchAlreadyCreated==null){
    let playerOne=await userModel.findOne({email:data.playerOne})
    let playerTwo=await userModel.findOne({email:data.playerTwo})
    let winBy=await userModel.findOne({email:data.winBy})
    data.playerOne=playerOne._id
    data.playerTwo=playerTwo._id
    data.winBy=winBy._id
       let match= await matchModel.create(data)
       data={
        ...data,
        match:match._id
    }

    
let user=await userModel.findOne({email:data.playerOne})
data={
    ...data,
    user:user._id
}
console.log("DATA FOR DISPUTE")
console.log(data)
        await matchDisputeModel.create(data)
        return res.status(200).json({
            message:"Match disputed created sucessfully"
        })

    }
data={
    ...data,
    match:matchAlreadyCreated._id
}

let user=await userModel.findOne({email:data.playerOne})
data={
    ...data,
    user:user._id
}
console.log("DATA FOR DISPUTE")
console.log(data)
        await matchDisputeModel.create(data)

return res.status(200).json({
    message:"Match disputed created sucessfully"
})

    }catch(e){
        console.log(e.message)
        return res.status(400).json({
            error:"Something wrong please try again"
        })
    }
 }




 module.exports.updateMatchDispute=async(req,res)=>{
    let {...data}=req.body;
    let {id}=req.params;
    try{

    let matchDispute=    await matchDisputeModel.findByIdAndUpdate(id,{$set:data},{new:true})

if(data.status=="RESOLVED"){
   
    await matchModel.updateOne({_id:matchDispute._id},{$set:{
        counted:false
    }})
}
return res.status(200).json({
    message:"Match disputed created sucessfully"
})

    }catch(e){
        console.log(e.message)
        return res.status(400).json({
            error:"Something wrong please try again"
        })
    }
 }


 module.exports.getChats=async(req,res)=>{
    try{
let chats=await chatModel.find({}).populate('by')
return res.status(200).json({
    chats
})
    }catch(e){
        console.log(e.message)
        return res.status(400).json({
            error:"Something wrong please try again"
        })
    }
 }


 
 module.exports.getSpectatorChats=async(req,res)=>{
    try{
let chats=await chatModel.find({spectator:true}).populate('by')
let flaggedChats=await chatModel.find({flagged:true})
return res.status(200).json({
    chats,
    flaggedChats
})
    }catch(e){
        console.log(e.message)
        return res.status(400).json({
            error:"Something wrong please try again"
        })
    }
 }

 module.exports.getUsers=async(req,res)=>{
    try{
        let users=await userModel.find({})
        return res.status(200).json({
            users
        })
            }catch(e){
                console.log(e.message)
                return res.status(400).json({
                    error:"Something wrong please try again"
                })
            }
 }


 


 module.exports.getAllChats=async(req,res)=>{
    try{
let chats=await chatModel.find({}).populate('by')
let flaggedChats=await chatModel.find({flagged:true})
return res.status(200).json({
    chats,
    flaggedChats
})
    }catch(e){
        console.log(e.message)
        return res.status(400).json({
            error:"Something wrong please try again"
        })
    }
 }




 module.exports.createAnnouncements=async(req,res)=>{
let {...data}=req.body;
    try{
await announcementModel.create(data)

return res.status(200).json({
    message:"Announcement created sucessfully"
})

    }catch(e){
        console.log(e.message)
        return res.status(400).json({
            error:"Something wrong please try again"
        })
    }
 }



 
 module.exports.getAnnouncements=async(req,res)=>{
   
        try{
 let announements=await announcementModel.find({})
    
    return res.status(200).json({
        announements
    })
    
        }catch(e){
            console.log(e.message)
            return res.status(400).json({
                error:"Something wrong please try again"
            })
        }
     }