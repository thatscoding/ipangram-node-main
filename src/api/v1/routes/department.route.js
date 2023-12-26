import express from "express";
import { isUserAuthorize } from "../middlewares/userAuthorization.js";
import { isUserAuthenticate } from "../middlewares/userAuthentication.js";
import handleDepartment from "../controllers/department.controller.js";

const router = express.Router();

router
  .route("/register")
  .post(isUserAuthenticate, isUserAuthorize, handleDepartment.register);

router.route("/all").get(isUserAuthenticate, handleDepartment.allDepartments);

router
  .route("/:id")
  .patch(isUserAuthenticate, isUserAuthorize, handleDepartment.updateDepartment)
  .delete(
    isUserAuthenticate,
    isUserAuthorize,
    handleDepartment.deleteDepartment
  )
  .get(isUserAuthenticate, handleDepartment.departmentById);

export default router;
