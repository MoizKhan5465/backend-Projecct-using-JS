import { Router } from "express";
import { loginUser, registerUser } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middileware.js";
import { upload } from "../middlewares/multer.js";

import { refreshToken } from "../controllers/user.controller.js";
import { logout } from "../controllers/user.controller.js";
import { updateUserCoverimage } from "../controllers/user.controller.js";

const router = Router();
router.route("/register").post(
  upload.fields([
    {
      name: "avtar",
      maxCount: 1,
    },
    {
      name: "coverimage",
      maxCount: 1,
    },
  ]),
  registerUser,
);

router.route("/login").post(loginUser);

router.route("/protected").post(refreshToken);

router.route("/logout").post(verifyJWT, logout);

router.route("/updatecoverimage").post(
  verifyJWT,
  upload.single("coverimage"),
  updateUserCoverimage,
);
export default router;
