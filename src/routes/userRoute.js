const express = require("express");
const { isAuth, authRole } = require("../../middleware/auth");
const {
    registerUser,
    loginUser,
    logout,
    forgotPassword,
    resetPassword,
    getUserInfo,
    updatePassword,
    updateUserInfo,
    getAllUsers,
    getSingleUser,
    updateUserRole,
    deleteUser,
    loginUserPhoneNo,
    registerUserWithPhone,
} = require("../controller/userController");
const router = express.Router();

router.post("/register", registerUser);
router.post("/register-with-phone", registerUserWithPhone);
router.post("/login", loginUser);
router.post("/login-with-phone", loginUserPhoneNo);
router.post("/password/forgot", forgotPassword);
router.put("/password/reset/:token", resetPassword);
router.get("/logout", logout);
router.get("/me", isAuth, getUserInfo);
router.put("/password/update", isAuth, updatePassword);
router.put("/me/update", isAuth, updateUserInfo);
router.get("/admin/users", isAuth, authRole("admin"), getAllUsers);
router.get("/admin/user/:id", isAuth, authRole("admin"), getSingleUser);
router.get("/user/:id", isAuth, getSingleUser);
router.put("/admin/user/:id", isAuth, authRole("admin"), updateUserRole);
router.delete("/admin/user/:id", isAuth, authRole("admin"), deleteUser);

module.exports = router;
