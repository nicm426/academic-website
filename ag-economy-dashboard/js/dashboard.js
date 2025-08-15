// Agricultural Economy Dashboard - Enhanced JavaScript
// Author: William N. McWilliams

// Global data storage
let dashboardData = {
    districtSurveys: null,
    lendingTerms: null,
    callReports: null,
    allSeries: {},  // Combined series from all datasets
    selectedSeries: [],  // Currently selected series for plotting
    currentOverviewSeries: null  // Track which overview metric is displayed
};

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Initializing dashboard...');
    await loadAllData();
    initializeEventListeners();
    updateDataExplorer();
    createInitialCharts();
    updateOverviewMetrics();
});

// Load all JSON data files
async function loadAllData() {
    try {
        // Load district surveys
        const districtResponse = await fetch('data/district-surveys.json');
        dashboardData.districtSurveys = await districtResponse.json();
        console.log('District Surveys loaded:', Object.keys(dashboardData.districtSurveys.series).length, 'series');
        
        // Load lending terms
        const lendingResponse = await fetch('data/lending-terms.json');
        dashboardData.lendingTerms = await lendingResponse.json();
        console.log('Lending Terms loaded:', Object.keys(dashboardData.lendingTerms.series).length, 'series');
        
        // Load call reports
        const callResponse = await fetch('data/call-reports.json');
        dashboardData.callReports = await callResponse.json();
        console.log('Call Reports loaded:', Object.keys(dashboardData.callReports.series).length, 'series');
        
        // Combine all series for cross-dataset analysis
        combineAllSeries();
        
        // Update metadata display
        updateMetadataDisplay();
        
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Error loading data files. Please check the console for details.');
    }
}

// Combine all series from different datasets
function combineAllSeries() {
    // Add district survey series
    if (dashboardData.districtSurveys) {
        Object.keys(dashboardData.districtSurveys.series).forEach(key => {
            dashboardData.allSeries[`DS_${key}`] = {
                data: dashboardData.districtSurveys.series[key],
                description: dashboardData.districtSurveys.descriptions[key],
                source: 'District Surveys',
                id: key
            };
        });
    }
    
    // Add lending terms series
    if (dashboardData.lendingTerms) {
        Object.keys(dashboardData.lendingTerms.series).forEach(key => {
            dashboardData.allSeries[`LT_${key}`] = {
                data: dashboardData.lendingTerms.series[key],
                description: dashboardData.lendingTerms.descriptions[key],
                source: 'Terms of Lending',
                id: key
            };
        });
    }
    
    // Add call report series
    if (dashboardData.callReports) {
        Object.keys(dashboardData.callReports.series).forEach(key => {
            dashboardData.allSeries[`CR_${key}`] = {
                data: dashboardData.callReports.series[key],
                description: dashboardData.callReports.descriptions[key],
                source: 'Call Reports',
                id: key
            };
        });
    }
    
    console.log('Combined series total:', Object.keys(dashboardData.allSeries).length);
}

// Update metadata display
function updateMetadataDisplay() {
    const lastUpdated = document.querySelector('.last-updated');
    if (lastUpdated && dashboardData.callReports) {
        // Get the latest date from the data
        let latestDate = '2025-Q2';
        if (dashboardData.callReports.metadata) {
            latestDate = dashboardData.callReports.metadata.updated || '2025-Q2';
        }
        lastUpdated.textContent = `Data Updated: ${latestDate}`;
    }
}

// Update overview metrics with real data
function updateOverviewMetrics() {
    if (!dashboardData.callReports || !dashboardData.districtSurveys || !dashboardData.lendingTerms) return;
    
    // Total Agricultural Loans
    const totalLoansKey = 'A001';  // Based on your data structure
    if (dashboardData.callReports.series[totalLoansKey]) {
        const series = dashboardData.callReports.series[totalLoansKey];
        const latestValue = series[series.length - 1]?.value || 0;
        document.getElementById('totalLoansMetric').textContent = `$${latestValue.toFixed(1)}B`;
        
        // Make it clickable
        document.querySelector('#totalLoansMetric').parentElement.style.cursor = 'pointer';
        document.querySelector('#totalLoansMetric').parentElement.onclick = () => {
            showOverviewSeries('totalLoans', totalLoansKey, 'Call Reports');
        };
    }
    
    // Average Interest Rate (from District Surveys)
    const interestRateKeys = Object.keys(dashboardData.districtSurveys.series).filter(key => 
        dashboardData.districtSurveys.descriptions[key].description.includes('Average Fixed Interest Rate on Operating')
    );
    if (interestRateKeys.length > 0) {
        const series = dashboardData.districtSurveys.series[interestRateKeys[0]];
        const latestValue = series[series.length - 1]?.value || 0;
        document.getElementById('avgRateMetric').textContent = `${latestValue.toFixed(2)}%`;
        
        document.querySelector('#avgRateMetric').parentElement.style.cursor = 'pointer';
        document.querySelector('#avgRateMetric').parentElement.onclick = () => {
            showOverviewSeries('interestRate', interestRateKeys[0], 'District Surveys');
        };
    }
    
    // Farmland Value Change
    const farmlandKeys = Object.keys(dashboardData.districtSurveys.series).filter(key => 
        dashboardData.districtSurveys.descriptions[key].description.includes('Annual Percent Change in Nonirrigated Farmland')
    );
    if (farmlandKeys.length > 0) {
        const series = dashboardData.districtSurveys.series[farmlandKeys[0]];
        const latestValue = series[series.length - 1]?.value || 0;
        const sign = latestValue >= 0 ? '+' : '';
        document.getElementById('farmlandMetric').textContent = `${sign}${latestValue.toFixed(1)}%`;
        
        document.querySelector('#farmlandMetric').parentElement.style.cursor = 'pointer';
        document.querySelector('#farmlandMetric').parentElement.onclick = () => {
            showOverviewSeries('farmland', farmlandKeys[0], 'District Surveys');
        };
    }
    
    // Delinquency Rate
    const delinquencyKeys = Object.keys(dashboardData.callReports.series).filter(key => 
        dashboardData.callReports.descriptions[key].statistic.includes('90 days or more')
    );
    if (delinquencyKeys.length > 0) {
        const series = dashboardData.callReports.series[delinquencyKeys[0]];
        const latestValue = series[series.length - 1]?.value || 0;
        document.getElementById('delinquencyMetric').textContent = `${latestValue.toFixed(2)}%`;
        
        document.querySelector('#delinquencyMetric').parentElement.style.cursor = 'pointer';
        document.querySelector('#delinquencyMetric').parentElement.onclick = () => {
            showOverviewSeries('delinquency', delinquencyKeys[0], 'Call Reports');
        };
    }
}

