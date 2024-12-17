const userId = localStorage.getItem('userId');
console.log(userId);

// Fetch data from the server
async function fetchRespondentsData() {
    try {
        const response = await fetch('/api/users/respondents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }
        const { data } = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch respondents data:', error);
        return [];
    }
}

// Compute totals per course
function computeTotals(data) {
    const courseTotals = {};

    data.forEach(item => {
        const { course, submitted_count } = item;
        courseTotals[course] = (courseTotals[course] || 0) + submitted_count;
    });

    return courseTotals;
}

let pieChartInstance; // Declare a global variable to store the pie chart instance

// Update the charts function to store the chart instance
async function updateCharts() {
    const data = await fetchRespondentsData();
    const courseTotals = computeTotals(data);

    // Prepare data for charts
    const labels = Object.keys(courseTotals); // Dynamically fetched course names
    const submittedCounts = Object.values(courseTotals); // Corresponding totals

    // Slice to get only the first 5 labels and counts
    const maxLabels = 5;
    const slicedLabels = labels.slice(0, maxLabels);
    const slicedCounts = submittedCounts.slice(0, maxLabels);

    // Pie chart configuration
    const pieConfig = {
        type: 'pie',
        data: {
            labels: slicedLabels,
            datasets: [{
                label: 'Respondents per Course',
                data: slicedCounts,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                ],
                borderWidth: 1,
            }],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Percentage of Respondents per Course' },
            },
        },
    };

    // Create or update the Pie chart
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    pieChartInstance = new Chart(pieCtx, pieConfig);  // Store the chart instance globally

    // Bar chart configuration
    const barConfig = {
        type: 'bar',
        data: {
            labels: slicedLabels,
            datasets: [{
                label: 'Respondents per Course',
                data: slicedCounts,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                ],
                borderWidth: 1,
            }],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Respondents per Course' },
            },
        },
    };

    // Render Bar Chart
    const barCtx = document.getElementById('barChart').getContext('2d');
    new Chart(barCtx, barConfig);
}

// Function to download CSV based on chart data
function downloadCSV() {
    if (!pieChartInstance) {
        console.error('Pie chart instance is not available');
        return;
    }

    const pieChartData = pieChartInstance.data; // Use the stored pie chart instance's data

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Course,Respondents\n";

    // Loop through the chart data and add each item to the CSV
    pieChartData.labels.forEach((label, index) => {
        const value = pieChartData.datasets[0].data[index];
        csvContent += `${label},${value}\n`;
    });

    // Create a Blob from the CSV content and trigger the download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "survey_results.csv");
    link.click();
}

// Attach the downloadCSV function to the button
document.getElementById('downloadCSVButton').addEventListener('click', downloadCSV);

// Initialize charts when the document is ready
document.addEventListener('DOMContentLoaded', updateCharts);

// Function to download PDF (as you previously implemented)
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Capture the pie chart image
    const pieCanvas = document.getElementById("pieChart");
    const pieImgData = pieCanvas.toDataURL("image/png");

    // Get the aspect ratio of the pie chart
    const pieWidth = pieCanvas.width;
    const pieHeight = pieCanvas.height;
    const pieAspectRatio = pieWidth / pieHeight;

    // Calculate the PDF width and height based on aspect ratio
    const pdfWidth = 180; // A reasonable width for the PDF page
    const pdfHeight = pdfWidth / pieAspectRatio; // Keep the aspect ratio consistent

    doc.addImage(pieImgData, 'PNG', 10, 10, pdfWidth, pdfHeight); // Adjusted size

    // Add some space between the charts
    doc.addPage();

    // Capture the bar chart
    const barCanvas = document.getElementById("barChart");
    const barImgData = barCanvas.toDataURL("image/png");

    // Get the aspect ratio of the bar chart
    const barWidth = barCanvas.width;
    const barHeight = barCanvas.height;
    const barAspectRatio = barWidth / barHeight;

    // Calculate the PDF width and height for the bar chart
    const barPdfHeight = pdfWidth / barAspectRatio; // Keep the aspect ratio consistent

    doc.addImage(barImgData, 'PNG', 10, 10, pdfWidth, barPdfHeight); // Adjusted size

    // Save the PDF
    doc.save("survey_results.pdf");
}

// Attach the downloadPDF function to the PDF download button
document.getElementById('downloadPDFButton').addEventListener('click', downloadPDF);

// Handle logout button click
const logoutButton = document.getElementById('logoutButton');
if (logoutButton) { // Ensure the button exists
    logoutButton.addEventListener('click', () => {
        window.location.href = '../html/login.html';
    });
}
