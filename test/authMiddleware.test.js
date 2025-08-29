import jwt from "jsonwebtoken";
import authMiddleware from "../src/app/middlewares/authMiddleware.js";

jest.mock("jsonwebtoken");

describe("AuthMiddleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();

    process.env.JWT_SECRET = "test_secret";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("deve retornar 401 se token estiver ausente", () => {
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Token de autenticação ausente" });
    expect(next).not.toHaveBeenCalled();
  });

  it("deve retornar 401 se token for inválido", () => {
    req.headers.authorization = "Bearer token_invalido";
    jwt.verify.mockImplementation(() => {
      throw new Error("Token inválido");
    });

    authMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith("token_invalido", "test_secret");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Token de autenticação inválido" });
    expect(next).not.toHaveBeenCalled();
  });

  it("deve chamar next se token for válido", () => {
    req.headers.authorization = "Bearer token_valido";
    jwt.verify.mockReturnValue({ id: 1 });

    authMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith("token_valido", "test_secret");
    expect(req.userId).toBe(1);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