// Show overview series when metric card is clicked
function showOverviewSeries(metricType, seriesKey, source) {
    let seriesData, description, title, yAxisTitle, unit;
    
    if (source === 'Call Reports') {
        seriesData = dashboardData.callReports.series[seriesKey];
        description = dashboardData.callReports.descriptions[seriesKey];
        title = description.statistic;
        unit = description.unit;
    } else if (source === 'District Surveys') {
        seriesData = dashboardData.districtSurveys.series[seriesKey];
        description = dashboardData.districtSurveys.descriptions[seriesKey];
        title = description.description;
        unit = description.unit;
    } else {
        seriesData = dashboardData.lendingTerms.series[seriesKey];
        description = dashboardData.lendingTerms.descriptions[seriesKey];
        title = description.statistic;
        unit = description.unit;
    }
    
    const trace = {
        x: seriesData.map(d => d.date),
        y: seriesData.map(d => d.value),
        type: 'scatter',
        mode: 'lines',
        name: title,
        line: { color: '#667eea', width: 3 }
    };
    
    const layout = {
        title: title,
        xaxis: { 
            title: 'Date',
            rangeslider: { visible: true },
            type: 'category'
        },
        yaxis: { 
            title: unit || 'Value'
        },
        hovermode: 'x unified',
        margin: { t: 50, r: 50, b: 100, l: 70 },
        annotations: [{
            xref: 'paper',
            yref: 'paper',
            x: 0.01,
            y: 0.01,
            xanchor: 'left',
            yanchor: 'bottom',
            text: `Data: Federal Reserve ${source} | Visual: William McWilliams`,
            showarrow: false,
            font: { size: 9, color: 'rgba(150,150,150,0.8)' },
            bgcolor: 'rgba(255,255,255,0.8)',
            borderpad: 2
        }]
    };
    
    Plotly.newPlot('overviewChart', [trace], layout, {responsive: true});
}

// Initialize event listeners
function initializeEventListeners() {
    // District selector for regional analysis
    const districtSelector = document.getElementById('districtSelector');
    if (districtSelector) {
        districtSelector.addEventListener('change', () => {
            updateRegionalChart();
            createDistrictMap(); // Update map when dropdown changes
        });
    }
    
    // Metric selector for regional analysis
    const metricSelector = document.getElementById('regionalMetricSelector');
    if (metricSelector) {
        metricSelector.addEventListener('change', updateRegionalChart);
    }
    
    // Search functionality
    const searchInput = document.getElementById('seriesSearch');
    if (searchInput) {
        searchInput.addEventListener('input', filterSeriesList);
    }
    
    // Statistics display toggle
    const statsToggle = document.getElementById('showStatistics');
    if (statsToggle) {
        statsToggle.addEventListener('change', (e) => {
            const statsSection = document.getElementById('statisticsSection');
            if (statsSection) {
                statsSection.style.display = e.target.checked ? 'block' : 'none';
                if (e.target.checked && dashboardData.selectedSeries.length > 0) {
                    updateStatisticsTable();
                }
            }
        });
    }
    
    // Data dictionary toggle
    const dictToggle = document.getElementById('showDataDictionary');
    if (dictToggle) {
        dictToggle.addEventListener('change', (e) => {
            const dictSection = document.getElementById('dataDictionarySection');
            if (dictSection) {
                dictSection.style.display = e.target.checked ? 'block' : 'none';
                if (e.target.checked && dashboardData.selectedSeries.length > 0) {
                    updateDataDictionary();
                }
            }
        });
    }
}

// Create initial charts with real data
function createInitialCharts() {
    createOverviewChart();
    createDistrictMap();  // Add the map
    updateRegionalChart();
    createCreditConditionsCharts();
}

