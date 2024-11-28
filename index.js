const env = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cron = require('node-cron');
const { connectToDatabase, getDb } = require("./db/db.js");
const express=require('express')



//router
const authRouter = require('./route/auth.route.js');
const userRouter = require('./route/user.route.js');
const paymentRouter = require('./route/payment.route.js');
const courseRouter = require("./route/course.route.js");
const batchRouter = require("./route/batch.route.js");
const geuRouter=require('./route/geu.route.js')
const jindalRouter=require('./route/jindal.route.js');
const christRouter=require('./route/christ.route.js');

env.config();
const app=express()
// const corsOptions = {
//   origin: "*",
//   // credentials: true,
// };


const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204,
};



app.use(cors(corsOptions)); // Make sure this is placed early
app.options('*', cors(corsOptions)); // Preflight handler for all routes
//middleware
app.use(cookieParser());

app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));


app.get('/alive', (req, res) => {
  res.send("Hello from your Node.js app! The server is live.");
});


//routes
app.use('/api',authRouter)
app.use('/api',userRouter)
app.use('/api',paymentRouter)
app.use('/api',courseRouter)
app.use('/api',batchRouter)
app.use('/api',geuRouter)
app.use('/api',jindalRouter);
app.use('/api',christRouter);




const PORT = +process.env.PORT || 8000;
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
