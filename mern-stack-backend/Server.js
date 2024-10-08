const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const transactionrouter = require("./Router/Transaction");

const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect("mongodb://localhost:27017/Transaction_data");

const database = mongoose.connection;
database.on("error", (error) => {
  console.log("Error", error);
});

database.once("connected", () => {
  console.log("Database Connected");
});
app.use("/api/transaction", transactionrouter);

app.listen(5001, () => {
  console.log("http://localhost:5001");
});