import type { ClosingReceiptPayload } from "./receiptTypes";
import {
  centerText,
  ESC_INIT,
  FEED_LINES,
  formatCurrency,
  formatDate,
  line,
  rowText,
  TEXT_BOLD_OFF,
  TEXT_BOLD_ON,
  TEXT_NORMAL,
} from "./receiptFormatUtils";

export const buildClosingReceiptText = (closing: ClosingReceiptPayload) => {
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
  output.push(
    rowText("Closed", closing.closedAt ? formatDate(closing.closedAt) : formatDate())
  );
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