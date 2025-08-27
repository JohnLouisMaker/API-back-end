import { Op } from "sequelize";
import { parseISO, isValid } from "date-fns";
import * as yup from "yup";

import Customers from "../models/customers.js";
import Contact from "../models/contacts.js";

class CustomersController {
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

      const where = {};
      let order = [];

      // filtros
      if (name) {
        where.name = { [Op.iLike]: `%${name}%` };
      }
      if (email) {
        where.email = { [Op.iLike]: `%${email}%` };
      }
      if (status) {
        where.status = { [Op.in]: status.split(",").map((s) => s.toUpperCase()) };
      }

      // datas
      if (createdAfter || createdBefore) {
        where.created_at = {};
        if (createdAfter) {
          const date = parseISO(createdAfter);
          if (!isValid(date))
            return res.status(400).json({ error: "Data inválida em createdAfter" });
          where.created_at[Op.gte] = date;
        }
        if (createdBefore) {
          const date = parseISO(createdBefore);
          if (!isValid(date))
            return res.status(400).json({ error: "Data inválida em createdBefore" });
          where.created_at[Op.lte] = date;
        }
      }

      if (updatedAfter || updatedBefore) {
        where.updated_at = {};
        if (updatedAfter) {
          const date = parseISO(updatedAfter);
          if (!isValid(date))
            return res.status(400).json({ error: "Data inválida em updatedAfter" });
          where.updated_at[Op.gte] = date;
        }
        if (updatedBefore) {
          const date = parseISO(updatedBefore);
          if (!isValid(date))
            return res.status(400).json({ error: "Data inválida em updatedBefore" });
          where.updated_at[Op.lte] = date;
        }
      }

      // ordenação
      if (sort) {
        order = sort.split(",").map((s) => {
          const [field, dir] = s.split(":");
          return [field, dir ? dir.toUpperCase() : "ASC"];
        });
      }

      const { count, rows } = await Customers.findAndCountAll({
        where,
        order,
        attributes: ["id", "name", "email", "status", "created_at", "updated_at"],
        include: [
          {
            model: Contact,
            as: "contacts",
            attributes: ["id", "name", "status"],
          },
        ],
        limit,
        offset: (page - 1) * limit,
      });

      return res.json({
        data: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      console.error("Erro REAL:", error);
      return res.status(500).json({ error: "Erro ao buscar clientes" });
    }
  }

  async show(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

      const customer = await Customers.findByPk(id, {
        attributes: ["id", "name", "email", "status", "created_at", "updated_at"],
        include: [
          {
            model: Contact,
            as: "contacts",
            attributes: ["id", "name", "status"],
          },
        ],
      });

      if (!customer) return res.status(404).json({ error: "Cliente não encontrado" });
      return res.json(customer);
    } catch (error) {
      console.error("Erro ao buscar cliente:", error);
      return res.status(500).json({ error: "Erro ao buscar cliente" });
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

      const customer = await Customers.create({
        ...req.body,
        status: req.body.status || "ACTIVE",
      });

      return res.status(201).json(customer);
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        return res.status(400).json({
          error: "Erro de validação",
          details: error.errors,
        });
      }
      console.error("Erro ao criar cliente:", error);
      return res.status(500).json({ error: "Erro interno ao criar cliente" });
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
      if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

      await schema.validate(req.body, { abortEarly: false });

      const customer = await Customers.findByPk(id);
      if (!customer) return res.status(404).json({ error: "Cliente não encontrado" });

      await customer.update(req.body);
      return res.json(customer);
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        return res.status(400).json({
          error: "Erro de validação",
          details: error.errors,
        });
      }
      console.error("Erro ao atualizar cliente:", error);
      return res.status(500).json({ error: "Erro ao atualizar cliente" });
    }
  }

  async destroy(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

      const customer = await Customers.findByPk(id);
      if (!customer) return res.status(404).json({ error: "Cliente não encontrado" });

      await customer.destroy();
      return res.status(204).send();
    } catch (error) {
      console.error("Erro ao deletar cliente:", error);
      return res.status(500).json({ error: "Erro ao deletar cliente" });
    }
  }
}

export default new CustomersController();
