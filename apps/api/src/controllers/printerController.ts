import { FastifyReply, FastifyRequest } from "fastify";
import { spawn } from "child_process";

type ReceiptItem = {
  name: string;
  qty: number;
  price: number;
  subtotal: number;
};

type ReceiptPayload = {
  storeName?: string;
  storeAddress?: string;
  employeeName?: string;
  posName?: string;
  customerName?: string | null;
  queueNumber?: string;
  paymentMethod?: "CASH" | "QRIS" | string;
  paidAmount?: number;
  changeAmount?: number;
  total?: number;
  paidAt?: string;
  items?: ReceiptItem[];
};

type ClosingReceiptPayload = {
  sessionId?: number | null;
  openedBy?: string | null;
  closedBy?: string | null;
  branch?: string | null;
  openedAt?: string | null;
  closedAt?: string | null;

  openingCash?: number;
  cashSales?: number;
  qrisSales?: number;
  expenses?: number;
  expectedCash?: number;
  actualCash?: number;
  difference?: number;

  totalOrders?: number;
  totalVoidOrders?: number;
  grossSales?: number;
  netSales?: number;
};

const printerName = process.env.THERMAL_PRINTER_NAME || "GEZHI_micro_printer";

const WIDTH = 42;
const PAD = " ";

const ESC_INIT = "\x1B\x40";
const TEXT_NORMAL = "\x1B\x21\x00";
const TEXT_SIZE_DOUBLE = "\x1D\x21\x11";
const TEXT_BOLD_ON = "\x1B\x45\x01";
const TEXT_BOLD_OFF = "\x1B\x45\x00";
const FEED_LINES = "\r\n\r\n\r\n\r\n\r\n";

const formatCurrency = (value = 0) => {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
};

const formatDate = (value?: string) => {
  const date = value ? new Date(value) : new Date();

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const padLine = (text = "") => `${PAD}${text}`;

const centerText = (text: string, width = WIDTH) => {
  const cleanText = String(text || "").slice(0, width);
  const leftPadding = Math.max(0, Math.floor((width - cleanText.length) / 2));

  return padLine(`${" ".repeat(leftPadding)}${cleanText}`);
};

const line = () => padLine("-".repeat(WIDTH));

const rowText = (left: string, right: string, width = WIDTH) => {
  const cleanLeft = String(left || "").slice(0, width);
  const cleanRight = String(right || "").slice(0, width);

  const space = Math.max(1, width - cleanLeft.length - cleanRight.length);

  return padLine(`${cleanLeft}${" ".repeat(space)}${cleanRight}`);
};

const wrapText = (text: string, width = WIDTH) => {
  const words = String(text || "").split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = `${current} ${word}`.trim();

    if (next.length > width) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);

  return lines;
};

const centerWrappedText = (text: string, width = WIDTH) => {
  return wrapText(text, width).map((line) => centerText(line, width));
};

const buildTestPrintText = () => {
  const output: string[] = [];

  output.push(ESC_INIT);
  output.push(TEXT_NORMAL);
  output.push("");

  output.push(centerText("KANOVI POS"));
  output.push(centerText("Printer Test"));
  output.push("");
  output.push(line());
  output.push(rowText("Status", "READY"));
  output.push(rowText("Paper", "80mm"));
  output.push(rowText("Mode", "USB RAW"));
  output.push(rowText("Printer", printerName.slice(0, 22)));
  output.push(rowText("Time", formatDate()));
  output.push(line());
  output.push("");
  output.push(centerText("Test Print OK"));
  output.push(centerText("Printer siap digunakan"));
  output.push(FEED_LINES);

  return output.join("\r\n");
};

