"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase, Employee } from "@/lib/supabase";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";

export default function FaceRegisterPage() {
  const router = useRouter();
  const params = useParams();
  const employeeId = params.id as string;
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  
  // เพิ่มตัวแปรสำหรับเก็บข้อมูลใบหน้าจากหลายมุม
  const [faceAngles, setFaceAngles] = useState<{
    front: Float32Array | null;
    left: Float32Array | null;
    right: Float32Array | null;
    up: Float32Array | null;
    down: Float32Array | null;
  }>({
    front: null,
    left: null,
    right: null,
    up: null,
    down: null
  });
  const [currentAngle, setCurrentAngle] = useState<'front' | 'left' | 'right' | 'up' | 'down'>('front');
  const [registrationStep, setRegistrationStep] = useState(1);
  
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Load employee data
  useEffect(() => {
    const fetchEmployee = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .eq("id", employeeId)
          .single();
        
        if (error) {
          throw error;
        }
        
        setEmployee(data as Employee);
      } catch (error) {
        console.error("Error fetching employee:", error);
        toast.error("ไม่สามารถโหลดข้อมูลพนักงานได้");
        router.push("/admin");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployee();
  }, [employeeId, router]);
  
  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      
      try {
        await Promise.all([
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        ]);
        
        setModelsLoaded(true);
        console.log("Face detection models loaded");
      } catch (error) {
        console.error("Error loading face detection models:", error);
        toast.error("ไม่สามารถโหลดโมเดลตรวจจับใบหน้าได้");
      }
    };

    loadModels();
  }, []);
  
  const captureImage = async () => {
    if (!webcamRef.current) return;
    
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    
    if (imageSrc) {
      // Detect face in captured image
      const img = document.createElement('img');
      img.src = imageSrc;
      
      img.onload = async () => {
        setIsProcessing(true);
        
        try {
          // Detect face with higher quality settings
          const detectionOptions = new faceapi.SsdMobilenetv1Options({ 
            minConfidence: 0.5,
            maxResults: 1 
          });
          
          // Detect face
          const detections = await faceapi
            .detectSingleFace(img, detectionOptions)
            .withFaceLandmarks()
            .withFaceDescriptor();
          
          if (!detections) {
            toast.error("ไม่พบใบหน้าในภาพ กรุณาถ่ายภาพใหม่");
            setCapturedImage(null);
            setFaceDetected(false);
            return;
          }
          
          // ตรวจสอบว่าใบหน้าอยู่ตรงกลางและมีขนาดใหญ่พอ
          const { width, height } = img;
          const faceBox = detections.detection.box;
          const faceArea = (faceBox.width * faceBox.height) / (width * height);
          const isCentered = 
            Math.abs((faceBox.x + faceBox.width/2) - width/2) < width * 0.2 &&
            Math.abs((faceBox.y + faceBox.height/2) - height/2) < height * 0.2;
          
          if (faceArea < 0.1) {
            toast.error("ใบหน้ามีขนาดเล็กเกินไป กรุณาเข้าใกล้กล้องมากขึ้น");
            setCapturedImage(null);
            setFaceDetected(false);
            return;
          }
          
          if (!isCentered) {
            toast.error("กรุณาหันหน้าตรงเข้ากล้อง");
            setCapturedImage(null);
            setFaceDetected(false);
            return;
          }
          
          setFaceDetected(true);
          
          // บันทึกข้อมูลใบหน้าตามมุมที่กำลังถ่าย
          setFaceAngles(prev => ({
            ...prev,
            [currentAngle]: detections.descriptor
          }));
          
          // Draw face detection on canvas
          const canvas = canvasRef.current;
          if (canvas) {
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, img.width, img.height);
              
              // Draw detection box
              const box = detections.detection.box;
              ctx.strokeStyle = "green";
              ctx.lineWidth = 3;
              ctx.strokeRect(box.x, box.y, box.width, box.height);
              
              // แสดงข้อความแนะนำ
              ctx.fillStyle = "green";
              ctx.font = "16px Arial";
              ctx.fillText(`ตรวจพบใบหน้า (${currentAngle})`, box.x, box.y - 10);
            }
          }
        } catch (error) {
          console.error("Error detecting face:", error);
          toast.error("เกิดข้อผิดพลาดในการตรวจจับใบหน้า");
          setCapturedImage(null);
        } finally {
          setIsProcessing(false);
        }
      };
    }
  };
  
  const resetCapture = () => {
    setCapturedImage(null);
    setFaceDetected(false);
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };
  
  const nextStep = () => {
    if (registrationStep < 5) {
      setRegistrationStep(registrationStep + 1);
      resetCapture();
      
      // กำหนดมุมถัดไป
      const angles: ('front' | 'left' | 'right' | 'up' | 'down')[] = ['front', 'left', 'right', 'up', 'down'];
      setCurrentAngle(angles[registrationStep]);
    } else {
      // ถ้าครบทุกมุมแล้ว ให้บันทึกข้อมูล
      saveFaceDescriptors();
    }
  };
  
  const saveFaceDescriptors = async () => {
    if (!employee) return;
    
    // ตรวจสอบว่ามีข้อมูลใบหน้าครบทุกมุมหรือไม่
    const missingAngles = Object.entries(faceAngles)
      .filter(([, descriptor]) => descriptor === null)
      .map(([angle]) => angle);
    
    if (missingAngles.length > 0) {
      toast.error(`กรุณาถ่ายภาพใบหน้าให้ครบทุกมุม (ขาด: ${missingAngles.join(', ')})`);
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // รวมข้อมูลใบหน้าจากทุกมุม
      const allDescriptors = Object.values(faceAngles).filter(Boolean) as Float32Array[];
      
      // คำนวณค่าเฉลี่ยของ descriptor จากทุกมุม
      const avgDescriptor = new Float32Array(128);
      for (let i = 0; i < 128; i++) {
        let sum = 0;
        for (const descriptor of allDescriptors) {
          sum += descriptor[i];
        }
        avgDescriptor[i] = sum / allDescriptors.length;
      }
      
      // แปลง Float32Array เป็น Array ธรรมดาเพื่อเก็บใน Supabase
      const descriptorArray = Array.from(avgDescriptor);
      
      // เก็บข้อมูลใบหน้าจากทุกมุมแยกกัน
      const allAnglesData = {
        front: faceAngles.front ? Array.from(faceAngles.front) : null,
        left: faceAngles.left ? Array.from(faceAngles.left) : null,
        right: faceAngles.right ? Array.from(faceAngles.right) : null,
        up: faceAngles.up ? Array.from(faceAngles.up) : null,
        down: faceAngles.down ? Array.from(faceAngles.down) : null
      };
      
      console.log("บันทึกข้อมูลใบหน้า...");
      console.log("ขนาดข้อมูล face_descriptor:", JSON.stringify(descriptorArray).length, "bytes");
      console.log("ขนาดข้อมูล face_angles:", JSON.stringify(allAnglesData).length, "bytes");
      
      // ตรวจสอบขนาดข้อมูล
      if (JSON.stringify(descriptorArray).length > 1000000 || JSON.stringify(allAnglesData).length > 1000000) {
        toast.error("ข้อมูลใบหน้ามีขนาดใหญ่เกินไป กรุณาลองใหม่อีกครั้ง");
        return;
      }
      
      // ทดลองบันทึกทีละส่วน
      try {
        // บันทึกเฉพาะ face_descriptor ก่อน
        const { error: descriptorError } = await supabase
          .from("employees")
          .update({
            face_descriptor: descriptorArray,
          })
          .eq("id", employee.id);
        
        if (descriptorError) {
          console.error("Error saving face descriptor:", descriptorError);
          throw new Error(`บันทึก face_descriptor ไม่สำเร็จ: ${descriptorError.message}`);
        }
        
        // บันทึก face_angles
        const { error: anglesError } = await supabase
          .from("employees")
          .update({
            face_angles: allAnglesData,
          })
          .eq("id", employee.id);
        
        if (anglesError) {
          console.error("Error saving face angles:", anglesError);
          throw new Error(`บันทึก face_angles ไม่สำเร็จ: ${anglesError.message}`);
        }
        
        // บันทึกรูปภาพ
        const { error: imageError } = await supabase
          .from("employees")
          .update({
            profile_image_url: capturedImage,
          })
          .eq("id", employee.id);
        
        if (imageError) {
          console.error("Error saving profile image:", imageError);
          throw new Error(`บันทึกรูปภาพไม่สำเร็จ: ${imageError.message}`);
        }
      } catch (stepError) {
        console.error("Error in step-by-step update:", stepError);
        throw stepError;
      }
      
      toast.success("ลงทะเบียนใบหน้าสำเร็จ");
      toast.info("บันทึกข้อมูลใบหน้าจากทุกมุมเรียบร้อยแล้ว");
      router.push("/admin");
    } catch (error: unknown) {
      console.error("Error saving face descriptor:", error);
      
      // แสดงข้อความข้อผิดพลาดที่ชัดเจน
      if (error instanceof Error) {
        toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
      } else if (typeof error === 'object' && error !== null && 'error_description' in error) {
        toast.error(`เกิดข้อผิดพลาด: ${(error as { error_description: string }).error_description}`);
      } else {
        toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูลใบหน้า");
      }
      
      // แนะนำวิธีแก้ไข
      toast.error("โปรดตรวจสอบว่าฐานข้อมูล Supabase มีฟิลด์ face_angles ประเภท jsonb");
    } finally {
      setIsProcessing(false);
    }
  };
  
  const getAngleInstructions = () => {
    switch (currentAngle) {
      case 'front':
        return "กรุณาหันหน้าตรงเข้ากล้อง";
      case 'left':
        return "กรุณาหันหน้าไปทางซ้ายเล็กน้อย (ประมาณ 15-30 องศา)";
      case 'right':
        return "กรุณาหันหน้าไปทางขวาเล็กน้อย (ประมาณ 15-30 องศา)";
      case 'up':
        return "กรุณาเงยหน้าขึ้นเล็กน้อย";
      case 'down':
        return "กรุณาก้มหน้าลงเล็กน้อย";
      default:
        return "กรุณาหันหน้าตรงเข้ากล้อง";
    }
  };
  
  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-emerald-50 to-emerald-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </main>
    );
  }
  
  if (!employee) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-emerald-50 to-emerald-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">ไม่พบข้อมูลพนักงาน</p>
          <Link href="/admin" passHref>
            <Button>กลับไปหน้าจัดการพนักงาน</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col p-4 bg-gradient-to-b from-emerald-50 to-emerald-100">
      <div className="container max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-emerald-800 mb-2">ลงทะเบียนใบหน้า</h1>
            <p className="text-gray-600">
              {employee.face_descriptor ? "อัปเดตใบหน้า" : "ลงทะเบียนใบหน้า"}: {employee.name}
            </p>
          </div>
          <Link href="/admin" passHref>
            <Button variant="outline">
              กลับไปหน้าจัดการพนักงาน
            </Button>
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-emerald-600 text-white rounded-t-lg">
            <CardTitle className="text-xl">ระบบลงทะเบียนใบหน้า</CardTitle>
            <CardDescription className="text-emerald-100">
              ขั้นตอนที่ {registrationStep}/5: {getAngleInstructions()}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* แสดงความคืบหน้าในการลงทะเบียน */}
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-emerald-600 h-2.5 rounded-full" 
                  style={{ width: `${(registrationStep / 5) * 100}%` }}
                ></div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="text-gray-700 font-medium mb-2">ข้อมูลพนักงาน</div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-4">
                      <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3">
                        {employee.profile_image_url ? (
                          <Image 
                            src={employee.profile_image_url} 
                            alt={employee.name} 
                            width={48}
                            height={48}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <span className="font-bold">{employee.name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.position}</div>
                      </div>
                    </div>
                    <div className="text-sm space-y-1">
                      <div><span className="text-gray-500">อีเมล:</span> {employee.email}</div>
                      <div><span className="text-gray-500">แผนก:</span> {employee.department}</div>
                      <div>
                        <span className="text-gray-500">สถานะใบหน้า:</span> 
                        {employee.face_descriptor ? (
                          <span className="text-green-600 ml-1">ลงทะเบียนแล้ว</span>
                        ) : (
                          <span className="text-red-600 ml-1">ยังไม่ลงทะเบียน</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* แสดงสถานะการลงทะเบียนแต่ละมุม */}
                  <div className="mt-4">
                    <div className="text-gray-700 font-medium mb-2">สถานะการลงทะเบียนแต่ละมุม</div>
                    <div className="grid grid-cols-5 gap-2">
                      <div className={`text-center p-2 rounded ${faceAngles.front ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                        ตรง
                      </div>
                      <div className={`text-center p-2 rounded ${faceAngles.left ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                        ซ้าย
                      </div>
                      <div className={`text-center p-2 rounded ${faceAngles.right ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                        ขวา
                      </div>
                      <div className={`text-center p-2 rounded ${faceAngles.up ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                        เงย
                      </div>
                      <div className={`text-center p-2 rounded ${faceAngles.down ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                        ก้ม
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="text-gray-700 font-medium mb-2">
                    {capturedImage ? "ภาพที่ถ่าย" : "กล้องถ่ายภาพ"}
                  </div>
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    {capturedImage ? (
                      <div className="relative">
                        <Image 
                          src={capturedImage} 
                          alt="Captured" 
                          width={640}
                          height={480}
                          className="w-full h-auto"
                        />
                        <canvas 
                          ref={canvasRef}
                          className="absolute top-0 left-0 w-full h-full"
                        />
                      </div>
                    ) : (
                      <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{
                          width: 640,
                          height: 480,
                          facingMode: "user"
                        }}
                        className="w-full h-auto"
                      />
                    )}
                    
                    {!modelsLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="text-center text-white p-4">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                          <p>กำลังโหลดโมเดลตรวจจับใบหน้า...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center space-x-4">
                {capturedImage ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={resetCapture}
                      disabled={isProcessing}
                    >
                      ถ่ายใหม่
                    </Button>
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={nextStep}
                      disabled={!faceDetected || isProcessing}
                    >
                      {registrationStep < 5 ? "ถัดไป" : "บันทึกใบหน้า"}
                    </Button>
                  </>
                ) : (
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={captureImage}
                    disabled={!modelsLoaded || isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        กำลังประมวลผล...
                      </>
                    ) : (
                      "ถ่ายภาพ"
                    )}
                  </Button>
                )}
              </div>
              
              {faceDetected && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center text-green-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p>ตรวจพบใบหน้าในภาพ คุณสามารถดำเนินการต่อได้</p>
                </div>
              )}
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700">
                <h3 className="font-medium mb-2">คำแนะนำในการถ่ายภาพ</h3>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>หันหน้าตามคำแนะนำในแต่ละขั้นตอน</li>
                  <li>ให้แน่ใจว่าใบหน้าอยู่ในกรอบและมีแสงสว่างเพียงพอ</li>
                  <li>ไม่ควรสวมแว่นตาหรืออุปกรณ์ที่บดบังใบหน้า</li>
                  <li>แสดงสีหน้าปกติ ไม่ยิ้มหรือแสดงอารมณ์</li>
                  <li>ลงทะเบียนให้ครบทั้ง 5 มุมเพื่อเพิ่มความแม่นยำ</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
} 