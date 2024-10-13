const bcrypt = require("bcrypt");
const User = require("../models/User");
const OTP = require("../models/OTP");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const mailSender = require("../utils/mailSender");
// const { passwordUpdated } = require("../mail/templates/passwordUpdate");
// const Profile = require("../models/Profile");
require("dotenv").config();

exports.sendotp = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user is already present
        // Find user with provided email
        const checkUserPresent = await User.findOne({ email });
        // to be used in case of signup

        // If user found with provided email
        if (checkUserPresent) {
            // Return 401 Unauthorized status code with error message
            return res.status(401).json({
                success: false,
                message: `User is Already Registered`,
            });
        }

        var otp = otpGenerator.generate(4, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        const result = await OTP.findOne({ otp: otp });
        console.log("OTP", otp);
        console.log("Result", result);
        while (result) {
            otp = otpGenerator.generate(4, {
                upperCaseAlphabets: false,
            });
        }
        const otpPayload = { email, otp };
        const otpBody = await OTP.create(otpPayload);
        console.log("OTP Body", otpBody);
        res.status(200).json({
            success: true,
            message: `OTP Sent Successfully`,
            otp,
        });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};

exports.signup = async (req, res) => {
    try {
        const {
            userName,
            email,
            phoneNo,
            password,
            otp,
        } = req.body;

        if (
            !userName ||
            !email ||
            !phoneNo ||
            !password ||
            !otp
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all the fields",
            });
        }

        // Password constraints validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.",
            });
        }

        // Check if user exists or not
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(401).json({
                success: false,
                message: "User already registered",
            });
        }

        // Find most recent OTP for user
        const recentOtp = await OTP.findOne({ email })
            .sort({ createdAt: -1 })
            .limit(1);

        console.log(recentOtp);
        // Validate OTP
        if (!recentOtp) {
            return res.status(401).json({
                success: false,
                message: "OTP Not Found",
            });
        } else if (otp !== recentOtp.otp) {
            return res.status(401).json({
                success: false,
                message: "OTP does not match",
            });
        }

        // Hash password
        const hashPassword = await bcrypt.hash(password, 10);

        // Create user entry in DB
        const user = await User.create({
            userName,
            email,
            phoneNo,
            password: hashPassword,
            profileImage: `https://images.unsplash.com/photo-1575439462433-8e1969065df7?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`,
        });

        const token = jwt.sign(
            { email: user.email, id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "10h" }
        );

        user.token = token;
        user.password = undefined;

        const options = {
            expiresIn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            httpOnly: true,
        };

        // Generate cookie and send response
        res.cookie("token", token, options).status(200).json({
            success: true,
            message: "User logged in successfully",
            user,
        });

    } catch (error) {
        console.log("Error in creating user : ", error.message);
        return res.status(500).json({
            success: false,
            message: `user can not register please try again later: Error ${error}`,
        });
    }
};

exports.login = async (req, res, next) => {
    try {
        // fetch data from body

        const { email, password } = req.body;

        // validate data

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all the fields",
            });
        }

        // check if user exists or not

        const isUser = await User.findOne({ email });

        if (!isUser) {
            return res.status(401).json({
                success: false,
                message: "User is not registered please sign up first",
            });
        }

        let user = {
            id: isUser._id,
            email: isUser.email,
        }

        // check password

        if (await bcrypt.compare(password, isUser.password)) {
            //    generate token
            const token = jwt.sign(
                { email: user.email, id: user.id },
                process.env.JWT_SECRET,
                { expiresIn: "10h" }
            );

            user.token = token;

            const options = {
                expiresIn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                httpOnly: true,
            };

            // generate cookie and send response
            res.cookie("token", token, options).status(200).json({
                success: true,
                message: "User logged in successfully",
                token,
                user
            });
        } else {


            return res.status(401).json({
                success: false,
                message: "Password is incorrect",
            });
        }

    } catch (error) {
        console.log("Error in login", error.message);
        return res.status(500).json({
            success: false,
            message: `login failed please try again later ${error}`,
        });
    }
};

exports.checkUserName = async (req, res) => {
    try {
        const { userName } = req.params;

        // Check if userName is provided
        if (!userName) {
            return res.status(400).json({
                success: false,
                message: "Enter User Name"
            });
        }

        // Constraints for userName
        const minLength = 3;
        const maxLength = 20;
        const validUserNameRegex = /^[a-zA-Z0-9_]+$/; // Allows letters, numbers, and underscores

        // Check userName length
        if (userName.length < minLength || userName.length > maxLength) {
            return res.status(406).json({
                success: false,
                message: `User Name must be between ${minLength} and ${maxLength} characters long`
            });
        }

        // Check for spaces and invalid symbols
        if (!validUserNameRegex.test(userName)) {
            return res.status(406).json({
                success: false,
                message: "User Name must not contain spaces or symbols other than '_'"
            });
        }

        // Check if the userName is already present
        const isPresent = await User.findOne({ userName }); // Use the correct query

        if (!isPresent) {
            return res.status(200).json({
                success: true,
                message: "User Name is available"
            });
        }

        return res.status(406).json({
            success: false,
            message: "User Name not available"
        });
    } catch (error) {
        return res.status(502).json({
            success: false,
            message: `Error while checking user name`
        });
    }
};






// ********************************************************************************************************
//                                      Google Auth Using Passport
// ********************************************************************************************************

const passport = require('passport')

var GoogleStrategy = require('passport-google-oauth2').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/api/v1/auth/google/callback"
},
    async function (accessToken, refreshToken, profile, done) {
        try {
            // Check if user already exists with this Google ID
            let user = await User.findOne({ googleId: profile.id });

            // If not, check if the email already exists from email/password sign up
            if (!user) {
                user = await User.findOne({ email: profile.emails[0].value });
                if (user) {
                    // If the email matches, link the Google ID to the existing user account
                    user.googleId = profile.id;
                    await user.save();
                } else {
                    // If no user found, create a new user with Google login
                    user = new User({
                        googleId: profile.id,
                        email: profile.emails[0].value,
                        name: profile.displayName,
                        profilePicture: profile.photos[0].value
                    });
                    await user.save();
                }
            }

            // Return authenticated user
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }));




passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user)
});

