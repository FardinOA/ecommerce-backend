const ErrorHandeler = require("../../utils/errorHandeler");
const catchAssyncErrors = require("../../middleware/catchAssyncErrors");
const User = require("../models/userModel");
const sendToken = require("../../utils/jwtToken");
const sendEmail = require("../../utils/sendEmail");
const crypto = require("crypto");
const cloudinary = require("cloudinary").v2;
// register a user
exports.registerUser = catchAssyncErrors(async (req, res, next) => {
    const myCloud = await cloudinary.uploader.upload(req.body.avatar, {
        folder: "avatars",
        width: 150,
        crop: "scale",
    });

    const { name, email, password } = req.body;

    const user = await User.create({
        name,
        email,
        password,
        avatar: {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        },
    });

    sendToken(user, 201, res);

    try {
        await sendEmail({
            email: user.email,
            subject: `Welcome To Ecommerce`,
            message: `Welcome ${user.name} to Ecommerce \n Hope you will enjoy your Shopping`,
        });
    } catch (err) {
        return next(new ErrorHandeler(err.message, 500));
    }
});

// login

exports.loginUser = catchAssyncErrors(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorHandeler("Please Enter Email & Password", 400));
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        return next(new ErrorHandeler("Invalid Email or Password", 401));
    }

    const isPassMatch = await user.comparePassword(password);

    if (!isPassMatch) {
        return next(new ErrorHandeler("Invalid Email or Password", 401));
    }

    sendToken(user, 200, res);
});

// logout user
exports.logout = catchAssyncErrors(async (req, res, next) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });
    res.status(200).json({
        success: true,
        message: "User logged out",
    });
});

// forgot password

exports.forgotPassword = catchAssyncErrors(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) return next(new ErrorHandeler("User not found", 404));

    // get the reset token
    const resetToken = user.getResetPasswordToken();
    user.save({ validateBeforeSave: false });
    const resetPasswordUrl = `${req.protocol}://${req.get(
        "host"
    )}/password/reset/${resetToken}`;

    const message = `your password reset token is :- \n\n ${resetPasswordUrl} \n\nif you have not requested this email then, Please ignore it`;

    try {
        await sendEmail({
            email: user.email,
            subject: `Ecommerce Password Recovery`,
            message,
        });

        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email} successfully`,
        });
    } catch (err) {
        console.log(err);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        user.save({ validateBeforeSave: false });
        return next(new ErrorHandeler(err.message, 500));
    }
});

//  reset password

exports.resetPassword = catchAssyncErrors(async (req, res, next) => {
    // creating hash token
    const resetPasswordToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user)
        return next(
            new ErrorHandeler(
                "Reset Password Token is Invalid or has been expired",
                400
            )
        );

    if (req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHandeler("Password does not match", 400));
    }
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    sendToken(user, 200, res);
});

// get my{for all login users} info
exports.getUserInfo = catchAssyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        user,
    });
});

// update password
exports.updatePassword = catchAssyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id).select("+password");
    const isPassMatch = await user.comparePassword(req.body.oldPassword);

    if (!isPassMatch) {
        return next(new ErrorHandeler("Password is incorrect", 400));
    }
    if (req.body.newPassword !== req.body.confirmPassword) {
        return next(new ErrorHandeler("Password does not match", 400));
    }

    if (req.body.newPassword === req.body.oldPassword) {
        return next(
            new ErrorHandeler(
                "You are changing your current password to current password",
                400
            )
        );
    }
    user.password = req.body.newPassword;
    await user.save();
    sendToken(user, 200, res);
});

// update user info
exports.updateUserInfo = catchAssyncErrors(async (req, res, next) => {
    const newUserInfo = {
        name: req.body.name,
        email: req.body.email,
    };
    if (req.body.avatar !== "") {
        const user = await User.findById(req.user.id);

        const imageId = user.avatar.public_id;
        await cloudinary.uploader.destroy(imageId);

        const myCloud = await cloudinary.uploader.upload(req.body.avatar, {
            folder: "avatars",
            width: 150,
            crop: "scale",
        });

        newUserInfo.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
        };
    }

    const user = await User.findByIdAndUpdate(req.user.id, newUserInfo, {
        new: true,
        runValidators: true,
        useFindAndModify: true,
    });
    res.status(200).json({
        success: true,
        message: "User updated successfully",
    });
});

// get all users {by admin}
exports.getAllUsers = catchAssyncErrors(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({ success: true, users });
});

// get single user {by admin}
exports.getSingleUser = catchAssyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(
            new ErrorHandeler(
                `User does not exist with id: ${req.params.id}`,
                400
            )
        );
    }
    res.status(200).json({ success: true, user });
});

// update user role -- admin
exports.updateUserRole = catchAssyncErrors(async (req, res, next) => {
    const newUserInfo = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
    };

    const user = await User.findByIdAndUpdate(req.params.id, newUserInfo, {
        new: true,
        runValidators: true,
        useFindAndModify: true,
    });
    res.status(200).json({ success: true });
});

// delete user -- admin

exports.deleteUser = catchAssyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(
            new ErrorHandeler(
                `User does not exist with id: ${req.params.id}`,
                400
            )
        );
    }

    const imageId = user.avatar.public_id;
    await cloudinary.uploader.destroy(imageId);
    await user.remove();
    res.status(200).json({
        success: true,
        message: "User deleted successfully",
    });
});
