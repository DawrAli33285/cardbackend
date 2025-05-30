const userModel = require("../../../models/user/user");
const jwt=require('jsonwebtoken')
const {cloudinaryUpload}=require('../../../middleware/cloudinary')
const fs = require('fs').promises
const path=require('path')


module.exports.register = async (req, res) => {
    let {...data}=req.body;
    try {
      
        let alreadyExists=await userModel.findOne({email:data.email})

        if(alreadyExists){
            return res.status(400).json({ error: "Email is already taken" });
        }
  

      await userModel.create(data)

        return res.status(200).json({ 
            message: "user registered successfully",
           
        });

    } catch (e) {
       console.log(e.message)
        return res.status(500).json({
            error: "Internal server error",
           
        });
    }
};




module.exports.login=async(req,res)=>{
    let {email}=req.body
    console.log(email)
    try{
let userFound=await userModel.findOne({email})
if(!userFound){
    return res.status(400).json({
        error:"User not found"
    })
}
if(userFound.deleted==true){
    console.log("ACCount deleted")
    return res.status(400).json({
        error:"Account was deleted"
    })
}
console.log(userFound)
let token = jwt.sign(
    { id: userFound._id, email: userFound.email }, 
    process.env.JWT_KEY,
    { expiresIn: '7d' } 
);
console.log(token)

return res.status(200).json({
    user:userFound,
    token
})
    }catch(e){
        console.log(e.message)
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }
}