const mongoose=require('mongoose')

const matchSchema=mongoose.Schema({
    users:[{type:mongoose.Schema.ObjectId,ref:'user'}],
    winBy:{
        type:mongoose.Schema.ObjectId,
        ref:'user'
    }
},{
    timestamps:true
})

const matchModel=mongoose.model('cardMatches',matchSchema)

module.exports=matchModel;