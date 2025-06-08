const mongoose=require('mongoose')

const matchDisputeSchema=mongoose.Schema({
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'user'
    },
match:{
    type:mongoose.Schema.ObjectId,
    ref:'cardMatches'
},
reportReason:{
type:String
},
status:{
    type:String,
    default:"PENDING"
}

},{timestamps:true})


const matchDisputeModel=mongoose.model('matchDispute',matchDisputeSchema)

module.exports=matchDisputeModel