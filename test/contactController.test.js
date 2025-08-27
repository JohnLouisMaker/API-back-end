import { Op } from "sequelize";
import * as dateFns from "date-fns";
import * as yup from "yup";
import ContactsController from "../src/app/controllers/contactsController.js";
import Contact from "../src/app/models/contacts.js";
import Customer from "../src/app/models/customers.js";

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
    Op: { iLike: Symbol("iLike"), gte: Symbol("gte") },
  };
});

jest.mock("date-fns", () => ({
  isValid: jest.fn(),
  parseISO: jest.fn(),
}));

jest.mock("../src/app/models/contacts.js");
jest.mock("../src/app/models/customers.js");

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
describe("ContactsController", () => {
  let req, res;
  let errorSpy;

  beforeEach(() => {
    // Configura mocks do yup
    yup.string.mockImplementation(() => mockString);
    yup.object.mockImplementation(() => ({
      shape: jest.fn(() => mockShape),
    }));

    // Configura mocks do date-fns
    dateFns.isValid.mockReturnValue(true);
    dateFns.parseISO.mockImplementation((date) => new Date(date));

    // Configura os objetos de requisição e resposta
    req = { params: {}, query: {}, body: {} };
    res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);

    // Suprime o console.error para os testes
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    // Limpa todos os mocks e restaura o console
    jest.clearAllMocks();
    errorSpy.mockRestore();
  });

  // ===== INDEX ===== //
  describe("index", () => {
    it("deve retornar lista de contatos com filtros", async () => {
      req.params.customerId = "1";
      req.query = { name: "João", page: "1", limit: "10" };

      const mockContacts = [{ id: 1, name: "João" }];
      Contact.findAll.mockResolvedValue(mockContacts);

      await ContactsController.index(req, res);

      expect(Contact.findAll).toHaveBeenCalledWith({
        where: {
          customer_id: "1",
          name: { [Op.iLike]: "%João%" },
        },
        order: [],
        attributes: ["id", "name", "email", "status", "createdAt", "updatedAt"],
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["id", "status", "email"],
            required: true,
          },
        ],
        limit: 10,
        offset: 0,
      });
      expect(res.json).toHaveBeenCalledWith(mockContacts);
    });

    it("deve retornar erro 400 para data inválida", async () => {
      req.params.customerId = "1";
      req.query = { createdAfter: "data-invalida" };

      dateFns.isValid.mockReturnValue(false);
      dateFns.parseISO.mockReturnValue(new Date("invalid-date"));

      await ContactsController.index(req, res);

      expect(dateFns.parseISO).toHaveBeenCalledWith("data-invalida");
      expect(dateFns.isValid).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Data inválida em createdAfter" });
    });

    it("deve adicionar filtro de data quando createdAfter for válido", async () => {
      req.params.customerId = "1";
      req.query = { createdAfter: "2023-01-01" };

      const mockContacts = [{ id: 1, name: "João" }];
      Contact.findAll.mockResolvedValue(mockContacts);

      const validDate = new Date("2023-01-01T00:00:00.000Z");
      dateFns.parseISO.mockReturnValue(validDate);
      dateFns.isValid.mockReturnValue(true);

      await ContactsController.index(req, res);

      expect(dateFns.parseISO).toHaveBeenCalledWith("2023-01-01");
      expect(dateFns.isValid).toHaveBeenCalledWith(validDate);
      expect(Contact.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              [Op.gte]: validDate,
            }),
          }),
        }),
      );
      expect(res.json).toHaveBeenCalledWith(mockContacts);
    });
  });

  // ===== SHOW ===== //
  describe("show", () => {
    it("deve retornar contato específico", async () => {
      req.params.customerId = "1";
      req.params.id = "1";

      const mockContact = { id: 1, name: "João" };
      Contact.findOne.mockResolvedValue(mockContact);

      await ContactsController.show(req, res);

      expect(Contact.findOne).toHaveBeenCalledWith({
        where: { id: 1, customer_id: 1 },
        attributes: ["id", "name", "email", "status", "createdAt", "updatedAt"],
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["id", "status", "email"],
          },
        ],
      });
      expect(res.json).toHaveBeenCalledWith(mockContact);
    });

    it("deve retornar erro 404 se contato não for encontrado", async () => {
      req.params.customerId = "1";
      req.params.id = "999";

      Contact.findOne.mockResolvedValue(null);

      await ContactsController.show(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Contato não encontrado para esse cliente" });
    });
  });

  // ===== CREATE ===== //
  describe("create", () => {
    it("deve criar novo contato com dados válidos", async () => {
      req.params.customerId = "1";
      req.body = { name: "João", email: "joao@email.com", status: "ACTIVE" };

      const mockContact = { id: 1, ...req.body };
      mockValidate.mockResolvedValue(req.body);
      Contact.create.mockResolvedValue(mockContact);

      await ContactsController.create(req, res);

      expect(mockValidate).toHaveBeenCalledWith(req.body, { abortEarly: false });
      expect(Contact.create).toHaveBeenCalledWith({
        ...req.body,
        customer_id: "1",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockContact);
    });

    it("deve retornar erro de validação para dados inválidos", async () => {
      req.params.customerId = "1";
      req.body = { name: "", email: "invalido" };

      const mockError = new yup.ValidationError(
        ["Nome é obrigatório", "E-mail inválido"],
        req.body,
        "status",
      );

      mockValidate.mockRejectedValue(mockError);

      await ContactsController.create(req, res);

      expect(mockValidate).toHaveBeenCalledWith(req.body, { abortEarly: false });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Erro de validação",
        details: ["Nome é obrigatório", "E-mail inválido"],
      });
    });
  });

  // ===== UPDATE ===== //
  describe("update", () => {
    it("deve atualizar contato existente", async () => {
      req.params.customerId = "1";
      req.params.id = "1";
      req.body = { name: "João Atualizado", email: "joao.atualizado@email.com" };

      const mockContact = {
        id: 1,
        update: jest.fn().mockResolvedValue(true),
      };

      mockValidate.mockResolvedValue(req.body);
      Contact.findOne.mockResolvedValue(mockContact);

      await ContactsController.update(req, res);

      expect(Contact.findOne).toHaveBeenCalledWith({
        where: { id: 1, customer_id: 1 },
      });
      expect(mockContact.update).toHaveBeenCalledWith(req.body);
      expect(res.json).toHaveBeenCalledWith(mockContact);
    });

    it("deve retornar erro de validação para dados inválidos", async () => {
      req.params.customerId = "1";
      req.params.id = "1";
      req.body = { name: "", email: "invalido" };

      const mockError = new yup.ValidationError(
        ["Nome é obrigatório", "E-mail inválido"],
        req.body,
        "status",
      );

      mockValidate.mockRejectedValue(mockError);
      Contact.findOne.mockResolvedValue({ update: jest.fn() });

      await ContactsController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Erro de validação",
        details: ["Nome é obrigatório", "E-mail inválido"],
      });
    });
  });

  // ===== DESTROY ===== //
  describe("destroy", () => {
    it("deve deletar contato existente", async () => {
      req.params.customerId = "1";
      req.params.id = "1";

      const mockContact = {
        id: 1,
        destroy: jest.fn().mockResolvedValue(true),
      };

      Contact.findOne.mockResolvedValue(mockContact);

      await ContactsController.destroy(req, res);

      expect(Contact.findOne).toHaveBeenCalledWith({
        where: { id: 1, customer_id: 1 },
      });
      expect(mockContact.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("deve retornar 500 se ocorrer erro no destroy", async () => {
      req.params.customerId = "1";
      req.params.id = "1";

      const mockContact = {
        id: 1,
        destroy: jest.fn().mockRejectedValue(new Error("DB error")),
      };

      Contact.findOne.mockResolvedValue(mockContact);

      await ContactsController.destroy(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Erro ao deletar contato" });
      // Adicionando um expect para verificar se o console.error foi chamado
      expect(console.error).toHaveBeenCalled();
    });
  });
});
