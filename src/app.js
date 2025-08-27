import express from "express";
import database from "./database/index.js";
import routes from "./routes.js";
const app = express();

app.use(express.json());
database.init();

app.use(routes);

export default app;
