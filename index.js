const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 3000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.6jar5hr.mongodb.net/?appName=Cluster0`;

//middleware
app.use(express.json());
app.use(cors());

// Create a MongoClient
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//mongodb
async function run() {
  try {
    await client.connect();
    const db=client.db("zap-shift-db");
    const parcelsCollection=db.collection('parcels');

    //parcel-api
    app.get('/parcel',async (req,res)=>{
        const query={};
        const{email}=req.query;

        if(email){
            query.senderEmail=email;
        }

        const cursor=parcelsCollection.find(query);
        const result=await cursor.toArray();
        res.send(result);


    })
    app.post('/parcel',async (req,res)=>{
        const parcel=req.body;
        parcel.createdAt=new Date();
        const result=await parcelsCollection.insertOne(parcel);
        res.send(result);

    })


    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

//basic-setup
app.get("/", (req, res) => {
  res.send("Hello,i am zapshift server!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
