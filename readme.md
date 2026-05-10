# Speech game — đoán con vật bằng giọng nói

Ứng dụng web nhỏ cho trẻ: xem ảnh con vật, bấm mic và **nói tên** (tiếng Việt). Trình duyệt nhận dạng giọng nói **Web Speech API** (`vi-VN`) và so khớp với đáp án/`aliases`. Có nhân vật thầy giáo (sprite), ô thoại ngẫu nhiên khi đúng/sai, âm thanh đúng/sai và điểm / tiến độ round.

**Lưu ý:** không dùng **TTS của trình duyệt** (phụ thuộc giọng trên máy, tiếng Việt không ổn định). Câu thoại hiển thị trên ô chat; có thể bổ sung file **MP3/MP4** sau nếu cần đọc câu hỏi / khen nhắc.

## Công nghệ

- React 18, Vite 5  
- Tailwind CSS 3  
- Framer Motion  
- Sharp (script xử lý ảnh)

## Chạy dự án

Yêu cầu Node.js **LTS** (khuyến nghị 18 trở lên).

```bash
npm install
npm run dev
```

Build production và xem preview:

```bash
npm run build
npm run preview
```

Nên mở bằng **Chrome/Chromium**, **HTTPS hoặc `localhost`** — nhận dạng giọng nói có thể bị giới hạn trên một số môi trường.

## Script có sẵn

| Lệnh | Mô tả |
|------|--------|
| `npm run generate:animals` | Sinh `src/data/animals.js` từ ảnh trong `public/images/` |
| `npm run crop-teacher` | Cắt sprite thầy (file `crop-teacher-sprite.js` ở root) |
| `npm run remove-teacher-bg` | Xử lý nền PNG thầy (`remove-teacher-bg.js`) |

Chuỗi thoại (câu hỏi, khen, nhắc lại): `src/constants/phrases.js`.

## Cấu trúc assets (gọn)

- `public/images/` — ảnh con vật  
- `public/teacher/` — sprite thầy  
- `public/sounds/` — ví dụ `correct.mp3`, `wrong.mp3`

## Repo

Nguồn: https://github.com/NgiasNguyen/speech-game
