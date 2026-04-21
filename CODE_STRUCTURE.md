# 🏁 Drone Racing Dashboard - Code Structure

## 📋 ภาพรวมโครงสร้าง

โค้ดแบ่งออกเป็น **9 ส่วนหลัก** เพื่อให้সহজต่อการบำรุงรักษาและขยายความสามารถ:

```
app.js
├── [1] GLOBAL VARIABLES & CONFIG
├── [2] INITIALIZATION
├── [3] NAVIGATION FUNCTIONS
├── [4] DATABASE FUNCTIONS ← เชื่อมต่อ Google Sheets
├── [5] TIMER FUNCTIONS
├── [6] DATA RENDERING FUNCTIONS
├── [7] TAB SWITCHING
├── [8] THEME FUNCTIONS
└── [9] ERROR HANDLING & LOGGING
```

---

## 🔧 รายละเอียดแต่ละส่วน

### **[1] GLOBAL VARIABLES & CONFIG**
```javascript
const SCRIPT_URL = '...'; // URL ของ Google Apps Script
let allTeamsData = {};     // เก็บข้อมูลทีม
let currentActiveId = "";  // ทีมที่เลือกอยู่
let currentEventName = ""; // ชื่อรายการ (Air / Remote)
let timeCount = 0;         // เวลาจับได้
let timerInterval = null;  // ID ของ timer
```
**ที่ใช้ที่:** ทั้งโปรแกรม

---

### **[2] INITIALIZATION**
```javascript
window.onload = async () => { ... }
```
- ทำงานเมื่อเปิดหน้าเว็บ
- โหลดธีมที่บันทึกไว้ใน localStorage

---

### **[3] NAVIGATION FUNCTIONS**
| ฟังก์ชั่น | ความหมาย |
|----------|---------|
| `enterEvent(eventName)` | เข้าไปยัง Dashboard เลือกรายการ |
| `exitToHome()` | กลับไปหน้า Home |
| `resetDashboard()` | รีเซ็ตข้อมูลทั้งหมด |

**ตัวอย่าง:**
```javascript
// เมื่อคลิก "AIR CIRCUIT"
enterEvent('Air');
// → ซ่อนหน้า Home
// → แสดงหน้า Dashboard
// → ดึงข้อมูลทีมจากฐานข้อมูล
```

---

### **[4] DATABASE FUNCTIONS** ⭐ **สำคัญที่สุด**

#### `syncWithDatabase(category)`
- **ที่ทำ:** ดึงข้อมูลทีมจาก Google Sheets
- **ส่วนที่เชื่อมต่อ:**
  ```javascript
  const url = `${SCRIPT_URL}?cat=${category}`;
  const response = await fetch(url);
  const teams = await response.json();
  ```
- **ส่งสิ่งนี้ไป:** `?cat=Air` หรือ `?cat=Remote`
- **ได้ข้อมูลกลับมา:** อาเรย์ของทีม + เวลาแข่ง

#### `addLap()`
- **ที่ทำ:** บันทึกเวลาแข่งลงฐานข้อมูล
- **ข้อมูลที่ส่ง:**
  ```javascript
  {
    teamId: "team1",
    roundNum: 1,
    timeStr: "0:45:230",
    category: "Air",
    timestamp: "2026-04-18T10:30:00Z"
  }
  ```
- **วิธีส่ง:** POST request ไปยัง `SCRIPT_URL`

---

### **[5] TIMER FUNCTIONS**
| ฟังก์ชั่น | ความหมาย |
|----------|---------|
| `startTimer()` | เริ่มจับเวลา |
| `stopTimer()` | หยุดจับเวลา |
| `resetTimer()` | รีเซ็ตเวลา |
| `updateTimerDisplay()` | อัปเดตหน้าจอ |

---

### **[6] DATA RENDERING FUNCTIONS**
| ฟังก์ชั่น | ความหมาย |
|----------|---------|
| `timeToMs(timeStr)` | แปลงเวลา เป็น milliseconds |
| `getOrdinal(n)` | แปลงเลข เป็น 1st, 2nd, 3rd... |
| `renderSingleTeam()` | แสดงผลทีมเดียว |
| `renderLeaderboard()` | แสดงผลตารางอันดับทั้งหมด |

**ตัวอย่าง:**
```javascript
// แสดงผลทีมที่เลือก
renderSingleTeam();
// → ดึงข้อมูลจาก allTeamsData[currentActiveId]
// → สร้าง HTML แถว table
// → แสดงในหน้าเว็บ
```

---

### **[7] TAB SWITCHING**
```javascript
function switchTab(value) {
    if (value === "VIEW_ALL") {
        renderLeaderboard(); // แสดงตารางอันดับ
    } else {
        currentActiveId = value;
        renderSingleTeam(); // แสดงทีมเดียว
    }
}
```

---

