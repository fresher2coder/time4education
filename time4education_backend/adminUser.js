import bcrypt from "bcrypt";

const password = "secret123";
const salt = await bcrypt.genSalt(10);
const hashed = await bcrypt.hash(password, salt);
console.log(hashed);
