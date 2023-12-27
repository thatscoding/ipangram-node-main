import { catchAsyncError } from "../middlewares/catchAsyncErrors.js";
import { Department } from "../models/department.model.js";
import { Employee } from "../models/employee.model.js";
import ErrorHandler from "../utils/errorHandle.js";
import { generatePassword, verifyPassword } from "../utils/generatePassword.js";
import { generateToken } from "../utils/generateToken.js";
import handleDepartment from "./department.controller.js";

class handleEmployee {
  static register = catchAsyncError(async (req, res, next) => {
    const { name, age, mobileNumber, email, password, location } = req.body;

    let department = req.body.department ? req.body.department : "new";

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

    const existingDepartment = await Department.findOne({ name: "new" });

    if (existingDepartment) {
      const hashPassword = await generatePassword(password);

      const newEmployee = new Employee({
        name,
        age,
        mobileNumber,
        email,
        location,
        department: existingDepartment._id,
        password: hashPassword,
      });

      await newEmployee.save();
      const doc2 = await Employee.findOne({ email });

      await existingDepartment.employees.push(doc2._id);
      await existingDepartment.save();

      res.status(201).json({
        success: true,
        message: "Successfully registered.",
        user: newEmployee,
      });
    } else {
      const newDept = await Department.create({ name: "new" });
      await newDept.save();

      const dept2 = await Department.findOne({ name: "new" });
      const hashPassword = await generatePassword(password);

      const newEmployee = new Employee({
        name,
        age,
        mobileNumber,
        email,
        location,
        department: dept2._id,
        password: hashPassword,
      });

      await newEmployee.save();

      const newEmp = await Employee.findOne({ email });

      await dept2.employees.push(newEmp._id);
      await dept2.save();

      res.status(201).json({
        success: true,
        message: "Successfully registered.",
        user: newEmployee,
      });
    }
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
    const usersData = await Employee.find();
    // console.log(users);

    if (!usersData || usersData.length === 0) {
      return next(new ErrorHandler("No users found.", 404));
    }

    const page = parseInt(req.query.page) - 1 || 0;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";
    let sort = req.query.sort || "order";
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

    const users = await Employee.find({
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
      users,
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
      return next(new ErrorHandler("No user found.", 404));
    }

    res.status(200).json({ success: true, user });
  });

  static updateEmployee = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
      return next(new ErrorHandler("Id is not found.", 400));
    }

    // let updatedUser;
    let newData = req.body;
    const prevUser = await Employee.findOne({ _id: id });

    if (req.body.password) {
      const hashPassword = await generatePassword(req.body.password);
      newData = { ...req.body, password: hashPassword };
    } else {
      let { password, ...temp } = req.body;
      newData = { ...temp };
    }
    if (req.body.department && req.body.department !== prevUser.department) {
      // remove from the previous department
      let prevDept = await Department.findOne({
        _id: prevUser.department,
      });
      console.log("prevDept", prevDept);

      if (prevDept) {
        await prevDept.employees.pull(id);
        await prevDept.save();
      }

      const addEmpToNewDept = await Department.findOne({
        _id: req.body.department,
      });
      if (addEmpToNewDept) {
        await addEmpToNewDept.employees.push(id);
        await addEmpToNewDept.save();
      }
    }

    console.log("id", id);
    console.log("data", newData);

    const updatedUser = await Employee.findOneAndUpdate(
      { _id: id },
      { $set: newData },
      {
        new: true,
      }
    );

    if (!updatedUser) {
      return next(new ErrorHandler("No user found.", 404));
    }

    res
      .status(200)
      .json({ success: true, user: updatedUser, prevData: newData });
  });

  static deleteEmployee = catchAsyncError(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
      return next(new ErrorHandler("Id is not found.", 400));
    }
    if (id === "658ae06016a113f1c89d9f60") {
      return next(new ErrorHandler("Admin never be deleted.", 400));
    }

    const user = await Employee.findById(id);

    if (!user) {
      return next(new ErrorHandler("User not found.", 404));
    }

    const deptDoc = await Department.findById(user.department);

    if (!deptDoc) {
      return next(new ErrorHandler("Department not found.", 401));
    }

    // Remove employee from the department
    await deptDoc.employees.pull(user._id);
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
      })
      .status(200)
      .json({ success: true, message: "User logout successful" });
  });
}

export default handleEmployee;
