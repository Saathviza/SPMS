console.log("SERVER FILE PATH:", __filename);
console.log("🔥 SERVER.JS LOADED");
require("./src/config/dbTest");

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require(__dirname + "/src/routes/auth.routes.js");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Scout PMS Backend Running");
});

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


