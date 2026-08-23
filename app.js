if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();

const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");

const ExpressError = require("./utils/ExpressError.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");

const passport = require("passport");
const LocalStrategy = require("passport-local");

const User = require("./models/user.js");

// ================= DATABASE =================

const dbUrl = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log("DATABASE CONNECTION ERROR:", err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

// ================= EJS =================

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ================= MIDDLEWARE =================

app.use(express.urlencoded({ extended: true }));

app.use(methodOverride("_method"));

app.engine("ejs", ejsMate);

app.use(express.static(path.join(__dirname, "/public")));

// ================= SESSION STORE =================

const store = MongoStore.create({
  mongoUrl: dbUrl,
  collectionName: "sessions_new",
  touchAfter: 24 * 3600,
});

store.on("error", (error) => {
  console.log("ERROR IN MONGO SESSION STORE:", error);
});

// ================= SESSION =================

const sessionOption = {
  store: store,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

app.use(session(sessionOption));

// ================= FLASH =================

app.use(flash());

// ================= PASSPORT =================

app.use(passport.initialize());

app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());

passport.deserializeUser(User.deserializeUser());

// ================= LOCALS =================

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user || null;

  next();
});

// ================= ROUTES =================

app.use("/listings", listingRouter);

app.use("/listings/:id/reviews", reviewRouter);

app.use("/", userRouter);

// ================= 404 =================

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page not found!"));
});

// ================= ERROR HANDLER =================

app.use((err, req, res, next) => {
  console.log("=================================");
  console.log("FULL ERROR:", err);
  console.log("ERROR MESSAGE:", err.message);
  console.log("ERROR STACK:", err.stack);
  console.log("=================================");

  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong!";

  res.status(statusCode).render("error.ejs", {
    message: message,
  });
});

// ================= SERVER =================

app.listen(8080, () => {
  console.log("server is listening to port 8080");
});