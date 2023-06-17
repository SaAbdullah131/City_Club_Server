const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
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
  },
  useNewUrlParser:true,
  useUnifiedTopology:true,
  maxPoolSize:10,
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
     client.connect((error)=>{
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
 
// ------------------- adminVerify --------------
  const adminVerify = async(req,res,next)=>{
    const email = req.decoded.email;
    const query = {email:email}
    const user = await UserCollection.findOne(query);
    if(user?.role !=='admin'){
      return res.status(403).send({error:true,message:'message forbidden'});
    }
    next();
  }

// -------------------------- coaches verify ----------------
const coachesVerify = async(req,res,next)=>{
    const email = req.decoded.email;
    const query ={email:email};
    const user = await UserCollection.findOne(query);
    if(user?.role !=='coaches'){
      return res.status(403).send({error:true,message:'message forbidden'});
    }
    next();
}
//------------------ user as a admin ---------
app.get('/users',verifyJWT,adminVerify,async(req,res)=>{
  const result = await UserCollection.find().toArray();
  res.send(result);
})
// ------------------ new user posted in mongodb ---------
app.post('/users',async(req,res)=>{
  const user = req.body;
  const query = {email:user.email};
  const existUser = await UserCollection.findOne(query);
  if(existUser) {
    return res.send({message:'already have an user'});
  }
  const result = await UserCollection.insertOne(user);
  res.send(result);
})
// check whether user admin or not..
app.post('/users/admin/:email',verifyJWT,async(req,res)=>{
  const email = req.params.email;
  if(req.decoded.email !== email) {
    res.send({admin:false})
  }
  const query = {email:email};
  const user = await UserCollection.findOne(query);
  const result = {admin:user?.role === 'admin'};
  res.send(result);

})
// check user coach for not..
app.get('/users/coach/:email',verifyJWT,async(req,res)=>{
      const email = req.params.email;
      if(req.decoded.email !== email){
          res.send({admin:false});
      }

      const query = {email:email};
      const user = await UserCollection.findOne(query);
      const result = {admin:user?.role === 'coach'};
      res.send(result);
})

// update any user as admin
app.patch('/users/coach/:id',async(req,res)=>{
    const id = req.params.id;
    const filter = {_id: new ObjectId(id)};
    const updateDocument = {
      $set:{
        role:'coach'
      },
    };
    const result = await UserCollection.updateOne(filter,updateDocument);
    res.send(result);
})
    // -------------------- all Coaches ------------------ 
    app.get('/allcoaches',async(req,res)=>{
      const aggregation = [
        {$group:{_id:'$coachEmail',document:{$first:'$$ROOT'}}},
        {$replaceRoot:{newRoot:'$document'}}
      ]
      const sort = {studentNumber:-1,coachName:1,coachEmail:1}
      const result = await CoachesSessionCollection.aggregate(aggregation).sort(sort).project(fields).toArray();
      res.send(result);

    })
    // all session
    app.get('/session',async(req,res)=>{
      const result=await CoachesSessionCollection.find().toArray();
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