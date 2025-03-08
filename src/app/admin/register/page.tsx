"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Define form schema with Zod
const formSchema = z.object({
  name: z.string().min(2, { message: "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร" }),
  email: z.string().email({ message: "รูปแบบอีเมลไม่ถูกต้อง" }),
  position: z.string().min(2, { message: "ตำแหน่งต้องมีอย่างน้อย 2 ตัวอักษร" }),
  department: z.string().min(2, { message: "แผนกต้องมีอย่างน้อย 2 ตัวอักษร" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function RegisterEmployeePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      position: "",
      department: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Insert new employee to Supabase
      const { error } = await supabase
        .from("employees")
        .insert({
          name: data.name,
          email: data.email,
          position: data.position,
          department: data.department,
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast.success("เพิ่มพนักงานใหม่สำเร็จ");
      
      // Redirect to employee list
      router.push("/admin");
    } catch (error: unknown) {
      console.error("Error adding employee:", error);
      
      const supabaseError = error as { code?: string };
      if (supabaseError.code === "23505") {
        toast.error("อีเมลนี้มีอยู่ในระบบแล้ว");
      } else {
        toast.error("เกิดข้อผิดพลาดในการเพิ่มพนักงาน");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col p-4 bg-gradient-to-b from-emerald-50 to-emerald-100">
      <div className="container max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-emerald-800 mb-2">เพิ่มพนักงานใหม่</h1>
            <p className="text-gray-600">กรอกข้อมูลพนักงานเพื่อลงทะเบียนในระบบ</p>
          </div>
          <Link href="/admin" passHref>
            <Button variant="outline">
              กลับไปหน้าจัดการพนักงาน
            </Button>
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-emerald-600 text-white rounded-t-lg">
            <CardTitle className="text-xl">แบบฟอร์มลงทะเบียนพนักงาน</CardTitle>
            <CardDescription className="text-emerald-100">
              กรอกข้อมูลให้ครบทุกช่อง
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ชื่อ-นามสกุล</FormLabel>
                      <FormControl>
                        <Input placeholder="ชื่อ นามสกุล" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>อีเมล</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="example@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ตำแหน่ง</FormLabel>
                      <FormControl>
                        <Input placeholder="ตำแหน่งงาน" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>แผนก</FormLabel>
                      <FormControl>
                        <Input placeholder="แผนก" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-4 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.push("/admin")}
                    disabled={isSubmitting}
                  >
                    ยกเลิก
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        กำลังบันทึก...
                      </>
                    ) : (
                      "บันทึกข้อมูล"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
} 