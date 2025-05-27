import { Chart, DoughnutController, ArcElement, Tooltip, Legend, Title } from 'chart.js'
import { onWebsiteTimesUpdated, clearCollection } from './firestore';

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

function updateChart(dict) {
    const minThreshold = 1

    const allTooSmall = values.length === 0 || values.every(v => v < minThreshold)
    const messageDiv = document.getElementById('chart-message')

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
        labels: Object.keys(dict),
        datasets: [{
        label: 'Minutes',
        data: Object.values(dict),
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
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('acquisitions')
    
    if (!canvas) {
        console.error("Canvas element with id 'acquisitions' not found.")
        return
    }

    const todayButton = document.getElementById('today-button')
    const thisWeekButton = document.getElementById('this-week-button')
    const thisMonthButton = document.getElementById('this-year-button')
    const allTimeButton = document.getElementById('all-time-button')

    if (!todayButton || !thisWeekButton || !thisMonthButton || !allTimeButton) {
        console.error("One or more filter buttons not found.")
        return
    }

    const ctx = canvas.getContext('2d')
    let chartInstance = null
    const clearButton = document.getElementById('clear-data-button')

    onWebsiteTimesUpdated((websiteTimeDict, websites) => {
        updateChart(websiteTimeDict)

        todayButton.addEventListener('click', () => {
            updateChart(buildChartData(websites, 'today'))
        })

        thisWeekButton.addEventListener('click', () => {
            updateChart(buildChartData(websites, 'this-week'))
        })

        thisMonthButton.addEventListener('click', () => {
            updateChart(buildChartData(websites, 'this-year'))
        })

        allTimeButton.addEventListener('click', () => {
            updateChart(buildChartData(websites, 'all-time'))
        })
    })

    // clear data (reset database from firestore)
    clearButton.addEventListener('click', async () => {
        if (confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
        await clearCollection("website-times")
        console.log("Data cleared")
        }
    })
})

console.log("Chart.js initialized")