// ================= การตั้งค่าพื้นฐาน =================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzUUU59y_YpxkR6q1NhWAc14HlNnrmQUCGg6Te_UsP_eAGRlVDYqgk01BjqgmJrxAiA6g/exec';

let timeLeft = 180;
let timerInterval;
let allTeamsData = {}; 
let currentMode = "none";
let currentActiveId = "";

// ================= ฟังก์ชันเริ่มทำงานเมื่อโหลดหน้าเว็บ =================
window.onload = async () => {
    await syncWithDatabase();
    setupTimeInputs();
};

// ================= ดึงข้อมูลจาก Google Sheets =================
async function syncWithDatabase() {
    try {
        const response = await fetch(SCRIPT_URL);
        const teams = await response.json(); 
        const select = document.getElementById('teamId');
        
        // เก็บค่าที่เลือกไว้ก่อนเผื่อรีเฟรช
        const lastSelected = select.value;

        select.innerHTML = '<option value="">-- เลือกรายการ --</option>';
        select.innerHTML += '<option value="VIEW_ALL" style="color:#10b981; font-weight:bold;">🏆 ตารางสรุปอันดับ (Leaderboard)</option>';
        
        teams.forEach(team => {
            select.innerHTML += `<option value="${team.id}">${team.name}</option>`;
            // เติมข้อมูลที่ดึงมาจาก Database ลงในตัวแปรหลัก
            allTeamsData[team.id] = { 
                name: team.name, 
                laps: team.laps || [] 
            };
        });

        // ถ้าก่อนหน้านี้เลือกทีมอะไรไว้ ให้สลับกลับไปโหมดนั้น
        if(lastSelected) {
            select.value = lastSelected;
            switchTab(lastSelected);
        }
    } catch (e) { 
        console.error("Sync Error:", e);
        alert("ไม่สามารถซิงค์ข้อมูลจากฐานข้อมูลได้");
    }
}

// ================= ตั้งค่า input ช่องกรอกเวลา =================
function setupTimeInputs() {
    const inMin = document.getElementById('inMin');
    const inSec = document.getElementById('inSec');
    const inMs = document.getElementById('inMs');
    
    inMin.addEventListener('input', function() {
        if (this.value.length >= 1) {
            inSec.focus();
        }
    });
    
    inSec.addEventListener('input', function() {
        if (this.value.length >= 2) {
            inMs.focus();
        }
    });
}

// ================= ฟังก์ชันสลับโหมดการดูตาราง =================
function switchTab(val) {
    if(!val) {
        currentMode = "none";
        document.getElementById('displayTeamName').innerText = "- SELECT VIEW -";
        document.getElementById('scoreBody').innerHTML = '<tr><td colspan="3" class="px-8 py-20 text-center theme-text-muted italic">Please select a team or leaderboard</td></tr>';
        return;
    }
    if(val === "VIEW_ALL") { 
        currentMode = "all"; 
        renderLeaderboard(); 
    } else { 
        currentMode = "single"; 
        currentActiveId = val; 
        renderSingleTeam(); 
    }
}

// ================= ฟังก์ชันแปลงเวลาเปรียบเทียบหาที่ 1 =================
function timeToMs(timeStr) {
    const p = timeStr.split(':');
    return (parseInt(p[0]) * 60000) + (parseInt(p[1]) * 1000) + parseInt(p[2]);
}

// ================= ฟังก์ชันบันทึกเวลา =================
async function addLap() {
    const id = document.getElementById('teamId').value;
    if (!id || id === "VIEW_ALL") return alert("กรุณาเลือกทีมก่อนบันทึก!");
    if (allTeamsData[id].laps.length >= 2) return alert("ทีมนี้แข่งครบ 2 รอบแล้ว!");

    const m = document.getElementById('inMin').value || 0;
    const s = document.getElementById('inSec').value || 0;
    const ms = document.getElementById('inMs').value || 0;
    const timeStr = `${m}:${s.toString().padStart(2,'0')}:${ms.toString().padStart(3,'0')}`;
    
    const lapData = { teamId: id, roundNum: allTeamsData[id].laps.length + 1, timeStr };

    try {
        document.getElementById('addBtn').innerText = "SAVING TO CLOUD...";
        document.getElementById('addBtn').disabled = true;

        // บันทึกลง Sheet
        await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(lapData) });
        
        // อัปเดตข้อมูลในหน้าเว็บแบบทันที (ไม่ต้องรอโหลดใหม่)
        allTeamsData[id].laps.push({ roundNum: lapData.roundNum, timeStr: lapData.timeStr });
        
        if(currentMode === "all") renderLeaderboard(); else renderSingleTeam();
        
        // เคลียร์ช่อง input
        document.getElementById('inMin').value = ''; 
        document.getElementById('inSec').value = ''; 
        document.getElementById('inMs').value = '';
        document.getElementById('addBtn').innerText = "SAVE RECORD";
        document.getElementById('addBtn').disabled = false;

    } catch (e) { 
        alert("Error: บันทึกไม่สำเร็จ"); 
        document.getElementById('addBtn').disabled = false;
    }
}

