import * as dateFns from "date-fns";
import * as yup from "yup";
import bcrypt from "bcryptjs";
import UsersController from "../src/app/controllers/usersController.js";
import User from "../src/app/models/users.js";

//// MOCKS
jest.mock("yup", () => {
  const actualYup = jest.requireActual("yup");

  const mockValidate = jest.fn();

  const mockString = {
    required: jest.fn().mockReturnThis(),
    email: jest.fn().mockReturnThis(),
    oneOf: jest.fn().mockReturnThis(),
    notRequired: jest.fn().mockReturnThis(),
    min: jest.fn().mockReturnThis(),
    when: jest.fn().mockReturnThis(),
  };

  const mockShape = { validate: mockValidate };

  return {
    ...actualYup, // mantém yup.ref, yup.number etc
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
    Op: {
      iLike: Symbol("iLike"),
      in: Symbol("in"),
      gte: Symbol("gte"),
      lte: Symbol("lte"),
    },
  };
});

jest.mock("date-fns", () => ({
  isValid: jest.fn(),
  parseISO: jest.fn(),
}));

jest.mock("bcryptjs");
jest.mock("../src/app/models/users.js");

//// MOCK VARS
const mockValidate = jest.fn();
const mockShape = { validate: mockValidate };

//// TEST SUITE
describe("UsersController", () => {
  let req, res, errorSpy;

  beforeEach(() => {
    // reset do mock do yup
    yup.object.mockImplementation(() => ({
      shape: jest.fn(() => mockShape),
    }));

    dateFns.isValid.mockReturnValue(true);
    dateFns.parseISO.mockImplementation((date) => new Date(date));

    req = { params: {}, query: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    errorSpy.mockRestore();
  });

  //// INDEX
  describe("index", () => {
    it("deve retornar lista de usuários com filtros", async () => {
      req.query = { name: "John", page: "1", limit: "10" };

      const mockData = { count: 1, rows: [{ id: 1, name: "John" }] };
      User.findAndCountAll.mockResolvedValue(mockData);

      await UsersController.index(req, res);

      expect(User.findAndCountAll).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        data: mockData.rows,
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });
    });

    it("deve retornar erro 400 para data inválida", async () => {
      req.query = { createdAfter: "invalid-date" };
      dateFns.isValid.mockReturnValue(false);

      await UsersController.index(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Data inválida em createdAfter" });
    });
  });

  //// SHOW
  describe("show", () => {
    it("deve retornar usuário específico", async () => {
      req.params.id = "1";
      const mockUser = { id: 1, name: "John" };
      User.findByPk.mockResolvedValue(mockUser);

      await UsersController.show(req, res);

      expect(User.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it("deve retornar 404 se não encontrado", async () => {
      req.params.id = "99";
      User.findByPk.mockResolvedValue(null);

      await UsersController.show(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Usuário não encontrado" });
    });

    it("deve retornar 400 se id inválido", async () => {
      req.params.id = "abc";
      await UsersController.show(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "ID inválido" });
    });
  });

  //// CREATE
  describe("create", () => {
    it("deve criar usuário válido", async () => {
      req.body = {
        name: "John",
        email: "john@mail.com",
        password: "12345678",
        passwordConfirm: "12345678",
      };
      mockValidate.mockResolvedValue(req.body);

      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed");

      const mockUser = {
        id: 1,
        name: "John",
        email: "john@mail.com",
        toJSON: () => ({ id: 1, name: "John", email: "john@mail.com" }),
      };
      User.create.mockResolvedValue(mockUser);

      await UsersController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        id: 1,
        name: "John",
        email: "john@mail.com",
      });
    });

    it("deve retornar erro de validação", async () => {
      const mockError = new yup.ValidationError(["Nome é obrigatório"], {}, "name");
      mockValidate.mockRejectedValue(mockError);

      await UsersController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Erro de validação",
        details: ["Nome é obrigatório"],
      });
    });

    it("deve retornar erro se email duplicado", async () => {
      req.body = {
        name: "John",
        email: "dup@mail.com",
        password: "12345678",
        passwordConfirm: "12345678",
      };
      mockValidate.mockResolvedValue(req.body);
      User.findOne.mockResolvedValue({ id: 1 });

      await UsersController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "E-mail já cadastrado" });
    });
  });

  //// UPDATE
  describe("update", () => {
    it("deve atualizar nome do usuário", async () => {
      req.params.id = "1";
      req.body = { name: "Novo Nome" };
      mockValidate.mockResolvedValue(req.body);

      const mockUser = {
        id: 1,
        password_hash: "hash",
        update: jest.fn().mockResolvedValue(true),
        toJSON: () => ({ id: 1, name: "Novo Nome" }),
      };
      User.findByPk.mockResolvedValue(mockUser);

      await UsersController.update(req, res);

      expect(mockUser.update).toHaveBeenCalledWith({ name: "Novo Nome" });
      expect(res.json).toHaveBeenCalledWith({ id: 1, name: "Novo Nome" });
    });

    it("deve exigir senha antiga ao mudar email", async () => {
      req.params.id = "1";
      req.body = { email: "new@mail.com" };
      mockValidate.mockResolvedValue(req.body);

      User.findByPk.mockResolvedValue({ id: 1, password_hash: "hash" });

      await UsersController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Senha antiga é necessária para atualizar email ou senha",
      });
    });

    it("deve retornar erro de validação", async () => {
      req.params.id = "1";
      const mockError = new yup.ValidationError(["E-mail inválido"], {}, "email");
      mockValidate.mockRejectedValue(mockError);

      await UsersController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Erro de validação",
        details: ["E-mail inválido"],
      });
    });
  });

  //// DESTROY
  describe("destroy", () => {
    it("deve deletar usuário existente", async () => {
      req.params.id = "1";
      const mockUser = { id: 1, destroy: jest.fn().mockResolvedValue(true) };
      User.findByPk.mockResolvedValue(mockUser);

      await UsersController.destroy(req, res);

      expect(mockUser.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("deve retornar 404 se não encontrado", async () => {
      req.params.id = "99";
      User.findByPk.mockResolvedValue(null);

      await UsersController.destroy(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Usuário não encontrado" });
    });
  });
});
