import { FastifyReply, FastifyRequest } from "fastify";
import { ClosingReceiptPayload, printerService, ReceiptPayload,} from "../services/printerService";

export const testPrint = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    await printerService.testPrint();

    return reply.code(200).send({
      success: true,
      message: "Test print berhasil dikirim ke printer.",
      printer: printerService.getPrinterName(),
    });
  } catch (error: any) {
    console.error("Gagal test print:", error);

    return reply.code(500).send({
      success: false,
      message: error?.message || "Gagal menjalankan test print.",
      printer: printerService.getPrinterName(),
    });
  }
};

export const printReceipt = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const receipt = req.body as ReceiptPayload;

    const result = await printerService.printReceipt(receipt);

    if (result.kind === "EMPTY_ITEMS") {
      return reply.code(400).send({
        success: false,
        message: "Data item struk kosong.",
      });
    }

    return reply.code(200).send({
      success: true,
      message: "Struk berhasil dikirim ke printer.",
      printer: printerService.getPrinterName(),
    });
  } catch (error: any) {
    console.error("Gagal print receipt:", error);

    return reply.code(500).send({
      success: false,
      message: error?.message || "Gagal mencetak struk.",
      printer: printerService.getPrinterName(),
    });
  }
};

export const printKitchenReceipt = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const receipt = req.body as ReceiptPayload;

    const result = await printerService.printKitchenReceipt(receipt);

    if (result.kind === "EMPTY_ITEMS") {
      return reply.code(400).send({
        success: false,
        message: "Data item dapur kosong.",
      });
    }

    return reply.code(200).send({
      success: true,
      message: "Struk dapur berhasil dikirim ke printer.",
      printer: printerService.getPrinterName(),
    });
  } catch (error: any) {
    console.error("Gagal print kitchen receipt:", error);

    return reply.code(500).send({
      success: false,
      message: error?.message || "Gagal mencetak struk dapur.",
      printer: printerService.getPrinterName(),
    });
  }
};

export const printClosingReceipt = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const closing = req.body as ClosingReceiptPayload;

    await printerService.printClosingReceipt(closing);

    return reply.code(200).send({
      success: true,
      message: "Struk closing berhasil dikirim ke printer.",
      printer: printerService.getPrinterName(),
    });
  } catch (error: any) {
    console.error("Gagal print closing receipt:", error);

    return reply.code(500).send({
      success: false,
      message: error?.message || "Gagal mencetak struk closing.",
      printer: printerService.getPrinterName(),
    });
  }
};