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
    @page { size: ${width} auto; margin: 0; }

    body {
      font-family: Arial, sans-serif;
      font-size: 14px;
      font-weight: 600;
      padding: 10px;
      width: ${width};
    }

    .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; }
    .shop-name { font-size: 20px; font-weight: 900; }

    .item-row { display: flex; justify-content: space-between; margin: 6px 0; }

    .order-type {
      font-size: 18px;
      font-weight: 900;
      text-align: center;
      margin: 10px 0;
      padding: 5px 0;
      border: 2px solid #000;
    }
  </style>
</head>

<body>

  <div class="header">
    <div class="shop-name">${settings.shopName}</div>
    <div>${settings.shopAddress}</div>
    ${settings.shopGST ? `<div>GSTIN: ${settings.shopGST}</div>` : ""}
  </div>

  <!-- ORDER TYPE -->
  <div class="order-type">${bill.orderType === "parcel" ? "PARCEL" : "DINE-IN"}</div>

  <!-- BILL INFO -->
  <div>
    <div><strong>Bill No:</strong> ${bill.billNumber}</div>
    <div><strong>Date:</strong> ${new Date(bill.createdAt).toLocaleString("en-IN")}</div>
    <div><strong>Cashier:</strong> ${bill.createdByName}</div>
    ${bill.customerName ? `<div><strong>Customer:</strong> ${bill.customerName}</div>` : ""}
  </div>

  <!-- ITEM LIST -->
  <div style="border-top:1px dashed #000; border-bottom:1px dashed #000; margin:10px 0; padding:10px 0;">
    <div style="display:flex; justify-content:space-between; border-bottom:1px solid #000; padding-bottom:5px;">
      <div style="flex:2;">Item</div>
      <div style="width:40px;text-align:center;">Qty</div>
      <div style="width:70px;text-align:right;">Price</div>
      <div style="width:70px;text-align:right;">Amount</div>
    </div>

    ${bill.items
      .map(
        (i) => `
      <div class="item-row">
        <div style="flex:2;">${i.name}</div>
        <div style="width:40px;text-align:center;">${i.quantity}</div>
        <div style="width:70px;text-align:right;">${i.price.toFixed(2)}</div>
        <div style="width:70px;text-align:right;">${i.subtotal.toFixed(2)}</div>
      </div>
    `
      )
      .join("")}
  </div>

  <!-- TOTALS -->
  <div>
    <div class="item-row"><span>Subtotal:</span><span>${settings.currency}${bill.subtotal.toFixed(2)}</span></div>
    <div class="item-row"><span>CGST:</span><span>${settings.currency}${bill.cgst.toFixed(2)}</span></div>
    <div class="item-row"><span>SGST:</span><span>${settings.currency}${bill.sgst.toFixed(2)}</span></div>

    <div class="item-row" style="border-top:2px solid #000; padding-top:5px; font-size:18px; font-weight:900;">
      <span>GRAND TOTAL:</span>
      <span>${settings.currency}${bill.total.toFixed(2)}</span>
    </div>
  </div>

  <div style="text-align:center; margin-top:15px;">
    <div style="font-size:15px; font-weight:900;">Thank You! Visit Again!</div>
  </div>

</body>
</html>
`;
}

export function printBill(bill: Bill, settings: AppSettings): void {
  const w = window.open("", "_blank");
  if (!w) {
    alert("Enable popups to print");
    return;
  }
  w.document.write(generatePrintHTML(bill, settings));
  w.document.close();
  setTimeout(() => { w.print(); w.close(); }, 250);
}
