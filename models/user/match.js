const mongoose=require('mongoose')

const matchSchema=mongoose.Schema({
   playerOne:{
type:mongoose.Schema.ObjectId,
ref:'user'
   },
   playerTwo:{
type:mongoose.Schema.ObjectId,
ref:'user'
   },
    winBy:{
        type:mongoose.Schema.ObjectId,
        ref:'user'
    },
    mode:{
type:String,
enum:['Rank','Casual']
    },
    counted:{
        type:Boolean,
        default:true
    },
    roomId:{
        type:String
    },
    tch:{
        type:String
    }
},{
    timestamps:true
})

const matchModel=mongoose.model('cardMatches',matchSchema)

module.exports=matchModel;