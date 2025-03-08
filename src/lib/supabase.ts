import { createClient } from '@supabase/supabase-js';


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ตรวจสอบว่ามีการกำหนดค่า URL และ Key หรือไม่
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Anon Key');
}

// สร้าง Supabase client พร้อมกำหนดค่า timeout
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: (...args) => {
      // เพิ่ม timeout เป็น 30 วินาที
      return fetch(...args);
    }
  }
});

// ทดสอบการเชื่อมต่อกับ Supabase
try {
  supabase.from('employees').select('count', { count: 'exact', head: true })
    .then(({ count, error }) => {
      if (error) {
        console.error('Error connecting to Supabase:', error);
      } else {
        console.log('Successfully connected to Supabase. Employee count:', count);
      }
    });
} catch (err) {
  console.error('Failed to connect to Supabase:', err);
}

// ประเภทข้อมูลสำหรับมุมใบหน้า
export type FaceAngles = {
  front: number[] | null;
  left: number[] | null;
  right: number[] | null;
  up: number[] | null;
  down: number[] | null;
}

export type Employee = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  position: string;
  department: string;
  face_descriptor: number[] | null;
  profile_image_url: string | null;
  face_angles?: FaceAngles | null; // เพิ่มฟิลด์ใหม่สำหรับเก็บข้อมูลใบหน้าจากหลายมุม
}

export type Attendance = {
  id: string;
  created_at: string;
  employee_id: string;
  check_in_time: string;
  check_out_time: string | null;
  status: 'present' | 'late' | 'absent';
  image_url: string | null;
} 