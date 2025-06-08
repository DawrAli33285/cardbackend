const mongoose=require('mongoose')

const settingsSchema=mongoose.Schema({
    grace_period:{
        type:String,
        default:'30'
    },
    auto_forefit:{
        type:Boolean,
        default:true
    },
    max_spectators:{
        type:Number,
        defaul:20
    },
    spectator_chat_delay:{
        type:Number,
        default:0
    },
    enable_spectator_settings:{
        type:Boolean,
        default:true
    },
    enable_automatic_filtering:{
        type:Boolean,
        default:true
    },
    filter_strictness:{
        type:String,
        default:'Medium'
    },
    auto_mute_for_voilations:{
        type:Boolean,
        default:true
    },
    duration:{
type:Number,
default:1
    },

    blocked_words: {
        type: [String],
        default: ['hate', 'stupid', 'idiot', 'cheater', 'looser']
      },

      lobbyTimer:{
        type:Number,
        default:60
      },
      matchmakingCriteria:{
        type:Number,
        default:2
      }
      

})

const settingsModel=mongoose.model('matchSettings',settingsSchema)


module.exports=settingsModel