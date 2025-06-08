const mongoose=require('mongoose')

const announcementSchema=mongoose.Schema({
title:{
    type:String
},
type:{
    type:String
},
status:{
    type:String
},
content:{
    type:String
}
},{timestamps:true})




const announcementModel=mongoose.model('announcement',announcementSchema)

module.exports=announcementModel