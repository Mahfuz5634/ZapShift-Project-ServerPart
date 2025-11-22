const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require("express");
const cors = require("cors");
const app = express();
require('dotenv').config();
const port = process.env.PORT || 3000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.6jar5hr.mongodb.net/?appName=Cluster0`;

//middleware
app.use(express.json())
app.use(cors())

// Create a MongoClient 
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

//mongodb
async function run() {
  try {

    await client.connect();
  
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
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
