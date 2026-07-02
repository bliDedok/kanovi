export const WIDTH = 42;
export const PAD = " ";

export const ESC_INIT = "\x1B\x40";
export const TEXT_NORMAL = "\x1B\x21\x00";
export const TEXT_SIZE_DOUBLE = "\x1D\x21\x11";
export const TEXT_BOLD_ON = "\x1B\x45\x01";
export const TEXT_BOLD_OFF = "\x1B\x45\x00";
export const FEED_LINES = "\r\n\r\n\r\n\r\n\r\n";

export const formatCurrency = (value = 0) => {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
};

export const formatDate = (value?: string) => {
  const date = value ? new Date(value) : new Date();

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const padLine = (text = "") => `${PAD}${text}`;

export const centerText = (text: string, width = WIDTH) => {
  const cleanText = String(text || "").slice(0, width);
  const leftPadding = Math.max(0, Math.floor((width - cleanText.length) / 2));

  return padLine(`${" ".repeat(leftPadding)}${cleanText}`);
};

export const line = () => padLine("-".repeat(WIDTH));

export const rowText = (left: string, right: string, width = WIDTH) => {
  const cleanLeft = String(left || "").slice(0, width);
  const cleanRight = String(right || "").slice(0, width);

  const space = Math.max(1, width - cleanLeft.length - cleanRight.length);

  return padLine(`${cleanLeft}${" ".repeat(space)}${cleanRight}`);
};

export const wrapText = (text: string, width = WIDTH) => {
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

export const centerWrappedText = (text: string, width = WIDTH) => {
  return wrapText(text, width).map((item) => centerText(item, width));
};