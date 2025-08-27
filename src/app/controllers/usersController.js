import { Op } from "sequelize";
import { parseISO, isValid } from "date-fns";
import * as yup from "yup";
import bcrypt from "bcryptjs";
import User from "../models/users.js";

class UsersController {
  //// INDEX
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

      if (name) where.name = { [Op.iLike]: `%${name}%` };
      if (email) where.email = { [Op.iLike]: `%${email}%` };
      if (status) where.status = { [Op.in]: status.split(",").map((s) => s.toUpperCase()) };

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

      if (sort) {
        order = sort.split(",").map((s) => {
          const [field, dir] = s.split(":");
          return [field, dir ? dir.toUpperCase() : "ASC"];
        });
      }

      const { count, rows } = await User.findAndCountAll({
        where,
        order,
        attributes: { exclude: ["password_hash"] },
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
      console.error("Erro ao buscar usuários:", error);
      return res.status(500).json({ error: "Erro ao buscar usuários" });
    }
  }

  //// SHOW
  async show(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

      const user = await User.findByPk(id, {
        attributes: { exclude: ["password_hash"] },
      });

      if (!user) return res.status(404).json({ error: "Usuário não encontrado" });
      return res.json(user);
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      return res.status(500).json({ error: "Erro ao buscar usuário" });
    }
  }

  //// CREATE
  async create(req, res) {
    const schema = yup.object().shape({
      name: yup.string().required("Nome é obrigatório"),
      email: yup.string().email("E-mail inválido").required("E-mail é obrigatório"),
      status: yup.string().oneOf(["ACTIVE", "ARCHIVED"], "Status inválido").notRequired(),
      password: yup
        .string()
        .min(8, "Senha deve ter no mínimo 8 caracteres")
        .required("Senha é obrigatória"),
      passwordConfirm: yup
        .string()
        .oneOf([yup.ref("password")], "As senhas não conferem")
        .required("Confirmação de senha é obrigatória"),
    });

    try {
      await schema.validate(req.body, { abortEarly: false });

      const { name, email, status, password } = req.body;

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) return res.status(400).json({ error: "E-mail já cadastrado" });

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        name,
        email,
        status: status || "ACTIVE",
        password_hash: hashedPassword,
      });
      const { password_hash, ...userData } = user.toJSON();

      return res.status(201).json(userData);
    } catch (error) {
      if (error instanceof yup.ValidationError)
        return res.status(400).json({ error: "Erro de validação", details: error.errors });
      console.error("Erro ao criar usuário:", error);
      return res.status(500).json({ error: "Erro interno ao criar usuário" });
    }
  }

  //// UPDATE
  async update(req, res) {
    const schema = yup.object().shape({
      name: yup.string(),
      email: yup.string().email("E-mail inválido"),
      oldPassword: yup.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
      password: yup
        .string()
        .min(8, "Senha deve ter no mínimo 8 caracteres")
        .when("oldPassword", (oldPassword, field) =>
          oldPassword ? field.required("Nova senha é obrigatória") : field.notRequired(),
        ),
      passwordConfirm: yup
        .string()
        .when("password", (password, field) =>
          password
            ? field.required("Confirmação de senha é obrigatória").oneOf([yup.ref("password")])
            : field.notRequired(),
        ),
    });

    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

      await schema.validate(req.body, { abortEarly: false });

      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

      const { name, email, oldPassword, password } = req.body;
      const updates = {};

      if (name) updates.name = name;

      if ((email || password) && !oldPassword)
        return res
          .status(401)
          .json({ error: "Senha antiga é necessária para atualizar email ou senha" });

      if (oldPassword && !(await bcrypt.compare(oldPassword, user.password_hash)))
        return res.status(401).json({ error: "Senha antiga incorreta" });

      if (email) updates.email = email;
      if (password) updates.password_hash = await bcrypt.hash(password, 10);

      await user.update(updates);

      const { password_hash, ...userData } = user.toJSON();
      return res.json(userData);
    } catch (error) {
      if (error instanceof yup.ValidationError)
        return res.status(400).json({ error: "Erro de validação", details: error.errors });

      console.error("Erro ao atualizar usuário:", error);
      return res.status(500).json({ error: "Erro ao atualizar usuário" });
    }
  }

  //// DELETE
  async destroy(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

      const user = await User.findByPk(id);
      if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

      await user.destroy();
      return res.status(204).send();
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      return res.status(500).json({ error: "Erro ao deletar usuário" });
    }
  }
}

export default new UsersController();
