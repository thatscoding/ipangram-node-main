import jwt from "jsonwebtoken";

export const generateToken = (payload) => {
  try {
    const token = jwt.sign(payload, process.env.SECRET_KEY, {
      expiresIn: "5d",
    });
    return token;
  } catch (error) {
    console.log(error);
  }
};

export const verifyToken = (token) => {
  try {
    const payload = jwt.verify(token, process.env.SECRET_KEY);
    return payload;
  } catch (error) {
    console.log(error);
  }
};
