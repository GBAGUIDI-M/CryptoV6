
// Gestion des graphiques avec Chart.js
window.charts = {
    doughnut: null,
    line: null,

    update: function (portfolio, history, settings, chartRange, sectors) {

        // Adaptation des couleurs de ChartJS selon le thème
        const theme = settings.theme;
        let gridColor = '#e5e7eb';
        let tickColor = '#4b5563';

        if (theme !== 'light') { // Dark, Cyberpunk, Ocean, Forest
            gridColor = '#374151';
            tickColor = '#9ca3af';
            if (theme === 'cyberpunk') { gridColor = '#333'; tickColor = '#00ffff'; }
            if (theme === 'ocean') { gridColor = '#005f73'; tickColor = '#4db6ac'; }
            if (theme === 'forest') { gridColor = '#3e4f3e'; tickColor = '#98bf64'; }
        }

        // 1. PIE CHART
        const ctxPie = document.getElementById('chartPie');
        if (ctxPie && portfolio) {
            if (this.doughnut) this.doughnut.destroy();
            // Si portfolio vide, afficher un placeholder ou chart vide ?
            const data = portfolio.length ? portfolio.map(i => i.currentValue) : [1];
            const labels = portfolio.length ? portfolio.map(i => i.symbol) : ['Vide'];
            const colors = portfolio.length ? portfolio.map(i => i.color) : ['#374151'];

            this.doughnut = new Chart(ctxPie, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors,
                        borderWidth: 0
                    }]
                },
                options: { plugins: { legend: { display: false } }, cutout: '70%' }
            });
        }

        // 2. LINE CHART
        const ctxLine = document.getElementById('chartLine');
        if (ctxLine && history) {
            if (this.line) this.line.destroy();

            let datasetData = history.map(h => h.value);
            let labels = history.map(h => h.date);

            // Filtrage
            if (chartRange === '7d') { datasetData = datasetData.slice(-7); labels = labels.slice(-7); }
            else if (chartRange === '1m') { datasetData = datasetData.slice(-30); labels = labels.slice(-30); }
            else if (chartRange === '3m') { datasetData = datasetData.slice(-90); labels = labels.slice(-90); }

            this.line = new Chart(ctxLine, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Valeur',
                        data: datasetData,
                        borderColor: (theme === 'cyberpunk' ? '#ff00ff' : (theme === 'forest' ? '#98bf64' : '#6366f1')),
                        tension: 0.3,
                        pointRadius: 2
                    }]
                },
                options: {
                    scales: {
                        x: { display: false },
                        y: { grid: { color: gridColor }, ticks: { color: tickColor } }
                    },
                    plugins: { legend: { display: false } },
                    maintainAspectRatio: false
                }
            });
        }

        // 3. SECTOR CHART
        const ctxSec = document.getElementById('chartSector');
        if (ctxSec && sectors) {
            if (this.sector) this.sector.destroy();
            this.sector = new Chart(ctxSec, {
                type: 'pie',
                data: {
                    labels: sectors.map(s => s.label),
                    datasets: [{
                        data: sectors.map(s => s.value),
                        backgroundColor: ['#F7931A', '#627EEA', '#F3BA2F', '#14F195', '#E84142', '#0088CC'], // Generic colors, maybe improve
                        borderWidth: 0
                    }]
                },
                options: {
                    plugins: {
                        legend: { position: 'right', labels: { color: tickColor } }
                    },
                    maintainAspectRatio: false
                }
            });
        }

        // 4. RADAR CHART (DNA)
        const ctxRadar = document.getElementById('chartRadar');
        const dna = window.cryptoAppInstance?.dna?.scores; // Access global or pass as arg?
        // Better to pass as arg. For now, try to find it from Alpine scope or passed arg?
        // Updated signature: update(..., sectors, dnaScores)

        // We will assume `dnaScores` is passed as argument
    },

    updateRadar: function (dnaScores, settings) {
        if (!dnaScores) return;
        const ctxRadar = document.getElementById('chartRadar');
        if (!ctxRadar) return;

        // Colors
        const theme = settings.theme;
        let tickColor = (theme !== 'light') ? '#9ca3af' : '#4b5563';
        let pointColor = (theme === 'cyberpunk') ? '#00ffff' : '#6366f1';
        let bgAlpha = (theme === 'cyberpunk') ? 'rgba(0, 255, 255, 0.2)' : 'rgba(99, 102, 241, 0.2)';

        if (this.radar) this.radar.destroy();
        this.radar = new Chart(ctxRadar, {
            type: 'radar',
            data: {
                labels: ['Impulsivité', 'Discipline', 'Tolérance Risque', 'Exposition Émotionnelle'],
                datasets: [{
                    label: 'Votre ADN',
                    data: [dnaScores.impulsivity, dnaScores.discipline, dnaScores.riskTolerance, dnaScores.emotionalExposure],
                    fill: true,
                    backgroundColor: bgAlpha,
                    borderColor: pointColor,
                    pointBackgroundColor: pointColor,
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: pointColor
                }]
            },
            options: {
                elements: { line: { borderWidth: 3 } },
                scales: {
                    r: {
                        angleLines: { color: (theme !== 'light' ? '#374151' : '#e5e7eb') },
                        grid: { color: (theme !== 'light' ? '#374151' : '#e5e7eb') },
                        pointLabels: { color: tickColor, font: { size: 12, weight: 'bold' } },
                        suggestedMin: 0,
                        suggestedMax: 100,
                        ticks: { backdropColor: 'transparent', display: false }
                    }
                },
                plugins: { legend: { display: false } },
                maintainAspectRatio: false
            }
        });
    }
};
