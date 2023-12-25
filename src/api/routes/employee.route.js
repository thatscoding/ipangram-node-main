import express from "express";
import handleEmployee from "../controllers/employee.controller.js";
import { isUserAuthorize } from "../middlewares/userAuthorization.js";
import { isUserAuthenticate } from "../middlewares/userAuthentication.js";

const router = express.Router();

router.route("/register").post(handleEmployee.register);
router.route("/login").post(handleEmployee.login);
router
  .route("/profile")
  .get(isUserAuthenticate, isUserAuthorize, handleEmployee.profile);
router.route("/logout").get(isUserAuthenticate, handleEmployee.logout);

router.route("/all").get(handleEmployee.allEmployees);

router
  .route("/:id")
  .patch(isUserAuthenticate, handleEmployee.updateEmployee)
  .delete(isUserAuthenticate, handleEmployee.deleteEmployee)
  .get(isUserAuthenticate, handleEmployee.employeeById);

export default router;
