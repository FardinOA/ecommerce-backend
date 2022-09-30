const mongoose = require("mongoose");
const validator = require("validator");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Please Enter Your Name"],
            maxlength: [30, "Name must be below 30 characters"],
            minlength: [4, "Name must be at least 4 characters"],
        },
        email: {
            type: String,
            required: [true, "Please Enter Your Email"],
            unique: true,
            validator: [validator.isEmail, "Please enter a valid email"],
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Please Enter Your Password"],
            minlength: [8, "Password must be at least 8 characters"],
            select: false,
        },
        avatar: {
            public_id: {
                type: String,
                required: true,
            },
            url: {
                type: String,
                required: true,
            },
        },

        role: {
            type: String,
            default: "user",
        },
        resetPasswordToken: String,
        resetPasswordExpire: Date,
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    this.password = await bcryptjs.hash(this.password, 10);
});

// JWT token
userSchema.methods.getJWTToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

//compare password
userSchema.methods.comparePassword = async function (pass) {
    return await bcryptjs.compare(pass, this.password);
};

// generation password reset token

userSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString("hex");

    // hassing & adding to userSchema
    this.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    return resetToken;
};

module.exports = mongoose.model("User", userSchema);
