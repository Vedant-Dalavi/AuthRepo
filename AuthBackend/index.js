const express = require('express');
const app = express();


// import Routes
const authRoute = require("./routes/Auth");


// import database
const database = require("./config/database");
database.connect();


// access routes
const cors = require("cors");


const dotenv = require("dotenv");


app.use(express.json());
app.use(cors());
app.use(cookieParser());


app.use("/api/v1/auth", authRoute);


// Start the server and listen on the given port
server.listen(PORT, () => {
    console.log(`App is running at port ${PORT}`);
});