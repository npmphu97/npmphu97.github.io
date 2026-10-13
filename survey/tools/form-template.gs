/**
 * TẠO GOOGLE FORM KHẢO SÁT NHU CẦU (tự sinh từ khao-sat-nhu-cau.html, đừng sửa tay phần DATA/ANALYZE).
 * Sửa giá hoặc câu hỏi trong khao-sat-nhu-cau.html rồi chạy lại: node tools/build-google-form.js
 *
 * CÁCH DÙNG (khoảng 5 phút):
 * 1. Vào script.google.com > Dự án mới, dán toàn bộ file này vào, lưu.
 * 2. Chọn hàm taoGoogleForm > Chạy. Cấp quyền khi Google hỏi (Forms, Sheets, Drive, Gmail, trigger).
 * 3. Xem Nhật ký thực thi: có link gửi cho khách (published URL), link chỉnh sửa và link Google Sheet phản hồi.
 * 4. Từ lúc đó, mỗi khi khách gửi form: script tự tính gói và giá, gửi mail tóm tắt cho NOTIFY_EMAIL,
 *    và thêm một dòng phân tích vào sheet "PhanTich" trong Google Sheet phản hồi.
 *
 * Chỉ chạy taoGoogleForm MỘT lần (chạy lại sẽ tạo thêm một form mới). Muốn thử phần tính giá mà
 * không cần điền form: chạy kiemTraPhanTich và xem Nhật ký.
 */
var NOTIFY_EMAIL = 'npmphu97@gmail.com';
var FORM_TITLE = 'Khảo sát nhu cầu website / app / hệ thống';
var ZALO_TEXT = '0379 774 886';

var ans = {}; // dùng bởi res() trong khối DATA

/*@@DATA@@*/

/*@@ANALYZE@@*/

/* ============================================================
   DỰNG FORM
   ============================================================ */
function val_(x, a) { return typeof x === 'function' ? x(a) : x; }

function stepById_(id) {
  for (var i = 0; i < STEPS.length; i++) if (STEPS[i].id === id) return STEPS[i];
  throw new Error('Không có bước ' + id);
}

function qById_(id) {
  for (var i = 0; i < STEPS.length; i++)
    for (var j = 0; j < STEPS[i].qs.length; j++) if (STEPS[i].qs[j].id === id) return STEPS[i].qs[j];
  return null;
}

function labelsOf_(q, a) {
  return getOpts(q, a).map(function (o) { return o[1]; });
}

