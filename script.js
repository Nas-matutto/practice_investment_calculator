document.addEventListener('DOMContentLoaded', function() {
    // Initialize chart
    let ctx = document.getElementById('investmentChart').getContext('2d');
    let investmentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Amount Invested',
                    backgroundColor: '#4a90e2',
                    data: []
                },
                {
                    label: 'Interest Earned',
                    backgroundColor: '#66c29a',
                    data: []
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Years'
                    }
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Amount ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += '$' + context.raw.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            });
                            return label;
                        }
                    }
                }
            }
        }
    });
    
    // Function to get contribution changes
    function getContributionChanges() {
        const changes = [];
        const changeElements = document.querySelectorAll('.contribution-change');
        
        changeElements.forEach(element => {
            const yearInput = element.querySelector('.changeYear');
            const amountInput = element.querySelector('.changeAmount');
            
            if (yearInput && amountInput) {
                const year = parseInt(yearInput.value) || 0;
                const amount = parseFloat(amountInput.value) || 0;
                
                if (year > 0 && amount >= 0) {
                    changes.push({ year, amount });
                }
            }
        });
        
        // Sort changes by year (ascending)
        return changes.sort((a, b) => a.year - b.year);
    }
    
    // Function to calculate investment returns
    function calculateReturns() {
        const initialInvestment = parseFloat(document.getElementById('initialInvestment').value) || 0;
        const baseMonthlyContribution = parseFloat(document.getElementById('monthlyContribution').value) || 0;
        const annualGrowthRate = parseFloat(document.getElementById('annualGrowth').value) || 0;
        const years = parseInt(document.getElementById('years').value) || 0;
        
        const monthlyRate = annualGrowthRate / 100 / 12;
        const totalMonths = years * 12;
        
        let invested = initialInvestment;
        let currentValue = initialInvestment;
        
        // Get contribution changes
        const contributionChanges = getContributionChanges();
        
        const yearlyData = [];
        yearlyData.push({
            year: 0,
            invested: initialInvestment,
            value: initialInvestment,
            interest: 0,
            monthlyContribution: baseMonthlyContribution
        });
        
        // Calculate month by month
        for (let month = 1; month <= totalMonths; month++) {
            const currentYear = Math.ceil(month / 12);
            
            // Determine the monthly contribution based on changes
            let monthlyContribution = baseMonthlyContribution;
            
            for (const change of contributionChanges) {
                if (currentYear >= change.year) {
                    monthlyContribution = change.amount;
                } else {
                    break;
                }
            }
            
            // Add monthly contribution
            invested += monthlyContribution;
            
            // Add interest for the month
            currentValue = (currentValue + monthlyContribution) * (1 + monthlyRate);
            
            // Store yearly data
            if (month % 12 === 0) {
                const year = month / 12;
                yearlyData.push({
                    year: year,
                    invested: invested,
                    value: currentValue,
                    interest: currentValue - invested,
                    monthlyContribution: monthlyContribution
                });
            }
        }
        
        // Update results
        document.getElementById('totalInvested').textContent = formatCurrency(invested);
        document.getElementById('totalValue').textContent = formatCurrency(currentValue);
        document.getElementById('totalInterest').textContent = formatCurrency(currentValue - invested);
        
        // Update chart
        updateChart(yearlyData);
    }
    
    // Format number as currency
    function formatCurrency(amount) {
        return '$' + amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
    // Update the chart with new data
    function updateChart(yearlyData) {
        const years = yearlyData.map(data => 'Year ' + data.year);
        const invested = yearlyData.map(data => data.invested);
        const interest = yearlyData.map(data => data.interest);
        
        investmentChart.data.labels = years;
        investmentChart.data.datasets[0].data = invested;
        investmentChart.data.datasets[1].data = interest;
        investmentChart.update();
    }
    
    // Create a contribution change element
    function createContributionChange(year, amount) {
        const container = document.querySelector('.contribution-changes-container');
        const newChange = document.createElement('div');
        newChange.className = 'contribution-change';
        
        newChange.innerHTML = `
            <div class="input-field">
                <label for="changeYear">Starting Year</label>
                <input type="number" class="changeYear" min="1" value="${year}">
            </div>
            <div class="input-field">
                <label for="changeAmount">New Monthly Amount ($)</label>
                <input type="number" class="changeAmount" min="0" value="${amount}">
            </div>
            <button class="remove-change">×</button>
        `;
        
        container.appendChild(newChange);
        
        // Add event listener to remove button
        newChange.querySelector('.remove-change').addEventListener('click', function() {
            container.removeChild(newChange);
            calculateReturns();
        });
        
        // Add event listeners to inputs
        newChange.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', calculateReturns);
        });
        
        return newChange;
    }
    
    // Toggle advanced options
    document.getElementById('toggleAdvanced').addEventListener('click', function() {
        const contributionChanges = document.querySelector('.contribution-changes');
        contributionChanges.style.display = 'block';
        
        // Add a first contribution change if container is empty
        const container = document.querySelector('.contribution-changes-container');
        if (container.children.length === 0) {
            const baseAmount = parseFloat(document.getElementById('monthlyContribution').value) || 0;
            const suggestedAmount = Math.round(baseAmount * 1.5); // 50% increase as suggestion
            createContributionChange(5, suggestedAmount);
        }
    });
    
    // Close advanced options
    document.getElementById('closeAdvanced').addEventListener('click', function() {
        const contributionChanges = document.querySelector('.contribution-changes');
        contributionChanges.style.display = 'none';
    });
    
    // Add new contribution change
    document.getElementById('addChange').addEventListener('click', function() {
        const container = document.querySelector('.contribution-changes-container');
        let suggestedYear = 5;
        let suggestedAmount = parseFloat(document.getElementById('monthlyContribution').value) * 2 || 200;
        
        if (container.children.length > 0) {
            const lastChange = container.lastElementChild;
            const lastYearInput = lastChange.querySelector('.changeYear');
            const lastAmountInput = lastChange.querySelector('.changeAmount');
            
            if (lastYearInput && lastAmountInput) {
                suggestedYear = parseInt(lastYearInput.value) + 5 || 5;
                suggestedAmount = parseFloat(lastAmountInput.value) * 1.5 || suggestedAmount;
            }
        }
        
        createContributionChange(suggestedYear, Math.round(suggestedAmount));
        calculateReturns();
    });
    
    // Event listener for calculate button
    document.getElementById('calculate').addEventListener('click', calculateReturns);
    
    // Event listeners for input changes
    document.querySelectorAll('#initialInvestment, #monthlyContribution, #annualGrowth, #years').forEach(input => {
        input.addEventListener('change', calculateReturns);
        input.addEventListener('input', calculateReturns);
    });
    
    // Calculate on page load with default values
    calculateReturns();

});

