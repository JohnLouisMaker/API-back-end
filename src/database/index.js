import Sequelize from "sequelize";
import Customer from "../app/models/customers.js";
import Contact from "../app/models/contacts.js";
import User from "../app/models/users.js";

const models = [Customer, Contact, User];

class Database {
  constructor() {
    this.connection = new Sequelize({ dialect: "sqlite", storage: ":memory:" });
  }

  init() {
    models.forEach((model) => model.init(this.connection));
    models.forEach((model) => model.associate?.(this.connection.models));
  }
}

export default new Database();
