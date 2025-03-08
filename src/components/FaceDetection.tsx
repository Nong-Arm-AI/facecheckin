"use client";

import { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { Employee, FaceAngles } from "@/lib/supabase";

interface FaceDetectionProps {
  onFaceRecognized: (employee: Employee, confidence: number, imageData?: string) => void;
  employees: Employee[];
  isProcessing: boolean;
}

export default function FaceDetection({ onFaceRecognized, employees, isProcessing }: FaceDetectionProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [detectionInterval, setDetectionInterval] = useState<NodeJS.Timeout | null>(null);
  const [showDebug, setShowDebug] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>("");

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
      }
    };

    loadModels();

    // Cleanup function
    return () => {
      if (detectionInterval) {
        clearInterval(detectionInterval);
      }
    };
  }, []);

  // Start face detection when models are loaded
  useEffect(() => {
    if (modelsLoaded && employees.length > 0 && !isProcessing) {
      startFaceDetection();
    }
    
    return () => {
      if (detectionInterval) {
        clearInterval(detectionInterval);
      }
    };
  }, [modelsLoaded, employees, isProcessing]);

  const startFaceDetection = () => {
    if (detectionInterval) {
      clearInterval(detectionInterval);
    }

    // Create labeled face descriptors from employees
    const labeledDescriptors: faceapi.LabeledFaceDescriptors[] = [];
    
    employees
      .filter(emp => emp.face_descriptor)
      .forEach(emp => {
        // ตรวจสอบว่ามีข้อมูลใบหน้าจากหลายมุมหรือไม่
        if (emp.face_angles) {
          // ถ้ามีข้อมูลจากหลายมุม ให้สร้าง descriptor สำหรับแต่ละมุม
          const descriptors: Float32Array[] = [];
          
          // เพิ่ม descriptor หลัก
          if (emp.face_descriptor) {
            descriptors.push(new Float32Array(emp.face_descriptor as number[]));
          }
          
          // เพิ่ม descriptor จากแต่ละมุม
          const angles = emp.face_angles as FaceAngles;
          for (const angle of ['front', 'left', 'right', 'up', 'down'] as (keyof FaceAngles)[]) {
            if (angles[angle]) {
              descriptors.push(new Float32Array(angles[angle] as number[]));
            }
          }
          
          if (descriptors.length > 0) {
            labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(emp.id, descriptors));
          }
        } else {
          // ถ้ามีแค่ descriptor เดียว ใช้แบบเดิม
          const descriptorArray = new Float32Array(emp.face_descriptor as number[]);
          labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(emp.id, [descriptorArray]));
        }
      });

    if (labeledDescriptors.length === 0) {
      console.warn("No face descriptors available for recognition");
      setDebugInfo("ไม่พบข้อมูลใบหน้าในระบบ");
      return;
    }

    // Create face matcher with higher threshold (ลดความเข้มงวดลง)
    // เปลี่ยนค่า threshold จาก 0.6 เป็น 0.5 เพื่อให้จับคู่ได้ง่ายขึ้น
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.7);

    // Start detection interval
    const interval = setInterval(async () => {
      if (isProcessing) {
        return;
      }

      if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
        const video = webcamRef.current.video;
        const canvas = canvasRef.current;
        
        if (!canvas) return;
        
        // Set canvas dimensions to match video
        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);

        try {
          // Detect faces
          const detections = await faceapi
            .detectAllFaces(video)
            .withFaceLandmarks()
            .withFaceDescriptors();

          // Resize detections to match display size
          const resizedDetections = faceapi.resizeResults(detections, displaySize);

          // Clear canvas
          const ctx = canvas.getContext("2d");
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

          // ถ้าไม่พบใบหน้า ให้แสดงข้อความ
          if (resizedDetections.length === 0) {
            setDebugInfo("ไม่พบใบหน้า");
          }

          // Draw detection results on canvas
          resizedDetections.forEach(detection => {
            const result = faceMatcher.findBestMatch(detection.descriptor);
            
            // คำนวณความมั่นใจเป็นเปอร์เซ็นต์
            const confidence = Math.round((1 - result.distance) * 100);
            
            // Draw box and text
            const box = detection.detection.box;
            const drawBox = new faceapi.draw.DrawBox(box, { 
              label: `${result.toString()} (${confidence}%)`,
              boxColor: result.distance < 0.5 ? "green" : "red",
              drawLabelOptions: {
                fontSize: 16,
                fontStyle: "bold"
              }
            });
            drawBox.draw(canvas);

            // อัปเดตข้อมูลดีบัก
            setDebugInfo(`ID: ${result.label}, ความมั่นใจ: ${confidence}%`);
            
            // ถ้าความมั่นใจมากกว่า 50% และไม่ใช่ unknown ให้ลงเวลาเข้างานเลย
            if (result.label !== "unknown" && confidence >= 50) {
              
              // Find the employee that matches the recognized face
              const recognizedEmployee = employees.find(emp => emp.id === result.label);
              
              if (recognizedEmployee) {
                console.log(`Recognized ${recognizedEmployee.name} with confidence ${confidence}%`);
                clearInterval(interval);
                setDetectionInterval(null);
                
                // จับภาพจากวิดีโอเพื่อส่งไปแสดงใน Modal
                const screenshot = webcamRef.current?.getScreenshot();
                const imageData = screenshot || undefined;
                
                // ส่งข้อมูลพนักงาน ความมั่นใจ และรูปภาพไปยังฟังก์ชัน onFaceRecognized
                onFaceRecognized(recognizedEmployee, confidence, imageData);
              }
            }
          });
        } catch (error) {
          console.error("Error during face detection:", error);
          setDebugInfo("เกิดข้อผิดพลาดในการตรวจจับใบหน้า");
        }
      }
    }, 100);

    setDetectionInterval(interval);
  };

  return (
    <div className="relative">
      <Webcam
        ref={webcamRef}
        audio={false}
        width="100%"
        height="auto"
        mirrored
        screenshotFormat="image/jpeg"
        videoConstraints={{
          width: 640,
          height: 480,
          facingMode: "user"
        }}
        className="rounded-lg"
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
      />
      
      {showDebug && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs p-2 rounded">
          {debugInfo || "รอการตรวจจับใบหน้า..."}
        </div>
      )}
      
      <button 
        onClick={() => setShowDebug(!showDebug)}
        className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded"
      >
        {showDebug ? "ซ่อนข้อมูลดีบัก" : "แสดงข้อมูลดีบัก"}
      </button>
      
      {!modelsLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <div className="text-center text-white p-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>กำลังโหลดโมเดลตรวจจับใบหน้า...</p>
          </div>
        </div>
      )}
      
      {modelsLoaded && employees.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <div className="text-center text-white p-4">
            <p>ไม่พบข้อมูลพนักงานในระบบ</p>
          </div>
        </div>
      )}
      
      {modelsLoaded && employees.filter(emp => emp.face_descriptor).length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <div className="text-center text-white p-4">
            <p>ไม่พบข้อมูลใบหน้าพนักงานในระบบ</p>
            <p className="text-sm mt-2">กรุณาลงทะเบียนใบหน้าพนักงานก่อนใช้งาน</p>
          </div>
        </div>
      )}
    </div>
  );
} 