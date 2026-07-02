import type { ReceiptPayload } from "./receiptTypes";
import {
  centerText,
  centerWrappedText,
  ESC_INIT,
  FEED_LINES,
  formatCurrency,
  formatDate,
  line,
  padLine,
  rowText,
  TEXT_BOLD_OFF,
  TEXT_BOLD_ON,
  TEXT_NORMAL,
  WIDTH,
  wrapText,
} from "./receiptFormatUtils";

export const buildCustomerReceiptText = (receipt: ReceiptPayload) => {
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

  centerWrappedText("Thanks for choosing Kanovi Escape", WIDTH).forEach(
    (text) => {
      output.push(text);
    }
  );

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