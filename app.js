// =============================================================
// 1. CONFIGURATION & GLOBAL STATE (ค่าตั้งต้นและตัวแปรหลัก)
// =============================================================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzUUU59y_YpxkR6q1NhWAc14HlNnrmQUCGg6Te_UsP_eAGRlVDYqgk01BjqgmJrxAiA6g/exec';

let allTeamsData = {};            // เก็บข้อมูลทีมทั้งหมดที่ Sync มาจาก Sheets
let currentActiveId = "VIEW_ALL"; // ID ทีมที่กำลังเลือก (ถ้าเป็น VIEW_ALL คือหน้า Leaderboard)
let currentEventName = "";        // ชื่อกิจกรรม (เช่น Drone Racing)
let currentSheetName = "";        // ชื่อ Sheet ที่ใช้ดึงข้อมูล (Data Sheet)
let currentClass = "";            // รุ่นการแข่งขัน (20 หรือ 40)
let timerInterval = null;         // ตัวแปรจับเวลา
let msElapsed = 0;                // เวลาที่ผ่านไป (มิลลิวินาที)
const MAX_TIME_MS = 180000;       // จำกัดเวลาที่ 3 นาที
let soccerScore = { red: 0, blue: 0 }; // คะแนน (สำหรับ Soccer/Futsal)

// =============================================================
// 2. INITIALIZATION & URL HANDLING (การตั้งค่าเริ่มต้นจาก URL)
// =============================================================
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    currentEventName = params.get('event') || "Unknown Event";
    currentSheetName = params.get('sheet') || "";
    currentClass = params.get('class') || ""; // ดึงค่าเลข 20 หรือ 40 จากลิงก์หน้าแรก
    
    const badge = document.getElementById('statusBadge');
    if (badge) {
        badge.innerText = `LIVE: ${currentEventName} ${currentClass ? 'Class ' + currentClass : ''}`;
    }
}

// =============================================================
// 3. DATABASE SYNC (ดึงรายชื่อทีมจาก Google Sheets)
// =============================================================
async function syncWithDatabase() {
    if (!currentSheetName) return;

    const display = document.getElementById('displayTeamName');
    const group = document.getElementById('teamGroup');
    const syncBtn = document.querySelector('button[onclick="syncWithDatabase()"]');
    
    const redSelect = document.getElementById('redTeamSelect');
    const blueSelect = document.getElementById('blueTeamSelect');
    
    if(syncBtn) syncBtn.innerHTML = '<span class="sync-icon-spin">🔄</span> Syncing...';
    if(display) display.innerText = "CONNECTING...";

    try {
        const response = await fetch(`${SCRIPT_URL}?sheetName=${encodeURIComponent(currentSheetName)}`);
        const teams = await response.json(); 

        if (teams.error) {
            if(display) display.innerText = "SHEET NOT FOUND";
            return;
        }

        allTeamsData = {}; 
        if(group) group.innerHTML = ''; 
        if(redSelect) redSelect.innerHTML = '<option value="">เลือกทีมแข่งขัน</option>'; 
        if(blueSelect) blueSelect.innerHTML = '<option value="">เลือกทีมแข่งขัน</option>'; 

        teams.forEach(team => {
            allTeamsData[team.id] = team;
            const finalTeamName = (team.name && team.name !== "-" && team.name !== "") ? team.name : team.members;

            if(group) {
                const opt = document.createElement('option');
                opt.value = team.id;
                opt.textContent = `[${team.id}] ${finalTeamName}`;
                group.appendChild(opt);
            }

            [redSelect, blueSelect].forEach(select => {
                if(select) {
                    const opt = document.createElement('option');
                    opt.value = team.id;
                    opt.textContent = `[${team.id}] ${finalTeamName}`;
                    select.appendChild(opt);
                }
            });
        });

        if(syncBtn) syncBtn.innerHTML = '🔄 Sync Data';
        
        if(display) {
            if (currentActiveId === "VIEW_ALL") {
                display.innerText = "LEADERBOARD";
            } else {
                const t = allTeamsData[currentActiveId];
                const tName = (t.name && t.name !== "-" && t.name !== "") ? t.name : t.members;
                display.innerHTML = `<div>${t.id}</div><div style="font-size: 0.5em; opacity: 0.7;">${tName}</div>`;
            }
        }
        
        switchTab(currentActiveId); 
    } catch (e) { 
        if(display) display.innerText = "OFFLINE / ERROR";
        console.error(e);
    }
}

