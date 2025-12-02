const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const express = require("express");
const cookieParser = require("cookie-parser");

const home = require("./routes/home.route.js");

dotenv.config();

const app = express();

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production" ? "*" : "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/", home);

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 1111;
  app.listen(PORT, () =>
    console.log(`Server running locally at http://localhost:${PORT}`)
  );
}

module.exports = app;
