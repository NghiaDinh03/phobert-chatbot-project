# Quy trình phân tích: Form Đánh giá ISO 27001

Đây là một trong những cốt lõi của **PhoBERT AI Platform**. Thay vì các chuyên gia (Auditors) phải tốn hàng tuần để dò xét hệ thống của doanh nghiệp và chấm điểm, tính năng này áp dụng mô hình **Dual-Layer LLM Analysis** để chấm điểm tự động.

## 1. Dòng chảy dữ liệu (Data Flow)

**B1. Khảo sát sơ bộ (Input Form):**
- Ngành nghề, quy mô doanh nghiệp.
- Hạ tầng máy chủ, hệ thống mạng (Firewall, IDS/IPS, VPN, Cloud).
- Các bộ chính sách bảo mật đã ban hành (Checkbox Yes/No/Partial).

**B2. Lớp ảo hóa bảo mật - SecurityLLM 7B:**
- Data thô từ Data Form sẽ được format lại thành 1 JSON/Text rõ ràng.
- Chuyển JSON này tới **SecurityLLM-7B-Q4_K_M** (được train chuyên biệt trong không gian an toàn thông tin). Mô hình này chịu trách nhiệm: **Soi lỗi & Xác định Risk Level**.
- SecurityLLM sẽ sinh ra một bản List gạch đầu dòng các "Lỗ hổng", "Lỗi cấu hình", "Vi phạm ISO" thô và khô khan.

**B3. Lớp báo cáo - Llama 3.1 8B:**
- List lỗ hổng thô ở (B2) sẽ được truyền lên **Llama 3.1**.
- Mô hình này sẽ đảm nhận vai trò là một "Chuyên gia viết Report". Nó tiến hành dịch, gắn kết ý nghĩa, và giải thích chi tiết tại sao các lỗi đó vi phạm ISO 27001, và cuối cùng tự đề xuất **Action Plan** (Hướng giải quyết khắc phục từng bước) một cách trôi chảy bằng Tiếng Việt mượt mà.

---

## 2. Các Modules tham gia:
*   **FastAPI Endpoint**: Nhận cục JSON từ Form.
*   **Model Router (`services/model_router.py`)**: Đóng vai trò làm nhạc trưởng. Nó gọi API lên LocalAI để request cho SecurityLLM chạy. Đợi SecurityLLM chạy xong, nó lại tiếp tục gọi LocalAI để nạp cho Llama 3.1 viết báo cáo.
*   **LocalAI Engine**: Phải load đồng thời 2 bản GGUF nặng ~10GB.

## 3. Quản lý Life Cycle (Lịch sử ISO)

Tại tab chức năng, mọi bài Đánh Giá (Assessments) đều được Server Backend lưu thành các chuỗi file JSON riêng biệt nằm ở `data/assessments/`.
Mỗi file sẽ bao gồm 2 phần là: `formData` (Thông tin doanh nghiệp nhập vào) và `ai_report` (Kết quả trả về của AI).

- Quản trị viên (Admin) có thể xem lại, review kết quả ở dạng Modal Popup.
- Nếu Server bị quá tải ở giữa tiến trình, có chức năng Click để **Tái sử dụng Form (Reload Input)** giúp người dùng tự động điền lại toàn bộ dữ liệu khảo sát cũ để gửi lại AI mà không cần phải tick hay gõ lại từ đầu.
