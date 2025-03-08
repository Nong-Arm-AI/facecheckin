"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";

export default function Home() {
  const [currentYear, setCurrentYear] = useState("");
  
  useEffect(() => {
    // ย้ายการใช้ Date ไปอยู่ใน useEffect เพื่อให้ทำงานเฉพาะฝั่ง client
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-blue-100">
      <div className="container max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-800 mb-4">ระบบสแกนหน้าเข้าทำงาน</h1>
          <p className="text-xl text-gray-600">ระบบลงเวลาทำงานอัจฉริยะด้วยเทคโนโลยีจดจำใบหน้า</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-blue-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl">สแกนหน้าเข้างาน</CardTitle>
              <CardDescription className="text-blue-100">สำหรับพนักงานลงเวลาเข้า-ออกงาน</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 pb-4">
              <div className="flex justify-center">
                <img 
                  src="/face-scan.svg" 
                  alt="Face Scan" 
                  className="w-32 h-32 mb-4"
                  onError={(e) => {
                    e.currentTarget.src = "https://placehold.co/128x128?text=Face+Scan";
                  }}
                />
              </div>
              <p className="text-gray-600 text-center">ลงเวลาเข้า-ออกงานด้วยการสแกนใบหน้า รวดเร็วและปลอดภัย</p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Link href="/check-in" passHref>
                <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                  เริ่มสแกนใบหน้า
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-emerald-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl">ระบบจัดการพนักงาน</CardTitle>
              <CardDescription className="text-emerald-100">สำหรับผู้ดูแลระบบ</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 pb-4">
              <div className="flex justify-center">
                <img 
                  src="/admin-panel.svg" 
                  alt="Admin Panel" 
                  className="w-32 h-32 mb-4"
                  onError={(e) => {
                    e.currentTarget.src = "https://placehold.co/128x128?text=Admin+Panel";
                  }}
                />
              </div>
              <p className="text-gray-600 text-center">จัดการข้อมูลพนักงาน ลงทะเบียนใบหน้า และดูรายงานการเข้างาน</p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Link href="/admin" passHref>
                <Button size="lg" variant="outline" className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                  เข้าสู่ระบบจัดการ
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-16 text-center text-gray-500">
          <p>© {currentYear} ระบบสแกนหน้าเข้าทำงาน. สงวนลิขสิทธิ์.</p>
        </div>
      </div>
    </main>
  );
}