// =============================================================
// 4. UI TABS & NAVIGATION (การสลับหน้าจอแสดงผล)
// =============================================================
function switchTab(val) {
    currentActiveId = val;
    const tbody = document.getElementById('scoreBody');
    const displayTitle = document.getElementById('displayTeamName');
    const displayRound = document.getElementById('displayRound');

    if (!tbody) return;

    if (val === "VIEW_ALL") {
        if(displayTitle) displayTitle.innerText = "LEADERBOARD";
        if(displayRound) displayRound.innerText = "LIVE STATS";
        renderLeaderboard();
    } else {
        const team = allTeamsData[val];
        if(!team) return;
        
        if(displayTitle) {
            const finalName = (team.name && team.name !== "-" && team.name !== "") ? team.name : team.members;
            displayTitle.innerHTML = `
                <div class="line-1">${team.id}</div>
                <div class="line-2" style="font-size: 0.4em; opacity: 0.6; margin-top: -5px; text-transform: none;">${finalName}</div>
            `;
        }
        
        if(displayRound) displayRound.innerText = `ROUNDS: ${team.laps.length}/2`;
        renderSingleTeam(team);
    }
}

// =============================================================
// 5. RENDER FUNCTIONS (การแสดงผลตารางข้อมูล)
// =============================================================

// แสดงตารางอันดับรวม (Leaderboard)
function renderLeaderboard() {
    const tbody = document.getElementById('scoreBody');
    if(!tbody) return;
    
    let list = Object.keys(allTeamsData)
        .filter(id => allTeamsData[id].laps && allTeamsData[id].laps.length > 0)
        .map(id => {
            let bestLap = allTeamsData[id].laps.reduce((prev, curr) => 
                timeToMs(curr.timeStr) < timeToMs(prev.timeStr) ? curr : prev
            );
            const finalTeamName = (allTeamsData[id].name && allTeamsData[id].name !== "-" && allTeamsData[id].name !== "") ? allTeamsData[id].name : allTeamsData[id].members;
            return { 
                id: id, 
                name: finalTeamName, 
                bestTime: bestLap.timeStr, 
                ms: timeToMs(bestLap.timeStr) 
            };
        })
        .sort((a, b) => a.ms - b.ms); 

    tbody.innerHTML = list.map((item, i) => {
        const rankClass = i === 0 ? 'rank-1st' : i === 1 ? 'rank-2nd' : i === 2 ? 'rank-3rd' : '';
        const rowClass = i === 0 ? 'winner-row' : i === 1 ? 'rank-2nd-row' : i === 2 ? 'rank-3rd-row' : '';
        
        let rankDisplay = i + 1;
        if (i === 0) rankDisplay = `1<span class="text-2xl align-top ml-0.5">st</span>`;
        else if (i === 1) rankDisplay = `2<span class="text-2xl align-top ml-0.5">nd</span>`;
        else if (i === 2) rankDisplay = `3<span class="text-2xl align-top ml-0.5">rd</span>`;

        return `
        <tr class="border-b border-white/5 hover:bg-white/5 transition-all ${rowClass}">
            <td class="p-6 race-font font-black italic text-6xl ${rankClass} ${i >= 3 ? 'opacity-40' : ''}">
                ${rankDisplay}
            </td>
            <td class="p-6">
                <div class="text-3xl font-black uppercase italic">${item.id}</div>
                <div class="text-lg font-bold opacity-70">${item.name}</div>
            </td>
            <td class="p-6 digital-font text-5xl text-right font-black ${i === 0 ? 'text-yellow-400' : 'text-red-500'}">
                ${item.bestTime}
            </td>
        </tr>`;
    }).join('') || `<tr><td class="p-20 text-center opacity-20 italic">WAITING FOR RECORDS...</td></tr>`;
}

// แสดงผลคะแนนรายทีมที่เลือก
function renderSingleTeam(team) {
    const tbody = document.getElementById('scoreBody');
    if(!tbody) return;

    let minMs = Infinity;
    if (team.laps && team.laps.length > 0) {
        minMs = Math.min(...team.laps.map(l => timeToMs(l.timeStr)));
    }

    tbody.innerHTML = team.laps.map(l => {
        const currentMs = timeToMs(l.timeStr);
        const isBest = currentMs === minMs && team.laps.length > 0;

        return `
        <tr class="border-b border-white/5 transition-all ${isBest ? 'best-round-row' : ''}">
            <td class="p-10 race-font font-black italic text-5xl">
                ROUND ${l.roundNum}
                ${isBest ? '<span class="ml-4 text-sm bg-green-600 text-white px-3 py-1 not-italic rounded-md shadow-lg shadow-green-900/20">THE BEST</span>' : ''}
            </td>
            <td class="p-10 digital-font text-8xl text-right font-black ${isBest ? 'text-green-500' : 'text-red-500'}">
                ${l.timeStr}
            </td>
        </tr>`;
    }).join('') || `<tr><td class="p-20 text-center opacity-20 italic">No record found</td></tr>`;
}

