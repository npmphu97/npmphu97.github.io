/**
 * Nhận câu trả lời khảo sát từ trang khao-sat-nhu-cau.html và ghi vào Google Sheet.
 * Mỗi khách một dòng, khóa là SỐ ĐIỆN THOẠI (cột sid), cập nhật liên tục khi khách trả lời tiếp.
 * Khách quay lại (kể cả thiết bị khác) nhập số điện thoại + email đã dùng lúc đầu thì được nạp lại
 * phiếu làm dở (doGet). Email không khớp thì không trả dữ liệu và không cho ghi đè.
 *
 * CÁCH CÀI (khoảng 5 phút):
 * 1. Tạo Google Sheet mới (đặt tên tùy ý) > Tiện ích mở rộng > Apps Script.
 * 2. Dán toàn bộ file này vào, lưu.
 * 3. Triển khai > Tùy chọn triển khai mới > loại "Ứng dụng web":
 *      - Thực thi dưới tên: Tôi
 *      - Người có quyền truy cập: Bất kỳ ai
 *    Cấp quyền khi được hỏi, rồi sao chép "URL ứng dụng web".
 * 4. Dán URL đó vào biến REMOTE_ENDPOINT trong khao-sat-nhu-cau.html.
 * 5. Lấy dữ liệu: Sheet > Tệp > Tải xuống > CSV. (Cột answers_json chứa toàn bộ
 *    câu trả lời dạng JSON nếu cần.)
 *
 * TỰ GỬI MAIL: khi khách bấm xem kết quả (hoàn thành phiếu), script gửi một email
 * tóm tắt tới NOTIFY_EMAIL (mặc định là chính tài khoản Google đã cài script).
 * Lần đầu triển khai Google sẽ hỏi quyền gửi email, bấm cho phép. Hạn mức gói miễn phí:
 * khoảng 100 email/ngày. Đặt NOTIFY_EMAIL = '' để tắt.
 *
 * Sửa code rồi phải "Quản lý bản triển khai" > Chỉnh sửa > Phiên bản mới để có hiệu lực.
 */
var SHEET_NAME = 'KhaoSat';
var NOTIFY_EMAIL = 'npmphu97@gmail.com';
var COLS = ['sid', 'cap_nhat', 'trang_thai', 'buoc', 'ho_ten', 'cong_ty', 'sdt', 'email',
  'linh_vuc', 'muc_tieu', 'ngan_sach', 'goi_de_xuat', 'tong_thap', 'tong_cao',
  'van_hanh', 'phan_loai', 'canh_bao', 'answers_json', 'email_xac_minh'];

/** Chuẩn hóa số điện thoại: chỉ giữ chữ số, đổi +84/84 đầu thành 0. */
function normPhone(s) {
  var d = String(s || '').replace(/[^\d+]/g, '').replace(/^\+?84/, '0');
  return d.replace(/\D/g, '').slice(0, 20);
}

function normEmail(s) {
  return String(s || '').trim().toLowerCase();
}

function col(name) {
  return COLS.indexOf(name);
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(COLS);
    sh.setFrozenRows(1);
  }
  return sh;
}

/** Trả về số dòng (1-based) của sid, hoặc 0 nếu chưa có. */
function findRow(sh, sid) {
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (normPhone(ids[i][0]) === sid) return i + 2;
  }
  return 0;
}

/** Email dùng để xác minh của một dòng (dòng cũ chưa có cột xác minh thì dùng cột email). */
function expectedEmail(rowVals) {
  return normEmail(rowVals[col('email_xac_minh')] || rowVals[col('email')]);
}

/** Nạp lại phiếu làm dở: GET ?sid=<sđt>&email=<email xác minh> */
function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    var sid = normPhone(p.sid);
    var email = normEmail(p.email);
    if (!sid) return json({ status: 'error' });
    var sh = getSheet();
    var at = findRow(sh, sid);
    if (!at) return json({ status: 'new' });
    var vals = sh.getRange(at, 1, 1, COLS.length).getValues()[0];
    var expected = expectedEmail(vals);
    if (!email || !expected || email !== expected) return json({ status: 'mismatch' });
    var answers = {};
    try { answers = JSON.parse(vals[col('answers_json')] || '{}'); } catch (err) {}
    return json({
      status: 'ok',
      trang_thai: String(vals[col('trang_thai')]),
      buoc: String(vals[col('buoc')]),
      answers: answers
    });
  } catch (err) {
    return json({ status: 'error' });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var rec = JSON.parse(e.postData.contents);
    var sid = normPhone(rec.sid);
    if (!sid) return out('thieu sid');
    var vem = normEmail(rec.vemail);

    var sh = getSheet();
    var last = sh.getLastRow();
    var at = findRow(sh, sid);
    var wasDone = false;
    var verified = vem;
    if (at) {
      var old = sh.getRange(at, 1, 1, COLS.length).getValues()[0];
      var expected = expectedEmail(old);
      if (expected && expected !== vem) return out('sai xac minh');
      if (!expected && !vem) return out('thieu xac minh');
      verified = expected || vem;
      wasDone = String(old[col('trang_thai')]) === 'hoan_thanh';
    } else {
      if (!vem) return out('thieu xac minh');
      at = last + 1;
    }

    var row = COLS.map(function (c) {
      if (c === 'sid') return sid;
      if (c === 'answers_json') return JSON.stringify(rec.answers || {});
      if (c === 'email_xac_minh') return verified;
      var v = rec[c];
      if (Array.isArray(v)) v = v.join('; ');
      return v == null ? '' : v;
    });

    var rng = sh.getRange(at, 1, 1, COLS.length);
    rng.setNumberFormat('@'); // giữ nguyên số 0 đầu của số điện thoại
    rng.setValues([row]);
    if (rec.trang_thai === 'hoan_thanh' && !wasDone) notify(rec);
    return out('ok');
  } catch (err) {
    return out('loi: ' + err);
  } finally {
    lock.releaseLock();
  }
}

function out(s) {
  return ContentService.createTextOutput(s);
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/** Gửi email tóm tắt cho chủ sheet. Chỉ gửi một lần cho mỗi khách (lần đầu hoàn thành). */
function notify(rec) {
  if (!NOTIFY_EMAIL) return;
  try {
    var opts = { name: 'Khảo sát nhu cầu' };
    if (rec.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(rec.email)) opts.replyTo = rec.email;
    var lines = [];
    if (rec.phan_loai) lines.push('Phân loại: ' + rec.phan_loai);
    if (rec.tong_thap) {
      lines.push('Chi phí ước tính (chưa VAT): ' + rec.tong_thap +
        (rec.tong_cao !== rec.tong_thap ? ' đến ' + rec.tong_cao : '') + ' đ');
    }
    lines.push('');
    lines.push(rec.tom_tat || JSON.stringify(rec.answers || {}, null, 2));
    var body = lines.join('\n');
    MailApp.sendEmail(NOTIFY_EMAIL, 'Khảo sát mới: ' + (rec.cong_ty || rec.ho_ten || ''), body, opts);
  } catch (err) {
    // lỗi gửi mail không được làm mất dữ liệu đã ghi vào sheet
  }
}
