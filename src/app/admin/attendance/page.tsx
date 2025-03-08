"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase, Employee, Attendance } from "@/lib/supabase";
import { Input } from "@/components/ui/input";

type AttendanceWithEmployee = Attendance & {
  employee: Employee;
};

export default function AttendancePage() {
  const [attendances, setAttendances] = useState<AttendanceWithEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchAttendances();
  }, [dateFilter]);

  const fetchAttendances = async () => {
    setIsLoading(true);
    try {
      // Get attendance records for the selected date
      const startDate = `${dateFilter}T00:00:00`;
      const endDate = `${dateFilter}T23:59:59`;
      
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          *,
          employee:employee_id (*)
        `)
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("check_in_time", { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setAttendances(data as AttendanceWithEmployee[]);
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      toast.error("ไม่สามารถโหลดข้อมูลการเข้างานได้");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "-";
    return new Date(timeString).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return "-";
    
    const checkInTime = new Date(checkIn).getTime();
    const checkOutTime = new Date(checkOut).getTime();
    const durationMs = checkOutTime - checkInTime;
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours} ชั่วโมง ${minutes} นาที`;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return 'มาตรงเวลา';
      case 'late':
        return 'มาสาย';
      case 'absent':
        return 'ขาดงาน';
      default:
        return status;
    }
  };

  return (
    <main className="flex min-h-screen flex-col p-4 bg-gradient-to-b from-emerald-50 to-emerald-100">
      <div className="container max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-emerald-800 mb-2">รายงานการเข้างาน</h1>
            <p className="text-gray-600">ตรวจสอบการลงเวลาเข้า-ออกงานของพนักงาน</p>
          </div>
          <Link href="/admin" passHref>
            <Button variant="outline">
              กลับไปหน้าจัดการพนักงาน
            </Button>
          </Link>
        </div>

        <Card className="shadow-lg mb-8">
          <CardHeader className="bg-emerald-600 text-white rounded-t-lg">
            <CardTitle className="text-xl">ตัวกรองข้อมูล</CardTitle>
            <CardDescription className="text-emerald-100">
              เลือกวันที่ต้องการดูรายงาน
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={fetchAttendances}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  ค้นหา
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="bg-emerald-600 text-white rounded-t-lg">
            <CardTitle className="text-xl">รายงานการเข้างาน</CardTitle>
            <CardDescription className="text-emerald-100">
              วันที่: {new Date(dateFilter).toLocaleDateString('th-TH', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
              })}
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
            ) : attendances.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 mb-4">ไม่พบข้อมูลการเข้างานในวันที่เลือก</p>
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
                        เวลาเข้างาน
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        เวลาออกงาน
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ระยะเวลาทำงาน
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สถานะ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendances.map((attendance) => (
                      <tr key={attendance.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3">
                              {attendance.employee.profile_image_url ? (
                                <img 
                                  src={attendance.employee.profile_image_url} 
                                  alt={attendance.employee.name} 
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <span className="font-bold">{attendance.employee.name.charAt(0)}</span>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{attendance.employee.name}</div>
                              <div className="text-gray-500 text-sm">{attendance.employee.position}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          {formatTime(attendance.check_in_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          {formatTime(attendance.check_out_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          {formatDuration(attendance.check_in_time, attendance.check_out_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(attendance.status)}`}>
                            {getStatusText(attendance.status)}
                          </span>
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