let jwt=require('jsonwebtoken')


module.exports.auth=async(req,res,next)=>{
try{
   
if(req.headers.authorization.startsWith('Bearer')){
let token=req.headers.authorization.split(' ')[1]
let decodedUser=jwt.verify(token,process.env.JWT_KEY)

let user=decodedUser
req.user=user;


next();
}
}catch(e){
    return res.status(400).json({
        error:"Something went wrong please try again"
    })
}
}