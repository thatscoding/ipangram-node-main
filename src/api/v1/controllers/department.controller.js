import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import { Department } from "../models/department.model.js";
import ErrorHandler from "../utils/errorHandle.js";

class handleDepartment {
  static register = catchAsyncError(async (req, res, next) => {
    const { name, employee } = req.body;
    console.log("working");

    let existingDepartment = await Department.findOne({ name });
    console.log(existingDepartment);

    if (existingDepartment) {
      if (employee) {
        await existingDepartment.employees.push(employee);
        await existingDepartment.save();

        return res
          .status(200)
          .json({ success: true, message: "Successfully updated." });
      } else {
        return res
          .status(401)
          .json({ success: false, message: "Name is already Exist." });
      }
    } else {
      let newDepartment = await Department.create({
        name: name,
      });

      if (employee) {
        await newDepartment.employees.push(employee);
      }
      await newDepartment.save();

      return res
        .status(201)
        .json({ success: true, message: "Successfully created." });
    }

    return res
      .status(400)
      .json({ success: false, message: "Invalid request." });
  });

  static allDepartments = catchAsyncError(async (req, res, next) => {
    const docs = await Department.find();

    if (!docs || docs.length === 0) {
      // Check if docs is empty
      return next(new ErrorHandler("No documents found.", 404));
    }

    res.status(200).json({ success: true, docs });
  });

  static departmentById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
      return next(new ErrorHandler("Id is not found.", 400));
    }

    const doc = await Department.findById(id);

    if (!doc) {
      return next(new ErrorHandler("No department found.", 404));
    }

    res.status(200).json({ success: true, doc });
  });

  static updateDepartment = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;
    const { name } = req.body;
    // console.log("working");

    if (!id) {
      return next(new ErrorHandler("Id is not found.", 400));
    }
    if (!name) {
      return next(new ErrorHandler("Data is required", 400));
    }

    const updatedDepartment = await Department.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedDepartment) {
      return next(new ErrorHandler("No department found.", 404));
    }

    res.status(200).json({ success: true, department: updatedDepartment });
  });

  static deleteDepartment = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
      return next(new ErrorHandler("Id is not found.", 400));
    }

    const doc = await Department.findOne({ _id: id });

    if (doc.name === "manager") {
      return next(new ErrorHandler("Manger can't be Deleted.", 401));
    }

    if (doc.employees.length === 0) {
      console.log("djflakjdfl");
      const deletedDepartment = await Department.findByIdAndDelete(id);

      if (!deletedDepartment) {
        return next(new ErrorHandler("No department found.", 404));
      }

      return res
        .status(200)
        .json({ success: true, department: deletedDepartment });
    }

    return next(
      new ErrorHandler(
        "Error! To delete Department; Employees should be 0.",
        401
      )
    );
  });
}

export default handleDepartment;
