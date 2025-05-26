import { Chart, DoughnutController, ArcElement, Tooltip, Legend, Title } from 'chart.js'
import { onWebsiteTimesUpdated, clearCollection } from './firestore';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend, Title)

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('acquisitions')
    if (!canvas) {
        console.error("Canvas element with id 'acquisitions' not found.");
        return;
    }
    const ctx = canvas.getContext('2d')
    let chartInstance = null

    onWebsiteTimesUpdated((websiteTimeDict) => {
        const values = Object.values(websiteTimeDict)
        const minThreshold = 1

        const allTooSmall = values.length === 0 || values.every(v => v < minThreshold)
        const messageDiv = document.getElementById('chart-message')

        const clearButton = document.getElementById('clear-data-button')

        if (allTooSmall) {
            if (messageDiv) {
                messageDiv.textContent = "No data to display yet; please spend at least 1 minute on a website to see your data"
                messageDiv.style.display = 'block'
                canvas.style.display = 'none'
                clearButton.style.display = 'none'
            }
        } else {
            if (messageDiv) {
                messageDiv.style.display = 'none'
                canvas.style.display = 'block'
                clearButton.style.display = 'block'
            }
        }
        const data = {
            labels: Object.keys(websiteTimeDict),
            datasets: [{
            label: 'Minutes',
            data: Object.values(websiteTimeDict),
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

    // button management

    // clear data (reset database from firestore)
    clearButton.addEventListener('click', async () => {
        if (confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
        await clearCollection("website-times")
        console.log("Data cleared")
        }
    })
})

console.log("Chart.js initialized")