const mongoose=require('mongoose')

const subscriptionSchema=mongoose.Schema({
   user:{
    type:mongoose.Schema.ObjectId,
    ref:'user'
   },
   amount:{
    type:String,
    required:true
   },
   subscriptionId:{
    type:String,
    required:true
   },
   last4:{
    type:String,
    required:true
   },
   cancelled:{
    type:Boolean,
    default:false
   }
})



const subscriptionModel=mongoose.model('subscription',subscriptionSchema)
module.exports=subscriptionModel