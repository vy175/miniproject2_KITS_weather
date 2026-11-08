/**
 * Service: Dynamic & Context-Aware Weather Advisory Engine
 * Phân tích đa chiều: Thời tiết (WMO), Nhiệt độ, Độ ẩm, Tốc độ gió & Khung giờ sinh hoạt
 */
class AlertService {
  analyze(current) {
    const { temperature, windSpeed, weatherCode, humidity } = current;

    // 1. Nhóm Cảnh báo Nguy hiểm Cấp 1 (Ưu tiên hàng đầu)
    if ([82, 95, 96, 99].includes(weatherCode)) {
      return {
        level: "danger",
        type: "Dông bão & Sét nguy hiểm",
        message: "Có dông sét mạnh hoặc mưa đá! Hạn chế ra ngoài, tránh trú mưa dưới gốc cây to hoặc cột điện.",
        icon: "alert-octagon"
      };
    }

    if ([63, 65, 80, 81].includes(weatherCode)) {
      return {
        level: "warning",
        type: "Mưa to diện rộng",
        message: "Đang có mưa vừa đến mưa to. Đừng quên mang áo mưa hoặc ô và chú ý trơn trượt khi lái xe.",
        icon: "cloud-rain"
      };
    }

    if ([51, 53, 55, 61].includes(weatherCode)) {
      return {
        level: "info",
        type: "Mưa phùn rải rác",
        message: "Trời có mưa nhỏ lất phất. Nên mang theo áo khoác nhẹ chống nước hoặc ô dù khi ra đường.",
        icon: "cloud-drizzle"
      };
    }

    if (temperature >= 35) {
      return {
        level: "warning",
        type: "Nắng nóng gay gắt",
        message: `Nhiệt độ chạm ngưỡng ${temperature}°C! Uống nhiều nước, bôi kem chống nắng và hạn chế ở ngoài trời lâu.`,
        icon: "sun"
      };
    }

    if (temperature <= 10) {
      return {
        level: "info",
        type: "Trời rét sâu",
        message: `Nhiệt độ chỉ còn ${temperature}°C. Hãy giữ ấm cổ, ngực và đeo găng tay ấm khi di chuyển ngoài đường.`,
        icon: "thermometer"
      };
    }

    if (windSpeed >= 25) {
      return {
        level: "warning",
        type: "Gió giật mạnh",
        message: `Tốc độ gió đạt ${windSpeed} km/h. Chú ý gió giật khi lái xe máy qua các khu vực cầu cao hoặc nhà cao tầng.`,
        icon: "wind"
      };
    }

    // 2. Nhóm Điều kiện Thuận lợi: TỰ ĐỘNG SINH GỢI Ý ĐỘNG THEO KHUNG GIỜ VÀ ĐỘ ẨM
    const hour = current.time ? new Date(current.time).getHours() : new Date().getHours();
    let timeGreeting = "";
    let activityAdvice = "";

    if (hour >= 5 && hour < 11) {
      timeGreeting = "Buổi sáng không khí trong lành";
      activityAdvice = "rất lý tưởng để tập thể dục nhẹ, chạy bộ hoặc thưởng thức cà phê khởi đầu ngày mới.";
    } else if (hour >= 11 && hour < 14) {
      timeGreeting = "Buổi trưa nhiệt độ ổn định";
      activityAdvice = "thuận lợi cho việc di chuyển ăn trưa và làm việc trong không gian thoáng đãng.";
    } else if (hour >= 14 && hour < 18) {
      timeGreeting = "Buổi chiều thời tiết dễ chịu";
      activityAdvice = "thích hợp cho các hoạt động thể thao ngoài trời hoặc gặp gỡ bạn bè sau giờ làm.";
    } else if (hour >= 18 && hour < 22) {
      timeGreeting = "Buổi tối mát mẻ và thoáng đãng";
      activityAdvice = "rất thuận tiện cho việc dạo phố, hẹn hò hoặc thư giãn ngoài trời.";
    } else {
      timeGreeting = "Đêm khuya nhiệt độ hạ nhẹ";
      activityAdvice = "không gian yên tĩnh, điều kiện lý tưởng cho một giấc ngủ sâu phục hồi năng lượng.";
    }

    // Kết hợp yếu tố độ ẩm để tăng tính thực tế
    let humidityNote = "";
    if (humidity >= 85) {
      humidityNote = " (Độ ẩm khá cao, không gian có cảm giác nồm nhẹ).";
    } else if (humidity <= 40) {
      humidityNote = " (Không khí hơi hanh khô, hãy nhớ uống đủ nước).";
    }

    return {
      level: "success",
      type: "Thời tiết thuận lợi",
      message: `${timeGreeting}, ${activityAdvice}${humidityNote}`,
      icon: "check-circle"
    };
  }
}

module.exports = new AlertService();
