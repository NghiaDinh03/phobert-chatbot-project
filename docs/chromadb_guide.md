# Hướng dẫn Lưu trữ & Quản lý Vector Tài liệu (ChromaDB)

Hệ thống **PhoBERT AI Platform** sử dụng **ChromaDB** làm Vector Database cục bộ (On-premise) nhằm cung cấp trải nghiệm truy xuất thông tin (RAG - Retrieval-Augmented Generation) nhanh chóng và chính xác cho các Model AI. Dưới đây là cách hoạt động và hướng dẫn sử dụng.

---

## 1. Vai trò của ChromaDB trong dự án
Thay vì phải gửi hàng nghìn trang luât, tiêu chuẩn ISO vào trong Prompt của LLM (gây tràn context và suy giảm tốc độ phản hồi), hệ thống sẽ:
1. Đọc tất cả các file tài liệu định dạng Markdown (`.md`).
2. Chia nhỏ thành từng đoạn (chunk) với kích thước tĩnh (ví dụ 1000 ký tự).
3. Sử dụng mô hình `all-MiniLM-L6-v2` để mã hóa (Embedding) từng chunk thành vector số học và lưu vào ổ cứng thông qua **ChromaDB**.
4. Khi người dùng đánh giá dự án hoặc hỏi Chatbot, câu hỏi sẽ được nhúng thành Vector và tìm kiếm những chunk có "độ tương đồng" (Cosine Similarity) cao nhất để nhồi vào Prompt cho Llama 3.1 8B và SecurityLLM.

---

## 2. Cách thêm Data mới vào Hệ thống (Dynamic Mount Mode)

ChromaDB được cấu hình để quét một thư mục cục bộ của dự án. Thực hiện theo các bước sau để thêm Luật, Quy định, File mô tả mới:

### Bước 2.1: Chuẩn bị tài liệu
Dự án ưu tiên nạp các file Markdown (`.md`). Hãy copy nội dung văn bản (Word, PDF) và chuyển nó thành Markdown sạch sẽ (có thẻ Heading như `#`, `##` rõ ràng).

### Bước 2.2: Kéo thả file vào thư mục Mounted
Chép file Markdown của bạn và thả vào thư mục `data/iso_documents/` tại folder gốc của dự án.
> **Lưu ý**: Nhờ cơ chế Volumes Docker (`- ./data:/data`), thư mục tĩnh này được liên kết động (Dynamic Mount) trực tiếp vào Container Backend. File vừa thả ở host Windows sẽ lập tức xuất hiện bên trong Docker.

### Bước 2.3: Nạp (Reindex) Tài liệu vào Database
1. Truy cập giao diện Web Dashboard của dự án.
2. Điều hướng tới trang **Analytics** (Giám sát).
3. Kéo xuống mục **🗄️ Kho Tài liệu AI — ChromaDB**.
4. Nhấn nút **"🔄 Nạp lại"** (ở cột bên phải, dưới ô Test tìm kiếm).
5. Hệ thống sẽ tự động dọn dẹp Database cũ và quét lại toàn bộ file trong thư mục `iso_documents`, tiến hành nhúng mã (Embedding) và trả về thông báo số `Chunks` đã nạp thành công.

---

## 3. Quản trị & Tìm lỗi (Troubleshooting)

### Kiểm tra bằng Test tìm kiếm
Ngay trên giao diện ChromaDB Monitor, bạn có thể gõ nội dung vào ô **"Thử tìm kiếm tài liệu..."** và nhấn `Enter`. Tính năng này sẽ mô phỏng chức năng nhúng Vector để kiểm tra xem hệ thống có trả về chính xác đoạn Text trong file bạn vừa nạp hay không (hiển thị % điểm Cosine).

### Lỗi Database Corrupted / Duplicate
Nếu quá trình Nạp lại xảy ra lỗi "Duplicate column" hoặc Database bị kẹt cứng:
1. Tắt hệ thống (`docker-compose down`).
2. Vào thư mục `data/` xoá luôn thư mục `vector_store/` đi (Đây là nơi ChromaDB ghi File SQLite).
3. Chạy lại dự án (`docker-compose up -d`). Database sẽ tạo lại mới và tự nạp file ở lẩn khởi chạy đầu tiên.
