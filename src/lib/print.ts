import { Bill, AppSettings } from '@/types';

export function generatePrintHTML(bill: Bill, settings: AppSettings): string {
  const width = settings.printerFormat === '58mm' ? '58mm' : '80mm';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bill ${bill.billNumber}</title>
  <style>
    @page {
      size: ${width} auto;
      margin: 0;
    }
    
    body {
      font-family: 'Arial', sans-serif;   /* Bigger + Darker font */
      font-size: 14px;                    /* 12 → 14 (1 size bigger) */
      line-height: 1.45;
      font-weight: 600;                   /* Darker */
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
      font-size: 20px;       /* Bigger */
      font-weight: 900;      /* Very bold */
      margin-bottom: 5px;
    }
    
    .shop-info {
      font-size: 12px;       /* Slightly bigger */
      font-weight: 600;      /* Darker */
      margin: 2px 0;
    }
    
    .bill-info {
      margin: 10px 0;
      font-size: 13px;       /* Bigger */
      font-weight: 600;
    }
    
    .items {
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
      padding: 10px 0;
      margin: 10px 0;
    }
    
    .item {
      display: flex;
      justify-content: space-between;
      margin: 6px 0;
      font-size: 14px;       /* Bigger */
      font-weight: 700;      /* Darker */
    }
    
    .item-name {
      flex: 1;
    }
    
    .item-qty {
      width: 40px;
      text-align: center;
      font-weight: 700;
    }
    
    .item-price {
      width: 60px;
      text-align: right;
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
      font-weight: 700;      /* Darker */
    }
    
    .grand-total {
      font-size: 18px;       /* Bigger */
      font-weight: 900;      /* Very bold */
      border-top: 2px solid #000;
      padding-top: 5px;
      margin-top: 5px;
    }
    
    .footer {
      text-align: center;
      margin-top: 15px;
      padding-top: 10px;
      border-top: 2px dashed #000;
      font-size: 13px;       /* Bigger */
      font-weight: 700;      /* Darker */
    }
    
    .thank-you {
      font-weight: 900;      /* Very bold */
      font-size: 15px;       /* Bigger */
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="shop-name">${settings.shopName}</div>
    <div class="shop-info">${settings.shopAddress}</div>
    ${settings.shopGST ? `<div class="shop-info">GSTIN: ${settings.shopGST}</div>` : ''}
    ${settings.shopPhone ? `<div class="shop-info">Tel: ${settings.shopPhone}</div>` : ''}
  </div>
  
  <div class="bill-info">
    <div><strong>Bill No:</strong> ${bill.billNumber}</div>
    <div><strong>Date:</strong> ${new Date(bill.createdAt).toLocaleString()}</div>
    <div><strong>Cashier:</strong> ${bill.createdByName}</div>
    ${bill.customerName ? `<div><strong>Customer:</strong> ${bill.customerName}</div>` : ''}
  </div>
  
  <div class="items">
    <div class="item" style="font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px;">
      <div class="item-name">Item</div>
      <div class="item-qty">Qty</div>
      <div class="item-price">Price</div>
    </div>
    ${bill.items.map(item => `
    <div class="item">
      <div class="item-name">${item.name}</div>
      <div class="item-qty">${item.quantity}</div>
      <div class="item-price">${settings.currency}${item.subtotal.toFixed(2)}</div>
    </div>
    `).join('')}
  </div>
  
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
  
  ${bill.paymentMethod ? `
  <div style="margin: 10px 0;">
    <strong>Payment:</strong> ${bill.paymentMethod.toUpperCase()}
  </div>
  ` : ''}
  
  ${bill.notes ? `
  <div style="margin: 10px 0; font-size: 10px;">
    <strong>Notes:</strong> ${bill.notes}
  </div>
  ` : ''}
  
  <div class="footer">
    <div class="thank-you">Thank You! Visit Again!</div>
    <div style="font-size: 9px; margin-top: 5px;">
      Powered by Restaurant POS
    </div>
  </div>
</body>
</html>
  `;
}

export function printBill(bill: Bill, settings: AppSettings): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print bills');
    return;
  }
  
  printWindow.document.write(generatePrintHTML(bill, settings));
  printWindow.document.close();
  
  // Wait for content to load, then print
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }, 250);
}
