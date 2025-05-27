import { Chart, DoughnutController, ArcElement, Tooltip, Legend, Title } from 'chart.js'
import { onWebsiteTimesUpdated, clearCollection, retrieveUserId, devDelete } from './firestore';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend, Title)

// see resources for where I got this from (stack overflow)
function onToday(date) {
  const today = new Date()
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate()
}

function onThisYear(date) {
    const today = new Date()
    return date.getFullYear() === today.getFullYear()
}

// see resources for where I got this from (stack overflow)
function onThisWeek(date, boundaryDay=0)
{
    let today = new Date()
    if(today > date)
    {
        let t = date;
        date = today;
        today = t;
    }

    if(((((today - date)/1000)/3600)/24)>6)
    {
        return false;
    }

    let dayToday = today.getUTCDay();
    let dayDate = date.getUTCDay();

    if(dayToday == boundaryDay)
    {
        return true;
    }

    if(dayDate == boundaryDay)
    {
        return false;
    }

    let dayTodayBoundaryDist = ((dayToday-boundaryDay)+7)%7;
    let dayDateBoundaryDist = ((dayDate-boundaryDay)+7)%7;

    if(dayTodayBoundaryDist <= dayDateBoundaryDist)
    {
        return true;
    }

    return false;
}

function buildChartData(websites, restriction) {
    let filtered
    switch (restriction) {
        case 'today':
            filtered = websites.filter(w => w.setActive && w.setActive.toDate && onToday(w.setActive.toDate()))
            break;
        case 'this-week':
            filtered = websites.filter(w => w.setActive && w.setActive.toDate && onThisWeek(w.setActive.toDate()))
            break;
        case 'this-year':
            filtered = websites.filter(w => w.setActive && w.setActive.toDate && onThisYear(w.setActive.toDate()))
            break
        case 'all-time':
        default:
            filtered = websites
    }
    const dict = {}
    filtered.forEach(w => {
        if (w.setIdle && w.setActive) {
            const minutes = Math.round((w.setIdle.toDate() - w.setActive.toDate()) / 1000 / 60)
            if (minutes > 0) {
                dict[w.websiteName] = (dict[w.websiteName] || 0) + minutes
            }
        }
    })
    return dict
}

let chartInstance = null

function updateChart(dict) {
    const canvas = document.getElementById('acquisitions')
    
    if (!canvas) {
        console.error("Canvas element with id 'acquisitions' not found.")
        return
    }

    const ctx = canvas.getContext('2d')
    const clearButton = document.getElementById('clear-data-button')

    const values = Object.values(dict)

    const minThreshold = 1
    const hourThreshold = 120

    const useHours = values.some(v => v >= hourThreshold)
    const displayValues = useHours ? values.map(v => (v / 60).toFixed(2)) : values
    const unitLabel = useHours ? 'Hours' : 'Minutes'

    const allTooSmall = values.length === 0 || displayValues.every(v => v < minThreshold)
    const messageDiv = document.getElementById('chart-message')

    if (allTooSmall) {
        if (messageDiv) {
            messageDiv.textContent = "No data to display yet; please spend at least 1 minute on a website to see your data"
            messageDiv.style.display = 'block'
            canvas.style.display = 'none'
            clearButton.style.display = 'none'
        }
        if (chartInstance) {
            chartInstance.destroy()
            chartInstance = null
        }
    } else {
        if (messageDiv) {
            messageDiv.style.display = 'none'
            canvas.style.display = 'block'
            clearButton.style.display = 'block'
        }
    }
    const data = {
        labels: Object.keys(dict),
        datasets: [{
        label: unitLabel,
        data: displayValues,
        backgroundColor: [
            '#FF6384', // pink/red
            '#36A2EB', // blue
            '#FFCE56', // yellow
            '#4BC0C0', // teal
            '#9966FF', // purple
            '#FF9F40', // orange
            '#C9CBCF', // gray
            '#2ecc40', // green
            '#e74c3c', // bright red
            '#f1c40f', // gold
            '#1abc9c', // turquoise
            '#8e44ad', // deep purple
            '#34495e', // dark blue-gray
            '#e67e22', // pumpkin orange
            '#7f8c8d', // dark gray
            '#00b894', // vivid green
            '#fdcb6e', // light orange
            '#d35400', // dark orange
            '#6c5ce7', // indigo
            '#00cec9', // cyan
            '#b2bec3', // light gray
            '#fab1a0', // light peach
            '#636e72', // charcoal
            '#81ecec', // light teal
            '#ffeaa7', // pale yellow
            '#a29bfe', // light purple
            '#00bcd4', // blue cyan
            '#ff7675', // light red
            '#55efc4', // mint
            '#fd79a8'  // hot pink
        ],
        }]
    }

    if (chartInstance) {
        chartInstance.destroy()
    }

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data, 
        options: { responsive: true }
    })
}

document.addEventListener('DOMContentLoaded', () => {

    /* commented out for now, but can be used for development purposes
    devDelete("website-times").then(() => {
        console.log("Dev delete completed")
    })
    */

    const todayButton = document.getElementById('today-button')
    const thisWeekButton = document.getElementById('this-week-button')
    const thisMonthButton = document.getElementById('this-year-button')
    const allTimeButton = document.getElementById('all-time-button')

    if (!todayButton || !thisWeekButton || !thisMonthButton || !allTimeButton) {
        console.error("One or more filter buttons not found.")
        return
    }

    const clearButton = document.getElementById('clear-data-button')

    let websitesCache = [];
    let websiteTimeDictCache = {};
    retrieveUserId().then((userId) => {
        onWebsiteTimesUpdated(userId, (websiteTimeDict, websites) => {
            websiteTimeDictCache = websiteTimeDict
            websitesCache = websites
            updateChart(websiteTimeDict)
        })
    })

    todayButton.addEventListener('click', () => {
        updateChart(buildChartData(websitesCache, 'today'))
    })
    thisWeekButton.addEventListener('click', () => {
        updateChart(buildChartData(websitesCache, 'this-week'))
    })
    thisMonthButton.addEventListener('click', () => {
        updateChart(buildChartData(websitesCache, 'this-year'))
    })
    allTimeButton.addEventListener('click', () => {
        updateChart(buildChartData(websitesCache, 'all-time'))
    })

    // clear data (reset database from firestore)
    clearButton.addEventListener('click', async () => {
        if (confirm("Are you sure you want to clear all data (this includes data not displayed in this view)? This action cannot be undone.")) {
        await clearCollection("website-times")
        console.log("Data cleared")
        }
    })
})

console.log("Chart.js initialized")