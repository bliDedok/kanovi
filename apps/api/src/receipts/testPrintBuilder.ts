import { centerText, ESC_INIT, FEED_LINES, formatDate, line, rowText, TEXT_NORMAL,} from "./receiptFormatUtils";

export const buildTestPrintText = (printerName: string) => {
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