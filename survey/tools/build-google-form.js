// Sinh khao-sat-google-form.gs từ khao-sat-nhu-cau.html để giá và câu hỏi chỉ có một nguồn.
// Chạy tại thư mục gốc của repo:  node tools/build-google-form.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'khao-sat-nhu-cau.html'), 'utf8');
const js = html.split('<script>')[1].split('</script>')[0];
const tpl = fs.readFileSync(path.join(__dirname, 'form-template.gs'), 'utf8');

function between(startMarker, endMarker, back) {
  const i = js.indexOf(startMarker);
  if (i < 0) throw new Error('Không thấy mốc đầu: ' + startMarker);
  let j = js.indexOf(endMarker, i);
  if (j < 0) throw new Error('Không thấy mốc cuối: ' + endMarker);
  if (back) j = js.lastIndexOf('/*', j); // lùi tới dòng chú thích mở đầu của phần kế tiếp
  return js.slice(i, j);
}

// DATA: bảng giá + bộ câu hỏi + tùy chỉnh theo lĩnh vực (từ PRICE tới trước phần trạng thái)
const data = between('var PRICE = {', '   TRẠNG THÁI', true);
// ANALYZE: hàm tính gói, giá và các hàm phụ (từ BUDGET tới trước priceText)
const analyze = between('var BUDGET=', 'function priceText', false);

for (const [name, body] of [['DATA', data], ['ANALYZE', analyze]]) {
  if (/\b(document|window|localStorage|\$\()/.test(body)) {
    throw new Error('Khối ' + name + ' có tham chiếu DOM, không dùng được trong Apps Script');
  }
}

const out = tpl.replace('/*@@DATA@@*/', () => data).replace('/*@@ANALYZE@@*/', () => analyze);
fs.writeFileSync(path.join(root, 'khao-sat-google-form.gs'), out, 'utf8');
console.log('Đã tạo khao-sat-google-form.gs (' + out.length + ' ký tự)');
