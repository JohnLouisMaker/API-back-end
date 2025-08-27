import * as dateFns from "date-fns";
import * as yup from "yup";
import bcrypt from "bcryptjs";
import UsersController from "../src/app/controllers/usersController.js";
import User from "../src/app/models/users.js";

// ==== Mocks ====
jest.mock("yup", () => {
  const actualYup = jest.requireActual("yup");
  const mockString = {
    required: jest.fn().mockReturnThis(),
    email: jest.fn().mockReturnThis(),
    oneOf: jest.fn().mockReturnThis(),
    min: jest.fn().mockReturnThis(),
    notRequired: jest.fn().mockReturnThis(),
  };
  const mockShape = { validate: jest.fn() };
  return {
    ValidationError: actualYup.ValidationError,
    string: jest.fn(() => mockString),
    object: jest.fn(() => ({
      shape: jest.fn(() => mockShape),
    })),
  };
});

jest.mock("sequelize", () => {
  const actualSequelize = jest.requireActual("sequelize");
  return {
    ...actualSequelize,
    Op: { iLike: Symbol("iLike"), in: Symbol("in"), gte: Symbol("gte"), lte: Symbol("lte") },
  };
});

jest.mock("date-fns", () => ({
  isValid: jest.fn(),
  parseISO: jest.fn(),
}));

jest.mock("bcryptjs");
jest.mock("../src/app/models/users.js");

// ==== Testes ====
describe("UsersController", () => {
  let req, res, errorSpy;
  const mockValidate = jest.fn();
  const mockShape = { validate: mockValidate };

  beforeEach(() => {
    yup.string.mockReturnValue({
      required: jest.fn().mockReturnThis(),
      email: jest.fn().mockReturnThis(),
      oneOf: jest.fn().mockReturnThis(),
      min: jest.fn().mockReturnThis(),
      notRequired: jest.fn().mockReturnThis(),
    });
    yup.object.mockReturnValue({ shape: jest.fn(() => mockShape) });

    dateFns.isValid.mockReturnValue(true);
    dateFns.parseISO.mockImplementation((d) => new Date(d));

    req = { params: {}, query: {}, body: {} };
    res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);

    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    errorSpy.mockRestore();
  });

  // ===== INDEX ===== //
  describe("index", () => {
    it("deve retornar lista de usuários", async () => {
      const mockData = { count: 1, rows: [{ id: 1, name: "João" }] };
      User.findAndCountAll.mockResolvedValue(mockData);

      await UsersController.index(req, res);

      expect(res.json).toHaveBeenCalledWith({
        data: mockData.rows,
        pagination: { total: 1, page: 1, limit: 25, totalPages: 1 },
      });
    });

    it("deve retornar erro 400 para data inválida", async () => {
      req.query.createdAfter = "inválida";
      dateFns.isValid.mockReturnValue(false);
      await UsersController.index(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ===== SHOW ===== //
  describe("show", () => {
    it("deve retornar usuário específico", async () => {
      req.params.id = "1";
      const mockUser = { id: 1, name: "João" };
      User.findByPk.mockResolvedValue(mockUser);

      await UsersController.show(req, res);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it("deve retornar 404 se não encontrado", async () => {
      req.params.id = "999";
      User.findByPk.mockResolvedValue(null);

      await UsersController.show(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ===== CREATE ===== //
  describe("create", () => {
    it("deve criar novo usuário", async () => {
      req.body = {
        name: "João",
        email: "joao@email.com",
        password: "12345678",
        passwordConfirm: "12345678",
      };
      mockValidate.mockResolvedValue(req.body);
      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed");

      const mockUser = { toJSON: () => ({ id: 1, ...req.body, password_hash: "hashed" }) };
      User.create.mockResolvedValue(mockUser);

      await UsersController.create(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 1, name: "João" }));
    });
  });

  // ===== UPDATE ===== //
  describe("update", () => {
    it("deve atualizar usuário", async () => {
      req.params.id = "1";
      req.body = { name: "João Atualizado" };
      mockValidate.mockResolvedValue(req.body);

      const mockUser = {
        update: jest.fn().mockResolvedValue(true),
        toJSON: () => ({ id: 1, ...req.body }),
      };
      User.findByPk.mockResolvedValue(mockUser);

      await UsersController.update(req, res);
      expect(mockUser.update).toHaveBeenCalledWith(req.body);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: "João Atualizado" }));
    });
  });

  // ===== DESTROY ===== //
  describe("destroy", () => {
    it("deve deletar usuário", async () => {
      req.params.id = "1";
      const mockUser = { destroy: jest.fn().mockResolvedValue(true) };
      User.findByPk.mockResolvedValue(mockUser);

      await UsersController.destroy(req, res);
      expect(mockUser.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });
});
