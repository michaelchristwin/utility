import { type Context } from "hono";
import * as bcrypt from "bcrypt";
import { users } from "../db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

export async function CreateUser(c: Context) {
  try {
    const { name, email, password, address } = await c.req.json();

    if (!name || !email || !password) {
      return c.json({ error: "Name, email, and password are required" }, 400);
    }

    const saltRounds = 12; // Higher = more secure but slower
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user: typeof users.$inferInsert = {
      name,
      email,
      password: hashedPassword,
      address: address ?? null,
    };

    await db.insert(users).values(user);

    return c.json({ message: "User added successfully" }, 201);
  } catch (err) {
    console.error("Error creating user:", err);
    return c.json({ error: "Failed to create user" }, 500);
  }
}

export async function UpdateUser(c: Context) {
  try {
    const { id } = c.req.param();
    const { name, email, password, address } = await c.req.json();

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (password) {
      const saltRounds = 12;
      hashedPassword = await bcrypt.hash(password, saltRounds);
    }

    // Build update object
    const updateData: Partial<typeof users.$inferInsert> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (address) updateData.address = address;
    if (hashedPassword) updateData.password = hashedPassword;

    // Update DB
    const result = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id));

    if (result.rowCount === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ message: "User updated successfully" }, 200);
  } catch (err) {
    console.error("Error updating user:", err);
    return c.json({ error: "Failed to update user" }, 500);
  }
}

// ✅ Login User
export async function LoginUser(c: Context) {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    // Find user by email
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Compare passwords
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // At this point, you might generate a JWT or session
    return c.json({ message: "Login successful", userId: user.id }, 200);
  } catch (err) {
    console.error("Error logging in user:", err);
    return c.json({ error: "Failed to login" }, 500);
  }
}
