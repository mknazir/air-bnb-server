const env = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cron = require('node-cron');
const { connectToDatabase, getDb } = require("./db/db.js");
const express=require('express')

const authRouter = require('./route/auth.route.js');
const userRouter = require('./route/user.route.js');

env.config();
const app=express()
const corsOptions = {
  origin: 'http://localhost:5173', // Replace '*' with specific origin(s) in production
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"], // Add other headers if needed
};

app.use(cors(corsOptions));
// app.options('*', cors(corsOptions));
app.use(cookieParser());

app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/alive', (req, res) => {
  res.send("Hello from your Node.js app! The server is live.");
});


//routes
app.use('/api',authRouter)
app.use('/api',userRouter)




const PORT = +process.env.PORT || 8000;
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
