# Khảo sát nhu cầu – lưu kết quả và gửi email (miễn phí)

Trang `khao-sat-nhu-cau.html` gửi câu trả lời của khách tới một **Google Apps Script**.
Script ghi vào **Google Sheet** (mỗi khách một dòng) và **gửi email tóm tắt** cho bạn khi khách hoàn thành phiếu.

Chi phí 0đ. Hạn mức gói miễn phí khoảng 100 email/ngày.

## Cài đặt (khoảng 5 phút)

### 1. Tạo Google Sheet và dán script
1. Vào <https://sheets.new> để tạo Google Sheet mới (đặt tên tùy ý, ví dụ `Khảo sát khách hàng`).
2. Chọn **Tiện ích mở rộng > Apps Script**.
3. Xóa code mẫu, dán toàn bộ nội dung file [`khao-sat-apps-script.gs`](khao-sat-apps-script.gs), bấm **Lưu**.
4. (Tùy chọn) Sửa dòng `var NOTIFY_EMAIL = '...'` thành email muốn nhận thông báo.
   Để `''` nếu chỉ muốn lưu vào Sheet, không gửi mail.

### 2. Triển khai thành ứng dụng web
1. Bấm **Triển khai > Tùy chọn triển khai mới**.
2. Bấm biểu tượng bánh răng, chọn loại **Ứng dụng web**.
3. Cấu hình:
   - **Thực thi dưới tên:** Tôi
   - **Người có quyền truy cập:** Bất kỳ ai
4. Bấm **Triển khai**, rồi **Cấp quyền truy cập** (cho phép truy cập Sheet và gửi email).
   Nếu Google báo "ứng dụng chưa được xác minh": chọn **Nâng cao > Đi tới ... (không an toàn)**.
   Đây là script do chính bạn viết nên có thể cho phép.
5. Sao chép **URL ứng dụng web** (dạng `https://script.google.com/macros/s/.../exec`).

### 3. Gắn URL vào trang khảo sát
Mở `khao-sat-nhu-cau.html`, tìm dòng:

```js
var REMOTE_ENDPOINT = '';
```

Dán URL vào giữa hai dấu nháy:

```js
var REMOTE_ENDPOINT = 'https://script.google.com/macros/s/XXXXXXXX/exec';
```

Commit và push lên GitHub, GitHub Pages sẽ tự cập nhật sau ít phút.

### 4. Kiểm tra
1. Mở trang khảo sát trên web, điền họ tên hoặc số điện thoại rồi làm đến hết.
2. Vào Google Sheet: sẽ có sheet `KhaoSat` với một dòng mới.
3. Kiểm tra hộp thư (cả mục Spam): có email tóm tắt khi bấm **Xem gợi ý**.

## Lấy dữ liệu
- **Xem trực tiếp:** mở Google Sheet.
- **Tải về:** Tệp > Tải xuống > CSV hoặc Excel.
- Cột `answers_json` chứa toàn bộ câu trả lời chi tiết dạng JSON.

## Khi sửa script sau này
Sửa code xong phải vào **Triển khai > Quản lý bản triển khai > Chỉnh sửa (biểu tượng bút) > Phiên bản: Phiên bản mới > Triển khai**.
Nếu chỉ bấm Lưu, bản đang chạy vẫn là code cũ. URL giữ nguyên nên không cần sửa lại trang khảo sát.

## Xử lý sự cố
| Hiện tượng | Cách xử lý |
|---|---|
| Sheet không có dữ liệu | Kiểm tra `REMOTE_ENDPOINT` đã dán đúng và đã push; kiểm tra quyền truy cập là **Bất kỳ ai** |
| Có dữ liệu nhưng không có mail | Chưa cấp quyền gửi email (triển khai lại và cấp quyền); xem mục Spam; kiểm tra `NOTIFY_EMAIL` |
| Sửa script mà không đổi gì | Chưa tạo **Phiên bản mới** khi triển khai |
| Không có dữ liệu dù khách đã điền | Trang chỉ lưu khi khách đã nhập họ tên hoặc số điện thoại |

## Chạy thử trên máy (không cần Google)
```bash
python survey/khao_sat_server.py
```
Mở <http://localhost:8000/khao-sat-nhu-cau.html>. Kết quả lưu vào `survey/khao-sat-data/responses.json` và `responses.csv`.

## Quyền riêng tư
Khi đã cấu hình `REMOTE_ENDPOINT`, trang tự hiển thị thông báo quyền riêng tư cho khách.
Dữ liệu chứa thông tin cá nhân (họ tên, số điện thoại, email), nên đừng chia sẻ công khai Google Sheet.
