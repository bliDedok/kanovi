export const printTestReceipt = () => {
  const printWindow = window.open("", "_blank", "width=420,height=700");

  if (!printWindow) {
    throw new Error(
      "Popup print diblokir browser. Izinkan popup untuk localhost agar test print bisa berjalan."
    );
  }

  const printedAt = new Date().toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Kanovi Printer Test</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            width: 80mm;
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: #000000;
            font-family: Arial, sans-serif;
          }

          body {
            padding: 4mm;
          }

          .receipt {
            width: 72mm;
            max-width: 72mm;
            font-size: 12px;
            line-height: 1.45;
          }

          .center {
            text-align: center;
          }

          .title {
            font-size: 18px;
            font-weight: 900;
            margin-bottom: 2mm;
          }

          .subtitle {
            font-size: 12px;
            font-weight: 700;
          }

          .line {
            border-top: 1px dashed #000;
            margin: 4mm 0;
          }

          .row {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 1mm;
          }

          .success {
            margin-top: 4mm;
            text-align: center;
            font-size: 14px;
            font-weight: 900;
          }

          .note {
            margin-top: 3mm;
            text-align: center;
            font-size: 11px;
          }
        </style>
      </head>

      <body>
        <div class="receipt">
          <div class="center">
            <div class="title">KANOVI POS</div>
            <div class="subtitle">Printer Test</div>
          </div>

          <div class="line"></div>

          <div class="row">
            <span>Status</span>
            <span>READY</span>
          </div>

          <div class="row">
            <span>Paper</span>
            <span>80mm</span>
          </div>

          <div class="row">
            <span>Time</span>
            <span>${printedAt}</span>
          </div>

          <div class="line"></div>

          <div class="success">Kanovi POS Printer Test</div>

          <div class="note">
            Jika teks ini tercetak, printer siap digunakan.
          </div>

          <div class="line"></div>

          <div class="center">-- TEST PRINT COMPLETE --</div>
        </div>

        <script>
          window.onload = function () {
            setTimeout(function () {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
};