// Create clickable district map
function createDistrictMap() {
    // Federal Reserve district boundaries (simplified)
    const districtStates = {
        'Chicago': ['IL', 'IN', 'IA', 'MI', 'WI'],
        'Dallas': ['TX', 'NM', 'LA'],
        'Kansas City': ['KS', 'MO', 'NE', 'OK', 'WY', 'CO', 'NM'],
        'Minneapolis': ['MN', 'MT', 'ND', 'SD', 'WI', 'MI'],
        'Richmond': ['MD', 'VA', 'NC', 'SC', 'WV', 'DC'],
        'San Francisco': ['CA', 'AK', 'AZ', 'HI', 'ID', 'NV', 'OR', 'UT', 'WA'],
        'St. Louis': ['MO', 'AR', 'MS', 'TN', 'KY', 'IL', 'IN']
    };
    
    // Districts that have data in our dataset
    const availableDistricts = ['Chicago', 'Dallas', 'Kansas City', 'Minneapolis', 'Richmond', 'San Francisco', 'St. Louis'];
    
    // Get currently selected districts
    const districtSelector = document.getElementById('districtSelector');
    const selectedCodes = Array.from(districtSelector.selectedOptions).map(opt => opt.value);
    const districtCodeMap = {
        'CHI': 'Chicago',
        'DAL': 'Dallas',
        'KC': 'Kansas City',
        'MIN': 'Minneapolis',
        'RIC': 'Richmond',
        'SF': 'San Francisco',
        'STL': 'St. Louis'
    };
    const selectedDistricts = new Set(selectedCodes.map(code => districtCodeMap[code]));
    
    // Create choropleth layer
    const choroplethTrace = {
        type: 'choropleth',
        locationmode: 'USA-states',
        locations: ['IL', 'IN', 'IA', 'MI', 'WI', 'TX', 'NM', 'LA', 'KS', 'MO', 'NE', 'OK', 'WY', 'CO',
                   'MN', 'MT', 'ND', 'SD', 'MD', 'VA', 'NC', 'SC', 'WV', 'DC', 'CA', 'AK', 'AZ', 
                   'HI', 'ID', 'NV', 'OR', 'UT', 'WA', 'AR', 'MS', 'TN', 'KY'],
        z: [
            selectedDistricts.has('Chicago') ? 2 : 1, selectedDistricts.has('Chicago') ? 2 : 1, 
            selectedDistricts.has('Chicago') ? 2 : 1, selectedDistricts.has('Chicago') ? 2 : 1, 
            selectedDistricts.has('Chicago') ? 2 : 1,
            selectedDistricts.has('Dallas') ? 2 : 1, selectedDistricts.has('Dallas') ? 2 : 1, 
            selectedDistricts.has('Dallas') ? 2 : 1,
            selectedDistricts.has('Kansas City') ? 2 : 1, selectedDistricts.has('Kansas City') ? 2 : 1,
            selectedDistricts.has('Kansas City') ? 2 : 1, selectedDistricts.has('Kansas City') ? 2 : 1,
            selectedDistricts.has('Kansas City') ? 2 : 1, selectedDistricts.has('Kansas City') ? 2 : 1,
            selectedDistricts.has('Minneapolis') ? 2 : 1, selectedDistricts.has('Minneapolis') ? 2 : 1,
            selectedDistricts.has('Minneapolis') ? 2 : 1, selectedDistricts.has('Minneapolis') ? 2 : 1,
            selectedDistricts.has('Richmond') ? 2 : 1, selectedDistricts.has('Richmond') ? 2 : 1,
            selectedDistricts.has('Richmond') ? 2 : 1, selectedDistricts.has('Richmond') ? 2 : 1,
            selectedDistricts.has('Richmond') ? 2 : 1, selectedDistricts.has('Richmond') ? 2 : 1,
            selectedDistricts.has('San Francisco') ? 2 : 1, selectedDistricts.has('San Francisco') ? 2 : 1,
            selectedDistricts.has('San Francisco') ? 2 : 1, selectedDistricts.has('San Francisco') ? 2 : 1,
            selectedDistricts.has('San Francisco') ? 2 : 1, selectedDistricts.has('San Francisco') ? 2 : 1,
            selectedDistricts.has('San Francisco') ? 2 : 1, selectedDistricts.has('San Francisco') ? 2 : 1,
            selectedDistricts.has('San Francisco') ? 2 : 1,
            selectedDistricts.has('St. Louis') ? 2 : 1, selectedDistricts.has('St. Louis') ? 2 : 1,
            selectedDistricts.has('St. Louis') ? 2 : 1, selectedDistricts.has('St. Louis') ? 2 : 1
        ],
        text: ['Chicago', 'Chicago', 'Chicago', 'Chicago', 'Chicago',
               'Dallas', 'Dallas', 'Dallas',
               'Kansas City', 'Kansas City', 'Kansas City', 'Kansas City', 'Kansas City', 'Kansas City',
               'Minneapolis', 'Minneapolis', 'Minneapolis', 'Minneapolis',
               'Richmond', 'Richmond', 'Richmond', 'Richmond', 'Richmond', 'Richmond',
               'San Francisco', 'San Francisco', 'San Francisco', 'San Francisco', 'San Francisco', 
               'San Francisco', 'San Francisco', 'San Francisco', 'San Francisco',
               'St. Louis', 'St. Louis', 'St. Louis', 'St. Louis'],
        colorscale: [
            [0, '#e8e8e8'],
            [0.5, '#e8e8e8'],
            [0.5, '#667eea'],
            [1, '#667eea']
        ],
        showscale: false,
        hovertemplate: '%{text} District<br>Click to toggle<extra></extra>'
    };
    
    const layout = {
        title: {
            text: 'Click Districts to Select/Deselect',
            font: { size: 14 }
        },
        geo: {
            scope: 'usa',
            projection: {
                type: 'albers usa'
            },
            showland: true,
            landcolor: 'rgb(250, 250, 250)',
            showlakes: false,
            showcountries: false,
            showsubunits: true,
            subunitcolor: 'rgb(200, 200, 200)',
            subunitwidth: 0.5
        },
        margin: { t: 30, r: 0, b: 0, l: 0 },
        height: 280,  // Reduced height
        showlegend: false
    };
    
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    Plotly.newPlot('districtMap', [choroplethTrace], layout, config);
    
    // Add click handler
    document.getElementById('districtMap').on('plotly_click', function(data) {
        if (data.points && data.points[0]) {
            const clickedDistrict = data.points[0].text;
            toggleDistrictSelection(clickedDistrict);
        }
    });
}

// Toggle district selection from map click
function toggleDistrictSelection(districtName) {
    const districtSelector = document.getElementById('districtSelector');
    const districtCodeMap = {
        'Chicago': 'CHI',
        'Dallas': 'DAL',
        'Kansas City': 'KC',
        'Minneapolis': 'MIN',
        'Richmond': 'RIC',
        'San Francisco': 'SF',
        'St. Louis': 'STL'
    };
    
    const districtCode = districtCodeMap[districtName];
    if (!districtCode) return;
    
    // Find the option and toggle its selection
    const option = Array.from(districtSelector.options).find(opt => opt.value === districtCode);
    if (option) {
        option.selected = !option.selected;
        
        // Trigger change event to update the dropdown visually
        const event = new Event('change', { bubbles: true });
        districtSelector.dispatchEvent(event);
        
        // Update the chart
        updateRegionalChart();
        
        // Update map to reflect new selection
        createDistrictMap();
    }
}

