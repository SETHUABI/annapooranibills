import { Bill, AppSettings } from "@/types";

export function generatePrintHTML(bill: Bill, settings: AppSettings): string {
  const width = settings.printerFormat === "58mm" ? "58mm" : "80mm";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Bill ${bill.billNumber}</title>

  <style>
    @page {
      size: ${width} auto;
      margin: 0;
    }

    body {
      font-family: 'Arial', sans-serif;
      font-size: 14px;
      line-height: 1.45;
      font-weight: 600;
      padding: 10px;
      margin: 0;
      width: ${width};
    }

    .header {
      text-align: center;
      border-bottom: 2px dashed #000;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }

    .shop-name {
      font-size: 20px;
      font-weight: 900;
      margin-bottom: 5px;
    }

    .shop-info {
      font-size: 12px;
      font-weight: 600;
      margin: 2px 0;
    }

    .bill-info {
      margin: 10px 0;
      font-size: 13px;
      font-weight: 600;
    }

    .items {
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
      padding: 10px 0;
      margin: 10px 0;
    }

    .item-row {
      display: flex;
      justify-content: space-between;
      margin: 6px 0;
      font-size: 14px;
      font-weight: 700;
    }

    .totals {
      margin: 10px 0;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
      font-size: 14px;
      font-weight: 700;
    }

    .grand-total {
      font-size: 18px;
      font-weight: 900;
      border-top: 2px solid #000;
      padding-top: 5px;
      margin-top: 5px;
    }

    .footer {
      text-align: center;
      margin-top: 15px;
      padding-top: 10px;
      border-top: 2px dashed #000;
      font-size: 13px;
      font-weight: 700;
    }
  </style>
</head>

<body>

  <!-- HEADER -->
  <div class="header">
    <div class="shop-name">${settings.shopName}</div>
    <div class="shop-info">${settings.shopAddress}</div>
    ${settings.shopGST ? `<div class="shop-info">GSTIN: ${settings.shopGST}</div>` : ""}
    ${settings.shopPhone ? `<div class="shop-info">Tel: ${settings.shopPhone}</div>` : ""}
  </div>

  <!-- BILL INFO -->
  <div class="bill-info">
    <div><strong>Bill No:</strong> ${bill.billNumber}</div>
    <div><strong>Date:</strong> ${new Date(bill.createdAt).toLocaleString()}</div>
    <div><strong>Cashier:</strong> ${bill.createdByName}</div>
    ${bill.customerName ? `<div><strong>Customer:</strong> ${bill.customerName}</div>` : ""}
  </div>

  <!-- ITEM TABLE -->
  <div class="items">

    <!-- HEADER ROW -->
    <div
      style="
        display: flex;
        justify-content: space-between;
        font-weight: bold;
        border-bottom: 1px solid #000;
        padding-bottom: 5px;
        margin-bottom: 5px;
        font-size: 14px;
      "
    >
      <div style="flex: 2;">Item</div>
      <div style="width: 40px; text-align: center;">Qty</div>
      <div style="width: 70px; text-align: right;">Price</div>
      <div style="width: 70px; text-align: right;">Amount</div>
    </div>

    <!-- ITEM ROWS -->
    ${bill.items
      .map(
        (item) => `
      <div class="item-row">
        <div style="flex: 2;">${item.name}</div>
        <div style="width: 40px; text-align: center;">${item.quantity}</div>
        <div style="width: 70px; text-align: right;">${item.price.toFixed(2)}</div>
        <div style="width: 70px; text-align: right;">${item.subtotal.toFixed(2)}</div>
      </div>
    `
      )
      .join("")}

  </div>

  <!-- TOTALS -->
  <div class="totals">
    <div class="total-row">
      <span>Subtotal:</span>
      <span>${settings.currency}${bill.subtotal.toFixed(2)}</span>
    </div>

    <div class="total-row">
      <span>CGST (${settings.cgstRate}%):</span>
      <span>${settings.currency}${bill.cgst.toFixed(2)}</span>
    </div>

    <div class="total-row">
      <span>SGST (${settings.sgstRate}%):</span>
      <span>${settings.currency}${bill.sgst.toFixed(2)}</span>
    </div>

    <div class="total-row grand-total">
      <span>GRAND TOTAL:</span>
      <span>${settings.currency}${bill.total.toFixed(2)}</span>
    </div>
  </div>

  ${bill.paymentMethod
    ? `<div style="margin: 10px 0;">
        <strong>Payment:</strong> ${bill.paymentMethod.toUpperCase()}
      </div>`
    : ""}

  <!-- FOOTER -->
  <div class="footer">
    <div style="font-size: 15px; font-weight: 900;">Thank You! Visit Again!</div>
    <div style="font-size: 9px; margin-top: 5px;">Powered by Restaurant POS</div>
  </div>

</body>
</html>
`;
}

export function printBill(bill: Bill, settings: AppSettings): void {
  const w = window.open("", "_blank");
  if (!w) {
    alert("Please allow popups to print bills");
    return;
  }

  w.document.write(generatePrintHTML(bill, settings));
  w.document.close();

  setTimeout(() => {
    w.focus();
    w.print();
    w.close();
  }, 250);
}