// =============================================================
// 6. SAVE DATA (บันทึกข้อมูลลง Database)
// =============================================================
async function addLap() {
    const id = document.getElementById('teamId').value;
    if (!id || id === "VIEW_ALL") return alert("กรุณาเลือกนักแข่งก่อน!");

    const teamInfo = allTeamsData[id];
    const m = document.getElementById('inMin').value || 0;
    const s = document.getElementById('inSec').value || 0;
    const ms = document.getElementById('inMs').value || 0;
    
    const timeStr = `${m}:${s.toString().padStart(2,'0')}:${ms.toString().padStart(3,'0')}`;
    
    if (teamInfo.laps.length >= 2) return alert("แข่งครบ 2 รอบแล้ว!");

    const finalNameForSave = (teamInfo.name && teamInfo.name !== "-" && teamInfo.name !== "") ? teamInfo.name : teamInfo.members;
    const fullCategory = `${currentEventName} ${currentClass ? 'Class ' + currentClass : ''}`.trim();

    // สร้างข้อมูลสำหรับบันทึก
    const lapData = { 
        action: "saveRacing", // *** จุดที่ต้องเพิ่มเพื่อให้ Script ทำงานได้ ***
        id: id, // แก้ไข: เปลี่ยนจาก teamId เป็น id เพื่อให้ตรงกับ Apps Script
        personalId: teamInfo.personalId,
        members: teamInfo.members, // แก้ไข: เปลี่ยนจาก fullName เป็น members
        name: finalNameForSave, // แก้ไข: เปลี่ยนจาก teamName เป็น name
        round: teamInfo.laps.length + 1, // แก้ไข: เปลี่ยนจาก roundNum เป็น round
        time: timeStr, // แก้ไข: เปลี่ยนจาก timeStr เป็น time
        category: fullCategory,
        sheetName: "Scores",
    sourceSheet: currentSheetName

    };

    const btn = document.getElementById('addBtn');
    btn.innerText = "SAVING..."; 
    btn.disabled = true;
    
    try {
        await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(lapData) });
       teamInfo.laps.push({ 
    roundNum: lapData.round, 
    timeStr: lapData.time 
});
        switchTab(id);
        
        document.getElementById('inMin').value = '';
        document.getElementById('inSec').value = '';
        document.getElementById('inMs').value = '';
        btn.innerText = "SAVE RECORD"; btn.disabled = false;
    } catch (e) { 
        alert("ส่งข้อมูลไม่สำเร็จ"); 
        btn.innerText = "SAVE RECORD"; btn.disabled = false;
    }
}

// =============================================================
// 7. HELPER FUNCTIONS (ฟังก์ชันเสริมอื่นๆ)
// =============================================================

// แปลงข้อความเวลา 0:00:000 เป็นตัวเลขมิลลิวินาที
function timeToMs(str) { 
    if (!str || typeof str !== 'string' || str.includes('T')) return 9999999;
    try { 
        const cleanStr = str.replace(/'/g, "").trim();
        const p = cleanStr.split(':'); 
        if (p.length < 3) return 9999999;
        return (parseInt(p[0]) * 60000) + (parseInt(p[1]) * 1000) + parseInt(p[2]); 
    } catch { return 9999999; } 
}

// =============================================================
// 8. TIMER & SCORE SYSTEM (ระบบเวลาและคะแนน)
// =============================================================
function updateTimerUI() {
    const mins = Math.floor(msElapsed / 60000);
    const secs = Math.floor((msElapsed % 60000) / 1000);
    const ms = Math.floor(msElapsed % 1000);
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${ms.toString().padStart(3, '0')}`;
    const display = document.getElementById('timerDisplay') || document.getElementById('soccerTimer');
    if (display) display.innerText = timeStr;
}

function startTimer() {
    if (timerInterval) return; 
    const startTime = Date.now() - msElapsed;
    timerInterval = setInterval(() => {
        msElapsed = Date.now() - startTime;
        if (msElapsed >= MAX_TIME_MS) {
            msElapsed = MAX_TIME_MS;
            updateTimerUI();
            stopTimer();
            alert("⚠️ หมดเวลา!");
        } else {
            updateTimerUI();
        }
    }, 10);
}

function stopTimer() { clearInterval(timerInterval); timerInterval = null; }
function resetTimer() { stopTimer(); msElapsed = 0; updateTimerUI(); }

// Score System
function changeScore(team, val) {
    if (team === 'red') {
        soccerScore.red = Math.max(0, soccerScore.red + val);
        document.getElementById('scoreRed').innerText = soccerScore.red;
    } else {
        soccerScore.blue = Math.max(0, soccerScore.blue + val);
        document.getElementById('scoreBlue').innerText = soccerScore.blue;
    }
}

function resetSoccer() {
    if (!confirm("รีเซ็ตทั้งหมด?")) return;
    resetTimer();
    soccerScore = { red: 0, blue: 0 };
    document.getElementById('scoreRed').innerText = "0";
    document.getElementById('scoreBlue').innerText = "0";
}

// =============================================================
// 9. THEME & EVENT LISTENERS
// =============================================================
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
}

window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-mode');
    getUrlParams();
    syncWithDatabase();

    const inputs = ['inMin', 'inSec', 'inMs'];
    const limits = [1, 2, 3];
    inputs.forEach((id, idx) => {
        const el = document.getElementById(id);
        if(!el) return;
        el.addEventListener('input', () => {
            if (el.value.length > limits[idx]) el.value = el.value.slice(0, limits[idx]);
            if (el.value.length === limits[idx] && inputs[idx+1]) document.getElementById(inputs[idx+1]).focus();
        });
    });
});