// Create overview chart with actual data
function createOverviewChart() {
    if (!dashboardData.callReports) return;
    
    // Default to total agricultural loans
    const totalLoansKey = 'A001';
    
    if (dashboardData.callReports.series[totalLoansKey]) {
        showOverviewSeries('totalLoans', totalLoansKey, 'Call Reports');
    }
}

// Update regional chart based on selections - FIXED VERSION
function updateRegionalChart() {
    if (!dashboardData.districtSurveys) {
        console.log('District surveys data not loaded');
        return;
    }
    
    const districtSelector = document.getElementById('districtSelector');
    const metricSelector = document.getElementById('regionalMetricSelector');
    
    if (!districtSelector || !metricSelector) return;
    
    const selectedDistricts = Array.from(districtSelector.selectedOptions).map(opt => opt.value);
    const selectedMetric = metricSelector.value;
    
    console.log('Selected districts:', selectedDistricts);
    console.log('Selected metric:', selectedMetric);
    
    // Map metric values to description patterns
    const metricMap = {
        'farmland': 'Farmland',
        'demand': 'Demand for Loans',
        'repayment': 'Repayment Rate',
        'income': 'Farm Income'
    };
    
    const metricPattern = metricMap[selectedMetric] || 'Demand for Loans';
    const traces = [];
    
    // Map district codes to full names
    const districtNameMap = {
        'CHI': 'Chicago',
        'DAL': 'Dallas',
        'KC': 'Kansas City',
        'MIN': 'Minneapolis',
        'RIC': 'Richmond',
        'SF': 'San Francisco',
        'STL': 'St. Louis'
    };
    
    const selectedDistrictNames = [];
    
    selectedDistricts.forEach(districtCode => {
        const districtName = districtNameMap[districtCode];
        selectedDistrictNames.push(districtName);
        
        // Find series for this district and metric
        const seriesKey = Object.keys(dashboardData.districtSurveys.series).find(key => {
            const desc = dashboardData.districtSurveys.descriptions[key];
            const descText = desc.description || '';
            const isCorrectDistrict = desc.district === districtName;
            
            // More specific matching for each metric type
            if (selectedMetric === 'farmland') {
                return isCorrectDistrict && descText.includes('Annual Percent Change in Nonirrigated Farmland');
            } else if (selectedMetric === 'income') {
                // Be very specific for Farm Income to avoid wrong series
                return isCorrectDistrict && descText === 'Farm Income';
            } else if (selectedMetric === 'demand') {
                return isCorrectDistrict && descText === 'Demand for Loans';
            } else if (selectedMetric === 'repayment') {
                return isCorrectDistrict && descText === 'Loan Repayment Rate';
            }
            
            return false;
        });
        
        console.log(`Found series for ${districtName}: ${seriesKey}`);
        
        if (seriesKey && dashboardData.districtSurveys.series[seriesKey]) {
            const seriesData = dashboardData.districtSurveys.series[seriesKey];
            
            // Filter out invalid data points
            const validData = seriesData.filter(d => 
                d.value !== null && 
                d.value !== undefined && 
                !isNaN(d.value) &&
                d.value !== '---'
            );
            
            if (validData.length > 0) {
                traces.push({
                    x: validData.map(d => d.date),
                    y: validData.map(d => d.value),
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: districtName,
                    line: { width: 2 },
                    marker: { size: 4 }
                });
            }
        }
    });
    
    console.log('Created traces:', traces.length);
    
    // Update title to include selected districts
    const districtText = selectedDistrictNames.length > 0 ? 
        ` - ${selectedDistrictNames.join(', ')}` : '';
    
    // Get the proper title and y-axis label
    let chartTitle = `${metricPattern}${districtText}`;
    let yAxisTitle = 'Diffusion Index';
    let description = 'Diffusion Index: 100 = no change, >100 = increase, <100 = decrease';
    
    if (selectedMetric === 'farmland') {
        chartTitle = `Annual Farmland Value Changes${districtText}`;
        yAxisTitle = 'Percent Change (%)';
        description = 'Annual percent change in nonirrigated farmland values';
    }
    
    const layout = {
        title: chartTitle,
        xaxis: { 
            title: 'Date',
            rangeslider: { visible: true },
            type: 'category'
        },
        yaxis: { 
            title: yAxisTitle
        },
        hovermode: 'x unified',
        margin: { t: 50, r: 50, b: 100, l: 70 },
        legend: {
            orientation: 'h',
            y: -0.2,  // Position below the chart
            x: 0.5,
            xanchor: 'center',
            bgcolor: 'rgba(255,255,255,0.8)'
        },
        annotations: [{
            xref: 'paper',
            yref: 'paper',
            x: 0.01,
            y: 0.01,
            xanchor: 'left',
            yanchor: 'bottom',
            text: `Data: Federal Reserve District Surveys | Visual: William McWilliams`,
            showarrow: false,
            font: { size: 9, color: 'rgba(150,150,150,0.8)' },
            bgcolor: 'rgba(255,255,255,0.8)',
            borderpad: 2
        }]
    };
    
    Plotly.newPlot('regionalChart', traces, layout, {responsive: true});
    
    // Update description panel
    updateRegionalDescription(selectedMetric);
}

// Update regional description based on metric
function updateRegionalDescription(metric) {
    const descPanel = document.getElementById('regionalDescription');
    if (!descPanel) return;
    
    const descriptions = {
        'farmland': 'Farmland value changes are reported as annual percent changes. Positive values indicate appreciation in farmland values, while negative values indicate depreciation. These values are survey-based estimates from agricultural lenders.',
        'demand': 'Loan demand diffusion index: Values above 100 indicate increasing demand for agricultural loans, values below 100 indicate decreasing demand, and 100 indicates no change from the previous quarter.',
        'repayment': 'Repayment rate diffusion index: Values above 100 indicate improving repayment rates, below 100 indicate worsening repayment rates, and 100 indicates no change.',
        'income': 'Farm income diffusion index: Values above 100 indicate increasing farm income, below 100 indicate decreasing income, and 100 indicates no change from the previous quarter.'
    };
    
    descPanel.innerHTML = `<strong>About this metric:</strong> ${descriptions[metric] || 'Select a metric to see description.'}`;
}