const buildReceiptText = (receipt: ReceiptPayload) => {
  const items = receipt.items || [];
  const total = Number(receipt.total || 0);
  const paidAmount = Number(receipt.paidAmount || total);
  const changeAmount = Number(receipt.changeAmount || 0);

  const output: string[] = [];

  output.push(ESC_INIT);
  output.push(TEXT_NORMAL);


  output.push("");

  
  output.push(TEXT_BOLD_ON);
  output.push(centerText("KANOVI"));
  output.push(TEXT_BOLD_OFF);
  output.push("");
  output.push(centerText(receipt.storeName || "Kanovi Escape"));


  if (receipt.storeAddress) {
    output.push("");

    centerWrappedText(receipt.storeAddress, WIDTH).forEach((text) => {
      output.push(text);
    });
  }

  output.push("");
  output.push(TEXT_BOLD_ON);
  output.push(centerText("KANOVI ESCAPE"));
  output.push(TEXT_BOLD_OFF);
  output.push("");


  output.push(rowText("Employee:", receipt.employeeName || "Kasir"));
  output.push(rowText("POS:", receipt.posName || "POS 1"));

  if (receipt.customerName) {
    output.push(rowText("Customer:", receipt.customerName));
  }

  output.push(line());

  
  items.forEach((item) => {
    const itemName = item.name || "Menu";
    const qty = Number(item.qty || 1);
    const price = Number(item.price || 0);
    const subtotal = Number(item.subtotal || qty * price);

    const itemNameWidth = 26;
    const wrappedName = wrapText(`${itemName} (UND)`, itemNameWidth);

    wrappedName.forEach((nameLine, index) => {
      if (index === 0) {
        output.push(rowText(nameLine, formatCurrency(subtotal)));
      } else {
        output.push(padLine(nameLine));
      }
    });

    output.push(padLine(`${qty} x ${formatCurrency(price)}`));
    output.push("");
  });

  output.push(line());

 
  output.push(TEXT_BOLD_ON);
  output.push(rowText("Total", formatCurrency(total)));
  output.push(TEXT_BOLD_OFF);
  output.push("");

  const paymentLabel = receipt.paymentMethod === "QRIS" ? "QRIS" : "Cash";
  output.push(rowText(paymentLabel, formatCurrency(paidAmount)));

  if (receipt.paymentMethod === "CASH") {
    output.push(rowText("Change", formatCurrency(changeAmount)));
  }

  output.push(line());
  output.push("");


  centerWrappedText("Thanks for choosing Kanovi Escape", WIDTH).forEach((text) => {
    output.push(text);
  });

  centerWrappedText(
    "Get the latest updates on promos, seasonal menus, and events by following us on Instagram",
    WIDTH
  ).forEach((text) => {
    output.push(text);
  });

  output.push(centerText("@kanovi escape"));
  output.push("");

  output.push(rowText(formatDate(receipt.paidAt), receipt.queueNumber || "-"));
  output.push(FEED_LINES);

  return output.join("\r\n");
};

const buildKitchenReceiptText = (receipt: ReceiptPayload) => {
  const items = receipt.items || [];
  const output: string[] = [];

  output.push(ESC_INIT);
  output.push(TEXT_NORMAL);

  items.forEach((item, index) => {
    const qty = Number(item.qty || 1);
    const itemName = item.name || "Menu";



    output.push(TEXT_BOLD_ON);
    output.push(TEXT_SIZE_DOUBLE);
    output.push(centerText(receipt.queueNumber || "-", Math.floor(WIDTH / 2)));
    output.push(TEXT_NORMAL);
    output.push(TEXT_BOLD_OFF);

    output.push("");
    output.push(padLine(formatDate(receipt.paidAt)));
    output.push(
      padLine(`${receipt.employeeName || "Kasir"}, ${receipt.posName || "POS 1"}`)
    );

    output.push(line());
    output.push("");

   
    output.push(TEXT_BOLD_ON);
    wrapText(`${qty} x ${itemName}`, WIDTH).forEach((text) => {
      output.push(padLine(text));
    });
    output.push(TEXT_BOLD_OFF);

    output.push("");
    output.push(line());

   
    output.push("");
    output.push("");
    output.push("");
    output.push("");
    output.push("");

   
    if (index < items.length - 1) {
      output.push("");
      output.push("");
      output.push("");
    }
  });

  return output.join("\r\n");
};

