import type { ReceiptPayload } from "./receiptTypes";
import {
  centerText,
  ESC_INIT,
  formatDate,
  line,
  padLine,
  TEXT_BOLD_OFF,
  TEXT_BOLD_ON,
  TEXT_NORMAL,
  TEXT_SIZE_DOUBLE,
  WIDTH,
  wrapText,
} from "./receiptFormatUtils";

export const buildKitchenReceiptText = (receipt: ReceiptPayload) => {
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