// Add Portfolio button functionality
document.getElementById('addPortfolio').addEventListener('click', async function() {
    // Check if user is logged in first
    const user = window.firebaseAuth?.currentUser;
    
    if (!user) {
        // Just show login modal 
        document.getElementById("auth-modal").style.display = "flex";
        return;
    }
    
    try {
        // Generate PDF 
        await generateInvestmentPlanDocument();
        
        // Save portfolio data to Firebase
        const portfolioData = {
            initialInvestment: parseFloat(document.getElementById('initialInvestment').value) || 0,
            monthlyContribution: parseFloat(document.getElementById('monthlyContribution').value) || 0,
            annualGrowth: parseFloat(document.getElementById('annualGrowth').value) || 0,
            years: parseInt(document.getElementById('years').value) || 0,
            totalValue: document.getElementById('totalValue').textContent,
            totalInvested: document.getElementById('totalInvested').textContent,
            totalInterest: document.getElementById('totalInterest').textContent,
            userId: user.uid,
            createdAt: new Date().toISOString()
        };
        
        const docRef = await window.firebaseAddDoc(
            window.firebaseCollection(window.firebaseDb, "portfolios"), 
            portfolioData
        );
        
        console.log("Portfolio saved with ID: ", docRef.id);
        
        // Show success notification
        showNotification('Investment plan downloaded successfully!', 'success');
    } catch (error) {
        console.error("Error saving portfolio: ", error);
        showNotification("Error saving portfolio: " + error.message, 'error');
    }
});

     // Function to generate detailed investment plan PDF
     function generateInvestmentPlanDocument() {
        return new Promise((resolve, reject) => {
            // Check if user is logged in
            const user = window.firebaseAuth?.currentUser;
            
            if (!user) {
                document.getElementById("auth-modal").style.display = "flex";
                reject(new Error("User not logged in"));
                return;
            }
    
            // Collect calculation data
            const initialInvestment = parseFloat(document.getElementById('initialInvestment').value) || 0;
            const baseMonthlyContribution = parseFloat(document.getElementById('monthlyContribution').value) || 0;
            const annualGrowth = parseFloat(document.getElementById('annualGrowth').value) || 0;
            const years = parseInt(document.getElementById('years').value) || 0;
            
            // Get contribution changes
            const contributionChanges = (() => {
                const changes = [];
                const changeElements = document.querySelectorAll('.contribution-change');
                
                changeElements.forEach(element => {
                    const yearInput = element.querySelector('.changeYear');
                    const amountInput = element.querySelector('.changeAmount');
                    
                    if (yearInput && amountInput) {
                        const year = parseInt(yearInput.value) || 0;
                        const amount = parseFloat(amountInput.value) || 0;
                        
                        if (year > 0) {
                            changes.push({ year, amount });
                        }
                    }
                });
                
                return changes.sort((a, b) => a.year - b.year);
            })();
            
            // Precise calculation of totals
            const totalInvested = initialInvestment + (baseMonthlyContribution * years * 12);
            const totalValue = parseFloat(document.getElementById('totalValue').textContent.replace(/[^0-9.-]+/g,""));
            const totalInterest = totalValue - totalInvested;
    
            // Use global jsPDF and html2canvas
            const { jsPDF } = window.jspdf;
            
            // Capture the chart as an image
            html2canvas(document.getElementById('investmentChart')).then(canvas => {
                const doc = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });
    
                // Set color scheme
                const primaryColor = '#2c3e50';  // Dark blue-gray
                const secondaryColor = '#3498db';  // Bright blue
    
                // Page margins
                const pageWidth = doc.internal.pageSize.width;
                const pageHeight = doc.internal.pageSize.height;
                const margin = 15;
    
                // Title
                doc.setTextColor(primaryColor);
                doc.setFontSize(22);
                doc.text('Investment Plan Summary', pageWidth / 2, 25, { align: 'center' });
    
                // Investment Details Section
                doc.setFontSize(14);
                doc.setTextColor(secondaryColor);
                doc.text('Investment Overview', margin, 45);
                
                doc.setTextColor(primaryColor);
                doc.setFontSize(11);
                let yPosition = 55;
                
                const details = [
                    `Initial Investment: $${initialInvestment.toLocaleString()}`,
                    `Base Monthly Contribution: $${baseMonthlyContribution.toLocaleString()}`,
                    `Annual Growth Rate: ${annualGrowth}%`,
                    `Investment Period: ${years} years`
                ];
                
                details.forEach(detail => {
                    doc.text(detail, margin, yPosition);
                    yPosition += 8;
                });
    
                // Contribution Changes Section
                if (contributionChanges.length > 0) {
                    doc.setTextColor(secondaryColor);
                    doc.setFontSize(14);
                    doc.text('Contribution Changes', margin, yPosition + 10);
                    
                    doc.setTextColor(primaryColor);
                    doc.setFontSize(11);
                    yPosition += 20;
                    
                    contributionChanges.forEach(change => {
                        doc.text(`Year ${change.year}: Monthly Contribution changes to $${change.amount.toLocaleString()}`, margin, yPosition);
                        yPosition += 8;
                    });
                }
    
                // Financial Summary Section
                doc.setTextColor(secondaryColor);
                doc.setFontSize(14);
                doc.text('Financial Summary', margin, yPosition + 15);
                
                doc.setTextColor(primaryColor);
                doc.setFontSize(11);
                yPosition += 25;
                
                const summary = [
                    `Total Amount Invested: $${totalInvested.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
                    `Total Portfolio Value: $${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
                    `Total Interest Earned: $${totalInterest.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                ];
                
                summary.forEach(detail => {
                    doc.text(detail, margin, yPosition);
                    yPosition += 8;
                });
    
                // Add chart image
                const imgData = canvas.toDataURL('image/png');
                const imgProps = doc.getImageProperties(imgData);
                const pdfWidth = pageWidth - (2 * margin);
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                
                // Add chart on the same page
                doc.addImage(imgData, 'PNG', margin, yPosition + 15, pdfWidth, pdfHeight);
    
                // Save the document
                doc.save('investment_plan.pdf');
    
                // Resolve the promise
                resolve();
            }).catch(error => {
                console.error('Error generating PDF:', error);
                showNotification('Error downloading investment plan', 'error');
                reject(error);
            });
        });
    }


        // Function to generate CSV content
    function generateInvestmentPlanCSV() {
    const initialInvestment = parseFloat(document.getElementById('initialInvestment').value) || 0;
    const monthlyContribution = parseFloat(document.getElementById('monthlyContribution').value) || 0;
    const annualGrowth = parseFloat(document.getElementById('annualGrowth').value) || 0;
    const years = parseInt(document.getElementById('years').value) || 0;
    
    const totalInvested = document.getElementById('totalInvested').textContent;
    const totalValue = document.getElementById('totalValue').textContent;
    const totalInterest = document.getElementById('totalInterest').textContent;
    
       // Create CSV content
    let csvContent = "Investment Plan Details\n\n";
    csvContent += "Initial Investment,$" + initialInvestment.toLocaleString() + "\n";
    csvContent += "Monthly Contribution,$" + monthlyContribution.toLocaleString() + "\n";
    csvContent += "Annual Growth Rate," + annualGrowth + "%\n";
    csvContent += "Investment Period," + years + " years\n\n";
    
    csvContent += "Summary\n";
    csvContent += "Total Amount Invested," + totalInvested + "\n";
    csvContent += "Total Portfolio Value," + totalValue + "\n";
    csvContent += "Total Interest Earned," + totalInterest + "\n";
    
        // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
        // Create a download link
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "investment_plan.csv");
    
       // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

    // Ensure html2canvas is loaded
function loadHTML2Canvas() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Load dependencies on page load
document.addEventListener('DOMContentLoaded', () => {
    // Preload html2canvas
    loadHTML2Canvas();
});