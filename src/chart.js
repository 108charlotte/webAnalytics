import { Chart, DoughnutController, ArcElement, Tooltip, Legend, Title } from 'chart.js'
import { onWebsiteTimesUpdated } from './firestore';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend, Title)

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('aquisitions')
    if (!canvas) {
        console.error("Canvas element with id 'aquisitions' not found.");
        return;
    }
    const ctx = canvas.getContext('2d')
    let chartInstance = null

    onWebsiteTimesUpdated((websiteTimeDict) => {
        const chartData = Object.entries(websiteTimeDict).map(([name, count]))

        const data = {
            labels: chartData.map(row => row.name),
            datasets: [{
            label: 'Minutes',
            data: chartData.map(row => row.count),
            backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                '#9966FF', '#FF9F40', '#C9CBCF', '#FF6384'
            ],
            }]
        }

        if (chartInstance) {
            chartInstance.data = data
            chartInstance.update()
        } else {
            chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data, 
            options: { responsive: true }
        })}
    })
})

console.log("Chart.js initialized")