const buildClosingReceiptText = (closing: ClosingReceiptPayload) => {
  const output: string[] = [];

  const openingCash = Number(closing.openingCash || 0);
  const cashSales = Number(closing.cashSales || 0);
  const qrisSales = Number(closing.qrisSales || 0);
  const expenses = Number(closing.expenses || 0);
  const expectedCash = Number(
    closing.expectedCash ?? openingCash + cashSales - expenses
  );
  const actualCash = Number(closing.actualCash ?? expectedCash);
  const difference = Number(closing.difference ?? actualCash - expectedCash);
  const grossSales = Number(closing.grossSales ?? cashSales + qrisSales);
  const netSales = Number(closing.netSales ?? grossSales);

  output.push(ESC_INIT);
  output.push(TEXT_NORMAL);
  output.push("");

  output.push(TEXT_BOLD_ON);
  output.push(centerText("KANOVI POS"));
  output.push(centerText("DAILY CLOSING"));
  output.push(TEXT_BOLD_OFF);
  output.push("");

  output.push(line());
  output.push(rowText("Session", closing.sessionId ? String(closing.sessionId) : "-"));
  output.push(rowText("Branch", closing.branch || "PUSAT"));
  output.push(rowText("Opened By", closing.openedBy || "-"));
  output.push(rowText("Closed By", closing.closedBy || "-"));
  output.push(rowText("Opened", closing.openedAt ? formatDate(closing.openedAt) : "-"));
  output.push(rowText("Closed", closing.closedAt ? formatDate(closing.closedAt) : formatDate()));
  output.push(line());
  output.push("");

  output.push(TEXT_BOLD_ON);
  output.push(centerText("SALES SUMMARY"));
  output.push(TEXT_BOLD_OFF);
  output.push(rowText("Total Orders", String(closing.totalOrders || 0)));
  output.push(rowText("Void Orders", String(closing.totalVoidOrders || 0)));
  output.push(rowText("Gross Sales", formatCurrency(grossSales)));
  output.push(rowText("Net Sales", formatCurrency(netSales)));
  output.push("");

  output.push(TEXT_BOLD_ON);
  output.push(centerText("PAYMENT SUMMARY"));
  output.push(TEXT_BOLD_OFF);
  output.push(rowText("Cash Sales", formatCurrency(cashSales)));
  output.push(rowText("QRIS Sales", formatCurrency(qrisSales)));
  output.push(rowText("Expenses", formatCurrency(expenses)));
  output.push("");

  output.push(TEXT_BOLD_ON);
  output.push(centerText("CASH DRAWER"));
  output.push(TEXT_BOLD_OFF);
  output.push(rowText("Opening Cash", formatCurrency(openingCash)));
  output.push(rowText("Expected Cash", formatCurrency(expectedCash)));
  output.push(rowText("Actual Cash", formatCurrency(actualCash)));
  output.push(rowText("Difference", formatCurrency(difference)));
  output.push(line());
  output.push("");

  output.push(centerText("Closing receipt printed"));
  output.push(centerText("by Kanovi POS"));
  output.push(FEED_LINES);

  return output.join("\r\n");
};

const rawPrint = (content: string) => {
  return new Promise<void>((resolve, reject) => {
    const lp = spawn("lp", ["-d", printerName, "-o", "raw"]);

    let errorOutput = "";

    lp.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    lp.on("error", (error) => {
      reject(error);
    });

    lp.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          errorOutput || `Gagal mencetak. Command lp keluar dengan code ${code}`
        )
      );
    });

    lp.stdin.write(content);
    lp.stdin.end();
  });
};

export const testPrint = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    await rawPrint(buildTestPrintText());

    return reply.code(200).send({
      success: true,
      message: "Test print berhasil dikirim ke printer.",
      printer: printerName,
    });
  } catch (error: any) {
    console.error("Gagal test print:", error);

    return reply.code(500).send({
      success: false,
      message: error?.message || "Gagal menjalankan test print.",
      printer: printerName,
    });
  }
};

export const printReceipt = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const receipt = req.body as ReceiptPayload;

    if (!receipt?.items || receipt.items.length === 0) {
      return reply.code(400).send({
        success: false,
        message: "Data item struk kosong.",
      });
    }

    await rawPrint(buildReceiptText(receipt));

    return reply.code(200).send({
      success: true,
      message: "Struk berhasil dikirim ke printer.",
      printer: printerName,
    });
  } catch (error: any) {
    console.error("Gagal print receipt:", error);

    return reply.code(500).send({
      success: false,
      message: error?.message || "Gagal mencetak struk.",
      printer: printerName,
    });
  }
};

export const printKitchenReceipt = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const receipt = req.body as ReceiptPayload;

    if (!receipt?.items || receipt.items.length === 0) {
      return reply.code(400).send({
        success: false,
        message: "Data item dapur kosong.",
      });
    }

    await rawPrint(buildKitchenReceiptText(receipt));

    return reply.code(200).send({
      success: true,
      message: "Struk dapur berhasil dikirim ke printer.",
      printer: printerName,
    });
  } catch (error: any) {
    console.error("Gagal print kitchen receipt:", error);

    return reply.code(500).send({
      success: false,
      message: error?.message || "Gagal mencetak struk dapur.",
      printer: printerName,
    });
  }
};

export const printClosingReceipt = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const closing = req.body as ClosingReceiptPayload;

    await rawPrint(buildClosingReceiptText(closing));

    return reply.code(200).send({
      success: true,
      message: "Struk closing berhasil dikirim ke printer.",
      printer: printerName,
    });
  } catch (error: any) {
    console.error("Gagal print closing receipt:", error);

    return reply.code(500).send({
      success: false,
      message: error?.message || "Gagal mencetak struk closing.",
      printer: printerName,
    });
  }
};