import express from "express";
import { initTRPC } from "@trpc/server";
import * as trpcExpress from "@trpc/server/adapters/express";
import path from "path";
import { PORT } from "../shared/constants.js";
import url from "node:url";
import knex from "knex";
import type { Knex } from "knex";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import knexConfig from "../../knexfile.js";
import { sessionMiddleware } from "./session.js";
import { contextMiddleware } from "./context.js";
import { html } from "./controllers/html.js";
import { auth } from "./controllers/auth.js";
import debugLib from "debug";
import { requiresAuth } from "./middleware/requiresAuth.js";

const debug = debugLib("server:express");

declare global {
  namespace Express {
    interface Request {
      db: Knex;
      session: {
        id: string;
        organizationId?: string;
      };
    }
  }
}

export const knexClient = knex(knexConfig);

const app = express();
app.use(cookieParser());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(contextMiddleware);
app.use(sessionMiddleware);

const t = initTRPC.context().create();

export const appRouter = t.router({
  getUser: t.procedure.query((req) => {
    return { id: req.input, name: "Bilbo" };
  }),
});

// export type definition of API
export type AppRouter = typeof appRouter;

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.use(html);
app.use(auth);

app.use(
  "/trpc",
  requiresAuth,
  trpcExpress.createExpressMiddleware({
    router: appRouter,
  })
);

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
