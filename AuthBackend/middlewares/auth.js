const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");

//auth
exports.auth = async (req, res, next) => {

    try {

        // extract token
        const token = req.cookies.token || req.body.token || req.header("Authorization").replace("Bearer ", "");

        // token missing 
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No token provided"
            })
        }


        // verify token
        try {
            const decode = jwt.verify(token, process.env.JWT_SECRET);

            // console.log(decode);
            req.user = decode;

        } catch (error) {

            return res.status(401).json({
                success: false,
                message: "token is invalid"
            });

        }
        next();

    } catch (error) {
        console.log("Error in authentication : ", error);
        return res.status(500).json({
            success: false,
            message: `something went wrong while validating token. \nError: ${error}`
        });

    }

}

