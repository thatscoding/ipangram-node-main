import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./db.js";
import employeeRoute from "../api/routes/employee.route.js";
import departmentRoute from "../api/routes/department.route.js";
import errorMiddleware from "../api/middlewares/error.js";

dotenv.config();

const server = express();
const DB_URL = process.env.DB_URL;

server.use(cors());
server.use(cookieParser());
server.use(express.json());
server.use(express.urlencoded({ extended: false }));

connectDB(DB_URL);

server.get("/", (req, res) => {
  res.send("Welcome to Employee Management System 💐");
});

// routes
server.use("/v1/employees", employeeRoute);
server.use("/v1/departments", departmentRoute);

server.use(errorMiddleware);

export default server;
