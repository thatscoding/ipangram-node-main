import bcrypt from "bcrypt";

export const generatePassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    return hashPassword;
  } catch (error) {
    console.log(error);
  }
};

export const verifyPassword = async (password, hashPassword) => {
  try {
    return await bcrypt.compare(password, hashPassword);
  } catch (error) {
    console.log(error);
  }
};
