import { FastifyInstance } from "fastify";
import { testPrint, printReceipt, printKitchenReceipt, } from "../controllers/printerController";

export async function printerRoutes(app: FastifyInstance) {
  app.post("/printer/test", testPrint);
  app.post("/printer/receipt", printReceipt);
  app.post("/printer/kitchen", printKitchenReceipt);
}