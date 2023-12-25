import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import { Department } from "../models/department.model.js";
import { Employee } from "../models/employee.model.js";
import ErrorHandler from "../utils/errorHandle.js";
import { generatePassword, verifyPassword } from "../utils/generatePassword.js";
import { generateToken } from "../utils/generateToken.js";
import handleDepartment from "./department.controller.js";

class handleEmployee {
  static register = catchAsyncError(async (req, res, next) => {
    const { name, age, mobileNumber, email, password, location, department } =
      req.body;

    if (
      !name ||
      !age ||
      !mobileNumber ||
      !email ||
      !password ||
      !location ||
      !department
    ) {
      return next(new ErrorHandler("All fields are required.", 400));
    }

    const existingUser = await Employee.findOne({ email });

    if (existingUser) {
      return next(new ErrorHandler("Email Already Registered.", 409));
    }

    const hashPassword = await generatePassword(password);

    const newEmployee = new Employee({
      name,
      age,
      mobileNumber,
      email,
      location,
      department,
      password: hashPassword,
    });

    await newEmployee.save();

    const doc2 = await Employee.findOne({ email });

    let existingDepartment = await Department.findOne({ name: "new" });
    console.log(existingDepartment);

    if (existingDepartment) {
      existingDepartment.employees.push(doc2._id);
      await existingDepartment.save();
    }

    res
      .status(201)
      .json({ success: true, message: "Successfully registered." });
  });

  static login = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body;
    console.log(req.body);

    if (!email || !password) {
      return next(new ErrorHandler("Email and password are required.", 400));
    }

    const user = await Employee.findOne({ email });
    // console.log(user);

    if (!user) {
      return next(new ErrorHandler("Invalid email or password.", 401));
    }

    const isPasswordMatch = await verifyPassword(password, user.password);

    if (!isPasswordMatch) {
      return next(new ErrorHandler("Invalid email or password.", 401));
    }

    const dept = await Department.findOne({ _id: user.department });
    console.log(dept);

    const payload = {
      employeeId: user._id,
      name: user.name,
      age: user.age,
      location: user.location,
      email: user.email,
      mobileNumber: user.mobileNumber,
      department: dept.name,
    };

    const token = await generateToken(payload);

    if (token) {
      res.cookie("token", token).status(200).json({
        success: true,
        message: "Successfully logged in",
        data: payload,
        token: token,
      });
    }
  });

  static allEmployees = catchAsyncError(async (req, res, next) => {
    const users = await Employee.find();
    // console.log(users);

    if (!users || users.length === 0) {
      return next(new ErrorHandler("No users found.", 404)); // Change status code to 404 for "Not Found"
    }

    const page = parseInt(req.query.page) - 1 || 0;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";
    let sort = req.query.sort || "rating";
    let location = req.query.location || "All";

    const result = await Employee.aggregate([{ $group: { _id: "$location" } }]);

    // console.log(result);

    let locationOptions = result.map((data) => {
      return data._id;
    });
    console.log(locationOptions);
    // return res.json({ data: locationOptions });

    location === "All"
      ? (location = [...locationOptions])
      : (location = req.query.location.split(","));
    req.query.sort ? (sort = req.query.sort.split(",")) : (sort = [sort]);

    let sortBy = {};
    if (sort[1]) {
      sortBy[sort[0]] = sort[1];
    } else {
      sortBy[sort[0]] = "asc";
    }

    const user = await Employee.find({
      name: { $regex: search, $options: "i" },
    })
      .where("location")
      .in([...location])
      .sort(sortBy)
      .skip(page * limit)
      .limit(limit);

    const total = await Employee.countDocuments({
      location: { $in: [...location] },
      name: { $regex: search, $options: "i" },
    });

    const response = {
      error: false,
      total,
      page: page + 1,
      limit,
      locations: locationOptions,
      user,
    };

    res.status(200).json({ success: true, response });
  });

  static employeeById = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
      return next(new ErrorHandler("Id is not found.", 400));
    }

    const user = await Employee.findById(id);

    if (!user) {
      return next(new ErrorHandler("No user found.", 404)); // Change status code to 404 for "Not Found"
    }

    res.status(200).json({ success: true, user });
  });

  static updateEmployee = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
      return next(new ErrorHandler("Id is not found.", 400));
    }

    let updatedUser;
    let newData;
    const doc = await Employee.findOne({ email: req.body.email });

    if (req.body.password) {
      const hashPassword = await generatePassword(req.body.password);
      newData = { ...req.body, password: hashPassword };
    } else if (req.body.department) {
      // remove from the previous department
      if (doc && doc.department) {
        let pulloutempyfromcat = await Department.findOne({
          _id: doc.department,
        });

        if (pulloutempyfromcat) {
          pulloutempyfromcat.employees.pull(doc._id);
          await pulloutempyfromcat.save();
        }
      }

      // employee join new department
      let newDepartment = await Department.findOne({
        _id: req.body.department,
      });
      if (newDepartment) {
        newDepartment.employees.push(doc._id);
        await newDepartment.save();
      }

      newData = { ...req.body, department: req.body.department };
    } else {
      const { password, ...nData } = req.body;

      updatedUser = await Employee.findByIdAndUpdate(id, nData, {
        new: true,
      });

      if (!updatedUser) {
        return next(new ErrorHandler("No user found.", 404));
      }

      res.status(200).json({ success: true, user: updatedUser });
      return; // Make sure to exit the function after sending the response
    }

    // Only update the user with newData if newData is defined
    if (newData) {
      updatedUser = await Employee.findByIdAndUpdate(id, newData, {
        new: true,
      });

      if (!updatedUser) {
        return next(new ErrorHandler("No user found.", 404));
      }

      res.status(200).json({ success: true, user: updatedUser });
    }
  });

  static deleteEmployee = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
      return next(new ErrorHandler("Id is not found.", 400));
    }

    const user = await Employee.findById(id);

    if (!user) {
      return next(new ErrorHandler("User not found.", 404));
    }

    const deptDoc = await Department.findById(user.department);

    if (!deptDoc) {
      return next(new ErrorHandler("Department not found.", 404));
    }

    // Remove employee from the department
    deptDoc.employees.pull(user._id);
    await deptDoc.save();

    // Delete the employee
    const deletedUser = await Employee.findByIdAndDelete(id);

    if (!deletedUser) {
      return next(new ErrorHandler("No user found.", 404));
    }

    res.status(200).json({ success: true, user: deletedUser });
  });

  static profile = catchAsyncError(async (req, res, next) => {
    res.status(200).json({ success: true, data: req.user });
  });

  static logout = catchAsyncError(async (req, res, next) => {
    res
      .cookie("token", "", {
        expires: new Date(0), // Set the expiration date to remove the cookie
        httpOnly: true,
      })
      .status(200)
      .json({ success: true, message: "User logout successful" });
  });
}

export default handleEmployee;
