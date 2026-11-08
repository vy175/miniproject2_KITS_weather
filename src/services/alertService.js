/**
 * Service: Rule-based Weather Alert & Health Advisory Engine
 */
class AlertService {
  analyze(current) {
    const { temperature, windSpeed, weatherCode } = current;

    if ([82, 95, 96, 99].includes(weatherCode)) {
      return {
        level: "danger",
        type: "Dông bão & Sét nguy hiểm",
        message: "Có dông sét nguy hiểm hoặc mưa đá! Nên hạn chế ra ngoài, tránh trú mưa dưới gốc cây to hoặc cột điện.",
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

    if (temperature >= 35) {
      return {
        level: "warning",
        type: "Nắng nóng gay gắt",
        message: "Nhiệt độ ngoài trời rất cao! Uống nhiều nước, bôi kem chống nắng và hạn chế ở ngoài trời lâu giữa trưa.",
        icon: "sun"
      };
    }

    if (temperature <= 10) {
      return {
        level: "info",
        type: "Trời rét đậm",
        message: "Thời tiết lạnh sâu. Hãy mặc ấm, giữ ấm cổ và đeo găng tay khi ra đường.",
        icon: "thermometer"
      };
    }

    if (windSpeed >= 25) {
      return {
        level: "warning",
        type: "Gió giật mạnh",
        message: `Tốc độ gió đạt ${windSpeed} km/h. Chú ý gió giật mạnh ở các khu vực thoáng và kiểm tra cửa sổ ban công.`,
        icon: "wind"
      };
    }

    return {
      level: "success",
      type: "Thời tiết dễ chịu",
      message: "Thời tiết hiện tại rất thuận lợi cho các hoạt động làm việc, học tập và thể thao ngoài trời.",
      icon: "check-circle"
    };
  }
}

module.exports = new AlertService();