### **[8] THEME FUNCTIONS**
```javascript
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}
```
- บันทึกธีมที่เลือก ไปยัง localStorage
- ธีมจะกลับมาเดิมครั้งถัดไป

---

### **[9] ERROR HANDLING & LOGGING**
```javascript
window.addEventListener('error', (event) => { ... });
window.addEventListener('offline', () => { ... });
window.addEventListener('online', () => { ... });
```
- ตรวจจับข้อผิดพลาด
- แจ้งเตือนเมื่อหมดการเชื่อมต่ออินเทอร์เน็ต

---

## 🔗 ความเชื่อมต่อกับฐานข้อมูล

```
┌─────────────────────────────────────────────────┐
│            หน้าเว็บ (HTML + CSS)                │
│                                                 │
│  Home Page ──┬──> AI CIRCUIT                    │
│              └──> REMOTE PRO                    │
│                                                 │
│  Dashboard ──┬──> Control Panel (ทีมเลือก)     │
│              ├──> Timer (จับเวลา)              │
│              └──> Leaderboard (ผลลัพธ์)        │
└─────────────────┬───────────────────────────────┘
                  │
                  │ app.js
                  │
            ┌─────▼──────┐
            │   Fetch    │ ◄── syncWithDatabase()
            │  API Call  │      addLap()
            └─────┬──────┘
                  │
                  │ HTTP Request/Response
                  │
            ┌─────▼──────────────────────────────────┐
            │    Google Apps Script Web App           │
            │  (Apps Script URL)                      │
            └─────┬──────────────────────────────────┘
                  │
            ┌─────▼──────────────────────────────────┐
            │    Google Sheets Database               │
            │  (ทีม, เวลาแข่ง, สถิติ)                │
            └──────────────────────────────────────┘
```

---

## 📌 ขั้นตอนการใช้งาน

### **1️⃣ เมื่อเปิดหน้าเว็บ**
```
window.onload
├─ โหลดธีม (localStorage)
└─ System Ready ✓
```

### **2️⃣ เมื่อคลิก "AIR CIRCUIT"**
```
enterEvent('Air')
├─ ซ่อนหน้า Home
├─ แสดงหน้า Dashboard
└─ syncWithDatabase('Air')
   ├─ Fetch ไปยัง: SCRIPT_URL?cat=Air
   ├─ ได้ข้อมูลทีมกลับมา
   └─ เก็บใน allTeamsData
```

### **3️⃣ เมื่อเลือกทีมและบันทึกเวลา**
```
addLap()
├─ สร้าง lapData Object
├─ POST ไปยัง SCRIPT_URL
├─ Google Sheets บันทึกข้อมูล
└─ renderSingleTeam()
   ├─ อัปเดต allTeamsData
   └─ แสดงผลใหม่
```

### **4️⃣ เมื่อคลิก "LEADERBOARD"**
```
switchTab('VIEW_ALL')
└─ renderLeaderboard()
   ├─ ดึงข้อมูลทีมทั้งหมด
   ├─ จัดเรียงตามเวลา
   └─ แสดงตารางอันดับ
```

---

## 🚨 ตัวชี้วัดข้อผิดพลาด

| ข้อความ | ความหมาย | วิธีแก้ |
|--------|---------|--------|
| `❌ Page elements not found!` | ไม่พบ DOM elements | ตรวจสอบชื่อ ID ใน HTML |
| `❌ Sync Error` | ไม่สามารถเชื่อมต่อฐานข้อมูล | ตรวจสอบ SCRIPT_URL, อินเทอร์เน็ต |
| `⚠️ No teams found` | ไม่มีทีมในฐานข้อมูล | ตรวจสอบ Google Sheets |
| `📡 Connection Lost` | หมดอินเทอร์เน็ต | เชื่อมต่อ WiFi ใหม่ |

---

## 💡 Tips สำคัญ

1. **SCRIPT_URL ต้องถูกต้อง** - ลองไปที่ Google Apps Script ดูเพื่อยืนยัน
2. **Google Sheets ต้องมีคอลัมน์:** id, name, laps, category
3. **Mode no-cors** ใช้เพื่อหลีกเลี่ยง CORS errors
4. **localStorage** เก็บธีมที่เลือก
5. **Console.log** ช่วยให้ debug ได้ง่ายขึ้น

---

## 📊 ตัวอย่าง allTeamsData Structure

```javascript
allTeamsData = {
    "team1": {
        name: "แรถ คะแนน",
        laps: [
            { roundNum: 1, timeStr: "0:45:230" },
            { roundNum: 2, timeStr: "0:43:120" }
        ]
    },
    "team2": {
        name: "ลาพร้อย",
        laps: [
            { roundNum: 1, timeStr: "0:50:500" }
        ]
    }
}
```

---

**✅ เสร็จแล้ว! โค้ดพร้อมใช้งาน**