function taoGoogleForm() {
  var form = FormApp.create(FORM_TITLE);
  form.setDescription('Trả lời vài câu hỏi ngắn, khoảng 5 phút. Câu nào chưa rõ cứ chọn "Chưa rõ". ' +
    'Mình sẽ liên hệ lại với đề xuất phương án và chi phí tham khảo.')
    .setProgressBar(true)
    .setAllowResponseEdits(false)
    .setConfirmationMessage('Cảm ơn bạn! Mình đã nhận được thông tin và sẽ liên hệ trong 1 ngày làm việc. ' +
      'Cần gấp, nhắn Zalo ' + ZALO_TEXT + '.');
  try { form.setCollectEmail(false); } catch (e) {}
  try { form.setLimitOneResponsePerUser(false); } catch (e) {}

  var map = {};   // id câu hỏi trong form -> mã câu hỏi (qid)
  var pages = {}; // tên trang -> PageBreakItem

  function addQ(q, a, suffix, forceOptional) {
    var title = q.label + (suffix || '');
    var help = val_(q.h, a) || '';
    var item;
    if (q.type === 'radio') item = form.addMultipleChoiceItem().setChoiceValues(labelsOf_(q, a));
    else if (q.type === 'check') item = form.addCheckboxItem().setChoiceValues(labelsOf_(q, a));
    else if (q.type === 'textarea') item = form.addParagraphTextItem();
    else {
      item = form.addTextItem();
      if (q.type === 'email') {
        item.setValidation(FormApp.createTextValidation().requireTextIsEmail().build());
      }
    }
    item.setTitle(title);
    if (q.show) { help = (help ? help + ' ' : '') + '(Bỏ qua nếu không áp dụng.)'; }
    if (help) item.setHelpText(help);
    item.setRequired(!!q.req && !q.show && !forceOptional);
    map[item.getId()] = q.id;
    return item;
  }

  function addGate(qid, title, help) {
    var item = form.addMultipleChoiceItem().setTitle(title).setHelpText(help).setRequired(true);
    item.setChoiceValues(['Có', 'Không']); // thay bằng lựa chọn có chuyển trang ở cuối
    map[item.getId()] = qid;
    return item;
  }

  function page(name, title, desc) {
    var p = form.addPageBreakItem().setTitle(title);
    if (desc) p.setHelpText(desc);
    pages[name] = p;
    return p;
  }

  // ---------- Trang 1: thông tin (nằm trên trang đầu tiên của form) ----------
  var s1 = stepById_('s1');
  var linhItem = null;
  s1.qs.forEach(function (q) {
    var it = addQ(q, {}, '');
    if (q.id === 'linh_vuc') linhItem = it;
  });

  // ---------- Mỗi lĩnh vực: Mục tiêu > Hỏi hệ thống > Nghiệp vụ ----------
  var linhQ = qById_('linh_vuc');
  var sectors = linhQ.opts.map(function (o) { return o[0]; }); // gồm cả 'khac'
  var s2 = stepById_('s2'), s4 = stepById_('s4');
  var gateSysItems = {};
  sectors.forEach(function (sk) {
    var a = { linh_vuc: sk };
    var S = sec(a), suf = ' [' + S.name + ']';
    page('goals_' + sk, s2.title + suf, s2.desc);
    addQ(qById_('muc_tieu'), a, suf);
    page('gate_' + sk, 'Hỏi nhanh: phần mềm quản lý' + suf, 'Chỉ để chuyển bạn tới đúng phần câu hỏi.');
    gateSysItems[sk] = addGate('gate_sys', 'Bạn có cần phần mềm quản lý (CRM, quản lý vận hành) không?',
      'Chọn Không nếu bạn không chọn CRM hoặc quản lý vận hành ở phần Mục tiêu.');
    page('nv_' + sk, 'Nghiệp vụ cần quản lý' + suf, s4.desc);
    addQ(qById_('nghiep_vu'), a, suf);
    addQ(qById_('nghiep_vu_khac'), a, suf);
  });

  // ---------- Phần chung ----------
  page('sys', 'Quy mô hệ thống', 'Giúp ước lượng chi phí hệ thống.');
  s4.qs.forEach(function (q) {
    if (q.id === 'nghiep_vu' || q.id === 'nghiep_vu_khac') return;
    addQ(q, {}, '');
  });

  page('desc', 'Hiện trạng của bạn', 'Cho mình hiểu bối cảnh.');
  s2.qs.forEach(function (q) {
    if (q.id === 'muc_tieu') return;
    addQ(q, {}, '');
  });

  page('gateW', 'Hỏi nhanh: website', 'Chỉ để chuyển bạn tới đúng phần câu hỏi.');
  var gateW = addGate('gate_web', 'Bạn có cần làm website / landing page không?',
    'Chọn Không nếu bạn không chọn mục website, bán hàng online ở phần Mục tiêu.');
  var s3 = stepById_('s3');
  page('web', s3.title, s3.desc);
  s3.qs.forEach(function (q) { addQ(q, {}, ''); });

  page('gateM', 'Hỏi nhanh: Zalo Mini App', 'Chỉ để chuyển bạn tới đúng phần câu hỏi.');
  var gateM = addGate('gate_mini', 'Bạn có cần Zalo Mini App không?', 'Ứng dụng chạy ngay trong Zalo.');
  var s5 = stepById_('s5');
  page('mini', s5.title, s5.desc);
  s5.qs.forEach(function (q) { addQ(q, {}, ''); });

  var s6 = stepById_('s6');
  page('budget', s6.title, s6.desc);
  s6.qs.forEach(function (q) { addQ(q, {}, ''); });

  // ---------- Nối các trang với nhau ----------
  // Lệnh chuyển trang của một ngắt trang áp dụng cho trang đứng TRƯỚC nó (theo tài liệu Google).
  linhItem.setChoices(linhQ.opts.map(function (o) {
    return linhItem.createChoice(o[1], pages['goals_' + o[0]]);
  }));
  sectors.forEach(function (sk, i) {
    gateSysItems[sk].setChoices([
      gateSysItems[sk].createChoice('Có', pages['nv_' + sk]),
      gateSysItems[sk].createChoice('Không', pages.desc)
    ]);
    // trang nghiệp vụ của lĩnh vực này nằm ngay trước ngắt trang "goals" của lĩnh vực kế tiếp
    if (i < sectors.length - 1) pages['goals_' + sectors[i + 1]].setGoToPage(pages.sys);
  });
  gateW.setChoices([gateW.createChoice('Có', pages.web), gateW.createChoice('Không', pages.gateM)]);
  gateM.setChoices([gateM.createChoice('Có', pages.mini), gateM.createChoice('Không', pages.budget)]);

  // ---------- Sheet phản hồi, lưu bản đồ, trigger ----------
  var ss = SpreadsheetApp.create('Khảo sát nhu cầu: phản hồi');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  var props = PropertiesService.getScriptProperties();
  props.setProperty('map', JSON.stringify(map));
  props.setProperty('ssId', ss.getId());
  ScriptApp.newTrigger('onFormSubmit').forForm(form).onFormSubmit().create();
  try { if (form.setPublished) form.setPublished(true); } catch (e) {}
  try { if (form.setAcceptingResponses) form.setAcceptingResponses(true); } catch (e) {}

  Logger.log('GỬI CHO KHÁCH: ' + form.getPublishedUrl());
  Logger.log('Chỉnh sửa form: ' + form.getEditUrl());
  Logger.log('Google Sheet phản hồi: ' + ss.getUrl());
}

