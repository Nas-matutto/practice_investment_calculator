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
        // Just show login modal without the alert
        document.getElementById("auth-modal").style.display = "flex";
        return;
    }
    
    // Get current investment data
    const portfolioData = {
        initialInvestment: parseFloat(document.getElementById('initialInvestment').value) || 0,
        monthlyContribution: parseFloat(document.getElementById('monthlyContribution').value) || 0,
        annualGrowth: parseFloat(document.getElementById('annualGrowth').value) || 0,
        years: parseInt(document.getElementById('years').value) || 0,
        totalValue: document.getElementById('totalValue').textContent,
        totalInvested: document.getElementById('totalInvested').textContent,
        totalInterest: document.getElementById('totalInterest').textContent,
        userId: user.uid,  // Make sure userId is set correctly
        createdAt: new Date().toISOString()
    };
    
    try {
        // Save to Firebase using the global functions
        const docRef = await window.firebaseAddDoc(
            window.firebaseCollection(window.firebaseDb, "portfolios"), 
            portfolioData
        );
        
        console.log("Portfolio saved with ID: ", docRef.id);
        
        // Store locally too for the portfolio page
        localStorage.setItem('investmentCalculatorState', JSON.stringify(portfolioData));
        
        // Navigate to portfolio page
        window.location.href = 'portfolio.html';
    } catch (error) {
        console.error("Error saving portfolio: ", error);
        alert("Error saving portfolio: " + error.message);
    }
});