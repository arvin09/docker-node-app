const express = require("express");
const app = express();
const mongoose = require("mongoose");
const {createClient} = require("redis");
const session = require("express-session");
const connectRedis = require('connect-redis');
const cors = require('cors');
let RedisStore = connectRedis(session);

const {
  MONGO_IP,
  MONGO_PORT,
  MONGO_USER,
  MONGO_PASSWORD,
  REDIS_URL,
  REDIS_PORT,
  SESSION_SECRET,
} = require("../config");

const mongoUrl = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_IP}:${MONGO_PORT}/?authSource=admin`;

const connectWithRetry = () => {
  mongoose
    .connect(mongoUrl, {
      useNewUrlParser: true,
    })
    .then(() => console.log("sucessfully connected to MONGO"))
    .catch((e) => {
      console.log(e);
      setTimeout(connectWithRetry, 5000);
    });
};
connectWithRetry();

//Configure redis client


let redisClient = createClient({
  host: REDIS_URL,
  port: REDIS_PORT
})

app.use(express.json());
app.use(cors({}));
// enable this if you run behind a proxy (e.g. nginx)
app.enable("trust proxy");

//Configure session middleware
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
      secure: false, // if true only transmit cookie over https
      httpOnly: true, // if true prevent client side JS from reading the cookie 
      maxAge: 30000 // session max age in miliseconds
  }
}))

const postRouter = require("../routes/postRoutes");
const userRouter = require("../routes/userRoutes");

app.get("/api/v1", (req, res) => {
  res.json({ message: "Docker is easy Arvin!! Lets start the journey" });
  console.log("Yeah it ran");
});

app.use("/api/v1/posts", postRouter);
app.use("/api/v1/users", userRouter);

const port = process.env.PORT || "8080";

app.listen(port, () =>
  console.log(`app is listening on http://localhost:${port}`)
);
