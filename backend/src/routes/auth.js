const express = require("express");
const User = require("../Models/auth");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing");
}

const isProd = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProd,                 
  sameSite: isProd ? "none" : "lax", 
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

function signToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post("/signin", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = signToken(newUser);

    return res
      .cookie("token", token, cookieOptions)
      .status(201)
      .json({
        success: true,
        message: "Account created successfully",
        token,
        user: {
          name: newUser.name,
          email: newUser.email,
        },
      });
  } catch (err) {
    console.log("Signup Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all fields",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = signToken(user);

    return res
      .cookie("token", token, cookieOptions)
      .status(200)
      .json({
        success: true,
        message: "Login successful",
        token,
        user: {
          name: user.name,
          email: user.email,
        },
      });
  } catch (err) {
    console.log("Login Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        name: req.user.name,
        email: req.user.email,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.post("/logout", (req, res) => {
  try {
    return res
      .clearCookie("token", cookieOptions)
      .status(200)
      .json({
        success: true,
        message: "Logged out successfully",
      });
  } catch (err) {
    console.log("Logout Error:", err);
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
});

module.exports = router;