// Create credit conditions charts with better layout
function createCreditConditionsCharts() {
    createInterestRateChart();
    createDelinquencyChart();
    createLoanVolumeChart();
}

// Create interest rate chart with fixed legend positioning
function createInterestRateChart() {
    if (!dashboardData.districtSurveys) return;
    
    // Find interest rate series for Chicago district as example
    const traces = [];
    const loanTypes = [
        { type: 'Operating', color: '#28a745' },
        { type: 'Intermediate', color: '#ffc107' },
        { type: 'Real Estate', color: '#17a2b8' }
    ];
    
    loanTypes.forEach(loan => {
        const seriesKey = Object.keys(dashboardData.districtSurveys.series).find(key => {
            const desc = dashboardData.districtSurveys.descriptions[key];
            return desc.description.includes(`Interest Rate on ${loan.type}`) && 
                   desc.district === 'Chicago';
        });
        
        if (seriesKey) {
            const seriesData = dashboardData.districtSurveys.series[seriesKey];
            traces.push({
                x: seriesData.map(d => d.date),
                y: seriesData.map(d => d.value),
                type: 'scatter',
                mode: 'lines',
                name: `${loan.type} Loans`,
                line: { width: 2, color: loan.color }
            });
        }
    });
    
    const layout = {
        title: 'Average Interest Rates by Loan Type (Chicago District)',
        xaxis: { 
            title: 'Date',
            type: 'category'
        },
        yaxis: { 
            title: 'Interest Rate (%)'
        },
        hovermode: 'x unified',
        legend: {
            orientation: 'h',
            y: 1.15,
            x: 0.5,
            xanchor: 'center',
            bgcolor: 'rgba(255,255,255,0.8)'
        },
        margin: { t: 80, r: 50, b: 60, l: 70 },
        annotations: [{
            xref: 'paper',
            yref: 'paper',
            x: 0.01,
            y: 0.01,
            xanchor: 'left',
            yanchor: 'bottom',
            text: 'Data: Fed District Surveys | Visual: William McWilliams',
            showarrow: false,
            font: { size: 9, color: 'rgba(150,150,150,0.8)' },
            bgcolor: 'rgba(255,255,255,0.8)',
            borderpad: 2
        }]
    };
    
    Plotly.newPlot('interestRateChart', traces, layout, {responsive: true});
}

// Create delinquency chart with better layout
function createDelinquencyChart() {
    if (!dashboardData.callReports) return;
    
    const traces = [];
    const categories = [
        { name: '30 to 89 days', color: '#ffc107' },
        { name: '90 days or more', color: '#fd7e14' },
        { name: 'Non-accruing', color: '#dc3545' }
    ];
    
    categories.forEach(category => {
        const seriesKey = Object.keys(dashboardData.callReports.series).find(key => {
            const desc = dashboardData.callReports.descriptions[key].statistic;
            return desc.includes(category.name) && desc.includes('Farm Real Estate');
        });
        
        if (seriesKey) {
            const seriesData = dashboardData.callReports.series[seriesKey];
            traces.push({
                x: seriesData.map(d => d.date),
                y: seriesData.map(d => d.value),
                type: 'scatter',
                mode: 'lines',
                name: category.name,
                line: { width: 2, color: category.color }
            });
        }
    });
    
    const layout = {
        title: 'Farm Real Estate Loan Delinquency Rates',
        xaxis: { 
            title: 'Date',
            type: 'category'
        },
        yaxis: { 
            title: 'Percent (%)'
        },
        hovermode: 'x unified',
        legend: {
            orientation: 'h',
            y: 1.15,
            x: 0.5,
            xanchor: 'center',
            bgcolor: 'rgba(255,255,255,0.8)'
        },
        margin: { t: 80, r: 20, b: 60, l: 70 },
        annotations: [{
            xref: 'paper',
            yref: 'paper',
            x: 0.01,
            y: 0.01,
            xanchor: 'left',
            yanchor: 'bottom',
            text: 'Data: Fed Call Reports | Visual: William McWilliams',
            showarrow: false,
            font: { size: 9, color: 'rgba(150,150,150,0.8)' },
            bgcolor: 'rgba(255,255,255,0.8)',
            borderpad: 2
        }]
    };
    
    Plotly.newPlot('delinquencyChart', traces, layout, {responsive: true});
}

// Create loan volume chart
function createLoanVolumeChart() {
    if (!dashboardData.lendingTerms) return;
    
    // Find volume series
    const volumeKey = Object.keys(dashboardData.lendingTerms.series).find(key => 
        dashboardData.lendingTerms.descriptions[key].statistic.includes('Volume')
    );
    
    if (volumeKey) {
        const seriesData = dashboardData.lendingTerms.series[volumeKey];
        const description = dashboardData.lendingTerms.descriptions[volumeKey];
        
        const trace = {
            x: seriesData.map(d => d.date),
            y: seriesData.map(d => d.value),
            type: 'bar',
            name: 'Loan Volume',
            marker: { color: '#764ba2' }
        };
        
        const layout = {
            title: 'Quarterly Non-Real Estate Farm Loan Volume',
            xaxis: { 
                title: 'Date',
                rangeslider: { visible: true },
                type: 'category'
            },
            yaxis: { 
                title: description.unit || 'Billions USD'
            },
            hovermode: 'x unified',
            margin: { t: 50, r: 50, b: 100, l: 70 },
            annotations: [{
                xref: 'paper',
                yref: 'paper',
                x: 0.99,
                y: 0.01,
                xanchor: 'right',
                yanchor: 'bottom',
                text: 'Data: Fed Terms of Lending Survey | Visual: William McWilliams',
                showarrow: false,
                font: { size: 9, color: 'rgba(150,150,150,0.8)' },
                bgcolor: 'rgba(255,255,255,0.8)',
                borderpad: 2
            }]
        };
        
        Plotly.newPlot('loanVolumeChart', [trace], layout, {responsive: true});
    }
}

