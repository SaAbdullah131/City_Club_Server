const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

console.log(process.env.DB_USER);

// verify jwt
const verifyJWT = (req,res,next)=> {
  const authorization = req.headers.authorization;
  if(!authorization) {
    return res.status(401).send({error:true,message:'unauthorized accesss'});
  }
  // bearer token 
  const token = authorization.split(' ')[1];
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
    if(err){
      return res.status(401).send({error:true,message:'unauthorized access'})
    }
    req.decoded = decoded;
    next();
  })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.satt96b.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect((error)=>{
      if(error){
        console.error(error);
        return;
      }
    });

    const UserCollection = client.db('City_club').collection('users');
    const CoachesSessionCollection = client.db('City_club').collection('CoachesSession');
    const topStudentCollection = client.db('City_club').collection('topStudent');
    const selectedSessionCollection = client.db('City_club').collection('selectedSession');
 // --------------------- jwt token post --------------
 app.post('/jwt',(req,res)=>{
  const user = req.body;
  const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'})
  res.send(token);
})

    // all Coaches 
    app.get('/allcoaches',async(req,res)=>{
      
      const result = await CoachesSessionCollection.toArray();
      res.send(result);
      
    })
    // all session
    app.get('/session',async(req,res)=>{
      const result=await CoachesSessionCollection.toArray();
      res.send(result);
    })

    // top student section 
    app.get('/top-student',async(req,res)=>{
      const result = await topStudentCollection.find().toArray();
      res.send(result); 
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send("City Club Server is Running");
})

app.listen(port,()=>{
    console.log(`City Club Server is Running on ${port}`);
})