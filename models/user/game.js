const mongoose=require('mongoose')

const gameSchema=mongoose.Schema({
    name:{
type:String,
required:true
    },
    description:{
type:String,
required:true
    },
    image:{
        type:String,
        required:true
    },
    status:{
        type:String,
        enum:['ACTIVE','INACTIVE'],
        default:'ACTIVE'
    },
    avg_wait_time:{
        type:Date
    }
})

const gameModel=mongoose.model('game',gameSchema)

module.exports=gameModel;