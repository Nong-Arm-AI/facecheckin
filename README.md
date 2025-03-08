# ระบบลงเวลาด้วยการจดจำใบหน้า (Face Recognition Time Attendance System)

ระบบลงเวลาเข้า-ออกงานด้วยเทคโนโลยีการจดจำใบหน้า (Face Recognition) พัฒนาด้วย Next.js, TypeScript และ Supabase

![ตัวอย่างระบบ](https://github.com/yourusername/facecheckin/raw/main/public/screenshot.png)

## 🌟 คุณสมบัติหลัก

- **การจดจำใบหน้าแบบเรียลไทม์** - ตรวจจับและจดจำใบหน้าพนักงานแบบเรียลไทม์
- **การลงทะเบียนใบหน้าจากหลายมุม** - บันทึกใบหน้าจาก 5 มุม (ด้านหน้า, ซ้าย, ขวา, บน, ล่าง) เพื่อเพิ่มความแม่นยำ
- **ยืนยันก่อนบันทึก** - แสดง Modal ยืนยันพร้อมรูปภาพและเปอร์เซ็นต์ความมั่นใจก่อนบันทึกเวลา
- **ระบบจัดการพนักงาน** - เพิ่ม แก้ไข ลบข้อมูลพนักงาน
- **รายงานการเข้างาน** - ดูรายงานการเข้างานรายวัน รายสัปดาห์ และรายเดือน
- **การแจ้งเตือน** - แจ้งเตือนเมื่อลงเวลาสำเร็จหรือมีข้อผิดพลาด
- **รองรับการใช้งานบนมือถือ** - ออกแบบ UI แบบ Responsive รองรับการใช้งานบนทุกอุปกรณ์

## 🛠️ เทคโนโลยีที่ใช้

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, Supabase
- **การจดจำใบหน้า**: face-api.js (ใช้ TensorFlow.js)
- **ฐานข้อมูล**: PostgreSQL (Supabase)
- **การจัดการรูปภาพ**: next/image, Webcam
- **การแจ้งเตือน**: Sonner Toast

## 📋 ความต้องการของระบบ

- Node.js 18.0.0 หรือสูงกว่า
- npm หรือ yarn
- บัญชี Supabase (ฟรี)
- กล้องเว็บแคม

## 🚀 การติดตั้ง

1. **โคลนโปรเจค**

```bash
git clone https://github.com/yourusername/facecheckin.git
cd facecheckin
```

2. **ติดตั้ง Dependencies**

```bash
npm install
# หรือ
yarn install
```

3. **ตั้งค่า Environment Variables**

สร้างไฟล์ `.env.local` ในโฟลเดอร์หลักของโปรเจค:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### คำสั่ง SQL สำหรับสร้างฐานข้อมูล

คุณสามารถใช้คำสั่ง SQL ต่อไปนี้เพื่อสร้างฐานข้อมูลทั้งหมดใน Supabase SQL Editor:

```sql
-- สร้างตาราง employees
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    position TEXT,
    department TEXT,
    face_descriptor FLOAT8[] NULL,
    profile_image_url TEXT NULL,
    face_angles JSONB NULL
);

-- สร้างตาราง attendance
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    check_in_time TIMESTAMPTZ NOT NULL,
    check_out_time TIMESTAMPTZ NULL,
    status TEXT CHECK (status IN ('present', 'late', 'absent')),
    image_url TEXT NULL
);

-- สร้าง index เพื่อเพิ่มประสิทธิภาพการค้นหา
CREATE INDEX IF NOT EXISTS employees_name_idx ON public.employees(name);
CREATE INDEX IF NOT EXISTS attendance_employee_id_idx ON public.attendance(employee_id);
CREATE INDEX IF NOT EXISTS attendance_check_in_time_idx ON public.attendance(check_in_time);

-- ตั้งค่า Row Level Security (RLS)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- สร้าง policy สำหรับการเข้าถึงข้อมูล
CREATE POLICY "Enable read access for all users" ON public.employees
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.employees
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.employees
    FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON public.attendance
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.attendance
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.attendance
    FOR UPDATE USING (true);
```

หากคุณต้องการเพิ่มฟิลด์ `face_angles` ในตาราง `employees` ที่มีอยู่แล้ว ให้ใช้คำสั่งนี้:

```sql
-- เพิ่มฟิลด์ face_angles ในตาราง employees ที่มีอยู่แล้ว
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS face_angles JSONB NULL;
```

5. **รันโปรเจคในโหมดพัฒนา**

```bash
npm run dev
# หรือ
yarn dev
```

6. **เปิดเบราว์เซอร์และเข้าสู่ระบบ**

เปิดเบราว์เซอร์และไปที่ `http://localhost:3000`

## 📱 วิธีใช้งาน

### การลงทะเบียนพนักงานใหม่

1. เข้าสู่หน้าแอดมิน
2. คลิกที่ "เพิ่มพนักงานใหม่"
3. กรอกข้อมูลพนักงาน (ชื่อ, ตำแหน่ง, แผนก)
4. คลิก "บันทึก" เพื่อสร้างข้อมูลพนักงาน
5. คลิก "ลงทะเบียนใบหน้า" เพื่อเริ่มกระบวนการลงทะเบียนใบหน้า
6. ทำตามคำแนะนำบนหน้าจอเพื่อบันทึกใบหน้าจาก 5 มุม (ด้านหน้า, ซ้าย, ขวา, บน, ล่าง)
7. คลิก "บันทึก" เพื่อเสร็จสิ้นการลงทะเบียน

### การลงเวลาเข้า-ออกงาน

1. เข้าสู่หน้าลงเวลา
2. หันหน้าเข้ากล้อง
3. ระบบจะตรวจจับและจดจำใบหน้าโดยอัตโนมัติ
4. เมื่อระบบตรวจพบใบหน้า จะแสดง Modal ยืนยันพร้อมรูปภาพและเปอร์เซ็นต์ความมั่นใจ
5. คลิก "ยืนยัน" เพื่อบันทึกเวลาเข้า-ออกงาน หรือ "ยกเลิก" เพื่อยกเลิกการบันทึก
6. ระบบจะแสดงข้อความยืนยันเมื่อบันทึกเวลาสำเร็จ

### การดูรายงาน

1. เข้าสู่หน้าแอดมิน
2. คลิกที่ "รายงานการเข้างาน"
3. เลือกช่วงเวลาที่ต้องการดูรายงาน (วัน, สัปดาห์, เดือน)
4. ระบบจะแสดงรายงานการเข้างานตามช่วงเวลาที่เลือก

## 🔧 การปรับแต่งค่า

### การปรับค่าความมั่นใจในการจดจำใบหน้า

ค่าความมั่นใจในการจดจำใบหน้าสามารถปรับได้ในไฟล์ `src/components/FaceDetection.tsx`:

```typescript
// ปรับค่า threshold ตรงนี้ (0.5 = 50% ความมั่นใจ)
const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.5);
```

### การปรับจำนวนครั้งในการตรวจจับ

จำนวนครั้งในการตรวจจับสามารถปรับได้ในไฟล์ `src/components/FaceDetection.tsx`:

```typescript
// ปรับจำนวนครั้งตรงนี้ (ปัจจุบันไม่ใช้การนับจำนวนครั้ง)
if (result.label !== "unknown" && confidence >= 50) {
  // ...
}
```

## 🤝 การมีส่วนร่วมพัฒนา

ยินดีรับการมีส่วนร่วมพัฒนาจากทุกท่าน! หากคุณต้องการมีส่วนร่วม:

1. Fork โปรเจคนี้
2. สร้าง Branch ใหม่ (`git checkout -b feature/amazing-feature`)
3. Commit การเปลี่ยนแปลงของคุณ (`git commit -m 'Add some amazing feature'`)
4. Push ไปยัง Branch (`git push origin feature/amazing-feature`)
5. เปิด Pull Request

## 📝 ข้อจำกัดและปัญหาที่รู้จัก

- ระบบต้องการแสงสว่างที่เพียงพอเพื่อการตรวจจับใบหน้าที่แม่นยำ
- ประสิทธิภาพอาจแตกต่างกันไปตามอุปกรณ์และเบราว์เซอร์
- การตรวจจับใบหน้าอาจไม่แม่นยำในกรณีที่มีการเปลี่ยนแปลงลักษณะใบหน้าอย่างมาก (เช่น ไว้หนวดเครา, ใส่แว่นตา)
- ระบบทำงานได้ดีที่สุดเมื่อมีการลงทะเบียนใบหน้าจากหลายมุม
