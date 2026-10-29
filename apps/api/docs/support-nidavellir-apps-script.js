/**
 * Paste into: Support Nidavellir spreadsheet → Extensions → Apps Script
 * Tabs (exact names):
 *   1) Support Tickets
 *   2) Support Commerce
 *   3) Support Account App
 *
 * Deploy → Web app → Execute as: Me → Who has access: Anyone → New version
 * Paste /exec URL into apps/mobile appConfig.supportFormWebhookUrl
 */

var TAB_TICKETS = 'Support Tickets';
var TAB_COMMERCE = 'Support Commerce';
var TAB_ACCOUNT = 'Support Account App';

// Support Tickets headers (row 1), 1-based columns:
// Timestamp | Name | Email | Phone | Category | Subcategory | OrderId | ProductSku | Comments | Status | CaseNumber | Source
var TICKETS = {
  Timestamp: 1,
  Name: 2,
  Email: 3,
  Phone: 4,
  Category: 5,
  Subcategory: 6,
  OrderId: 7,
  ProductSku: 8,
  Comments: 9,
  Status: 10,
  CaseNumber: 11,
  Source: 12,
};

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var tickets = ss.getSheetByName(TAB_TICKETS);
    if (!tickets) throw new Error('Missing tab: ' + TAB_TICKETS);

    var action = data.action || 'create';

    if (action === 'resolve') {
      var caseNumber = String(data.caseNumber || '').trim();
      if (!caseNumber) throw new Error('caseNumber required to resolve');
      var row = findRowByCaseNumber(tickets, caseNumber, TICKETS.CaseNumber);
      if (!row) throw new Error('Case not found: ' + caseNumber);
      tickets.getRange(row, TICKETS.Status).setValue('Resolved');
      return json({ ok: true, action: 'resolve', caseNumber: caseNumber });
    }

    var caseNo = String(data.caseNumber || '').trim();
    if (!caseNo) throw new Error('caseNumber required on create');

    // Row order must match header order above
    tickets.appendRow([
      new Date(), // Timestamp
      data.name || '',
      data.email || '',
      data.phone || '',
      data.category || '',
      data.subcategory || '',
      data.orderId || '',
      data.productSku || '',
      data.comments || '',
      data.status || 'Pending', // Status
      caseNo, // CaseNumber
      data.source || 'nidavellir-mobile-support',
    ]);

    if (hasCommerceExtras(data)) {
      var commerce = ss.getSheetByName(TAB_COMMERCE);
      if (!commerce) throw new Error('Missing tab: ' + TAB_COMMERCE);
      // CaseNumber | OrderDate | PaymentMode | TransactionId | PaymentAmount | PaymentDate |
      // AWB | ExpectedDate | DeliveryAddress | ReturnProduct | ReturnRequestId | RefundAmount | RefundReference
      commerce.appendRow([
        caseNo,
        data.orderDate || '',
        data.paymentMode || '',
        data.transactionId || '',
        data.paymentAmount || '',
        data.paymentDate || '',
        data.awb || '',
        data.expectedDate || '',
        data.deliveryAddress || '',
        data.returnProduct || '',
        data.returnRequestId || '',
        data.refundAmount || '',
        data.refundReference || '',
      ]);
    }

    if (hasAccountExtras(data)) {
      var account = ss.getSheetByName(TAB_ACCOUNT);
      if (!account) throw new Error('Missing tab: ' + TAB_ACCOUNT);
      // CaseNumber | RegisteredMobile | RegisteredEmail | ErrorMessage | Device | CouponCode
      account.appendRow([
        caseNo,
        data.registeredMobile || '',
        data.registeredEmail || '',
        data.errorMessage || '',
        data.device || '',
        data.couponCode || '',
      ]);
    }

    return json({ ok: true, action: 'create', caseNumber: caseNo });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function hasCommerceExtras(data) {
  return !!(
    data.orderDate ||
    data.paymentMode ||
    data.transactionId ||
    data.paymentAmount ||
    data.paymentDate ||
    data.awb ||
    data.expectedDate ||
    data.deliveryAddress ||
    data.returnProduct ||
    data.returnRequestId ||
    data.refundAmount ||
    data.refundReference
  );
}

function hasAccountExtras(data) {
  return !!(
    data.registeredMobile ||
    data.registeredEmail ||
    data.errorMessage ||
    data.device ||
    data.couponCode
  );
}

function findRowByCaseNumber(sheet, caseNumber, caseCol) {
  var values = sheet.getDataRange().getValues();
  for (var r = 1; r < values.length; r++) {
    if (String(values[r][caseCol - 1]).trim() === caseNumber) return r + 1;
  }
  return 0;
}

function doGet() {
  return json({ ok: true, service: 'nidavellir-support-3tabs' });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
