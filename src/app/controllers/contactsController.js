import { Op } from "sequelize";
import { parseISO, isValid } from "date-fns";
import * as yup from "yup";

import Customer from "../models/customers.js";
import Contact from "../models/contacts.js";

class ContactsController {
  async index(req, res) {
    try {
      const {
        name,
        email,
        status,
        createdAfter,
        createdBefore,
        updatedAfter,
        updatedBefore,
        sort,
      } = req.query;

      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 25;

      const where = { customer_id: req.params.customerId };
      let order = [];

      if (name) where.name = { [Op.iLike]: `%${name}%` };
      if (email) where.email = { [Op.iLike]: `%${email}%` };
      if (status) where.status = { [Op.in]: status.split(",").map((s) => s.toUpperCase()) };

      if (createdAfter || createdBefore) {
        if (createdAfter && !isValid(parseISO(createdAfter))) {
          return res.status(400).json({ error: "Data inválida em createdAfter" });
        }
        if (createdBefore && !isValid(parseISO(createdBefore))) {
          return res.status(400).json({ error: "Data inválida em createdBefore" });
        }
        where.createdAt = {};
        if (createdAfter) where.createdAt[Op.gte] = parseISO(createdAfter);
        if (createdBefore) where.createdAt[Op.lte] = parseISO(createdBefore);
      }

      if (updatedAfter || updatedBefore) {
        if (updatedAfter && !isValid(parseISO(updatedAfter))) {
          return res.status(400).json({ error: "Data inválida em updatedAfter" });
        }
        if (updatedBefore && !isValid(parseISO(updatedBefore))) {
          return res.status(400).json({ error: "Data inválida em updatedBefore" });
        }
        where.updatedAt = {};
        if (updatedAfter) where.updatedAt[Op.gte] = parseISO(updatedAfter);
        if (updatedBefore) where.updatedAt[Op.lte] = parseISO(updatedBefore);
      }

      if (sort) {
        order = sort.split(",").map((s) => {
          const [field, dir] = s.split(":");
          return [field, dir ? dir.toUpperCase() : "ASC"];
        });
      }

      const data = await Contact.findAll({
        where,
        order,
        attributes: ["id", "name", "email", "status", "createdAt", "updatedAt"],
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["id", "status", "email"],
            required: true,
          },
        ],
        limit,
        offset: (page - 1) * limit,
      });

      return res.json(data);
    } catch (error) {
      console.error("Erro REAL:", error);
      return res.status(500).json({ error: "Erro ao buscar contatos" });
    }
  }

  async show(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const customerId = parseInt(req.params.customerId, 10);

      if (isNaN(id) || isNaN(customerId)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const contact = await Contact.findOne({
        where: { id, customer_id: customerId },
        attributes: ["id", "name", "email", "status", "createdAt", "updatedAt"],
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["id", "status", "email"],
          },
        ],
      });

      if (!contact) {
        return res.status(404).json({ error: "Contato não encontrado para esse cliente" });
      }

      return res.json(contact);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao buscar contato" });
    }
  }

  async create(req, res) {
    const schema = yup.object().shape({
      name: yup.string().required("Nome é obrigatório"),
      email: yup.string().email("E-mail inválido").required("E-mail é obrigatório"),
      status: yup.string().oneOf(["ACTIVE", "ARCHIVED"], "Status inválido").notRequired(),
    });

    try {
      await schema.validate(req.body, { abortEarly: false });

      const { name, email, status } = req.body;
      const contact = await Contact.create({
        name,
        email,
        status,
        customer_id: req.params.customerId,
      });

      return res.status(201).json(contact);
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        return res.status(400).json({ error: "Erro de validação", details: error.errors });
      }

      console.error("Erro ao criar contato:", error);
      return res.status(500).json({ error: "Erro interno ao criar contato" });
    }
  }

  async update(req, res) {
    const schema = yup.object().shape({
      name: yup.string(),
      email: yup.string().email("E-mail inválido"),
      status: yup.string().oneOf(["ACTIVE", "ARCHIVED"], "Status inválido").notRequired(),
    });

    try {
      const id = parseInt(req.params.id, 10);
      const customerId = parseInt(req.params.customerId, 10);

      if (isNaN(id) || isNaN(customerId)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      await schema.validate(req.body, { abortEarly: false });

      const contact = await Contact.findOne({ where: { id, customer_id: customerId } });
      if (!contact)
        return res.status(404).json({ error: "Contato não encontrado para esse cliente" });

      await contact.update(req.body);

      return res.json(contact);
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        return res.status(400).json({ error: "Erro de validação", details: error.errors });
      }

      console.error("Erro ao atualizar contato:", error);
      return res.status(500).json({ error: "Erro ao atualizar contato" });
    }
  }

  async destroy(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const customerId = parseInt(req.params.customerId, 10);

      if (isNaN(id) || isNaN(customerId)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const contact = await Contact.findOne({ where: { id, customer_id: customerId } });
      if (!contact)
        return res.status(404).json({ error: "Contato não encontrado para esse cliente" });

      await contact.destroy();
      return res.status(204).send();
    } catch (error) {
      console.error("Erro ao deletar contato:", error);
      return res.status(500).json({ error: "Erro ao deletar contato" });
    }
  }
}

export default new ContactsController();
