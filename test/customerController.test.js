import * as dateFns from "date-fns";
import * as yup from "yup";
import CustomersController from "../src/app/controllers/customersController.js";
import Customers from "../src/app/models/customers.js";

// ==== Mock de módulos externos ==== //
jest.mock("yup", () => {
  const actualYup = jest.requireActual("yup");
  const mockString = {
    required: jest.fn().mockReturnThis(),
    email: jest.fn().mockReturnThis(),
    oneOf: jest.fn().mockReturnThis(),
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

jest.mock("../src/app/models/customers.js");
jest.mock("../src/app/models/contacts.js");

// ==== Yup Mocks ==== //
const mockValidate = jest.fn();
const mockShape = { validate: mockValidate };
const mockString = {
  required: jest.fn().mockReturnThis(),
  email: jest.fn().mockReturnThis(),
  oneOf: jest.fn().mockReturnThis(),
  notRequired: jest.fn().mockReturnThis(),
};

// ==== Testes ==== //
describe("CustomersController", () => {
  let req, res, errorSpy;

  beforeEach(() => {
    yup.string.mockImplementation(() => mockString);
    yup.object.mockImplementation(() => ({
      shape: jest.fn(() => mockShape),
    }));

    dateFns.isValid.mockReturnValue(true);
    dateFns.parseISO.mockImplementation((date) => new Date(date));

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
    it("deve retornar lista de clientes com filtros", async () => {
      req.query = { name: "João", page: "1", limit: "10" };

      const mockData = {
        count: 1,
        rows: [{ id: 1, name: "João", contacts: [] }],
      };
      Customers.findAndCountAll.mockResolvedValue(mockData);

      await CustomersController.index(req, res);

      expect(Customers.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.any(Object),
          }),
          limit: 10,
          offset: 0,
        }),
      );
      expect(res.json).toHaveBeenCalledWith({
        data: mockData.rows,
        pagination: {
          total: mockData.count,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it("deve retornar erro 400 para data inválida", async () => {
      req.query = { createdAfter: "data-invalida" };

      dateFns.isValid.mockReturnValue(false);
      dateFns.parseISO.mockReturnValue(new Date("invalid-date"));

      await CustomersController.index(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Data inválida em createdAfter" });
    });
  });

  // ===== SHOW ===== //
  describe("show", () => {
    it("deve retornar cliente específico", async () => {
      req.params.id = "1";
      const mockCustomer = { id: 1, name: "João", contacts: [] };
      Customers.findByPk.mockResolvedValue(mockCustomer);

      await CustomersController.show(req, res);

      expect(Customers.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
      expect(res.json).toHaveBeenCalledWith(mockCustomer);
    });

    it("deve retornar 404 se cliente não encontrado", async () => {
      req.params.id = "999";
      Customers.findByPk.mockResolvedValue(null);

      await CustomersController.show(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Cliente não encontrado" });
    });
  });

  // ===== CREATE ===== //
  describe("create", () => {
    it("deve criar cliente com dados válidos", async () => {
      req.body = { name: "João", email: "joao@email.com" };
      const mockCustomer = { id: 1, ...req.body, status: "ACTIVE" };
      mockValidate.mockResolvedValue(req.body);
      Customers.create.mockResolvedValue(mockCustomer);

      await CustomersController.create(req, res);

      expect(mockValidate).toHaveBeenCalledWith(req.body, { abortEarly: false });
      expect(Customers.create).toHaveBeenCalledWith({
        ...req.body,
        status: "ACTIVE",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockCustomer);
    });

    it("deve retornar erro de validação para dados inválidos", async () => {
      req.body = { name: "", email: "invalido" };
      const mockError = new yup.ValidationError(
        ["Nome é obrigatório", "E-mail inválido"],
        req.body,
        "status",
      );
      mockValidate.mockRejectedValue(mockError);

      await CustomersController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Erro de validação",
        details: ["Nome é obrigatório", "E-mail inválido"],
      });
    });
  });

  // ===== UPDATE ===== //
  describe("update", () => {
    it("deve atualizar cliente existente", async () => {
      req.params.id = "1";
      req.body = { name: "João Atualizado" };
      const mockCustomer = { id: 1, update: jest.fn().mockResolvedValue(true) };
      Customers.findByPk.mockResolvedValue(mockCustomer);
      mockValidate.mockResolvedValue(req.body);

      await CustomersController.update(req, res);

      expect(mockCustomer.update).toHaveBeenCalledWith(req.body);
      expect(res.json).toHaveBeenCalledWith(mockCustomer);
    });

    it("deve retornar 400 para dados inválidos", async () => {
      req.params.id = "1";
      req.body = { email: "invalido" };
      const mockError = new yup.ValidationError(["E-mail inválido"], req.body, "status");
      mockValidate.mockRejectedValue(mockError);
      Customers.findByPk.mockResolvedValue({ update: jest.fn() });

      await CustomersController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Erro de validação",
        details: ["E-mail inválido"],
      });
    });
  });

  // ===== DESTROY ===== //
  describe("destroy", () => {
    it("deve deletar cliente existente", async () => {
      req.params.id = "1";
      const mockCustomer = { id: 1, destroy: jest.fn().mockResolvedValue(true) };
      Customers.findByPk.mockResolvedValue(mockCustomer);

      await CustomersController.destroy(req, res);

      expect(mockCustomer.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("deve retornar 404 se cliente não encontrado", async () => {
      req.params.id = "999";
      Customers.findByPk.mockResolvedValue(null);

      await CustomersController.destroy(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Cliente não encontrado" });
    });

    it("deve retornar 500 se ocorrer erro no destroy", async () => {
      req.params.id = "1";
      const mockCustomer = { id: 1, destroy: jest.fn().mockRejectedValue(new Error("DB error")) };
      Customers.findByPk.mockResolvedValue(mockCustomer);

      await CustomersController.destroy(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Erro ao deletar cliente" });
      expect(console.error).toHaveBeenCalled();
    });
  });
});
