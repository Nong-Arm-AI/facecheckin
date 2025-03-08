"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase, Employee } from "@/lib/supabase";

export default function AdminPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModelWarning, setShowModelWarning] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("name");
      
      if (error) {
        throw error;
      }
      
      setEmployees(data as Employee[]);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("ไม่สามารถโหลดข้อมูลพนักงานได้");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col p-4 bg-gradient-to-b from-emerald-50 to-emerald-100">
      <div className="container max-w-6xl mx-auto">
        {showModelWarning && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>สำคัญ:</strong> ระบบตรวจจับใบหน้าต้องการไฟล์โมเดล face-api.js ในโฟลเดอร์ public/models
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  กรุณาดาวน์โหลดโมเดลจาก <a href="https://github.com/justadudewhohacks/face-api.js/tree/master/weights" target="_blank" className="underline">GitHub</a> และวางในโฟลเดอร์ public/models
                </p>
                <button 
                  onClick={() => setShowModelWarning(false)} 
                  className="mt-2 text-sm text-yellow-700 underline"
                >
                  ซ่อนข้อความนี้
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-emerald-800 mb-2">ระบบจัดการพนักงาน</h1>
            <p className="text-gray-600">จัดการข้อมูลพนักงานและการลงทะเบียนใบหน้า</p>
          </div>
          <div className="flex gap-4">
            <Link href="/admin/register" passHref>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                + เพิ่มพนักงานใหม่
              </Button>
            </Link>
            <Link href="/admin/attendance" passHref>
              <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                รายงานการเข้างาน
              </Button>
            </Link>
            <Link href="/" passHref>
              <Button variant="ghost">
                กลับหน้าหลัก
              </Button>
            </Link>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-emerald-600 text-white rounded-t-lg">
            <CardTitle className="text-xl">รายชื่อพนักงาน</CardTitle>
            <CardDescription className="text-emerald-100">
              พนักงานทั้งหมด: {employees.length} คน
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
                </div>
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 mb-4">ยังไม่มีข้อมูลพนักงานในระบบ</p>
                <Link href="/admin/register" passHref>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    + เพิ่มพนักงานใหม่
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        พนักงาน
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ตำแหน่ง
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        แผนก
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สถานะใบหน้า
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3">
                              {employee.profile_image_url ? (
                                <img 
                                  src={employee.profile_image_url} 
                                  alt={employee.name} 
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <span className="font-bold">{employee.name.charAt(0)}</span>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{employee.name}</div>
                              <div className="text-gray-500 text-sm">{employee.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          {employee.position}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          {employee.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {employee.face_descriptor ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              ลงทะเบียนแล้ว
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              ยังไม่ลงทะเบียน
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <Link href={`/admin/employee/${employee.id}`} passHref>
                              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                                แก้ไข
                              </Button>
                            </Link>
                            <Link href={`/admin/face-register/${employee.id}`} passHref>
                              <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-800">
                                {employee.face_descriptor ? "อัปเดตใบหน้า" : "ลงทะเบียนใบหน้า"}
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
} 