// ฟังก์ชันสลับธีมเมื่อกดปุ่ม
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    
    // ถ้าตอนนี้เป็น light ให้เปลี่ยนเป็นค่าว่าง (Dark) ถ้าว่างให้เป็น light
    const targetTheme = currentTheme === 'light' ? '' : 'light';
    
    html.setAttribute('data-theme', targetTheme);
    localStorage.setItem('drone-theme-pro', targetTheme); // บันทึกค่าลง Browser
    updateThemeButton(targetTheme);
}

// อัปเดตข้อความและไอคอนบนปุ่ม
function updateThemeButton(theme) {
    const btn = document.getElementById('themeToggleBtn');
    if (theme === 'light') {
        btn.innerHTML = '🌙 DARK MODE';
    } else {
        btn.innerHTML = '☀️ LIGHT MODE';
    }
}

// เมื่อโหลดหน้าเว็บ ให้เช็คว่าเคยตั้งธีมอะไรไว้
window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('drone-theme-pro');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeButton(savedTheme);
    }
});