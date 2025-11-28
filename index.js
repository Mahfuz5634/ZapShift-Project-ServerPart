const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 3000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.6jar5hr.mongodb.net/?appName=Cluster0`;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const YOUR_DOMAIN = "http://localhost:5173";

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
    const db = client.db("zap-shift-db");
    const parcelsCollection = db.collection("parcels");

    app.get("/paybill/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const query = { _id: new ObjectId(id) };

        const result = await parcelsCollection.findOne(query);

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Something went wrong" });
      }
    });

    //parcel-api
    app.get("/parcel", async (req, res) => {
      const query = {};
      const { email } = req.query;

      if (email) {
        query.senderEmail = email;
      }

      const cursor = parcelsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.post("/parcel", async (req, res) => {
      const parcel = req.body;
      parcel.createdAt = new Date();
      const result = await parcelsCollection.insertOne(parcel);
      res.send(result);
    });

    //payment-api-------------------->
    app.post("/create-checkout-session", async (req, res) => {
      try {
        const paymentInfo = req.body;

        if (
          !paymentInfo.cost ||
          !paymentInfo.parcelName ||
          !paymentInfo.senderEmail
        ) {
          return res.status(400).send({ error: "Missing required fields" });
        }

        const amount = parseInt(paymentInfo.cost) * 100; // cents

        const session = await stripe.checkout.sessions.create({
          line_items: [
            {
              price_data: {
                currency: "BDT", // USD or BDT
                unit_amount: amount,
                product_data: {
                  name: paymentInfo.parcelName,
                },
              },
              quantity: 1,
            },
          ],
          customer_email: paymentInfo.senderEmail,
          mode: "payment",
          metadata: {
            parcelId: paymentInfo.parcelId,
          },
          success_url: `${YOUR_DOMAIN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${YOUR_DOMAIN}/dashboard/payment-cancel`,
        });

        res.send({ url: session.url }); // JSON response for frontend
      } catch (error) {
        console.log(error);
        res.status(500).send({ error: error.message });
      }
    });

    //payment-check
    app.patch("/payment-success", async (req, res) => {
      try {
        const sessionId = req.query.session_id;

        if (!sessionId) {
          return res.status(400).send({ error: "session_id missing" });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === "paid") {
          const id = session.metadata.parcelId;
          const query = { _id: new ObjectId(id) };

          const update = {
            $set: { status: "paid" },
          };

          const result = await parcelsCollection.updateOne(query, update);
          return res.send({ success: true, result });
        } else {
          return res.status(400).send({
            success: false,
            message: "Payment not paid yet",
          });
        }
      } catch (error) {
        console.error("Payment success error:", error);
        res.status(500).send({ error: error.message });
      }
    });

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
