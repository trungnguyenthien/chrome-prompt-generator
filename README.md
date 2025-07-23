# Chrome Extension v3 - Prompt Generator

Một Chrome Extension để tạo và quản lý các prompt template, giúp bạn sử dụng AI một cách hiệu quả hơn trên bất kỳ trang web nào.

## 🌟 Tính năng

- ✨ **Tạo và quản lý prompt template**: Tạo, chỉnh sửa, xóa các template prompt
- 📁 **Quản lý danh mục**: CRUD hoàn chỉnh cho danh mục template với ID riêng
- 🎯 **Sử dụng trên mọi trang web**: Áp dụng template trên bất kỳ trang web nào
- 📝 **Template có biến động**: Sử dụng `{{variable}}` để tạo template linh hoạt
- 🔍 **Tìm kiếm và phân loại**: Tìm kiếm nhanh và phân loại template theo danh mục
- 📊 **Thống kê danh mục**: Hiển thị số lượng template trong mỗi danh mục
- ⭐ **Đánh dấu yêu thích**: Đánh dấu template thường dùng
- 🎨 **Giao diện hiện đại**: Sử dụng Bootstrap với thiết kế responsive
- 💾 **Lưu trữ local**: Dữ liệu được lưu an toàn trên máy tính
- 🚫 **Context menu**: Sử dụng template qua menu chuột phải

## 🚀 Cài đặt

1. **Clone hoặc tải về repository này**
2. **Mở Chrome và truy cập**: `chrome://extensions/`
3. **Bật Developer mode** (góc trên bên phải)
4. **Nhấn "Load unpacked"** và chọn thư mục chứa extension
5. **Extension sẽ xuất hiện** trong thanh công cụ Chrome

## 📖 Hướng dẫn sử dụng

### Quản lý Danh mục
1. Nhấn vào icon extension để mở manager
2. Chuyển sang tab "Quản lý Danh mục"
3. **Tạo danh mục**: Nhấn "Tạo Danh mục Mới", điền thông tin và lưu
4. **Sửa danh mục**: Nhấn icon bút chì để chỉnh sửa
5. **Xóa danh mục**: Nhấn icon thùng rác (template sẽ chuyển về "Chung")

### Tạo Template
1. Nhấn vào icon extension
2. Ở tab "Quản lý Template", nhấn "Tạo Template Mới"
3. Chọn danh mục, điền thông tin và nhấn "Lưu"

### Sử dụng Template
**Cách 1: Từ manager**
1. Nhấn icon extension
2. Chọn template và nhấn "Sử dụng"

**Cách 2: Context menu**
1. Chuột phải trên bất kỳ trang web nào
2. Chọn "Sử dụng Prompt Template"
3. Chọn template từ modal

**Cách 3: Trên trang web**
1. Nhấn icon extension
2. Chọn template từ danh sách
3. Điền biến (nếu có) và text sẽ được chèn

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
