const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
  .then(() => {
    console.log("Connected to DB");
    initDB();
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

const initDB = async () => {
  await Listing.deleteMany({});

  const data = initData.data.map((obj) => ({
    ...obj,
    owner: "6a681b45ad9bb5071dc8cbbd",
    geometry: {
      type: "Point",
      coordinates: [77.2090, 28.6139], // Default: Delhi
    },
  }));

  await Listing.insertMany(data);
  console.log("Data was initialized");
  mongoose.connection.close();
};