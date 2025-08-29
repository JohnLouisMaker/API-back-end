import User from "../models/users.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

class AuthController {
  async authenticate(req, res) {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email e senha são obrigatórios" });

    const user = await User.findOne({
      where: { email },
      attributes: ["id", "name", "email", "password_hash"],
    });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Senha incorreta" });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "secret", {
      expiresIn: "3d",
    });

    const { password_hash, ...userData } = user.toJSON();
    return res.status(200).json({ ...userData, token });
  }
}

export default new AuthController();
