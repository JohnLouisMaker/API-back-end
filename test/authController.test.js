import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import AuthController from "../src/app/controllers/authController.js";
import User from "../src/app/models/users.js";

jest.mock("jsonwebtoken");
jest.mock("bcryptjs");
jest.mock("../src/app/models/users.js");

describe("AuthController", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    process.env.JWT_SECRET = "test_secret";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("authenticate", () => {
    it("deve retornar 404 se usuário não for encontrado", async () => {
      User.findOne.mockResolvedValue(null);
      req.body = { email: "inexistente@teste.com", password: "senha123" };

      await AuthController.authenticate(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: "inexistente@teste.com" } });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Usuário não encontrado" });
    });

    it("deve retornar 401 se a senha estiver incorreta", async () => {
      const mockUser = {
        id: 1,
        email: "teste@teste.com",
        password_hash: "hash_senha_correta",
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);
      req.body = { email: "teste@teste.com", password: "senha_errada" };

      await AuthController.authenticate(req, res);

      expect(bcrypt.compare).toHaveBeenCalledWith("senha_errada", "hash_senha_correta");
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Senha incorreta" });
    });

    it("deve retornar token JWT se autenticação for bem-sucedida", async () => {
      const mockUser = {
        id: 1,
        email: "teste@teste.com",
        password_hash: "hash_senha_correta",
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("token_jwt_gerado");

      req.body = { email: "teste@teste.com", password: "senha_correta" };

      await AuthController.authenticate(req, res);

      expect(jwt.sign).toHaveBeenCalledWith({ id: 1 }, "test_secret", { expiresIn: "3d" });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ token: "token_jwt_gerado" });
    });
  });
});
