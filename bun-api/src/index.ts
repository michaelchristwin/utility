import { Hono } from "hono";
import { logger } from "hono/logger";
import { CreateUser, LoginUser, UpdateUser } from "./routes/users";

const app = new Hono();
app.use(logger());
app.get("/", (c) => {
  return c.text("Hello Hono!");
});

//User and Auth Routes
app.post("/auth/register", CreateUser);
app.patch("/auth/login", LoginUser);
app.patch("/api/users/:id", UpdateUser);

export default app;
