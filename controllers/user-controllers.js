const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error");
const sgMail = require("@sendgrid/mail");
const nodemailer = require("nodemailer");
const mailgun = require("mailgun-js");

const mg = mailgun({
  apiKey: process.env.MAILGUN_API_KEY,
  domain: process.env.MAILGUN_DOMAIN_NAME,
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const url = process.env.DB_URL;
mongoose.connect(url).then(() => console.log("Connected!"));

const login = async (req, res, next) => {
  const { email, password } = req.body;
  let user;
  try {
    user = await User.findOne({ email });
  } catch (err) {
    const error = new HttpError(
      "Can't get user right now, try again later",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError(
      "We can't find an account with that email address",
      401
    );
    return next(error);
  }
  let match;
  try {
    match = await bcrypt.compare(password, user.password);
  } catch (err) {
    const error = new HttpError("Can't login, try again", 500);
    return next(error);
  }
  if (!match) {
    const error = new HttpError("Invalid email or password", 401);
    return next(error);
  }
  let token;
  try {
    token = jwt.sign(
      {
        userId: user.id,
        name: user.name,
        admin: user.admin,
        email: user.email,
        verified: user.verified,
      },
      process.env.TOKEN_SECRET,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Logging in failed, try again later", 500);
    return next(error);
  }
  res.status(200).json({
    userId: user.id,
    name: user.name,
    email: user.email,
    admin: user.admin,
    verified: user.verified,
    token,
  });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError("Invalid inputs passed!", 422);
    return next(error);
  }
  const { firstName, lastName, email, password } = req.body;
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError("Could not create user, try again", 500);
    return next(error);
  }
  let hasUser;
  try {
    hasUser = await User.findOne({ email });
  } catch (err) {
    const error = new HttpError(
      "Can't get user right now, try again later",
      500
    );
    return next(error);
  }
  if (hasUser) {
    const error = new HttpError("Email already exists!", 422);
    return next(error);
  }

  const newUser = new User({
    name: { firstName, lastName },
    email,
    password: hashedPassword,
    orders: [],
    reviews: [],
  });
  try {
    await newUser.save();
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }
  jwt.sign(
    { user: newUser.id },
    process.env.EMAIL_SECRET,
    { expiresIn: "1h" },
    (err, emailToken) => {
      const url = `${process.env.BACKEND_URL}/api/user/verify/${emailToken}`;
      const msg = {
        to: newUser.email,
        from: process.env.NODE_EMAIL,
        subject: "Account verification",
        html: `<strong>Please verify your account:</strong><br/><a href="${url}">${url}</a><br/><p>This link will expire in 1 hour.</p>`,
      };
      sgMail
        .send(msg)
        .then(() => {
          console.log("Email sent");
        })
        .catch((error) => {
          console.error(error);
        });
    }
  );

  let token;
  try {
    token = jwt.sign(
      {
        userId: newUser.id,
        name: newUser.name,
        admin: newUser.admin,
        email: newUser.email,
      },
      process.env.TOKEN_SECRET,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError(
      "Can't create user right now, try again later",
      500
    );
    return next(error);
  }
  res.status(201).json({ userId: newUser.id, token });
};

const support = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError("Invalid inputs passed!", 422);
    return next(error);
  }
  const { email, subject, message } = req.body;
  const data = {
    from: email,
    to: process.env.NODE_EMAIL,
    subject: subject,
    text: message,
  };
  mg.messages().send(data, (err, body) => {
    if (err) {
      const error = new HttpError(
        "Can't send email right now, try again later",
        500
      );
      return next(error);
    }
    res.status(201).json({ message: "Email sent succssfully" });
  });
};

const verify = async (req, res, next) => {
  const token = req.params.token;

  jwt.verify(token, process.env.EMAIL_SECRET, async (err, decoded) => {
    if (err) {
      console.log(err);
      const error = new HttpError("Invalid token", 401);
      return next(error);
    }
    try {
      const user = await User.findOne({ id: decoded.user });
      if (user.verified === true) {
        const error = new HttpError("Email already verified", 401);
        return next(error);
      }
      user.verified = true;
      await user.save();
      const msg = {
        to: user.email,
        from: process.env.NODE_EMAIL,
        subject: "Account verification",
        html: `<strong>Your email was verfied successfully</strong>`,
      };
      sgMail
        .send(msg)
        .then(() => {
          console.log("Email sent");
        })
        .catch((err) => {
          const error = new HttpError(
            "Can't sent email rightnow, try later",
            500
          );
          return next(error);
        });
    } catch (err) {
      const error = new HttpError("Can't verify user right now", 500);
      return next(error);
    }
    res.status(201).json({ message: "Email verified succssfully" });
  });
};

const forgetPassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError("Invalid inputs passed!", 422);
    return next(error);
  }
  const email = req.body.email;
  let user;
  try {
    user = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Can't get user right now, try again later",
      500
    );
    return next(error);
  }
  if (!user) {
    const error = new HttpError("User with this email does not exists", 401);
    return next(error);
  }
  jwt.sign(
    { user: user.id },
    process.env.RESET_SECRET,
    { expiresIn: "20m" },
    (err, resetToken) => {
      const url = `${process.env.BACKEND_URL}/reset/${resetToken}`;
      const msg = {
        to: user.email,
        from: process.env.NODE_EMAIL,
        subject: "Reset password link",
        html: `<strong>Reset password link:</strong><br/><a href="${url}">${url}</a><br/><p>This link will expire in 20 minutes.</p>`,
      };
      sgMail
        .send(msg)
        .then(() => {
          user.resetToken = resetToken;
          user.save((err, result) => {
            if (err) {
              const error = new HttpError("Something went wrong", 500);
              return next(error);
            }
            res.status(201).json({ message: "Reset email sent successfully" });
          });
        })
        .catch((err) => {
          const error = new HttpError(
            "Can't sent email rightnow, try later",
            500
          );
          return next(error);
        });
    }
  );
};

const resetPassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError("Invalid inputs passed!", 422);
    return next(error);
  }
  const { resetLink, newPassword } = req.body;

  jwt.verify(resetLink, process.env.RESET_SECRET, async (err, decoded) => {
    if (err) {
      const error = new HttpError("Invalid token", 401);
      return next(error);
    }
    let user;
    try {
      user = await User.findOne({ resetToken: resetLink });
    } catch (err) {
      const error = new HttpError(
        "Can't get user right now, try again later",
        500
      );
      return next(error);
    }
    if (!user) {
      const error = new HttpError("User with this email does not exists", 401);
      return next(error);
    }
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(newPassword, 12);
    } catch (err) {
      const error = new HttpError("Could not reset password, try again", 500);
      return next(error);
    }
    user.password = hashedPassword;
    try {
      await user.save();
    } catch (err) {
      const error = new HttpError("Something went wrong", 500);
      return next(error);
    }

    res.status(201).json({ message: "Password has been reset successfully" });
    const msg = {
      to: user.email,
      from: process.env.NODE_EMAIL,
      subject: "Password resetting",
      html: `<strong>Your password has been reset successfully</strong>`,
    };
    sgMail
      .send(msg)
      .then(() => {})
      .catch((err) => {
        const error = new HttpError(
          "Can't sent email rightnow, try later",
          500
        );
        return next(error);
      });
  });
};

const getUser = async (req, res, next) => {
  const { uid } = req.params;
  let user;
  try {
    user = await User.findOne({ _id: uid })
      .populate("orders")
      .populate({
        path: "reviews",
        select: { creator: 0 },
        populate: {
          path: "product",
          model: "Product",
          select: "title",
        },
      })
      .select({ password: 0 });
  } catch (err) {
    const error = new HttpError(
      "Can't get user right now, try again later",
      500
    );
    return next(error);
  }
  if (!user) {
    const error = new HttpError("User with this email does not exists", 401);
    return next(error);
  }
  res.status(201).json({ user });
};

exports.login = login;
exports.forgetPassword = forgetPassword;
exports.resetPassword = resetPassword;
exports.support = support;
exports.signup = signup;
exports.verify = verify;
exports.getUser = getUser;