// Update data explorer with all available series
function updateDataExplorer() {
    const seriesContainer = document.getElementById('seriesSelector');
    if (!seriesContainer) return;
    
    seriesContainer.innerHTML = '<h6>Available Data Series:</h6>';
    
    // Create grouped checkboxes by data source
    const sources = ['District Surveys', 'Terms of Lending', 'Call Reports'];
    
    sources.forEach(source => {
        const sourceDiv = document.createElement('div');
        sourceDiv.className = 'mb-3';
        sourceDiv.innerHTML = `<strong>${source}</strong>`;
        
        const seriesDiv = document.createElement('div');
        seriesDiv.className = 'series-group ms-3';
        seriesDiv.style.maxHeight = '200px';
        seriesDiv.style.overflowY = 'auto';
        
        let count = 0;
        Object.keys(dashboardData.allSeries).forEach(key => {
            const series = dashboardData.allSeries[key];
            if (series.source === source) {
                const checkDiv = document.createElement('div');
                checkDiv.className = 'form-check';
                checkDiv.innerHTML = `
                    <input class="form-check-input series-checkbox" type="checkbox" 
                           value="${key}" id="series_${key}">
                    <label class="form-check-label small" for="series_${key}">
                        ${getSeriesLabel(series)}
                    </label>
                `;
                seriesDiv.appendChild(checkDiv);
                count++;
            }
        });
        
        sourceDiv.appendChild(seriesDiv);
        if (count > 0) {
            seriesContainer.appendChild(sourceDiv);
        }
    });
    
    // Add event listeners to checkboxes
    document.querySelectorAll('.series-checkbox').forEach(cb => {
        cb.addEventListener('change', updateCustomChart);
    });
}

// Get readable label for series
function getSeriesLabel(series) {
    if (series.source === 'District Surveys') {
        return `${series.description.description} - ${series.description.district}`;
    } else if (series.source === 'Terms of Lending') {
        return `${series.description.statistic} - ${series.description.attribute2 || series.description.attribute1 || ''}`;
    } else {
        return series.description.statistic;
    }
}

// Filter series list based on search
function filterSeriesList() {
    const searchTerm = document.getElementById('seriesSearch').value.toLowerCase();
    const checkboxes = document.querySelectorAll('.series-checkbox');
    
    checkboxes.forEach(cb => {
        const label = cb.nextElementSibling.textContent.toLowerCase();
        const parent = cb.closest('.form-check');
        if (label.includes(searchTerm)) {
            parent.style.display = 'block';
        } else {
            parent.style.display = 'none';
        }
    });
}

// Update custom chart based on selected series
function updateCustomChart() {
    const selectedCheckboxes = document.querySelectorAll('.series-checkbox:checked');
    
    if (selectedCheckboxes.length === 0) {
        Plotly.purge('customChart');
        return;
    }
    
    const traces = [];
    dashboardData.selectedSeries = [];
    
    selectedCheckboxes.forEach(cb => {
        const seriesKey = cb.value;
        const series = dashboardData.allSeries[seriesKey];
        
        if (series && series.data) {
            dashboardData.selectedSeries.push(seriesKey);
            
            traces.push({
                x: series.data.map(d => d.date),
                y: series.data.map(d => d.value),
                type: 'scatter',
                mode: 'lines',
                name: getSeriesLabel(series).substring(0, 50)  // Truncate long names
            });
        }
    });
    
    const layout = {
        title: 'Custom Data Visualization',
        xaxis: { 
            title: 'Date',
            rangeslider: { visible: true },
            type: 'category'
        },
        yaxis: { 
            title: 'Value'
        },
        hovermode: 'x unified',
        legend: {
            orientation: 'v',
            y: 1,
            x: 1.02,
            xanchor: 'left',
            bgcolor: 'rgba(255,255,255,0.8)',
            bordercolor: '#ccc',
            borderwidth: 1
        },
        margin: { t: 50, r: 200, b: 120, l: 70 },  // More right margin for legend
        annotations: [{
            xref: 'paper',
            yref: 'paper',
            x: 0,
            y: -0.25,
            xanchor: 'left',
            yanchor: 'top',
            text: 'Source: Federal Reserve - Multiple Datasets',
            showarrow: false,
            font: { size: 10, color: 'gray' }
        }]
    };
    
    Plotly.newPlot('customChart', traces, layout, {responsive: true});
    
    // Update statistics if enabled
    if (document.getElementById('showStatistics')?.checked) {
        updateStatisticsTable();
    }
    
    // Update data dictionary if enabled
    if (document.getElementById('showDataDictionary')?.checked) {
        updateDataDictionary();
    }
}

