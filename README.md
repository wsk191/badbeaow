# BADBEAOW

ระบบจัดการคิวตีแบด (React + Vite + Firebase Realtime Database)

```bash
npm install
npm run dev
```

## Database rules

กฎความปลอดภัยของฐานข้อมูลอยู่ที่ `database.rules.json` ทุกครั้งที่แก้ไฟล์นี้ต้องนำไปเผยแพร่เอง:
Firebase Console → Realtime Database → แท็บ **Rules** → วางเนื้อหาทั้งไฟล์ → **Publish**

## แจ้งเตือนอีเมลเมื่อมีคนสมัครแอดมิน (EmailJS)

เว็บนี้ไม่มีเซิร์ฟเวอร์หลังบ้าน จึงใช้ [EmailJS](https://www.emailjs.com) ส่งอีเมล (ฟรี 200 ฉบับ/เดือน)
ถ้ายังไม่ตั้งค่า คำขอยังเข้าระบบปกติและแสดงในหน้า SuperAdmin → แท็บ **แอดมิน** แค่ไม่มีอีเมลแจ้ง

1. สมัคร emailjs.com แล้วไปที่ **Email Services** → **Add New Service** → เลือก Gmail แล้วเชื่อมบัญชีอีเมลที่ใช้ส่ง จด **Service ID**
2. ไปที่ **Email Templates** → **Create New Template**
   - **To Email**: อีเมล SuperAdmin ที่ต้องการให้แจ้งเตือน
   - **Subject**: `มีคนสมัครแอดมิน {{court_name}}`
   - **Content** (ใช้ตัวแปรเหล่านี้ได้):
     ```
     อีเมลผู้สมัคร: {{applicant_email}}
     สนามที่ขอ: {{court_name}}
     เวลา: {{requested_at}}
     เข้าไปอนุมัติได้ที่: {{review_url}} (ล็อกอิน SuperAdmin → แท็บ แอดมิน)
     ```
   - บันทึกแล้วจด **Template ID**
3. ไปที่ **Account** → **General** จด **Public Key**
4. คัดลอก `.env.example` เป็น `.env.local` แล้วใส่ค่าทั้ง 3 ตัว จากนั้นรัน `npm run dev` ใหม่
5. ถ้า deploy บน Vercel/Netlify ให้ใส่ตัวแปร 3 ตัวนี้ในหน้า Environment Variables ของโฮสต์ด้วย

อีเมลแจ้งเตือนจะไม่มีรหัสผ่านของผู้สมัคร (รหัสผ่านถูกเก็บโดย Firebase Authentication เท่านั้น)
