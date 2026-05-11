# Speech game — đoán con vật bằng giọng nói

Ứng dụng web nhỏ cho trẻ: xem ảnh con vật, bấm mic và **nói tên** (tiếng Việt). Trình duyệt nhận dạng giọng nói **Web Speech API** (`vi-VN`) và so khớp với đáp án/`aliases`.

Game có nhân vật thầy giáo (PNG), ô thoại + **TTS MP3** (đã generate sẵn), đếm ngược thời gian, tự động chuyển câu, và report sau 10 câu.

## Luồng chơi

- Bấm **Bắt đầu** để vào câu 1
- Thầy đọc câu hỏi (MP3) → **đọc xong mới bắt đầu đếm 10s**
- Trả lời đúng/sai/hết giờ → thầy đọc MP3 phản hồi → **tự chuyển câu tiếp theo**
- Kết thúc 10 câu → hiện điểm + report “đúng / sai / hết giờ”

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
| `npm run generate:tts` | Sinh MP3 TTS vào `public/sounds/tts/` + `manifest.json` |

Trong `package.json` có thêm `crop-teacher` / `remove-teacher-bg` nếu bạn thêm các file script tương ứng ở thư mục gốc.

Chuỗi thoại: `src/constants/phrases.js`.

## TTS assets

TTS được generate bằng Python (mặc định `gTTS`).

Cài và generate:

```bash
python3 -m pip install -r scripts/requirements-tts.txt
python3 scripts/generate_tts.py --animals
```

Các file game đang dùng:

- Câu hỏi: `public/sounds/tts/teacher_question.mp3`
- Khen khi đúng: `public/sounds/tts/positive_0.mp3` … `positive_4.mp3`
- Sai (đọc liền không khựng): `public/sounds/tts/wrong_reveal_animal_01.mp3` … `wrong_reveal_animal_10.mp3`
- Hết giờ (đọc liền): `public/sounds/tts/timeout_reveal_animal_01.mp3` … `timeout_reveal_animal_10.mp3`
- Mapping: `public/sounds/tts/manifest.json`

## Cấu trúc assets (gọn)

- `public/images/` — ảnh con vật  
- `public/teacher/` — PNG thầy  
- `public/sounds/` — ví dụ `correct.mp3`, `wrong.mp3`

## Repo

Nguồn: https://github.com/NgiasNguyen/speech-game
