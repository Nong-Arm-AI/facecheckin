"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase, Employee } from "@/lib/supabase";
import dynamic from "next/dynamic";

// Import face-api.js dynamically to avoid SSR issues
const FaceDetection = dynamic(() => import("@/components/FaceDetection"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-[300px] bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">กำลังโหลดระบบตรวจจับใบหน้า...</p>
      </div>
    </div>
  ),
});

export default function CheckIn() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedEmployee, setRecognizedEmployee] = useState<Employee | null>(null);
  const [checkInStatus, setCheckInStatus] = useState<"idle" | "success" | "error">("idle");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [confidence, setConfidence] = useState<number>(0);
  const [capturedImage, setCapturedImage] = useState<string | undefined>(undefined);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isCheckingIn, setIsCheckingIn] = useState<boolean>(true);
  
  useEffect(() => {
    // อัปเดตเวลาทุกวินาที
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('th-TH'));
      setCurrentDate(now.toLocaleDateString('th-TH', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }));
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Load employees from Supabase
    const fetchEmployees = async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*");
      
      if (error) {
        console.error("Error fetching employees:", error);
        toast.error("ไม่สามารถโหลดข้อมูลพนักงานได้");
        return;
      }
      
      if (data) {
        setEmployees(data as Employee[]);
      }
    };

    fetchEmployees();
  }, []);

  const handleFaceRecognized = async (employee: Employee, confidenceScore: number, imageData?: string) => {
    setIsProcessing(true);
    setRecognizedEmployee(employee);
    setConfidence(confidenceScore);
    setCapturedImage(imageData);
    
    try {
      console.log("Face recognized:", employee, "Confidence:", confidenceScore);
      
      // Check if employee already checked in today
      const today = new Date().toISOString().split('T')[0];
      console.log("Checking attendance for date:", today);
      
      const { data: existingAttendance, error: fetchError } = await supabase
        .from("attendance")
        .select("*")
        .eq("employee_id", employee.id)
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`)
        .is("check_out_time", null);
      
      if (fetchError) {
        console.error("Error fetching attendance:", fetchError);
        throw fetchError;
      }
      
      console.log("Existing attendance:", existingAttendance);
      
      // กำหนดว่าเป็นการเช็คอินหรือเช็คเอาท์
      setIsCheckingIn(!(existingAttendance && existingAttendance.length > 0));
      
      // แสดง Modal ยืนยันก่อนบันทึก
      setShowConfirmModal(true);
      
    } catch (error) {
      console.error("Error checking attendance:", error);
      toast.error("เกิดข้อผิดพลาดในการตรวจสอบข้อมูลการเข้างาน");
      setIsProcessing(false);
      resetState();
    }
  };
  
  const confirmAttendance = async () => {
    if (!recognizedEmployee) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      if (isCheckingIn) {
        // Perform check in
        console.log("Performing check-in for:", recognizedEmployee.name);
        
        const currentHour = new Date().getHours();
        const status = currentHour >= 9 ? "late" : "present";
        console.log("Attendance status:", status, "Current hour:", currentHour);
        
        const { error: insertError } = await supabase
          .from("attendance")
          .insert({
            employee_id: recognizedEmployee.id,
            check_in_time: new Date().toISOString(),
            status: status,
          });
        
        if (insertError) {
          console.error("Error inserting attendance:", insertError);
          throw insertError;
        }
        
        toast.success(`ลงเวลาเข้างานสำเร็จ: ${recognizedEmployee.name}`);
      } else {
        // Perform check out
        console.log("Performing check-out for:", recognizedEmployee.name);
        
        const { data: existingAttendance, error: fetchError } = await supabase
          .from("attendance")
          .select("*")
          .eq("employee_id", recognizedEmployee.id)
          .gte("created_at", `${today}T00:00:00`)
          .lte("created_at", `${today}T23:59:59`)
          .is("check_out_time", null);
          
        if (fetchError) {
          console.error("Error fetching attendance:", fetchError);
          throw fetchError;
        }
        
        if (existingAttendance && existingAttendance.length > 0) {
          const { error: updateError } = await supabase
            .from("attendance")
            .update({
              check_out_time: new Date().toISOString(),
            })
            .eq("id", existingAttendance[0].id);
          
          if (updateError) {
            console.error("Error updating attendance:", updateError);
            throw updateError;
          }
          
          toast.success(`ลงเวลาออกงานสำเร็จ: ${recognizedEmployee.name}`);
        }
      }
      
      setCheckInStatus("success");
    } catch (error) {
      console.error("Error recording attendance:", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึกเวลา");
      toast.error("กรุณาตรวจสอบการเชื่อมต่อกับฐานข้อมูล");
      setCheckInStatus("error");
    } finally {
      setShowConfirmModal(false);
      setIsProcessing(false);
      
      // Reset after 5 seconds
      setTimeout(resetState, 5000);
    }
  };
  
  const cancelAttendance = () => {
    setShowConfirmModal(false);
    setIsProcessing(false);
    resetState();
  };
  
  const resetState = () => {
    setRecognizedEmployee(null);
    setCheckInStatus("idle");
    setConfidence(0);
    setCapturedImage(undefined);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-blue-100">
      <div className="container max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">สแกนหน้าเข้างาน</h1>
          <p className="text-gray-600">กรุณาหันหน้าเข้ากล้องเพื่อลงเวลาเข้า-ออกงาน</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-blue-600 text-white rounded-t-lg">
            <CardTitle className="text-xl">ระบบสแกนใบหน้า</CardTitle>
            <CardDescription className="text-blue-100">
              {currentDate}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {recognizedEmployee && checkInStatus !== "idle" ? (
              <div className="text-center p-4">
                <div className={`mx-auto rounded-full w-24 h-24 flex items-center justify-center mb-4 ${
                  checkInStatus === "success" ? "bg-green-100 text-green-600" : 
                  checkInStatus === "error" ? "bg-red-100 text-red-600" : 
                  "bg-blue-100 text-blue-600"
                }`}>
                  {checkInStatus === "success" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : checkInStatus === "error" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-1">{recognizedEmployee.name}</h3>
                <p className="text-gray-500 mb-2">{recognizedEmployee.position}</p>
                <p className="text-gray-500">{recognizedEmployee.department}</p>
              </div>
            ) : (
              <FaceDetection 
                onFaceRecognized={handleFaceRecognized}
                employees={employees}
                isProcessing={isProcessing}
              />
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href="/" passHref>
              <Button variant="outline">กลับหน้าหลัก</Button>
            </Link>
            <div className="text-sm text-gray-500">
              เวลาปัจจุบัน: {currentTime}
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Modal ยืนยันการบันทึกเวลา */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ยืนยันการ{isCheckingIn ? 'เข้า' : 'ออก'}งาน</DialogTitle>
            <DialogDescription>
              ระบบตรวจพบใบหน้าของคุณ กรุณายืนยันการลงเวลา{isCheckingIn ? 'เข้า' : 'ออก'}งาน
            </DialogDescription>
          </DialogHeader>
          
          {recognizedEmployee && (
            <div className="flex flex-col items-center space-y-4 py-4">
              {capturedImage && (
                <div className="relative w-64 h-64 overflow-hidden rounded-lg border-2 border-blue-500">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={capturedImage} 
                    alt="ภาพใบหน้าที่ตรวจจับได้" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-sm font-bold">
                    {confidence}%
                  </div>
                </div>
              )}
              
              <div className="text-center">
                <h3 className="text-xl font-semibold">{recognizedEmployee.name}</h3>
                <p className="text-gray-500">{recognizedEmployee.position}</p>
                <p className="text-gray-500">{recognizedEmployee.department}</p>
                <p className="mt-2 text-blue-600 font-medium">
                  ความมั่นใจในการตรวจจับ: {confidence}%
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={cancelAttendance}>
              ยกเลิก
            </Button>
            <Button onClick={confirmAttendance} className="bg-blue-600 hover:bg-blue-700">
              ยืนยันการ{isCheckingIn ? 'เข้า' : 'ออก'}งาน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
} 