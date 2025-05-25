import { Chart, DoughnutController, ArcElement, Tooltip, Legend, Title } from 'chart.js'

Chart.register(DoughnutController, ArcElement, Tooltip, Legend, Title)

import { websiteTimeDict } from './firestore.js'

const chartData = []
for (const [key, value] of Object.entries(websiteTimeDict)) {
    chartData.push({ name: key, count: value });
}

    const ctx = document.getElementById('acquisitions').getContext('2d');
    new Chart(ctx, {
    type: 'doughnut',
    data: {
        labels: chartData.map(row => row.name),
        datasets: [{
        label: 'Minutes',
        data: chartData.map(row => row.count),
        backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
            '#9966FF', '#FF9F40', '#C9CBCF', '#FF6384'
        ],
        }]
    },
    options: {
        responsive: true,
    }
    })
console.log("Chart.js initialized")