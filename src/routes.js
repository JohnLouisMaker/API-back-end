import { Router } from "express";
import "dotenv/config";

import customers from "./app/controllers/customersController.js";
import contacts from "./app/controllers/contactsController.js";
import users from "./app/controllers/usersController.js";

import authController from "./app/controllers/authController.js";
import authMiddleware from "./app/middlewares/authMiddleware.js";

const routes = new Router();

////CRIAR USUARIO
routes.post("/users", users.create);

//// LOGIN
routes.post("/login", authController.authenticate);

routes.use(authMiddleware);

//// CUSTOMERS
routes.get("/customers", customers.index);
routes.get("/customers/:id", customers.show);
routes.post("/customers", customers.create);
routes.put("/customers/:id", customers.update);
routes.delete("/customers/:id", customers.destroy);

//// CONTACTS
routes.get("/customers/:customerId/contacts", contacts.index);
routes.get("/customers/:customerId/contacts/:id", contacts.show);
routes.post("/customers/:customerId/contacts", contacts.create);
routes.put("/customers/:customerId/contacts/:id", contacts.update);
routes.delete("/customers/:customerId/contacts/:id", contacts.destroy);

//// USERS
routes.get("/users", users.index);
routes.get("/users/:id", users.show);
routes.put("/users/:id", users.update);
routes.delete("/users/:id", users.destroy);

export default routes;
