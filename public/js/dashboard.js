document.addEventListener('DOMContentLoaded', function () {
    // Room Status Chart (Doughnut)
    const roomStatusCanvas = document.getElementById('roomStatusChart');
    if (roomStatusCanvas) {
        const ctx1 = roomStatusCanvas.getContext('2d');
        const occupied = parseInt(roomStatusCanvas.getAttribute('data-occupied')) || 0;
        const available = parseInt(roomStatusCanvas.getAttribute('data-available')) || 0;
        const maintenance = parseInt(roomStatusCanvas.getAttribute('data-maintenance')) || 0;

        new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: ['Occupied', 'Available', 'Maintenance'],
                datasets: [{
                    data: [occupied, available, maintenance],
                    backgroundColor: ['#48bb78', '#3a86ff', '#f6ad55'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: { legend: { display: false } }
            }
        });
    }

    // Revenue Chart (Bar)
    const revenueCanvas = document.getElementById('revenueChart');
    if (revenueCanvas) {
        const ctx2 = revenueCanvas.getContext('2d');
        new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Revenue',
                    data: [45000, 52000, 48000, 61000, 55000, 67000],
                    backgroundColor: '#3a86ff',
                    borderRadius: 4,
                    barPercentage: 0.6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#a0aec0', padding: 10 }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#a0aec0', padding: 10 }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
});
