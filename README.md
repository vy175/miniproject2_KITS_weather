# 🌤️ Fullstack Weather Dashboard (Layered Architecture & Automated Testing)

Ứng dụng web hiển thị và so sánh dữ liệu thời tiết thời gian thực theo kiến trúc **Layered Architecture (Kiến trúc phân tầng chuẩn công nghiệp)** ở Backend và **ES6 Modular Pattern** ở Frontend, tích hợp cơ sở dữ liệu **SQLite**, hệ thống cảnh báo thời tiết thông minh, tìm kiếm toàn cầu với gợi ý tự động (Autocomplete), hỗ trợ đa ngôn ngữ (VI/EN) cùng **hai tầng kiểm thử toàn diện (Unit Test & Integration Test)**.

---

## 🏛️ 1. Cấu trúc Dự án (Project Structure)

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
├── public/                                # FRONTEND (ES6 Modules)
│   ├── index.html                         # Giao diện HTML Semantic
│   ├── style.css                          # Thiết kế CSS hiện đại, Compact Spacing
│   └── js/
│       ├── i18n.js                        # Từ điển đa ngôn ngữ (Tiếng Việt 🇻🇳 / English 🇬🇧)
│       ├── api.js                         # Module chuyên trách giao tiếp HTTP với Backend
│       ├── ui.js                          # Module Render giao diện, điều khiển DOM & States
│       └── main.js                        # Controller khởi tạo ứng dụng & kết nối sự kiện
│
├── tests/                                 # UNIT TESTING SUITE (Node.js Native Test Runner)
│   └── unit/
│       ├── alertService.test.js           # Unit test Rule Engine phân tích cảnh báo (5 tests)
│       ├── cacheService.test.js           # Unit test SQLite Cache & History (3 tests)
│       └── weatherService.test.js         # Unit test thuật toán Delta so sánh (3 tests)
│
├── test.js                                # INTEGRATION / API TEST SUITE (9/9 Tests)
├── weather.db                             # File cơ sở dữ liệu SQLite
├── package.json
└── README.md
```

---

## 🌟 2. Các Quyết định Kỹ thuật (Technical Decisions)

### ❓ Vì sao chọn Open-Meteo & Open-Meteo Geocoding API?
1. **100% Miễn phí & Không cần API Key**: Không lo hết hạn key, không rủi ro lộ bí mật bảo mật trên client.
2. **CORS Enabled & Dữ liệu chuẩn WMO**: Dữ liệu từ các cơ quan khí tượng hàng đầu (NOAA, DWD, ECMWF).
3. **Geocoding toàn cầu**: Hỗ trợ tìm kiếm mọi thành phố, thị xã trên thế giới bằng cả tiếng Việt có dấu và không dấu.

### ❓ Vì sao tách lớp Backend (Layered Architecture)?
- **`Routes`**: Chỉ định nghĩa các đường dẫn URL và phương thức HTTP.
- **`Controllers`**: Tiếp nhận request, kiểm tra tham số (`validation`) và trả về HTTP status chuẩn.
- **`Services`**: Chứa toàn bộ nghiệp vụ xử lý dữ liệu và thuật toán phân tích.
- **`Database`**: Tách riêng truy vấn SQLite (`better-sqlite3`).

### ❓ Vì sao tách module Frontend (ES6 Modules)?
- **`api.js`**: Đóng gói các hàm gọi API, dễ bảo trì khi đổi endpoint.
- **`ui.js`**: Chuyên trách cập nhật giao diện và DOM rendering.
- **`i18n.js`**: Từ điển dịch thuật độc lập, mở rộng ngôn ngữ dễ dàng.
- **`main.js`**: Điều phối luồng ứng dụng và lắng nghe sự kiện người dùng.

---

## 🚀 3. Danh sách Tính năng Chính

1. **Tìm kiếm thành phố toàn cầu**: Autocomplete gợi ý tự động sau 300ms debounce khi gõ từ 2 ký tự.
2. **Xem thời tiết chi tiết**: Nhiệt độ, độ ẩm, tốc độ gió, độ cao địa hình, tọa độ, mô tả chuẩn WMO.
3. **Chế độ So sánh (Compare Mode)**: Tìm kiếm 2 thành phố bất kỳ, tính toán song song độ lệch nhiệt độ/độ ẩm/gió và tự động sinh câu nhận định phân tích.
4. **Hệ thống Cảnh báo thông minh (Smart Alert Engine)**: Phân tích tự động các mức độ: dông sét nguy hiểm, nắng nóng gay gắt, rét đậm hoặc thời tiết thuận lợi.
5. **Cơ sở dữ liệu SQLite (`weather.db`)**:
   - Cache bền vững 5 phút (TTL) - không lo mất cache khi tắt server.
   - Thẻ lịch sử tra cứu (Quick Chips) có nút `(x)` để xóa từng mục, tự động giữ tối đa 20 bản ghi.
6. **Chuyển đổi ngôn ngữ (`VI / EN`)**: Dịch toàn bộ giao diện và dữ liệu thời tiết tức thì.
7. **Đổi đơn vị nhiệt độ (`°C / °F`)**: Chuyển đổi công thức ngay tức thì.
8. **Xử lý toàn diện lỗi & Offline**: Bắt lỗi mạng khi mất Internet và timeout tự động.

---

## 🧪 4. Kiểm thử Tự động (Two-tier Testing Strategy)

Dự án trang bị cả 2 tầng kiểm thử chuẩn mực:

### Tầng 1: Unit Test (`npm run test:unit`)
Sử dụng test runner tích hợp của Node.js (`node:test` & `node:assert`), kiểm thử độc lập từng Service với thời gian chạy siêu nhanh (**~400ms**):
```bash
npm run test:unit
```
* **AlertService (5 tests)**: Kiểm thử logic phân loại cấp độ cảnh báo (danger, warning, info, success).
* **CacheService (3 tests)**: Kiểm thử lưu/đọc SQLite, cơ chế hết hạn TTL, thêm và xóa lịch sử.
* **WeatherService (3 tests)**: Kiểm thử bắt lỗi 400 và tính toán chính xác Delta so sánh.
👉 **Kết quả: 11/11 tests PASS**

### Tầng 2: Integration / API Test (`npm test`)
Kiểm thử toàn bộ luồng mạng thực tế từ client đến các API endpoint:
```bash
npm test
```
* Health check, SQLite Cache HIT/MISS, Mock 500 error, Validate input.
👉 **Kết quả: 9/9 tests PASS**

---

## 💻 5. Hướng dẫn Cài đặt & Khởi chạy

```bash
# 1. Cài đặt các thư viện cần thiết:
npm install

# 2. Khởi chạy Server Backend & Frontend:
npm start

# 3. Mở trình duyệt truy cập:
http://localhost:3000

# 4. Chạy kiểm thử:
npm run test:unit     # Chạy Unit Tests
npm test              # Chạy Integration / API Tests
```

---
1/11 Unit Tests PASS) và `npm test` (9/9 API Tests PASS) để minh chứng chất lượng mã nguồn.
