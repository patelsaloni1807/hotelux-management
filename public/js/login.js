// Toggle between Guest and Admin on login page
const guestBtn = document.getElementById('guestBtn');
const adminBtn = document.getElementById('adminBtn');
const roleInput = document.getElementById('roleInput');

guestBtn.addEventListener('click', function() {
    guestBtn.classList.add('active');
    adminBtn.classList.remove('active');
    roleInput.value = 'guest';
});

adminBtn.addEventListener('click', function() {
    adminBtn.classList.add('active');
    guestBtn.classList.remove('active');
    roleInput.value = 'admin';
});
