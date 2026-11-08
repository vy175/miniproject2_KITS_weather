# 🌤️ Fullstack Weather Dashboard (Node.js Express + SQLite + Open-Meteo)

Dự án ứng dụng web hiển thị dữ liệu thời tiết thời gian thực theo kiến trúc **Fullstack chuyên nghiệp (Backend Gateway + SQLite Persistent Database + Frontend Client)**, tích hợp các tính năng nâng cao: **So sánh thời tiết 2 thành phố (VS Mode)**, **Hệ thống Cảnh báo & Lời khuyên sức khỏe thông minh (Smart Rule Engine)**, **Lịch sử tra cứu bền vững (No Auth)** và **Kiểm thử tự động 9/9 Test Cases**.

---

## 🏛️ 1. Kiến trúc Hệ thống (Fullstack Architecture)

```
[ Client (Browser) ]
        │
        ├─► Tab 1: Xem thời tiết đơn (Nhiệt độ, Cảnh báo, Lịch sử, Đổi °C/°F)
        ├─► Tab 2: So sánh đối đầu 2 thành phố (VS View & Delta Analysis)
        │
        ▼ (RESTful API nội bộ: /api/weather, /api/weather/compare, /api/history, /api/health)
[ Backend (Node.js Express Gateway) ]
        │
        ├── Rule-based Alert Engine (Phân tích nguy cơ nắng nóng, rét đậm, dông bão, gió lớn)
        ├── Comparison Analytics (Promise.all song song, tính độ lệch nhiệt độ/độ ẩm/gió)
        │
        ▼
[ SQLite Database (weather.db) ]
        ├── Bảng weather_cache: Cache bền vững theo TTL 5 phút (X-Cache: HIT / MISS)
        └── Bảng search_history: Lịch sử tra cứu không cần đăng nhập (No-Auth Audit)
        │
        ▼ (Nếu Cache MISS)
[ Open-Meteo Public API ] (https://api.open-meteo.com)
```

---

## 🌟 2. Các Tính năng Nâng cao (Advanced Features)

### 1. ⚔️ So sánh thời tiết giữa 2 thành phố (Weather Comparison Mode - VS View)
* **Backend (`GET /api/weather/compare?city1=...&city2=...`)**:
  - Tận dụng `Promise.all()` gọi song song cả 2 thành phố (ưu tiên đọc SQLite Cache trước).
  - Tự động tính toán độ lệch: Chênh lệch nhiệt độ (`tempDiff`), độ ẩm (`humidityDiff`), tốc độ gió (`windDiff`).
  - Tự động sinh văn bản nhận định và so sánh du lịch: *VD: "Hà Nội đang ấm/nóng hơn Tokyo 13°C. Độ ẩm tại Hà Nội cao hơn đáng kể (+12%)."*
* **Frontend**: Tab chuyển đổi mượt mà, hiển thị 2 thẻ đối đầu kèm vòng tròn **VS** và bảng thống kê Delta.

### 2. 🧠 Hệ thống Cảnh báo Thời tiết Thông minh (Rule-based Weather Alerts)
* Backend tích hợp Rule Engine tự động phân tích:
  - **Mưa dông sét / Bão nguy hiểm**: Cảnh báo đỏ `danger` kèm lưu ý an toàn.
  - **Nắng nóng gay gắt (≥ 35°C)**: Cảnh báo vàng `warning` nhắc nhở bù nước và chống nắng.
  - **Trời rét đậm (≤ 10°C)**: Cảnh báo xanh `info` nhắc giữ ấm.
  - **Gió lớn (≥ 25 km/h)**: Cảnh báo gió giật mạnh.
  - **Thời tiết lý tưởng**: Khuyến khích các hoạt động ngoài trời.

### 3. 🗄️ Cơ sở dữ liệu SQLite (`weather.db`) bền vững (No Auth)
* Sử dụng thư viện `better-sqlite3` hiệu năng cao.
* **Persistent Cache**: Dù có tắt hoặc restart server, cache 5 phút vẫn còn hiệu lực trong database.
* **Search History**: Tự động lưu lịch sử vào SQLite mà **không cần người dùng phải đăng nhập**.

