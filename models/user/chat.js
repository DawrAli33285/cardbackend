const mongoose=require('mongoose')

const chatSchema=mongoose.Schema({
    message:{
        type:String
    },
    match:{
        type:mongoose.Schema.ObjectId,
        ref:'cardMatches'
    },
    by:{
        type:mongoose.Schema.ObjectId,
        ref:'user'
    },
    spectator:{
        type:Boolean,
        default:false
    },
    status:{
        type:String
    },
    flagged:{
        type:Boolean,
        default:false
    }
},{timestamps:true})


const chatModel=mongoose.model('chat',chatSchema)
module.exports=chatModel;