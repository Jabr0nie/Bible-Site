
// Hamburger menu
document.querySelector('.hamburger-toggle').addEventListener('click', () => {
    const menu = document.querySelector('.hamburger-menu');
    const icon = document.querySelector('.hamburger-icon');
    const close = document.querySelector('.hamburger-close');
    menu.classList.toggle('active');
    icon.style.display = menu.classList.contains('active') ? 'none' : 'block';
    close.style.display = menu.classList.contains('active') ? 'block' : 'none';
});

document.querySelectorAll('.hamburger-menu a').forEach(link => {
    link.addEventListener('click', () => {
        document.querySelector('.hamburger-menu').classList.remove('active');
        document.querySelector('.hamburger-icon').style.display = 'block';
        document.querySelector('.hamburger-close').style.display = 'none';
    });
});


// Dark mode toggle
const modeSwitch = document.getElementById('modeSwitch');
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    const icon = modeSwitch.querySelector('i');
    if (isDark) {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    } else {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }
    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
}

// Load saved mode
const savedMode = localStorage.getItem('darkMode');
if (savedMode === 'disabled') {
    document.body.classList.remove('dark-mode');
    modeSwitch.innerHTML = '<i class="fas fa-sun"></i>';
} else {
    document.body.classList.add('dark-mode');
    modeSwitch.innerHTML = '<i class="fas fa-moon"></i>';
}
modeSwitch.addEventListener('click', toggleDarkMode);