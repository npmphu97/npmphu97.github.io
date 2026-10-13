/**
 * Nhận câu trả lời khảo sát từ trang khao-sat-nhu-cau.html và ghi vào Google Sheet.
 * Mỗi khách một dòng (theo cột sid), cập nhật liên tục khi khách trả lời tiếp.
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
  'van_hanh', 'phan_loai', 'canh_bao', 'answers_json'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var rec = JSON.parse(e.postData.contents);
    var sid = String(rec.sid || '').slice(0, 64);
    if (!sid) return out('thieu sid');

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() === 0) {
      sh.appendRow(COLS);
      sh.setFrozenRows(1);
    }

    var row = COLS.map(function (c) {
      if (c === 'answers_json') return JSON.stringify(rec.answers || {});
      var v = rec[c];
      if (Array.isArray(v)) v = v.join('; ');
      return v == null ? '' : v;
    });

    var last = sh.getLastRow();
    var ids = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues() : [];
    var at = 0;
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === sid) { at = i + 2; break; }
    }
    if (!at) at = last + 1;
    var wasDone = at <= last && String(sh.getRange(at, 3).getValue()) === 'hoan_thanh';
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