// ================= วาดตาราง: ดูเวลาของทีมเดียว =================
function renderSingleTeam() {
    const team = allTeamsData[currentActiveId];
    const tbody = document.getElementById('scoreBody');
    document.getElementById('headerLabel').innerText = "Team Performance";
    document.getElementById('displayTeamName').innerText = team.name;
    document.getElementById('displayRound').innerText = `Rounds: ${team.laps.length} / 2`;
    
    document.getElementById('tableHead').innerHTML = `<tr><th class="px-8 py-4">Status</th><th class="px-8 py-4">Lap</th><th class="px-8 py-4 text-right">Time (M:S:MS)</th></tr>`;
    
    tbody.innerHTML = team.laps.length === 0 ? '<tr><td colspan="3" class="px-8 py-20 text-center theme-text-muted italic uppercase">No data for this team</td></tr>' : "";
    
    team.laps.forEach(lap => {
        tbody.innerHTML += `
            <tr class="hover-theme transition-all">
                <td class="px-8 py-5 theme-text-muted">-</td>
                <td class="px-8 py-5 font-bold uppercase">Round ${lap.roundNum}</td>
                <td class="px-8 py-5 digital-font text-3xl text-blue-400 text-right">${lap.timeStr}</td>
            </tr>`;
    });
}

// ================= วาดตาราง: สรุปอันดับทุกทีม (Leaderboard) =================
function renderLeaderboard() {
    const tbody = document.getElementById('scoreBody');
    document.getElementById('headerLabel').innerText = "Current Tournament Standings";
    document.getElementById('displayTeamName').innerText = "🏆 LEADERBOARD";
    document.getElementById('displayRound').innerText = "All Teams";
    
    document.getElementById('tableHead').innerHTML = `<tr><th class="px-8 py-4">Rank</th><th class="px-8 py-4">Team</th><th class="px-8 py-4 text-right">Best Time</th></tr>`;
    
    let list = [];
    for (let id in allTeamsData) {
        if (allTeamsData[id].laps.length > 0) {
            // หารอบที่เวลาดีที่สุด
            let best = allTeamsData[id].laps.reduce((m, l) => timeToMs(l.timeStr) < timeToMs(m.timeStr) ? l : m);
            list.push({ name: allTeamsData[id].name, bestTime: best.timeStr, ms: timeToMs(best.timeStr) });
        }
    }
    // เรียงจากเวลาน้อยไปมาก
    list.sort((a, b) => a.ms - b.ms);

    tbody.innerHTML = list.length === 0 ? '<tr><td colspan="3" class="px-8 py-20 text-center theme-text-muted italic">Waiting for results...</td></tr>' : "";
    
    list.forEach((item, index) => {
        let rankClass = "";
        let textClass = "text-blue-400"; // สี Default (อันดับ 4 ลงไป)
        let rankLabel = (index + 1).toString().padStart(2, '0');

        // เช็คอันดับ 1-3 เพื่อใส่สีพิเศษ
        if (index === 0) { rankClass = "rank-1"; textClass = "text-gold"; rankLabel = "🏆 01"; }
        else if (index === 1) { rankClass = "rank-2"; textClass = "text-silver"; rankLabel = "🥈 02"; }
        else if (index === 2) { rankClass = "rank-3"; textClass = "text-bronze"; rankLabel = "🥉 03"; }

        tbody.innerHTML += `
            <tr class="${rankClass} transition-all border-b theme-divide">
                <td class="px-8 py-5 font-black digital-font text-2xl ${textClass}">${rankLabel}</td>
                <td class="px-8 py-5 font-bold">${item.name}</td>
                <td class="px-8 py-5 digital-font text-3xl ${textClass} text-right">${item.bestTime}</td>
            </tr>`;
    });
}

// ================= ระบบนาฬิกาจับเวลา =================
function updateTimerDisplay() {
    const m = Math.floor(timeLeft / 60); const s = timeLeft % 60;
    document.getElementById('timerDisplay').innerText = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}
function startTimer() { if(!timerInterval) timerInterval = setInterval(() => { if(timeLeft > 0){ timeLeft--; updateTimerDisplay(); } else stopTimer(); }, 1000); }
function stopTimer() { clearInterval(timerInterval); timerInterval = null; }
function resetTimer() { stopTimer(); timeLeft = 180; updateTimerDisplay(); }