import express from "express";
import { isUserAuthorize } from "../middlewares/userAuthorization.js";
import { isUserAuthenticate } from "../middlewares/userAuthentication.js";
import handleDepartment from "../controllers/department.controller.js";

const router = express.Router();

router.route("/register").post(handleDepartment.register);

router.route("/all").get(handleDepartment.allDepartments);

router
  .route("/:id")
  .patch(isUserAuthenticate, handleDepartment.updateDepartment)
  .delete(isUserAuthenticate, handleDepartment.deleteDepartment)
  .get(isUserAuthenticate, handleDepartment.departmentById);

export default router;
