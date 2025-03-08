# โมเดลสำหรับ face-api.js

โฟลเดอร์นี้ใช้สำหรับเก็บไฟล์โมเดลของ face-api.js ที่จำเป็นสำหรับการตรวจจับและจดจำใบหน้า

## ไฟล์โมเดลที่จำเป็น

1. **face_recognition_model-weights_manifest.json**
2. **face_recognition_model-shard1**
3. **face_landmark_68_model-weights_manifest.json**
4. **face_landmark_68_model-shard1**
5. **ssd_mobilenetv1_model-weights_manifest.json**
6. **ssd_mobilenetv1_model-shard1**
7. **ssd_mobilenetv1_model-shard2**

## วิธีการดาวน์โหลดโมเดล

1. ไปที่ [GitHub ของ face-api.js](https://github.com/justadudewhohacks/face-api.js/tree/master/weights)
2. ดาวน์โหลดไฟล์ทั้งหมดที่ระบุไว้ข้างต้น
3. วางไฟล์ทั้งหมดในโฟลเดอร์นี้ (public/models)

## คำสั่ง PowerShell สำหรับดาวน์โหลดโมเดล

```powershell
# สร้างโฟลเดอร์ models (ถ้ายังไม่มี)
mkdir -p public/models

# ดาวน์โหลดไฟล์โมเดล
$baseUrl = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"
$files = @(
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model-shard1",
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-shard1",
    "ssd_mobilenetv1_model-weights_manifest.json",
    "ssd_mobilenetv1_model-shard1",
    "ssd_mobilenetv1_model-shard2"
)

foreach ($file in $files) {
    Invoke-WebRequest -Uri "$baseUrl/$file" -OutFile "public/models/$file"
    Write-Host "Downloaded $file"
}
```

## คำสั่ง Bash สำหรับดาวน์โหลดโมเดล

```bash
# สร้างโฟลเดอร์ models (ถ้ายังไม่มี)
mkdir -p public/models

# ดาวน์โหลดไฟล์โมเดล
BASE_URL="https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"
FILES=(
    "face_recognition_model-weights_manifest.json"
    "face_recognition_model-shard1"
    "face_landmark_68_model-weights_manifest.json"
    "face_landmark_68_model-shard1"
    "ssd_mobilenetv1_model-weights_manifest.json"
    "ssd_mobilenetv1_model-shard1"
    "ssd_mobilenetv1_model-shard2"
)

for file in "${FILES[@]}"; do
    curl -o "public/models/$file" "$BASE_URL/$file"
    echo "Downloaded $file"
done
```

หลังจากดาวน์โหลดโมเดลเรียบร้อยแล้ว ระบบตรวจจับและจดจำใบหน้าจะสามารถทำงานได้อย่างถูกต้อง 