const gameModel = require("../../models/user/game");
const matchModel = require("../../models/user/match");
const userModel = require("../../models/user/user");

module.exports.createMatch=async(req,res)=>{
    let {...data}=req.body;

    console.log("createMatch")
    console.log(data)
    try{
        if(!data?.roomId){
return res.status(400).json({
    error:"no roomId"
})
        }
    
        let alreadyExists=await matchModel.findOne({roomId:data.roomId})
      if(alreadyExists){
        return res.status(200).json({
            message:"Match already created"
        })
      }
    let playerOne=await userModel.findOne({email:data.playerOne})
    let playerTwo=await userModel.findOne({email:data.playerTwo})
   if(data?.winBy){
    let winBy=await userModel.findOne({email:data.winBy})
    data.winBy=winBy._id
   }
    data.playerOne=playerOne._id
    data.playerTwo=playerTwo._id

       let match=await matchModel.create(data)
       await userModel.findByIdAndUpdate(data.playerOne, {
        $push: { 
            recentMatchHistory: match._id  
        }
    });
await userModel.findByIdAndUpdate(data.playerTwo, {
    $push: { 
        recentMatchHistory: match._id  
    }
});
return res.status(200).json({
    message:"Match created sucessfully"
})
    }catch(e){
        console.log("CREATE MATCH ERROR")
        console.log(e.message)
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }
}






module.exports.updateMatch = async (req, res) => {
    let { ...data } = req.body;
    let { roomId } = req.params;

    console.log("UPDATE MATCH")
    console.log(data)
    console.log(roomId)
   
    try {
 
        const winner = await userModel.findOne({ email: data.winBy});
        let playerTwo=await userModel.findOne({email:data.playerTwo})
        const playerOne=await userModel.findOne({email:data.playerOne})
        if (!winner) {
            return res.status(404).json({
                error: "Winner user not found"
            });
        }

        data.playerOne=playerOne._id
        data.playerTwo=playerTwo._id
        
        data.winBy = winner._id;

      
        let alreadyCreated = await matchModel.updateOne(
            { roomId: roomId }, 
            { $set: data }
        );

   
        await userModel.updateOne(
            { _id: winner._id }, 
            { $inc: { rank: 1 } }  
        );

        return res.status(200).json({
            message: "Match successfully updated"
        });
    } catch (e) {
        console.log(e.message);
        return res.status(400).json({
            error: "Something went wrong please try again"
        });
    }
};

module.exports.getGames=async(req,res)=>{
 
    try{
        let games=await gameModel.find({status:"ACTIVE"})
return res.status(200).json({
    games
})
    }catch(e){
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }
}