/* ============================================================
   KHI KHÁCH GỬI FORM: TÍNH GÓI, GIÁ, GỬI MAIL, GHI SHEET
   ============================================================ */
function codeOf_(qid, label) {
  var q = qById_(qid);
  if (!q || !q.opts) return label;
  var lists = typeof q.opts === 'function'
    ? [q.opts({})].concat(Object.keys(SECTORS).map(function (k) { return q.opts({ linh_vuc: k }); }))
    : [q.opts];
  for (var i = 0; i < lists.length; i++)
    for (var j = 0; j < lists[i].length; j++) if (lists[i][j][1] === label) return lists[i][j][0];
  return label;
}

var GATE_IDS_ = { gate_sys: 1, gate_web: 1, gate_mini: 1 };

function dongChoForm_(responseItems, map) {
  var a = {}, raw = [];
  responseItems.forEach(function (ir) {
    var qid = map[ir.getItem().getId()];
    var v = ir.getResponse();
    raw.push(ir.getItem().getTitle() + ': ' + (Array.isArray(v) ? v.join('; ') : v));
    if (!qid) return;
    var isEmpty = v == null || v === '' || (Array.isArray(v) && !v.length);
    if (isEmpty) return;
    if (GATE_IDS_[qid]) { a[qid] = v === 'Có' ? 'co' : 'khong'; return; }
    var q = qById_(qid);
    if (q && q.type === 'check') {
      a[qid] = (Array.isArray(v) ? v : [v]).map(function (x) { return codeOf_(qid, x); });
    } else {
      a[qid] = Array.isArray(v) ? codeOf_(qid, v[0]) : codeOf_(qid, v);
    }
  });
  // đồng bộ mục tiêu với các câu "có/không" để phân tích không bỏ sót
  var g = a.muc_tieu = a.muc_tieu || [];
  var drop = function (list) { a.muc_tieu = a.muc_tieu.filter(function (k) { return list.indexOf(k) < 0; }); };
  if (a.gate_web === 'khong') drop(['landing', 'web', 'cms', 'shop']);
  if (a.gate_mini === 'khong') drop(['mini']);
  if (a.gate_sys === 'khong') drop(['crm', 'ql']);
  if (a.gate_web === 'co' && !wantsWeb(a)) a.muc_tieu.push('web');
  if (a.gate_mini === 'co' && !has(a, 'muc_tieu', 'mini')) a.muc_tieu.push('mini');
  if (a.gate_sys === 'co' && !wantsSys(a)) a.muc_tieu.push('crm');
  if (!a.muc_tieu.length) a.muc_tieu = ['unknown'];
  return { a: a, raw: raw };
}

