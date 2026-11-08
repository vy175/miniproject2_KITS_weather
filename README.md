# 🌤️ Fullstack Weather Dashboard (Layered Architecture & Modular Design)

Dự án ứng dụng web hiển thị dữ liệu thời tiết thời gian thực được tổ chức theo chuẩn **Layered Architecture (Kiến trúc phân tầng chuẩn công nghiệp)** ở Backend và **ES6 Modular Pattern** ở Frontend, tích hợp cơ sở dữ liệu SQLite, hệ thống cảnh báo thông minh, so sánh thời tiết 2 thành phố và hỗ trợ đa ngôn ngữ (VI/EN).

---

## 🏛️ 1. Cấu trúc Thư mục Chuẩn (Modular & Layered Architecture)

```
miniPrj_KITS/
├── src/                                   # BACKEND (Layered Architecture)
│   ├── config/
│   │   └── cities.js                      # Cấu hình danh mục tọa độ thành phố & mã WMO
│   ├── database/
│   │   └── connection.js                  # Kết nối SQLite Database (WAL mode & Table init)
│   ├── services/
│   │   ├── weatherService.js              # Gọi Open-Meteo API Gateway & Data Normalization
│   │   ├── cacheService.js                # Quản lý Persistent Cache (TTL 5m) & Search History
│   │   └── alertService.js                # Rule-based Engine phân tích cảnh báo & lời khuyên sức khỏe
│   ├── controllers/
│   │   └── weatherController.js           # Tiếp nhận HTTP Request, Validate, điều hướng & Response
│   └── routes/
│       └── apiRoutes.js                   # Định tuyến RESTful Endpoints (/api/weather, /api/compare...)
│
├── server.js                              # Entry point khởi chạy Express Server & Middlewares
│
├── public/                                # FRONTEND (ES6 Modules)
│   ├── index.html                         # Giao diện HTML Semantic
│   ├── style.css                          # Thiết kế CSS hiện đại, Compact Spacing
│   └── js/
│       ├── i18n.js                        # Từ điển đa ngôn ngữ (Tiếng Việt 🇻🇳 / English 🇬🇧)
│       ├── api.js                         # Module chuyên trách giao tiếp HTTP với Backend
│       ├── ui.js                          # Module Render giao diện, điều khiển DOM & States
│       └── main.js                        # Controller khởi tạo ứng dụng & kết nối sự kiện
│
├── test.js                                # Bộ kiểm thử tự động 9/9 Test Cases (Automated Test Suite)
├── weather.db                             # File cơ sở dữ liệu SQLite
├── package.json
└── README.md
```

---

## 🌟 2. Các Quyết định Kỹ thuật (Technical Decisions)

### ❓ Vì sao tách lớp Backend (Layered Architecture)?
1. **Separation of Concerns (SoC)**:
   - **`Routes`**: Chỉ định nghĩa các đường dẫn URL và phương thức HTTP.
   - **`Controllers`**: Chỉ nhận request, kiểm tra tính hợp lệ của tham số (`validation`) và trả về mã HTTP chuẩn (`200`, `400`, `404`, `500`).
   - **`Services`**: Chứa toàn bộ nghiệp vụ (gọi Open-Meteo, tính toán độ lệch so sánh giữa 2 thành phố, phân tích quy tắc cảnh báo).
   - **`Database`**: Tách riêng logic truy vấn cơ sở dữ liệu SQLite (bảng cache và bảng history).
2. **Khả năng mở rộng & Bảo trì**: Khi muốn thêm tính năng mới hoặc đổi nguồn API, chỉ cần can thiệp đúng Service tương ứng mà không làm ảnh hưởng đến các tầng khác.

### ❓ Vì sao tách module Frontend (ES6 Modules)?
Thay vì dồn hàng trăm dòng code vào 1 file `app.js` khổng lồ:
* **`api.js`**: Đóng gói các hàm `fetch()`. Khi Backend đổi endpoint, chỉ cần sửa ở 1 nơi.
* **`ui.js`**: Chuyên trách cập nhật giao diện (DOM manipulation, hiển thị loading/error, render thẻ thời tiết, format ngày giờ).
* **`i18n.js`**: Tách riêng từ điển dịch thuật, dễ dàng bổ sung thêm ngôn ngữ khác trong tương lai.
* **`main.js`**: Điều phối luồng ứng dụng và lắng nghe sự kiện từ người dùng.

---

## 🚀 3. Danh sách Tính năng Chính

1. **Xem thời tiết chi tiết**: Nhiệt độ, độ ẩm, tốc độ gió, độ cao địa hình, tọa độ, mô tả chuẩn WMO.
2. **Chế độ So sánh (Compare Mode)**: Gọi song song `Promise.all()`, tính toán độ lệch nhiệt độ/độ ẩm/gió và tự động sinh câu nhận định phân tích.
3. **Cảnh báo thông minh (Smart Alert Engine)**: Tự động cảnh báo dông sét, rét đậm, nắng nóng gay gắt hoặc thời tiết thuận lợi.
4. **Cơ sở dữ liệu SQLite (`weather.db`)**:
   - Cache bền vững 5 phút (TTL).
   - Lịch sử tra cứu gần đây (Quick Chips) không cần đăng nhập (No-Auth).
5. **Chuyển đổi ngôn ngữ (`VI / EN`)**: Dịch toàn bộ giao diện và dữ liệu thời tiết chỉ với 1 click.
6. **Đổi đơn vị nhiệt độ (`°C / °F`)**: Tính toán chuyển đổi tức thì.
7. **Xử lý toàn diện lỗi & Offline**: Bắt lỗi mạng khi mất Internet và timeout tự động.

---

## 🧪 4. Kiểm thử Tự động (Automated Testing)

Chạy bộ kiểm thử tự động với 9 kịch bản bao phủ:
```bash
npm test
```
**Kết quả: 9/9 Tests PASS**
* `TC-01`: Health Check Endpoint (`/api/health`)
* `TC-02`: Lấy danh sách thành phố (`/api/cities`)
* `TC-03`: Fetch thời tiết Hà Nội & Cảnh báo thông minh
* `TC-04`: Kiểm tra SQLite Cache HIT (`X-Cache: HIT`)
* `TC-05`: So sánh 2 thành phố (`/api/weather/compare`)
* `TC-06`: Chặn lỗi so sánh trùng thành phố (`400 Bad Request`)
* `TC-07`: Bắt lỗi thiếu tham số (`400 Bad Request`)
* `TC-08`: Giả lập lỗi Server 500 (`mock_error=true`)
* `TC-09`: Kiểm tra lịch sử lưu trong SQLite (`/api/history`)

---

## 💻 5. Hướng dẫn Khởi chạy

```bash
# 1. Cài đặt thư viện:
npm install

# 2. Khởi chạy Server:
npm start

# 3. Mở trình duyệt:
http://localhost:3000
```
