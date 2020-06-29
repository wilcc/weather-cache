const express = require('express');
const router = express.Router();
const axios = require('axios')
const redis = require('redis')



const REDIS_PORT = 6379
const client = redis.createClient(REDIS_PORT)

require('dotenv').config()
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
const apiKey = process.env.APIKEY
const seconds = 60*60*5

const checkForData = async(req,res,next)=>{
  try{
    await client.get('redisWeather',async(err,info)=>{
      if(err){
        return next(err)
      }
  
      if(info ===null){
        console.log('null call')
        return next()
      }

      const currentLocate = req.params.locate
      const parseData = await JSON.parse(info)
      const redisLocate = `${parseData.data.latitude},${parseData.data.longitude}`




      if(currentLocate === redisLocate){
        return res.json({message:'from cache',data:parseData})
      // res.render('fivehourforecast',{weather:parseData})

      }
      next()
    })

  }
  catch(err){
    next(err)
  }
}
router.post('/forecast',async (req,res,next)=>{
  try{
    const zipCode = req.body.zipcode
    const zipKey = process.env.zipAPI
    const zipUrl = `https://www.zipcodeapi.com/rest/${zipKey}/info.json/${zipCode}/degrees`
    const locate = await axios.get(zipUrl)
    const lat = locate.data.lat
    const long = locate.data.lng

    res.redirect(`/forecast/${lat},${long}`)
  }
    catch(err){
      next(err)
    }
    
  }
    )

router.get('/forecast',(req,res)=>{
  res.render('forecast')
})

router.get('/forecast/:locate',checkForData,async (req,res,next)=>{
  try{
    const location2 = req.params.locate

    const url = `https://api.darksky.net/forecast/${apiKey}/${location2}?exclude=minutely,hourly`

    const currentDate = await Date.now()
    const result = await axios.get(url)
    const webData = result.data
  
  let newData = {}
  newData.date = currentDate
  newData.data = webData
  
  await client.setex('redisWeather', seconds, JSON.stringify(newData))
  return res.json({message:'from database',data:newData})
  
  // res.render('fivehourforecast',{weather:newData})


      
      }
      catch(err){
        console.log(err)
      }
})


module.exports = router;
