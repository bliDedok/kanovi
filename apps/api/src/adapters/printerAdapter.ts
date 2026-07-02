import { spawn } from "child_process";

export interface PrinterAdapter {
  print(content: string): Promise<void>;
  getPrinterName(): string;
}

export class LpPrinterAdapter implements PrinterAdapter {
  private readonly printerName: string;

  constructor(printerName: string) {
    this.printerName = printerName;
  }

  getPrinterName() {
    return this.printerName;
  }

  print(content: string) {
    return new Promise<void>((resolve, reject) => {
      const lp = spawn("lp", ["-d", this.printerName, "-o", "raw"]);

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
            errorOutput ||
              `Gagal mencetak. Command lp keluar dengan code ${code}`
          )
        );
      });

      lp.stdin.write(content);
      lp.stdin.end();
    });
  }
}