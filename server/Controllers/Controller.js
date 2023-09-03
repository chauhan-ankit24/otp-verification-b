const User = require("../server/Models/user");
const { isEmail } = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const TOKEN_KEY = process.env.TOKEN_KEY;


const login = async (req, res) => {
  try {
    const { password, email } = req.body;
    if (!password && !email) {
      return res.send({ msg: "Please Enter the Details", status: 400 });
    }
    if (typeof password !== "string" && typeof email !== "string") {
      return res.send({ msg: "input must be a string", status: 400 });
    }
    if (password.trim().length == 0 || email.trim().length == 0) {
      return res.send({ msg: "All inputs are required", status: 400 });
    }
    const user = await User.find({ email: email.toLowerCase() });
    if (user.length == 0) {
      return res.send({ status: 400, msg: "User not found !" });
    }
    const auth = await bcrypt.compare(password, user[0].password);
    if (!auth) {
      return res.send({ msg: "Wrong Password", status: 400 });
    }
    res.send({ msg: "login succesfully", status: 200, user: user[0] });
  } catch (error) {
    res.send({ msg: "internal server error", status: 500 });
  }
};

const register = async (req, res) => {
  try {
    const { name, password, email } = req.body;

    if (!name || !password || !email) {
      return res.send({ msg: "All fields are required", status: 400 });
    }

    if (password.length < 8) {
      return res.send({ msg: "Password must be at least 8 characters long", status: 400 });
    }

    let existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      // If the user already exists, update their data
      existingUser.name = name;
      existingUser.password = await bcrypt.hash(password, 11);
      await existingUser.save();

      const token = jwt.sign(
        { user_id: existingUser._id, email },
        TOKEN_KEY,
        { expiresIn: "10d" }
      );
      existingUser.token = token;
      await existingUser.save();

      return res.send({ msg: "User information updated", status: 200, user: existingUser });
    }

    const encryptedPassword = await bcrypt.hash(password, 11);
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: encryptedPassword,
    });

    const token = jwt.sign(
      { user_id: newUser._id, email },
      TOKEN_KEY,
      { expiresIn: "10d" }
    );
    newUser.token = token;
    await newUser.save();

    res.send({ msg: "User created", status: 200, user: newUser });
  } catch (error) {
    console.error('Error during registration:', error);

    if (error.name === 'ValidationError') {
      res.send({ msg: "Validation error", status: 400, error });
    } else {
      res.send({ msg: "Internal server error", status: 500, error });
    }
  }
};



const sendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const min = 1000;
    const max = 9999;
    const otp = Math.floor(Math.random() * (max - min + 1)) + min;

    let existingUser = await User.findOne({ email });

    if (existingUser) {
      existingUser.otp = otp;
      await existingUser.save();
    } else {
      existingUser = new User({ email, otp });
      await existingUser.save();
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "akashchauhan72520@gmail.com",
        pass: "mmdaudzbxrotscir",
      },
    });
    const mailOptions = {
      from: '"Medical"<akashchauhan72520@gmail.com>',
      to: email,
      subject: "Verification",
      text: `Your OTP for verification is: ${otp}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);

    res.send('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('Error sending email');
  }
};



const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  console.log("req body", req.body);

  try {
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).send('User not found');
      return;
    }

    if (user.otp === otp) {
      console.log("OTP verified");
      res.send('OTP verified successfully');
    } else {
      res.send('Incorrect OTP');
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).send('Error verifying OTP');
  }
};


module.exports = { login, register, sendOTP, verifyOTP }