/**
 * Nhận câu trả lời khảo sát từ trang khao-sat-nhu-cau.html và ghi vào Google Sheet.
 * Mỗi khách một dòng, khóa là SỐ ĐIỆN THOẠI (cột sid), cập nhật liên tục khi khách trả lời tiếp.
 * Khách quay lại (kể cả thiết bị khác) nhập số điện thoại + email đã dùng lúc đầu, nhận MÃ OTP 6 số qua
 * email, nhập đúng mã thì được nạp lại phiếu làm dở. Không có mã đúng thì không đọc/ghi đè được dữ liệu.
 * Lần đầu cài, Google sẽ hỏi quyền gửi email (dùng cho OTP và thông báo), bấm cho phép.
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

// ---- Xác minh OTP qua email ------------------------------------------------
var OTP_TTL = 600;          // mã có hiệu lực 10 phút
var OTP_TRIES = 5;          // sai quá 5 lần thì phải xin mã mới
var OTP_COOLDOWN = 60;      // giãn cách giữa 2 lần gửi mã (giây)
var OTP_MAX_SENDS = 5;      // tối đa 5 mã / giờ / số điện thoại
var TOKEN_TTL_MS = 24 * 3600 * 1000; // phiên sau khi xác minh: 24 giờ

function secret() {
  var pr = PropertiesService.getScriptProperties();
  var s = pr.getProperty('SECRET');
  if (!s) {
    s = Utilities.getUuid() + Utilities.getUuid();
    pr.setProperty('SECRET', s);
  }
  return s;
}

function hmac(msg) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(msg, secret())).replace(/=+$/, '');
}

function makeToken(sid, email) {
  var body = [sid, email, Date.now() + TOKEN_TTL_MS].join('|');
  return Utilities.base64EncodeWebSafe(body) + '.' + hmac(body);
}

/** Trả về {sid, email} nếu token hợp lệ và chưa hết hạn, ngược lại null. */
function parseToken(tok) {
  try {
    var parts = String(tok || '').split('.');
    if (parts.length !== 2) return null;
    var body = Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString();
    if (hmac(body) !== parts[1]) return null;
    var f = body.split('|');
    if (f.length !== 3 || Number(f[2]) < Date.now()) return null;
    return { sid: f[0], email: f[1] };
  } catch (err) {
    return null;
  }
}

function newCode() {
  var n = parseInt(Utilities.getUuid().replace(/-/g, '').slice(0, 8), 16) % 1000000;
  return ('000000' + n).slice(-6);
}

function validEmail(s) {
  return /^[^@\s|]+@[^@\s|]+\.[^@\s|]+$/.test(s);
}

/**
 * GET ?action=otp&sid=<sđt>&email=<email>          -> gửi mã 6 số tới email (nếu hợp lệ)
 * GET ?action=verify&sid&email&code=<mã>           -> kiểm tra mã, trả token + phiếu làm dở (nếu có)
 * Luôn trả "sent" dù email có khớp phiếu cũ hay không, để người lạ không dò được số nào đã có phiếu.
 */
function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    var sid = normPhone(p.sid);
    var email = normEmail(p.email);
    if (!sid || !validEmail(email)) return json({ status: 'error' });
    var cache = CacheService.getScriptCache();

    if (p.action === 'otp') {
      if (cache.get('cd_' + sid)) return json({ status: 'wait' });
      var sends = Number(cache.get('sc_' + sid) || 0);
      if (sends >= OTP_MAX_SENDS) return json({ status: 'limit' });
      cache.put('cd_' + sid, '1', OTP_COOLDOWN);
      cache.put('sc_' + sid, String(sends + 1), 3600);

      var sh = getSheet();
      var at = findRow(sh, sid);
      var allowed = true;
      if (at) {
        var expected = expectedEmail(sh.getRange(at, 1, 1, COLS.length).getValues()[0]);
        allowed = !!expected && expected === email;
      }
      if (allowed) {
        var code = newCode();
        cache.put('otp_' + sid, JSON.stringify({ h: hmac('otp|' + sid + '|' + email + '|' + code), e: email, t: 0 }), OTP_TTL);
        MailApp.sendEmail(email, 'Mã xác minh khảo sát: ' + code,
          'Mã xác minh của bạn là: ' + code + '\n\nMã có hiệu lực trong ' + (OTP_TTL / 60) +
          ' phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.', { name: 'Khảo sát nhu cầu' });
      }
      return json({ status: 'sent' });
    }

    if (p.action === 'verify') {
      var raw = cache.get('otp_' + sid);
      if (!raw) return json({ status: 'bad' });
      var o = JSON.parse(raw);
      if (o.e !== email || o.t >= OTP_TRIES) { cache.remove('otp_' + sid); return json({ status: 'bad' }); }
      var code2 = String(p.code || '').replace(/\D/g, '');
      if (hmac('otp|' + sid + '|' + email + '|' + code2) !== o.h) {
        o.t++;
        cache.put('otp_' + sid, JSON.stringify(o), OTP_TTL);
        return json({ status: 'bad' });
      }
      cache.remove('otp_' + sid);
      var token = makeToken(sid, email);
      var sh2 = getSheet();
      var at2 = findRow(sh2, sid);
      if (!at2) return json({ status: 'new', token: token });
      var vals = sh2.getRange(at2, 1, 1, COLS.length).getValues()[0];
      var answers = {};
      try { answers = JSON.parse(vals[col('answers_json')] || '{}'); } catch (err) {}
      return json({
        status: 'ok', token: token,
        trang_thai: String(vals[col('trang_thai')]),
        buoc: String(vals[col('buoc')]),
        answers: answers
      });
    }
    return json({ status: 'error' });
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
    var tok = parseToken(rec.token);
    if (!tok || tok.sid !== sid) return out('chua xac minh');
    var vem = tok.email;

    var sh = getSheet();
    var last = sh.getLastRow();
    var at = findRow(sh, sid);
    var wasDone = false;
    if (at) {
      var old = sh.getRange(at, 1, 1, COLS.length).getValues()[0];
      var expected = expectedEmail(old);
      if (!expected || expected !== vem) return out('sai xac minh');
      wasDone = String(old[col('trang_thai')]) === 'hoan_thanh';
    } else {
      at = last + 1;
    }

    var row = COLS.map(function (c) {
      if (c === 'sid') return sid;
      if (c === 'answers_json') return JSON.stringify(rec.answers || {});
      if (c === 'email_xac_minh') return vem;
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
