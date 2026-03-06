# AI News Aggregator & Text-To-Speech (TTS)

Trong kỷ nguyên an ninh thông tin, việc tiếp thu kịp thời các tin tức chứng khoán, giá dầu, hoặc mã độc Zero-Day mới là cực kỳ quan trọng. Trang **Tin tức** được thiết kế như một quy trình Background (tự động hóa ngầm) để loại bỏ 100% rào cản ngoại ngữ.

## 1. Sơ đồ các luồng chạy của Hệ thống

### Luồng 1 (Fetch Data): Thu thập RSS định kỳ
- Mỗi 2 tiếng, Timer ở Background Python sẽ kích hoạt (Hoặc người dùng Auto-refresh trên UI).
- Script tự động quét 3 thẻ tin tức:
  - *"An Ninh Mạng"* (The Hacker News, BleepingComputer...).
  - *"Cổ Phiếu Quốc Tế"* (CNBC, Yahoo Finance).
  - *"Chứng Khoán VN"*.
- Lấy về 20-30 Header Tin (Tiêu đề, Mô tả ngắn, Link gốc).

### Luồng 2 (AI Auto-Translate):
- Vì báo nước ngoài (Title EN) là Tiếng Anh, ngay tức thì tiến trình ngầm sẽ quăng đống Title này vào **Mô hình VinAI Translate** (135 triệu tham số).
- Model này được load ngầm trên HuggingFace (hoạt động hoàn toàn Offline trong local). Nó có khả năng dịch song ngữ EN->VI xuất sắc.
- Sau vài giây, UI của người dùng đột nhiên biến đổi toàn bộ đầu báo Quốc tế hiển thị sang dạng Tiếng Việt trực quan. File kết quả dịch lưu Cache tại `data/translations/<hash>.json`.

### Luồng 3 (AI Tagging):
- Đồng thời với việc dịch, Title dịch được nạp vào Llama 3.1 nội bộ.
- Prompt cực ngắn: *"Gán 1-2 từ khóa tiêu điểm. Không giải thích thêm"*.
- Llama dán nhãn thông minh (vd: "Pháp lý", "Ransomware", "Cổ tức"). Những Tags này xuất hiện bên dưới thẻ tin tức gốc.

---

## 2. Luồng Audio Text-To-Speech (AI Tóm tắt báo)

Trọng tâm của tính năng (Button [Play Audio 🎧]):

1. Khi click Play (hoặc khi background chạy), thư viện `newspaper3k` sẽ vào link báo gốc cào toàn diện bài phân tích (Html -> Raw Text).
2. Xóa sạch rác, quảng cáo, chèn cái chổi lọc.
3. Nếu bài Tiếng Anh: Yêu cầu **Llama 3.1** *"Dịch tóm tắt súc tích, lược bỏ ký tự đặc biệt, nối câu mạch lạc để dùng đọc Voice"*.
4. Nếu báo tiếng Việt: Llama *"Làm gọn bài báo lại, loại bỏ các đường dẫn hỏng, ngắt câu mạch lạc chuẩn phong thái Tiếng Việt"*.
5. Bơm dòng văn bản (Summary text) vừa sinh ra vào thư viện chuyên dụng **Microsoft Edge-TTS** thông qua python `edge-tts`. Sử dụng giọng Vocal AI `vi-VN-HoaiMyNeural` chuẩn phát thanh viên.
6. Sinh ra File mp3, lưu định tuyến tại `data/summaries/audio/`. Trả URL hiển thị để Browser tự phát loa cho người dùng nghe (Kèm chữ chạy theo).
7. Trạng thái `Audio_cached=True` (Nút màu xanh) có hiệu lực.

## 3. Storage & Cleanup
- Để không bị nổ ổ cứng do File Mp3 (Voice), chu kỳ dọn rác của hệ thống (2h) sẽ tự dò xem: Bài báo nằm trong Audio Cache có đang hiện trên Bảng Tin hay không? Nếu không nằm trong Top News -> **Tự động Delete MP3 + JSON**. Hệ thống bảo toàn vĩnh viễn mức RAM và Ổ Cứng lý tưởng!
