"""Server cục bộ: phục vụ trang khảo sát và tự lưu câu trả lời ra JSON + CSV.

Chạy:   python khao_sat_server.py            (cổng 8000)
        python khao_sat_server.py 8080
Mở:     http://localhost:8000/khao-sat-nhu-cau.html
Kết quả: khao-sat-data/responses.json và khao-sat-data/responses.csv
         (mỗi khách một dòng, cập nhật liên tục khi khách trả lời tiếp)

Chỉ lắng nghe 127.0.0.1 nên máy khác trong mạng không truy cập được.
"""
import csv
import json
import os
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, "khao-sat-data")
JSON_PATH = os.path.join(DATA, "responses.json")
CSV_PATH = os.path.join(DATA, "responses.csv")
API = "/api/khao-sat"
COLS = ["sid", "cap_nhat", "trang_thai", "buoc", "ho_ten", "cong_ty", "sdt", "email",
        "linh_vuc", "muc_tieu", "ngan_sach", "goi_de_xuat", "tong_thap", "tong_cao",
        "van_hanh", "phan_loai", "canh_bao", "answers_json"]
lock = threading.Lock()


def load():
    try:
        with open(JSON_PATH, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return []


def flat(rec):
    row = {c: rec.get(c, "") for c in COLS}
    for k, v in list(row.items()):
        if isinstance(v, list):
            row[k] = "; ".join(str(x) for x in v)
    row["answers_json"] = json.dumps(rec.get("answers", {}), ensure_ascii=False)
    return row


def atomic_write(path, write):
    tmp = path + ".tmp"
    write(tmp)
    os.replace(tmp, path)


def save(rec):
    with lock:
        os.makedirs(DATA, exist_ok=True)
        rows = load()
        for i, r in enumerate(rows):
            if r.get("sid") == rec["sid"]:
                rows[i] = rec
                break
        else:
            rows.append(rec)

        def w_json(p):
            with open(p, "w", encoding="utf-8") as f:
                json.dump(rows, f, ensure_ascii=False, indent=2)

        def w_csv(p):
            # utf-8-sig để Excel mở đúng tiếng Việt; sdt giữ nguyên số 0 đầu khi mở bằng Sheets/Excel dạng text
            with open(p, "w", encoding="utf-8-sig", newline="") as f:
                wr = csv.DictWriter(f, fieldnames=COLS)
                wr.writeheader()
                for r in rows:
                    wr.writerow(flat(r))

        atomic_write(JSON_PATH, w_json)
        atomic_write(CSV_PATH, w_csv)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def do_POST(self):
        if self.path != API:
            self.send_error(404)
            return
        try:
            n = int(self.headers.get("Content-Length", "0"))
            if n <= 0 or n > 200_000:
                raise ValueError("kích thước không hợp lệ")
            rec = json.loads(self.rfile.read(n).decode("utf-8"))
            if not isinstance(rec, dict) or not str(rec.get("sid", "")).strip():
                raise ValueError("thiếu sid")
            rec["sid"] = str(rec["sid"])[:64]
            save(rec)
        except (ValueError, OSError) as e:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(str(e).encode("utf-8"))
            return
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        # không phục vụ thư mục dữ liệu khách ra web, kể cả cục bộ
        if self.path.split("?")[0].startswith("/khao-sat-data"):
            self.send_error(404)
            return
        super().do_GET()

    def log_message(self, fmt, *args):
        if self.command == "POST":
            sys.stderr.write("đã lưu: %s\n" % self.log_date_time_string())


if __name__ == "__main__":
    for stream in (sys.stdout, sys.stderr):  # console Windows mặc định không in được tiếng Việt
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    srv = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print("Khảo sát: http://localhost:%d/khao-sat-nhu-cau.html" % port)
    print("Dữ liệu lưu tại:", DATA)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
