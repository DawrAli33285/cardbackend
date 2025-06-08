const axios = require('axios');

const BEARER_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NDgzNTQ4MTQsImV4cCI6MTc0OTU2NDQxNCwianRpIjoiZGJiMzg3ZjAtOWY1Yi00MzI4LThjM2ItN2ZlZTZhYmI1ZjViIiwidHlwZSI6Im1hbmFnZW1lbnQiLCJ2ZXJzaW9uIjoyLCJuYmYiOjE3NDgzNTQ4MTQsImFjY2Vzc19rZXkiOiI2ODMxZWQxZTE0NWNiNGU4NDQ5YWY4MzAifQ.mWaOXUuhUocHESLX9mA3fT0D6qqmemQF3kYyZL7K4JA';

module.exports.getRoomCodes = async (req, res) => {
  let { id } = req.params;
  try {
    let response = await axios.get(`https://api.100ms.live/v2/room-codes/room/${id}`, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`
      }
    });
    return res.status(200).json({
      codes: response.data.data
    });
  } catch (e) {
    console.log(e.message);
    return res.status(400).json({
      error: "Something went wrong, please try again"
    });
  }
};

module.exports.getRoomToken = async (req, res) => {
  try {
    let { code } = req.body;
    let response = await axios.post('https://auth.100ms.live/v2/token', code, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`
      }
    });
    return res.status(200).json({
      token: response.data.token
    });
  } catch (e) {
    return res.status(400).json({
      error: "Something went wrong, please try again"
    });
  }
};


module.exports.getCodeAndToken=async(req,res)=>{
    let { id ,roleName} = req.params;
  console.log("ROOMID")
  console.log(id)
    try{
        const cleanId = id.trim().toLowerCase();
        const response = await axios.post(`https://api.100ms.live/v2/rooms/${cleanId}`, {
            enabled: true
        }, {
            headers: {
               'Authorization': `Bearer ${BEARER_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("enable room api")
        console.log(response.data)

        const codeResponse = await axios.post(
          `https://api.100ms.live/v2/room-codes/room/${id}/role/${roleName}`,
          null, 
          {
            headers: {
              Authorization: `Bearer ${BEARER_TOKEN}`
            }
          }
        );
    let code=codeResponse.data.code
console.log(code)
console.log("CODE")
    const EnableRoomCodeResponse = await axios.post(
        'https://api.100ms.live/v2/room-codes/code',
        {
          code: code,  
          enabled: true   
        },
        {
          headers: {
            'Authorization': `Bearer ${BEARER_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('EnableRoomCodeResponse')
      console.log(EnableRoomCodeResponse.data)
  
    
    const cleanCode = code.trim().replace(/[^a-zA-Z0-9-]/g, '');
    let tokenResponse = await axios.post('https://auth.100ms.live/v2/token', {code:cleanCode}, {
        headers: {
          'Authorization': `Bearer ${BEARER_TOKEN}`,
            'Content-Type': 'application/json'
        }
      });

     
    
      return res.status(200).json({
        token:tokenResponse.data.token
      })
    }catch(e){
        console.log(e.message)
        return res.status(400).json({
            error: "Something went wrong, please try again"
          });
    }
}