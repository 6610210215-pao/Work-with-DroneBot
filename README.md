
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Drone Racing Grand Championship</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Bai+Jamjuree:wght@300;500;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --racing-red: #e11d48;
            /* Dark Mode Specs */
            --bg-main: radial-gradient(circle at top right, #1e293b, #0f172a);
            --panel-bg: rgba(30, 41, 59, 0.7);
            --text-main: #f8fafc;
            --input-bg: rgba(0, 0, 0, 0.4);
            --border-color: rgba(255, 255, 255, 0.1);
        }

        /* Light Mode Specs */
        body.light-mode {
            --bg-main: radial-gradient(circle at top right, #f1f5f9, #e2e8f0);
            --panel-bg: rgba(255, 255, 255, 0.8);
            --text-main: #0f172a;
            --input-bg: #ffffff;
            --border-color: rgba(0, 0, 0, 0.1);
        }

        body { 
            font-family: 'Bai Jamjuree', sans-serif; 
            background: var(--bg-main);
            color: var(--text-main); 
            height: 100vh; 
            overflow: hidden; 
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .digital-font { font-family: 'Orbitron', sans-serif; }
        
        .glass-panel {
            background: var(--panel-bg);
            backdrop-filter: blur(12px);
            border: 1px solid var(--border-color);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
        }
        
        .timer-glow {
            text-shadow: 0 0 20px rgba(225, 29, 72, 0.4);
            color: var(--text-main);
        }

        body.light-mode .timer-glow { color: #e11d48; text-shadow: none; }

        .btn-racing {
            background: linear-gradient(135deg, #e11d48 0%, #9f1239 100%);
            transition: all 0.3s;
            color: white;
        }
        .btn-racing:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(225, 29, 72, 0.4); }

        .rank-row { transition: all 0.2s; border-left: 4px solid transparent; }
        .rank-1 { background: linear-gradient(90deg, rgba(251, 191, 36, 0.1) 0%, transparent 100%); border-left-color: #fbbf24; }
        .rank-2 { background: linear-gradient(90deg, rgba(148, 163, 184, 0.1) 0%, transparent 100%); border-left-color: #94a3b8; }
        .rank-3 { background: linear-gradient(90deg, rgba(234, 88, 12, 0.1) 0%, transparent 100%); border-left-color: #ea580c; }
        
        .input-box { background: var(--input-bg); border: 2px solid var(--border-color); color: var(--text-main); }
        .scroll-custom::-webkit-scrollbar { width: 6px; }
        .scroll-custom::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 10px; }

        /* Theme Toggle Button Style */
        .theme-toggle {
            cursor: pointer;
            padding: 8px 16px;
            border-radius: 50px;
            font-weight: bold;
            font-size: 10px;
            border: 1px solid var(--border-color);
            background: var(--panel-bg);
            transition: 0.3s;
        }
    </style>
</head>
<body class="p-4">

    <div class="max-w-[1600px] mx-auto h-full flex flex-col gap-4">
        
        <header class="glass-panel rounded-3xl p-4 flex items-center justify-between border-b-4 border-red-600">
            <div class="flex items-center gap-4">
                <div class="bg-red-600 p-2 rounded-lg shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <div>
                    <h1 class="digital-font text-2xl font-black tracking-tighter italic">DRONE <span class="text-red-600">PRO SCORE</span></h1>
                </div>
            </div>
            
            <div class="flex flex-col items-center">
                <div id="timerDisplay" class="digital-font text-7xl font-black timer-glow leading-none">03:00</div>
                <div class="flex gap-2 mt-2">
                    <button onclick="startTimer()" class="bg-emerald-600/20 hover:bg-emerald-600 text-[10px] font-bold px-4 py-1 rounded-full transition-all border border-emerald-600/40">START</button>
                    <button onclick="stopTimer()" class="bg-red-600/20 hover:bg-red-600 text-[10px] font-bold px-4 py-1 rounded-full transition-all border border-red-600/40">STOP</button>
                    <button onclick="resetTimer()" class="bg-slate-600/20 hover:bg-slate-600 text-[10px] font-bold px-4 py-1 rounded-full transition-all border border-slate-600/40">RESET</button>
                </div>
            </div>

            <div class="flex items-center gap-4">
                <button onclick="toggleTheme()" class="theme-toggle hover:scale-105 active:scale-95 uppercase tracking-widest">
                    🌓 Switch Mode
                </button>
            </div>
        </header>

        <main class="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 overflow-hidden">
            
            <section class="lg:col-span-4 flex flex-col gap-4">
                <div class="glass-panel p-6 rounded-3xl h-full border-t-4 border-red-600 md:border-white">
                    <h2 class="text-red-600 font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2 italic">
                        <span class="w-2 h-4 bg-red-600 block"></span> Record Center
                    </h2>
                    
                    <div class="space-y-8">
                        <div>
                            <label class="text-[11px] font-bold opacity-60 uppercase mb-3 block italic">1. Select Competitor</label>
                            <select id="teamId" onchange="switchTab(this.value)" class="w-full input-box rounded-2xl p-4 font-bold text-xl outline-none appearance-none cursor-pointer">
                                <option value="">-- Loading Teams --</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="text-[11px] font-bold opacity-60 uppercase mb-3 block italic">2. Lap Time Record</label>
                            <div class="grid grid-cols-3 gap-3 input-box p-4 rounded-2xl shadow-inner">
                                <div class="text-center">
                                    <span class="text-[9px] font-bold opacity-50 uppercase">Min</span>
                                    <input type="number" id="inMin" placeholder="0" class="w-full bg-transparent text-center text-5xl font-black digital-font outline-none">
                                </div>
                                <div class="text-center border-x border-slate-400/20">
                                    <span class="text-[9px] font-bold opacity-50 uppercase">Sec</span>
                                    <input type="number" id="inSec" placeholder="00" class="w-full bg-transparent text-center text-5xl font-black digital-font outline-none">
                                </div>
                                <div class="text-center">
                                    <span class="text-[9px] font-bold opacity-50 uppercase">Ms</span>
                                    <input type="number" id="inMs" placeholder="000" class="w-full bg-transparent text-center text-5xl font-black digital-font outline-none">
                                </div>
                            </div>
                        </div>

                        <button onclick="addLap()" id="addBtn" class="btn-racing w-full py-6 rounded-2xl font-black text-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95">
                            <span>SAVE RECORD</span>
                        </button>
                    </div>
                </div>
            </section>

            <section class="lg:col-span-8 glass-panel rounded-3xl overflow-hidden flex flex-col border-t-4 border-red-600">
                <div class="bg-black/5 px-8 py-6 flex justify-between items-end border-b border-black/10">
                    <div>
                        <h2 id="displayTeamName" class="font-black text-5xl italic uppercase leading-none tracking-tighter">- WAITING -</h2>
                        <p id="headerLabel" class="text-red-500 font-bold text-xs uppercase mt-2 tracking-widest italic">Live Statistics Interface</p>
                    </div>
                    <div id="displayRound" class="digital-font text-lg font-bold bg-red-600 text-white px-6 py-1 rounded-full">
                        RD: 0 / 2
                    </div>
                </div>
                
                <div class="flex-1 overflow-y-auto scroll-custom">
                    <table class="w-full">
                        <thead id="tableHead" class="bg-black/5 text-slate-500 text-[11px] font-bold uppercase sticky top-0 backdrop-blur-md">
                        </thead>
                        <tbody id="scoreBody">
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    </div>

    <script>
        const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzUUU59y_YpxkR6q1NhWAc14HlNnrmQUCGg6Te_UsP_eAGRlVDYqgk01BjqgmJrxAiA6g/exec';
        
        let timeLeft = 180;
        let timerInterval;
        let allTeamsData = {}; 
        let currentMode = "none";
        let currentActiveId = "";

        // --- Theme Toggle ---
        function toggleTheme() {
            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
        }

        // Load saved theme
        if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-mode');

        window.onload = async () => { await syncWithDatabase(); };

        async function syncWithDatabase() {
            try {
                const response = await fetch(SCRIPT_URL);
                const teams = await response.json(); 
                const select = document.getElementById('teamId');
                select.innerHTML = '<option value="">-- Choose Competitor --</option>';
                select.innerHTML += '<option value="VIEW_ALL" style="background:#e11d48; color:white;">🏆 LEADERBOARD</option>';
                teams.forEach(team => {
                    select.innerHTML += `<option value="${team.id}">${team.name}</option>`;
                    allTeamsData[team.id] = { name: team.name, laps: team.laps || [] };
                });
            } catch (e) { alert("Database Error"); }
        }

        function switchTab(val) {
            if(!val) return;
            if(val === "VIEW_ALL") { currentMode = "all"; renderLeaderboard(); } 
            else { currentMode = "single"; currentActiveId = val; renderSingleTeam(); }
        }

        function timeToMs(timeStr) {
            const p = timeStr.split(':');
            return (parseInt(p[0]) * 60000) + (parseInt(p[1]) * 1000) + parseInt(p[2]);
        }

        async function addLap() {
            const id = document.getElementById('teamId').value;
            if (!id || id === "VIEW_ALL") return alert("Select team first!");
            if (allTeamsData[id].laps.length >= 2) return alert("Limit 2 Rounds!");

            const m = document.getElementById('inMin').value || 0;
            const s = document.getElementById('inSec').value || 0;
            const ms = document.getElementById('inMs').value || 0;
            const timeStr = `${m}:${s.toString().padStart(2,'0')}:${ms.toString().padStart(3,'0')}`;
            const lapData = { teamId: id, roundNum: allTeamsData[id].laps.length + 1, timeStr };

            try {
                const btn = document.getElementById('addBtn');
                btn.innerText = "UPLOADING..."; btn.disabled = true;
                await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(lapData) });
                allTeamsData[id].laps.push({ roundNum: lapData.roundNum, timeStr: lapData.timeStr });
                if(currentMode === "all") renderLeaderboard(); else renderSingleTeam();
                document.getElementById('inMin').value = ''; document.getElementById('inSec').value = ''; document.getElementById('inMs').value = '';
                btn.innerText = "SAVE RECORD"; btn.disabled = false;
            } catch (e) { alert("Sync Failed"); }
        }

        function renderSingleTeam() {
            const team = allTeamsData[currentActiveId];
            const tbody = document.getElementById('scoreBody');
            document.getElementById('displayTeamName').innerText = team.name;
            document.getElementById('displayRound').innerText = `RD: ${team.laps.length} / 2`;
            document.getElementById('tableHead').innerHTML = `<tr><th class="px-8 py-4">#</th><th class="px-8 py-4">Session</th><th class="px-8 py-4 text-right">Time</th></tr>`;
            tbody.innerHTML = team.laps.map(lap => `
                <tr class="border-b border-black/5 bg-black/5">
                    <td class="px-8 py-6 text-red-600 font-bold">-</td>
                    <td class="px-8 py-6 font-bold uppercase opacity-70">Round ${lap.roundNum}</td>
                    <td class="px-8 py-6 digital-font text-4xl text-right font-black">${lap.timeStr}</td>
                </tr>`).join('');
        }

        function renderLeaderboard() {
            const tbody = document.getElementById('scoreBody');
            document.getElementById('displayTeamName').innerText = "LEADERBOARD";
            document.getElementById('displayRound').innerText = "LIVE";
            document.getElementById('tableHead').innerHTML = `<tr><th class="px-8 py-4">Rank</th><th class="px-8 py-4">Team</th><th class="px-8 py-4 text-right">Best Time</th></tr>`;
            let list = Object.keys(allTeamsData).filter(id => allTeamsData[id].laps.length > 0).map(id => {
                let best = allTeamsData[id].laps.reduce((m, l) => timeToMs(l.timeStr) < timeToMs(m.timeStr) ? l : m);
                return { name: allTeamsData[id].name, bestTime: best.timeStr, ms: timeToMs(best.timeStr) };
            }).sort((a,b) => a.ms - b.ms);

            tbody.innerHTML = list.map((item, index) => `
                <tr class="rank-row ${index<3?`rank-${index+1}`:''} border-b border-black/5">
                    <td class="px-8 py-6 digital-font text-3xl font-black ${index==0?'text-amber-500':index==1?'text-slate-400':index==2?'text-orange-600':'text-slate-400/50'}">P${(index+1).toString().padStart(2,'0')}</td>
                    <td class="px-8 py-6 font-black text-xl italic uppercase">${item.name}</td>
                    <td class="px-8 py-6 digital-font text-4xl text-right font-black">${item.bestTime}</td>
                </tr>`).join('');
        }

        // Timer Logic
        function updateTimerDisplay() {
            const m = Math.floor(timeLeft / 60); const s = timeLeft % 60;
            document.getElementById('timerDisplay').innerText = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        }
        function startTimer() { if(!timerInterval) timerInterval = setInterval(() => { if(timeLeft > 0){ timeLeft--; updateTimerDisplay(); } else stopTimer(); }, 1000); }
        function stopTimer() { clearInterval(timerInterval); timerInterval = null; }
        function resetTimer() { stopTimer(); timeLeft = 180; updateTimerDisplay(); }
    </script>
</body>
</html>
