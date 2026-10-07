import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { findUserByEmail, createUser } from '../models/userModel.js';

// 1. Registrar usuário (POST /auth/register)
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: "E-mail já cadastrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await createUser({
      name,
      email,
      password: hashedPassword
    });

    return res.status(201).json(newUser);
  } catch (error) {
    return res.status(500).json({ message: "Erro interno no servidor" });
  }
};

// 2. Login (POST /auth/login)
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const token = jwt.sign(
      { id: user.id_users_pk, email: user.email },
      process.env.JWT_SECRET || "chave_secreta",
      { expiresIn: '8h' }
    );

    return res.status(200).json({ token });
  } catch (error) {
    return res.status(500).json({ message: "Erro interno no servidor" });
  }
};