function soanThu_(a, r, raw) {
  var L = [];
  L.push('Phân loại khách: ' + r.lead + ' (' + r.score + '/10)');
  L.push('Liên hệ: ' + (a.ho_ten || '') + ' · ' + (a.sdt || '') + (a.email ? ' · ' + a.email : ''));
  L.push('Doanh nghiệp: ' + (a.cong_ty || '') + ' · ' + (a.linh_vuc ? labelOf('linh_vuc', a.linh_vuc, a) : ''));
  L.push('');
  L.push('GỢI Ý SƠ BỘ');
  r.items.forEach(function (i) { L.push('- ' + i.name + (i.why.length ? ' (' + i.why.join('; ') + ')' : '')); });
  r.addons.forEach(function (x) { L.push('  + ' + x.name + (x.est ? ' (ước tính, cần xác nhận)' : '')); });
  L.push('Chi phí chưa VAT: ' + (r.low === r.high ? money(r.low) : money(r.low) + ' đến ' + money(r.high)));
  L.push('Đã gồm VAT ' + PRICE.vat * 100 + '%: ' + money(Math.round(r.low * (1 + PRICE.vat))) +
    (r.low === r.high ? '' : ' đến ' + money(Math.round(r.high * (1 + PRICE.vat)))));
  L.push('Thời gian dự kiến: ' + r.weeks + ' đến ' + r.weeksHi + ' tuần');
  L.push('Vận hành: ' + r.ops.name + ', khoảng ' + money(Math.round(r.ops.fee / 1000) * 1000) + '/tháng (' + r.ops.sla + ')');
  if (a.ngan_sach) L.push('Ngân sách khách: ' + labelOf('ngan_sach', a.ngan_sach, a) + ' (' +
    { ok: 'phù hợp', under: 'thấp hơn ước tính', over: 'cao hơn ước tính', unknown: 'chưa rõ' }[r.fit] + ')');
  if (r.flags.length) { L.push(''); L.push('CẢNH BÁO'); r.flags.forEach(function (x) { L.push('- ' + x); }); }
  if (r.notes.length) { L.push(''); L.push('GHI CHÚ ĐỊNH GIÁ'); r.notes.forEach(function (x) { L.push('- ' + x); }); }
  if (r.ask.length) { L.push(''); L.push('CÂU CẦN HỎI LẠI KHI GỌI'); r.ask.forEach(function (x) { L.push('- ' + x); }); }
  L.push('');
  L.push('TOÀN BỘ CÂU TRẢ LỜI');
  raw.forEach(function (x) { L.push(x); });
  return L.join('\n');
}

function ghiSheetPhanTich_(a, r) {
  var id = PropertiesService.getScriptProperties().getProperty('ssId');
  if (!id) return;
  var ss = SpreadsheetApp.openById(id);
  var sh = ss.getSheetByName('PhanTich') || ss.insertSheet('PhanTich');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['thoi_gian', 'ho_ten', 'cong_ty', 'sdt', 'email', 'linh_vuc', 'goi_de_xuat',
      'tong_thap', 'tong_cao', 'van_hanh', 'phan_loai', 'canh_bao']);
    sh.setFrozenRows(1);
  }
  var row = sh.getLastRow() + 1;
  sh.getRange(row, 4).setNumberFormat('@'); // giữ số 0 đầu của số điện thoại
  sh.getRange(row, 1, 1, 12).setValues([[new Date(), a.ho_ten || '', a.cong_ty || '', a.sdt || '', a.email || '',
    a.linh_vuc ? labelOf('linh_vuc', a.linh_vuc, a) : '',
    r.items.map(function (i) { return i.name; }).concat(r.addons.map(function (x) { return x.name; })).join('; '),
    r.low, r.high, r.ops.name, r.lead, r.flags.join(' | ')]]);
}

function onFormSubmit(e) {
  var map = JSON.parse(PropertiesService.getScriptProperties().getProperty('map') || '{}');
  var d = dongChoForm_(e.response.getItemResponses(), map);
  var r = analyze(d.a);
  try { ghiSheetPhanTich_(d.a, r); } catch (err) { Logger.log('Lỗi ghi sheet: ' + err); }
  if (NOTIFY_EMAIL) {
    try {
      var opts = { name: 'Khảo sát nhu cầu' };
      if (d.a.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.a.email)) opts.replyTo = d.a.email;
      MailApp.sendEmail(NOTIFY_EMAIL, 'Khảo sát mới (' + r.lead + '): ' + (d.a.cong_ty || d.a.ho_ten || ''),
        soanThu_(d.a, r, d.raw), opts);
    } catch (err) { Logger.log('Lỗi gửi mail: ' + err); }
  }
}

/** Chạy thử phần tính gói và giá bằng một khách mẫu, xem kết quả trong Nhật ký. */
function kiemTraPhanTich() {
  var a = { ho_ten: 'Nguyễn Văn A', cong_ty: 'Trung tâm Anh ngữ ABC', sdt: '0901234567', vai_tro: 'chu',
    linh_vuc: 'giao_duc', muc_tieu: ['cms', 'ql', 'mini'], nguoi_dung: 'ca_hai', so_trang: '6-15', cap_nhat: 'thang',
    giao_dien: 'mau', so_user: '6-20', nghiep_vu: ['hoc_vien', 'lich', 'diem_danh', 'thu_chi'], chi_nhanh: '2-3',
    mini_cn: ['gioi_thieu', 'dat_lich'], ngan_sach: '100-200', thoi_gian: '2-3thang', bat_dau: 'thang_nay',
    van_hanh: 'co_ban', su_co: 'trong_ngay' };
  Logger.log(soanThu_(a, analyze(a), ['(câu trả lời mẫu)']));
}
