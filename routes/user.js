const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const Usercontroller=require("../controllers/user.js");


router.route("/signup")
   .get(Usercontroller.signupForm )
   .post(wrapAsync(Usercontroller.signup));

router.route("/login")
    .get(Usercontroller.loginForm )
    .post(saveRedirectUrl,
    passport.authenticate("local", {
        failureRedirect: "/login",
        failureFlash: true,
    }),
   Usercontroller.login
);

// Logout
router.get("/logout",Usercontroller.logout);

module.exports = router;