const stripe = require('stripe')('sk_test_51OwuO4LcfLzcwwOYsXYljgE1gUyGnLFvjewSf1NG9CsrSqTsxm7n7ppmZ2ZIFL01ptVDhuW7LixPggik41wWmOyE00RjWnYxUA');
const subscriptionModel = require('../../models/user/subscription');
const subscriptionsModel=require('../../models/user/subscription');
const userModel = require('../../models/user/user');

module.exports.createSession=async(req,res)=>{
    try{

        if (!req.user?.email) {
            return res.status(400).json({ error: "User email required" });
          }
          let alreadySubscribed=await subscriptionModel.findOne({email:req.user.email})
          if(alreadySubscribed){
            return res.status(400).json({
                error:"User already subscribed"
            })
          }
     
       const product = await stripe.products.create({
        name: 'Card Game Premium',
        description: 'Subscription for premium card game features',
      });
  

      const price = await stripe.prices.create({
        unit_amount: 399, 
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
        product: product.id,
        metadata: {
          type: 'card_game_subscription'
        }
      });


    
  
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: req.user.email,
        line_items: [{
          price: price.id, 
          quantity: 1,
        }],
        success_url: 'http://localhost:3000',
        cancel_url: 'http://localhost:3000/subscribe',
        subscription_data: {
          metadata: {
            user_id: req.user.id,
            description: 'Card Game Premium Subscription'
          }
        },
        payment_method_collection: 'always',
        allow_promotion_codes: true,
      });


          return res.status(200).json({
            session
          })
    }catch(e){
        console.log(e.message)
        return res.status(400).json({
            error:"Something went wrong please try again"
        })
    }
}



const ACCOUNT_123_API_KEY = 'sk_test_51OwuO4LcfLzcwwOYsXYljgE1gUyGnLFvjewSf1NG9CsrSqTsxm7n7ppmZ2ZIFL01ptVDhuW7LixPggik41wWmOyE00RjWnYxUA';


const accountApiKeys = {
  account_123: ACCOUNT_123_API_KEY
};


module.exports.webhook = async(req,res) => {
   const sig=req.headers['stripe-signature']
   let event;
   try{
event=stripe.webhooks.constructEvent(
    req['rawBody'],sig,'whsec_b82d718fbae44ab38035f9ce59915a1c5c7870d001c5d90f38cab27b8e52a15c'
)
   }catch(e){
    return res.status(400).json({
        error:e.message
    })
   }
if(event.type=="invoice.payment_succeeded"){
    const invoice = event.data.object;
      
    
    const customerEmail = invoice.customer_email;
    const amount = invoice.amount_paid; 
    const subscriptionId = invoice.subscription;

    let last4 = null;
    try {
      if (invoice.charge) {
        const charge = await stripe.charges.retrieve(invoice.charge);
        if (charge.payment_method_details?.card?.last4) {
          last4 = charge.payment_method_details.card.last4;
        }
      }
    } catch (error) {
      console.log('Error retrieving charge details:', error.message);
    }
    
   
    console.log('Payment Details:', {
      email: customerEmail,
      amount: amount / 100,
      subscriptionId: subscriptionId,
      last4: last4
    });

    let user=await userModel.findOne({email:customerEmail})
    await subscriptionsModel.create({
user:user._id,
amount:amount/100,
subscriptionId: subscriptionId,
last4: last4
    })
}else if(event.type=="customer.subscription.deleted"){
    const deleteCharge = event.data.object;
    let email=deleteCharge.billing_details.email
    let user=await userModel.findOne({email})
     await subscriptionsModel.updateOne({user:user._id},{
        $set:{
            cancelled:true
        }
     })

}else if(event.type=="charge.refunded"){
    const refundedCharge = event.data.object;
    let email=refundedCharge.billing_details.email
    let user=await userModel.findOne({email})
    console.log("EMAIL")
    console.log(email)
    console.log(refundedCharge)

     await subscriptionsModel.updateOne({user:user._id},{
        $set:{
            cancelled:true
        }
     })
    
}
  };