// Show comprehensive statistics
function showStatistics() {
    if (dashboardData.selectedSeries.length === 0) {
        alert('Please select at least one data series first');
        return;
    }
    
    const statsSection = document.getElementById('statisticsSection');
    if (statsSection) {
        statsSection.style.display = 'block';
        updateStatisticsTable();
        statsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Update statistics table with comprehensive stats
function updateStatisticsTable() {
    const tableContainer = document.getElementById('statsTableContainer');
    if (!tableContainer) return;
    
    let tableHTML = `
        <table class="table table-striped table-sm">
            <thead>
                <tr>
                    <th>Series</th>
                    <th>N</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Mean</th>
                    <th>Median</th>
                    <th>Std Dev</th>
                    <th>Min</th>
                    <th>Max</th>
                    <th>Latest</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    dashboardData.selectedSeries.forEach(seriesKey => {
        const series = dashboardData.allSeries[seriesKey];
        if (series && series.data) {
            const stats = calculateStatistics(series.data);
            const label = getSeriesLabel(series).substring(0, 40);
            
            tableHTML += `
                <tr>
                    <td class="small">${label}</td>
                    <td>${stats.n}</td>
                    <td>${stats.start}</td>
                    <td>${stats.end}</td>
                    <td>${stats.mean.toFixed(2)}</td>
                    <td>${stats.median.toFixed(2)}</td>
                    <td>${stats.stdDev.toFixed(2)}</td>
                    <td>${stats.min.toFixed(2)}</td>
                    <td>${stats.max.toFixed(2)}</td>
                    <td>${stats.latest.toFixed(2)}</td>
                </tr>
            `;
        }
    });
    
    tableHTML += '</tbody></table>';
    tableContainer.innerHTML = tableHTML;
}

// Calculate comprehensive statistics for a series
function calculateStatistics(data) {
    const values = data.map(d => d.value).filter(v => v !== null && v !== undefined);
    const dates = data.map(d => d.date).filter(d => d !== null);
    
    if (values.length === 0) {
        return {
            n: 0,
            start: 'N/A',
            end: 'N/A',
            mean: 0,
            median: 0,
            stdDev: 0,
            min: 0,
            max: 0,
            latest: 0
        };
    }
    
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const median = getMedian(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    
    return {
        n: n,
        start: dates[0] || 'N/A',
        end: dates[dates.length - 1] || 'N/A',
        mean: mean,
        median: median,
        stdDev: stdDev,
        min: Math.min(...values),
        max: Math.max(...values),
        latest: values[values.length - 1] || 0
    };
}

// Get median of array
function getMedian(values) {
    if (values.length === 0) return 0;
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Update data dictionary
function updateDataDictionary() {
    const dictContainer = document.getElementById('dataDictionaryContainer');
    if (!dictContainer) return;
    
    let dictHTML = '<div class="row">';
    
    dashboardData.selectedSeries.forEach(seriesKey => {
        const series = dashboardData.allSeries[seriesKey];
        if (series) {
            dictHTML += `
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-body p-2">
                            <h6 class="card-title">${getSeriesLabel(series)}</h6>
                            <p class="card-text small mb-1">
                                <strong>Source:</strong> ${series.source}<br>
                                <strong>Series ID:</strong> ${series.id}<br>
            `;
            
            if (series.source === 'District Surveys') {
                dictHTML += `
                    <strong>Unit:</strong> ${series.description.unit}<br>
                    <strong>Frequency:</strong> ${series.description.frequency}
                `;
            } else if (series.source === 'Terms of Lending') {
                dictHTML += `
                    <strong>Unit:</strong> ${series.description.unit}<br>
                    ${series.description.attribute1 ? `<strong>Category:</strong> ${series.description.attribute1}<br>` : ''}
                `;
            } else {
                dictHTML += `
                    <strong>Description:</strong> ${series.description.description || 'N/A'}<br>
                    <strong>Unit:</strong> ${series.description.unit}<br>
                    <strong>Frequency:</strong> ${series.description.frequency || 'Quarterly'}
                `;
            }
            
            dictHTML += '</p></div></div></div>';
        }
    });
    
    dictHTML += '</div>';
    dictContainer.innerHTML = dictHTML;
}

// Show correlation matrix
function showCorrelationMatrix() {
    if (dashboardData.selectedSeries.length < 2) {
        alert('Please select at least 2 series for correlation analysis');
        return;
    }
    
    // Show the correlation section
    const corrSection = document.getElementById('correlationSection');
    if (corrSection) {
        corrSection.style.display = 'block';
    }
    
    // Get correlation type
    const correlationType = document.getElementById('correlationType')?.value || 'pearson';
    
    // Calculate correlation matrix
    const matrix = calculateCorrelationMatrix(correlationType);
    
    // Create text annotations for the correlation values
    const annotations = [];
    for (let i = 0; i < matrix.labels.length; i++) {
        for (let j = 0; j < matrix.labels.length; j++) {
            const value = matrix.values[i][j];
            annotations.push({
                x: matrix.labels[j],
                y: matrix.labels[i],
                text: value.toFixed(2),
                xref: 'x',
                yref: 'y',
                showarrow: false,
                font: {
                    size: 12,
                    color: Math.abs(value) > 0.5 ? 'white' : 'black'
                }
            });
        }
    }
    
    // Create heatmap
    const data = [{
        z: matrix.values,
        x: matrix.labels,
        y: matrix.labels,
        type: 'heatmap',
        colorscale: 'RdBu',
        reversescale: true,
        zmin: -1,
        zmax: 1,
        colorbar: {
            title: 'Correlation',
            titleside: 'right'
        },
        hovertemplate: 'x: %{x}<br>y: %{y}<br>Correlation: %{z:.3f}<extra></extra>'
    }];
    
    const layout = {
        title: `Correlation Matrix (${correlationType.charAt(0).toUpperCase() + correlationType.slice(1)})`,
        xaxis: { 
            tickangle: -45,
            side: 'bottom',
            tickfont: { size: 10 }
        },
        yaxis: { 
            autorange: 'reversed',
            tickfont: { size: 10 }
        },
        annotations: annotations,
        margin: { t: 50, r: 100, b: 150, l: 250 },  // Increased left margin significantly
        width: null,  // Allow responsive width
        height: 600   // Set a good height
    };
    
    Plotly.newPlot('correlationMatrix', data, layout, {responsive: true});
    
    // Scroll to the correlation matrix
    corrSection.scrollIntoView({ behavior: 'smooth' });
}

// Calculate correlation matrix
function calculateCorrelationMatrix(type = 'pearson') {
    const seriesData = [];
    const labels = [];
    
    // Collect data for each selected series
    dashboardData.selectedSeries.forEach(key => {
        const series = dashboardData.allSeries[key];
        if (series && series.data && series.data.length > 0) {
            seriesData.push(series.data);
            labels.push(getSeriesLabel(series).substring(0, 30));
        }
    });
    
    console.log(`Calculating ${type} correlation for ${labels.length} series`);
    
    const n = labels.length;
    const values = Array(n).fill().map(() => Array(n).fill(0));
    
    // Calculate correlations based on type
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (i === j) {
                values[i][j] = 1;
            } else {
                const corr = type === 'spearman' ? 
                    calculateSpearmanCorrelation(seriesData[i], seriesData[j]) :
                    calculatePearsonCorrelation(seriesData[i], seriesData[j]);
                values[i][j] = isNaN(corr) ? 0 : corr;
                values[j][i] = values[i][j]; // Ensure symmetry
            }
        }
    }
    
    console.log('Correlation matrix calculated:', values);
    
    return { labels, values };
}

// Calculate Spearman correlation between two series
function calculateSpearmanCorrelation(series1, series2) {
    // Find common dates
    const dates1 = new Set(series1.map(d => d.date));
    const dates2 = new Set(series2.map(d => d.date));
    const commonDates = [...dates1].filter(d => dates2.has(d));
    
    if (commonDates.length < 2) return 0;
    
    // Get values for common dates
    const values1 = [];
    const values2 = [];
    
    commonDates.forEach(date => {
        const v1 = series1.find(d => d.date === date)?.value;
        const v2 = series2.find(d => d.date === date)?.value;
        if (v1 !== null && v2 !== null && v1 !== undefined && v2 !== undefined) {
            values1.push(v1);
            values2.push(v2);
        }
    });
    
    if (values1.length < 2) return 0;
    
    // Convert to ranks
    const ranks1 = getRanks(values1);
    const ranks2 = getRanks(values2);
    
    // Calculate Pearson correlation on ranks (Spearman)
    return calculatePearsonOnValues(ranks1, ranks2);
}

// Get ranks for Spearman correlation
function getRanks(values) {
    // Create array of {value, index} pairs
    const indexed = values.map((v, i) => ({value: v, index: i}));
    
    // Sort by value
    indexed.sort((a, b) => a.value - b.value);
    
    // Assign ranks, handling ties
    const ranks = new Array(values.length);
    let currentRank = 1;
    
    for (let i = 0; i < indexed.length; i++) {
        let j = i;
        let sum = 0;
        let count = 0;
        
        // Find all tied values
        while (j < indexed.length && indexed[j].value === indexed[i].value) {
            sum += currentRank + count;
            count++;
            j++;
        }
        
        // Assign average rank to all tied values
        const avgRank = sum / count;
        for (let k = i; k < j; k++) {
            ranks[indexed[k].index] = avgRank;
        }
        
        currentRank += count;
        i = j - 1; // Skip ahead past tied values
    }
    
    return ranks;
}

// Calculate Pearson correlation on provided values
function calculatePearsonOnValues(values1, values2) {
    const n = values1.length;
    
    // Calculate means
    const mean1 = values1.reduce((a, b) => a + b, 0) / n;
    const mean2 = values2.reduce((a, b) => a + b, 0) / n;
    
    // Calculate correlation
    let numerator = 0;
    let sum1 = 0;
    let sum2 = 0;
    
    for (let i = 0; i < n; i++) {
        const diff1 = values1[i] - mean1;
        const diff2 = values2[i] - mean2;
        numerator += diff1 * diff2;
        sum1 += diff1 * diff1;
        sum2 += diff2 * diff2;
    }
    
    const denominator = Math.sqrt(sum1 * sum2);
    return denominator === 0 ? 0 : numerator / denominator;
}

// Calculate Pearson correlation between two series
function calculatePearsonCorrelation(series1, series2) {
    // Find common dates
    const dates1 = new Set(series1.map(d => d.date));
    const dates2 = new Set(series2.map(d => d.date));
    const commonDates = [...dates1].filter(d => dates2.has(d));
    
    if (commonDates.length < 2) return 0;
    
    // Get values for common dates
    const values1 = [];
    const values2 = [];
    
    commonDates.forEach(date => {
        const v1 = series1.find(d => d.date === date)?.value;
        const v2 = series2.find(d => d.date === date)?.value;
        if (v1 !== null && v2 !== null && v1 !== undefined && v2 !== undefined) {
            values1.push(v1);
            values2.push(v2);
        }
    });
    
    if (values1.length < 2) return 0;
    
    // Calculate means
    const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
    const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;
    
    // Calculate correlation
    let numerator = 0;
    let sum1 = 0;
    let sum2 = 0;
    
    for (let i = 0; i < values1.length; i++) {
        const diff1 = values1[i] - mean1;
        const diff2 = values2[i] - mean2;
        numerator += diff1 * diff2;
        sum1 += diff1 * diff1;
        sum2 += diff2 * diff2;
    }
    
    const denominator = Math.sqrt(sum1 * sum2);
    return denominator === 0 ? 0 : numerator / denominator;
}

// Download chart as PNG
function downloadChart() {
    Plotly.downloadImage('customChart', {
        format: 'png',
        width: 1200,
        height: 600,
        filename: `ag-economy-chart-${new Date().toISOString().split('T')[0]}`
    });
}

// Download data as CSV
function downloadData() {
    if (dashboardData.selectedSeries.length === 0) {
        alert('Please select at least one data series first');
        return;
    }
    
    // Prepare CSV content
    let csv = 'Date';
    dashboardData.selectedSeries.forEach(key => {
        csv += ',' + getSeriesLabel(dashboardData.allSeries[key]).replace(/,/g, ';');
    });
    csv += '\n';
    
    // Get all unique dates
    const allDates = new Set();
    dashboardData.selectedSeries.forEach(key => {
        const series = dashboardData.allSeries[key];
        series.data.forEach(d => allDates.add(d.date));
    });
    
    // Sort dates
    const sortedDates = Array.from(allDates).sort();
    
    // Build CSV rows
    sortedDates.forEach(date => {
        csv += date;
        dashboardData.selectedSeries.forEach(key => {
            const series = dashboardData.allSeries[key];
            const dataPoint = series.data.find(d => d.date === date);
            csv += ',' + (dataPoint ? dataPoint.value : '');
        });
        csv += '\n';
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ag-economy-data-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}