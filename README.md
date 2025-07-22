# Chrome Extension v3 - Prompt Generator

Một Chrome Extension để tạo và quản lý các prompt template, giúp bạn sử dụng AI một cách hiệu quả hơn trên bất kỳ trang web nào.

## 🌟 Tính năng

- ✨ **Tạo và quản lý prompt template**: Tạo, chỉnh sửa, xóa các template prompt
- 🎯 **Sử dụng trên mọi trang web**: Áp dụng template trên bất kỳ trang web nào
- 📝 **Template có biến động**: Sử dụng `{{variable}}` để tạo template linh hoạt
- 🔍 **Tìm kiếm và phân loại**: Tìm kiếm nhanh và phân loại template theo danh mục
- 📊 **Thống kê sử dụng**: Theo dõi tần suất sử dụng template
- ⭐ **Đánh dấu yêu thích**: Đánh dấu template thường dùng
- 💾 **Lưu trữ local**: Dữ liệu được lưu an toàn trên máy tính

## 🚀 Cài đặt

1. **Clone hoặc tải về repository này**
2. **Mở Chrome và truy cập**: `chrome://extensions/`
3. **Bật Developer mode** (góc trên bên phải)
4. **Nhấn "Load unpacked"** và chọn thư mục chứa extension
5. **Extension sẽ xuất hiện** trong thanh công cụ Chrome

## 📖 Hướng dẫn sử dụng

### Tạo Template
1. Nhấn vào icon extension
2. Chọn "Quản lý Template"
3. Nhấn "Tạo Template Mới"
4. Điền thông tin và nhấn "Lưu"

### Sử dụng Template
**Cách 1: Từ popup**
1. Nhấn icon extension
2. Chọn template từ danh sách gần đây
3. Hoặc nhấn "Sử dụng template" để xem tất cả

**Cách 2: Trên trang web**
1. Nhấn icon extension
2. Chọn "Sử dụng template"
3. Chọn template và điền biến (nếu có)
4. Text sẽ được chèn vào vị trí cursor

### Template với biến
Sử dụng cú pháp `{{tên_biến}}` trong nội dung template:

```
Hãy viết một email về {{chủ_đề}} gửi cho {{người_nhận}}.
Nội dung chính: {{nội_dung}}
```

## 🗂️ Cấu trúc dự án

```
chrome-prompt-generator/
├── manifest.json          # Manifest file của extension
├── popup.html             # Giao diện popup
├── popup.css              # Style cho popup
├── popup.js               # Logic popup
├── manager.html           # Trang quản lý template
├── manager.css            # Style cho trang quản lý
├── manager.js             # Logic quản lý template
├── content.js             # Content script
├── background.js          # Background service worker
├── icons/                 # Thư mục chứa icon
└── README.md             # File này
```

## 🎨 Danh mục Template

- **Chung**: Template đa dụng
- **Viết lách**: Template cho việc viết
- **Lập trình**: Template cho code
- **Phân tích**: Template phân tích dữ liệu
- **Sáng tạo**: Template sáng tạo nội dung
- **Kinh doanh**: Template cho công việc

## 🔧 Phát triển

### Yêu cầu
- Chrome Browser
- Kiến thức HTML, CSS, JavaScript cơ bản

### Cấu trúc code
- **Manifest V3**: Sử dụng format mới nhất
- **Service Worker**: Background script
- **Content Script**: Tương tác với trang web
- **Chrome Storage**: Lưu trữ dữ liệu local

## 📝 Template mẫu

Extension đi kèm với một số template mẫu:

1. **Tóm tắt nội dung**
2. **Viết email chuyên nghiệp** 
3. **Phân tích code**

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Hãy:

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push và tạo Pull Request

## 📄 License

MIT License - xem file LICENSE để biết thêm chi tiết.

## 🆘 Hỗ trợ

Nếu gặp vấn đề, hãy tạo issue trên GitHub hoặc liên hệ qua email.

---

**Tận hưởng việc sử dụng AI hiệu quả hơn với Prompt Generator! 🚀**
