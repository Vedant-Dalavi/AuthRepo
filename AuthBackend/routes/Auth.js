// Import the required modules
const express = require("express")
const router = express.Router()

// Import the required controllers and middleware functions
const {
  login,
  signup,
  sendotp,
  checkUserName,
  // changePassword,
} = require("../controllers/Auth")
// const {
//   resetPasswordToken,
//   resetPassword,
// } = require("../controllers/ResetPassword")

const { auth } = require("../middlewares/auth")

// Routes for Login, Signup, and Authentication

// ********************************************************************************************************
//                                      Authentication routes
// ********************************************************************************************************

// Route for user login
router.post("/login", login)

// Route for user signup
router.post("/signup", signup)

// Route for sending OTP to the user's email
router.post("/sendotp", sendotp)

router.get("/checkusername/:userName", checkUserName)

// Route for Changing the password
// router.post("/changepassword", auth, changePassword)

// ********************************************************************************************************
//                                      Reset Password
// ********************************************************************************************************

// Route for generating a reset password token
// router.post("/reset-password-token", resetPasswordToken)

// Route for resetting user's password after verification
// router.post("/reset-password", resetPassword)
// 
// Export the router for use in the main application






// ********************************************************************************************************
//                                      Google Auth Using Passport
// ********************************************************************************************************

const passport = require("passport")

router.get('/google',
    passport.authenticate('google', {
        scope:
            ['email', 'profile']
    }
    ));

router.get('/google/callback',
    passport.authenticate('google', {
        successRedirect: '/api/v1/auth/google/protected',
        failureRedirect: '/api/v1/auth/google/failure'
    }));

router.get('/google/protected', (req, res) => {
    let name = req.user.userName;
    console.log(name)
    res.send(`Hello ${name}`)
})


router.get('/google/failure', (req, res) => {
    res.send("something went wrong")
})

module.exports = router