### 4. 🎛️ Tính năng Trải nghiệm người dùng (UX)
* Chuyển đổi nhanh giữa độ C và độ F (`°C / °F Toggle`).
* Tự động ghi nhớ thành phố xem gần nhất qua `localStorage`.
* Đèn báo tình trạng kết nối SQLite Backend Server.
* Badge hiển thị nguồn gốc dữ liệu: `SQLITE CACHE (HIT)` vs `LIVE (MISS)`.

---

## 🧪 3. Bảng Kịch bản Kiểm thử (9 Test Cases)

| STT | Tên Test Case | Endpoint / Thao tác | Kết quả mong đợi |
| :---: | :--- | :--- | :--- |
| **TC-01** | Health Check | `GET /api/health` | Trả về `status: OK`, database: `SQLite (weather.db)`. |
| **TC-02** | Danh mục thành phố | `GET /api/cities` | Trả về danh sách 9 thành phố lớn. |
| **TC-03** | Tra cứu thời tiết & Cảnh báo | `GET /api/weather?city=hanoi` | Dữ liệu thời tiết đầy đủ, kèm object `alert` do Rule Engine phân tích. |
| **TC-04** | Kiểm tra SQLite Cache | Gọi lại `city=hanoi` | Header trả về `X-Cache: HIT`, `cached: true` từ SQLite. |
| **TC-05** | So sánh 2 thành phố | `GET /api/weather/compare?city1=hanoi&city2=tokyo` | Trả về dữ liệu song song của 2 thành phố, các chỉ số chênh lệch `delta` và đoạn văn bản `summary`. |
| **TC-06** | So sánh trùng thành phố | `city1=hanoi&city2=hanoi` | Backend chặn và trả về lỗi `400 Bad Request`. |
| **TC-07** | Thiếu tham số | `GET /api/weather` | Backend trả về lỗi `400 Bad Request`. |
| **TC-08** | Giả lập lỗi Server | `mock_error=true` | Backend trả về `500 Internal Server Error`, Frontend hiển thị giao diện bắt lỗi đỏ. |
| **TC-09** | Lịch sử SQLite | `GET /api/history` | Trả về danh sách lịch sử lưu trữ trong SQLite. |

---

## 💻 4. Hướng dẫn khởi chạy & Chạy Test

### 1. Khởi chạy ứng dụng:
```bash
# Cài đặt thư viện nếu chưa có:
npm install

# Chạy Server Backend & Frontend:
npm start
```
Truy cập: 👉 **http://localhost:3000**

### 2. Chạy bộ kiểm thử tự động (Automated Tests):
```bash
npm test
```
*Kết quả sẽ hiển thị `9/9 tests PASS` xanh toàn bộ.*

---

## 🎥 5. Kịch bản quay Video Demo (1.5 - 2 phút)

* **0:00 - 0:25**: Mở `http://localhost:3000`. Giới thiệu kiến trúc Fullstack (Express + SQLite + Open-Meteo).
* **0:25 - 0:45**: Xem thời tiết Hà Nội, chỉ vào thanh **Cảnh báo thông minh** (Rule Engine) và badge `LIVE (MISS)`. Nhấn Làm mới để thấy chuyển sang `SQLITE CACHE (HIT)`.
* **0:45 - 1:10**: Chuyển sang Tab **"So sánh 2 thành phố"**. Chọn Hà Nội vs Tokyo, nhấn **"So sánh ngay"** để trình diễn giao diện VS, độ lệch nhiệt độ và nhận định so sánh tự động.
* **1:10 - 1:30**: Nhấn nút **"Test Lỗi BE (500)"** và thử ngắt mạng (F12 Offline) để biểu diễn khả năng bắt lỗi & phục hồi.
* **1:30 - 1:45**: Mở terminal gõ `npm test` để show bộ test tự động 9/9 PASS.
