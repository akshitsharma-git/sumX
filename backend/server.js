
const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const path = require("path");

const _dirname = path.resolve();

const home = require("./routes/home.route.js");

dotenv.config();

const app = express();


app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production" ? "*" : "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", home);
app.use(express.static(path.join(_dirname, "frontend", "dist")));
app.use((req, res) => {
  res.sendFile(path.resolve(_dirname, "frontend", "dist", "index.html"));
});


const PORT = process.env.PORT || 1111;

app.listen(PORT, () =>
  console.log(`Server running locally at http://localhost:${PORT}`)
)
