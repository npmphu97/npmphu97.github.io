# Khảo sát nhu cầu – lưu kết quả và gửi email (miễn phí)

Trang `khao-sat-nhu-cau.html` gửi câu trả lời của khách tới một **Google Apps Script**.
Script ghi vào **Google Sheet** (mỗi khách một dòng) và **gửi email tóm tắt** cho bạn khi khách hoàn thành phiếu.

## Khách vào làm và quay lại thế nào

1. Màn hình đầu tiên yêu cầu khách nhập **số điện thoại** và **email**, rồi bấm "Gửi mã xác minh".
2. Khách nhận email có **mã OTP 6 số** (hiệu lực 10 phút), nhập mã vào trang.
3. Số điện thoại (đã chuẩn hóa: `+84 912…`, `84912…` và `0912…` là cùng một số) là mã khách (`sid`) trên mọi thiết bị.
4. Khách quay lại, ở thiết bị nào cũng được, nhập lại **số điện thoại + email đã dùng lần đầu** và mã OTP mới thì phiếu làm dở được nạp lại, làm tiếp đúng bước cũ.
5. Số đã có phiếu mà nhập email khác thì **không có mã nào được gửi**, nên không mở được và không ghi đè được. Trang vẫn hiện ô nhập mã để người lạ không biết số nào đã có phiếu.
6. Mỗi số điện thoại chỉ có một dòng. Nút "Làm phiếu mới" xóa câu trả lời và ghi đè đúng dòng đó.

Giới hạn chống lạm dụng: mỗi số được gửi lại mã sau 60 giây, tối đa 5 mã mỗi giờ; nhập sai 5 lần thì mã bị hủy. Sau khi xác minh, phiên lưu dữ liệu có hiệu lực 24 giờ.

Cột `email_xac_minh` trong Sheet là email đã xác minh bằng OTP của số đó.

**Hạn mức email:** mỗi mã OTP và mỗi email thông báo tính vào hạn mức khoảng 100 email/ngày của tài khoản Gmail thường (khoảng 1.500 nếu dùng Google Workspace). Mỗi khách tốn ít nhất 2 email (mã + thông báo hoàn thành). Quá hạn mức thì khách không nhận được mã trong ngày đó.

Chi phí 0đ. Hạn mức gói miễn phí khoảng 100 email/ngày.

## Cài đặt (khoảng 5 phút)

### 1. Tạo Google Sheet và dán script
1. Vào <https://sheets.new> để tạo Google Sheet mới (đặt tên tùy ý, ví dụ `Khảo sát khách hàng`).
2. Chọn **Tiện ích mở rộng > Apps Script**.
3. Xóa code mẫu, dán toàn bộ nội dung file [`khao-sat-apps-script.gs`](khao-sat-apps-script.gs), bấm **Lưu**.
4. Nếu Sheet đã có dữ liệu thử từ phiên bản cũ, xóa sheet `KhaoSat` cũ để script tạo lại với cột `email_xac_minh` mới.
5. (Tùy chọn) Sửa dòng `var NOTIFY_EMAIL = '...'` thành email muốn nhận thông báo.
   Để `''` nếu chỉ muốn lưu vào Sheet, không gửi mail.

### 2. Triển khai thành ứng dụng web
1. Bấm **Triển khai > Tùy chọn triển khai mới**.
2. Bấm biểu tượng bánh răng, chọn loại **Ứng dụng web**.
3. Cấu hình:
   - **Thực thi dưới tên:** Tôi
   - **Người có quyền truy cập:** Bất kỳ ai
4. Bấm **Triển khai**, rồi **Cấp quyền truy cập** (cho phép truy cập Sheet và gửi email, dùng để gửi mã OTP và thông báo).
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
1. Mở trang khảo sát trên web, nhập số điện thoại và email thật của bạn, nhận mã OTP trong hộp thư (kể cả Spam), nhập mã rồi làm đến hết.
   Mở lại trang bằng trình duyệt ẩn danh hoặc thiết bị khác, nhập lại đúng số và email, nhận mã mới để kiểm tra việc nạp lại phiếu.
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
| Khách không nhận được mã OTP | Xem mục Spam; kiểm tra khách nhập đúng email lần đầu (xem cột `email_xac_minh` của số đó); có thể đã hết hạn mức email trong ngày |
| Khách đổi email, không mở lại được phiếu cũ | Sửa ô `email_xac_minh` của số đó trong Sheet thành email mới |

## Chạy thử trên máy (không cần Google)
```bash
python survey/khao_sat_server.py
```
Mở <http://localhost:8000/khao-sat-nhu-cau.html>. Chạy cục bộ không gửi email thật: mã OTP được in ra cửa sổ đang chạy server (dòng bắt đầu bằng `[OTP]`). Kết quả lưu vào `survey/khao-sat-data/responses.json` và `responses.csv`.

## Quyền riêng tư
Khi đã cấu hình `REMOTE_ENDPOINT`, trang tự hiển thị thông báo quyền riêng tư cho khách.
Dữ liệu chứa thông tin cá nhân (họ tên, số điện thoại, email), nên đừng chia sẻ công khai Google Sheet.
Muốn thêm thông báo xóa dữ liệu, khách nhắn Zalo cho bạn (đã có sẵn trong dòng thông báo của trang).
