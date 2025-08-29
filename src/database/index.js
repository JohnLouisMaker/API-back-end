import Sequelize from "sequelize";
import databaseConfig from "../config/database.cjs";
import Customer from "../app/models/customers.js";
import Contact from "../app/models/contacts.js";
import User from "../app/models/users.js";

const models = [Customer, Contact, User];
const env = process.env.NODE_ENV || "development";
const config = databaseConfig[env]; // pega apenas o ambiente correto

class Database {
  constructor() {
    this.connection = new Sequelize(config.database, config.username, config.password, config);
  }

  init() {
    models.forEach((model) => model.init(this.connection));
    models.forEach((model) => model.associate?.(this.connection.models));

    if (process.env.NODE_ENV !== "production") {
      this.connection.sync();
    }
  }
}

export default new Database();
