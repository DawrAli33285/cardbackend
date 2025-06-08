const mongoose=require('mongoose')

const userSchema=mongoose.Schema({
    email:{
type:String,
required:["Please provide email",true]
    },
    userName:{
        type:String,
        required:['Please provide username',true]
    },
    avatar:{
        type:String,
        required:["Please provide avatar picture",true]
    },
    rank:{
        type:Number,
        default:0
    },
    tagline:{
     type:String,
     default:'Cards, strategy, and a little bit of luck!'
    },
    deleted:{
        type:Boolean,
        default:false
    },
    recentMatchHistory: {
        type: [{
            type: mongoose.Schema.ObjectId,
            ref: 'cardMatches'
        }],
        default: [] 
    },
    friendList:{
        type:[{
  type: mongoose.Schema.ObjectId,
  ref: 'user'
        }],
        default:[]
    },
    visible: {
        type: String,  
        enum: ['visible', 'hidden'],  
        default: 'visible'  
    },
    status:{
        type:String,
        enum:['Active','Pending','Banned','Muted',"Warnings"]  
    },
    lastLoggedIn:{
        type:Date
    },
    deleted:{
        type:Boolean,
        default:false
    },
    warnings:{
        type:Number,
        default:0
    },
    prevWarnings:{
        type:Number,
        default:0
    },
    mutedOn:{
        type:Date
    }
})


const userModel=mongoose.model('user',userSchema)
module.exports=userModel