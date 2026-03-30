import Fastify from "fastify";
import cors from "@fastify/cors";
import { prisma } from "./prisma";
import { loginUser } from "./controllers/authController";

// --- IMPORT ROUTES ---
import menuRoutes from "./routes/menuRoutes";
import ingredientRoutes from "./routes/ingredientRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import orderRoutes from "./routes/orderRoutes";
import queueRoutes from "./routes/queueRoutes";
import financeRoutes from "./routes/financeRoutes";

const port = Number(process.env.PORT ?? 3001);
const app = Fastify({ logger: true });

app.register(cors, {
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});

// --- RUTE PUBLIK  ---
app.get("/health", async () => ({ ok: true, ts: new Date().toISOString() }));
app.post("/api/auth/login", loginUser);

// ==========================================
// 🚀 REGISTER ROUTES 
// ==========================================
app.register(menuRoutes, { prefix: "/api/menus" });
app.register(ingredientRoutes, { prefix: "/api/ingredients" });
app.register(categoryRoutes, { prefix: "/categories" }); 
app.register(orderRoutes, { prefix: "/api/orders" });
app.register(queueRoutes, { prefix: "/api" }); 
app.register(financeRoutes, { prefix: "/api/finance" });

// --- SEEDING DATABASE UNTUK DEV ---
app.post("/dev/seed", async (_req, reply) => {
  if (process.env.NODE_ENV === "production") return reply.code(403).send({ error: "Forbidden" });

  const [u] = await prisma.user.findMany({ take: 1 });
  const user = u ?? await prisma.user.create({ data: { name: "Kasir 1", username: "kasirdemo", password: "dummy123", role: "PEGAWAI", location: "COUNTER" } });
  
  return { ok: true, userId: user.id };
});

app.listen({ port, host: "0.0.0.0" });