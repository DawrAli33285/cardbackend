const userModel = require("../../../models/user/user");
const fs=require('fs').promises
const path=require('path')
const {cloudinaryUpload}=require('../../../middleware/cloudinary')


module.exports.updateProfile = async (req, res) => {
    let { ...data } = req.body;
    console.log("Update Data:", data);

    try {
        let profile = await userModel.findByIdAndUpdate(
            req.user.id,
            { $set: data },
            { new: true, runValidators: true } 
        );

        if (!profile) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json({ profile });
    } catch (e) {
        console.log("Error updating profile:", e.message);
        return res.status(500).json({ error: "Something went wrong, please try again" });
    }
};


module.exports.updateAvatar=async(req,res)=>{
    try{
        console.log(req.file)
        if (!req.file) {
            return res.status(400).json({ error: "Avatar file is required" });
        }
      
        const filePath = path.join(process.cwd(), "images");
        const fileName = `${Date.now()}-${req.file.originalname}`;
        const combinedPath = path.join(filePath, fileName);

       
        
        await fs.mkdir(filePath, { recursive: true });
        
        
        await fs.writeFile(combinedPath, req.file.buffer);
let cloudFile=await cloudinaryUpload(combinedPath)
console.log("CLOUD")
console.log(cloudFile)
await userModel.findByIdAndUpdate(req.user.id,{
   $set:{
    avatar:cloudFile.url
   }
})

return res.status(200).json({
    message:"Avatar updated successfully"
})
    }catch(e){
        console.log("ERROR")
        console.log(e.message)
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }
}


module.exports.deleteUser=async(req,res)=>{
  
    try{
await userModel.findByIdAndUpdate(req.user.id,{
    $set:{
        deleted:true
    }
})

return res.status(200).json({
    message:"User deleted successfully"
})
    }catch(e){
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }
}



module.exports.getProfile=async(req,res)=>{
    try{
      
let user=await userModel.findOne({_id:req.user.id}).populate('recentMatchHistory')
return res.status(200).json({
    user
})
    }catch(e){
        console.log(e.message)
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }
}