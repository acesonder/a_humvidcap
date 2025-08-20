// HumVidCap Application JavaScript
class HumVidCapApp {
    constructor() {
        this.socket = io();
        this.activeSessions = new Map();
        this.isRecording = new Set();
        this.humanDetectionActive = new Set();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupSocketListeners();
        this.initializeViewports();
        this.loadSettings();
        this.addLogEntry('Application initialized successfully', 'success');
    }

    setupEventListeners() {
        // Global controls
        document.getElementById('stop-all-btn').addEventListener('click', () => {
            this.stopAllCaptures();
        });
        
        document.getElementById('download-logs-btn').addEventListener('click', () => {
            this.downloadLogs();
        });
        
        document.getElementById('clear-log-btn').addEventListener('click', () => {
            this.clearLog();
        });
        
        // Storage type change
        document.getElementById('storage-type').addEventListener('change', (e) => {
            this.toggleFTPSettings(e.target.value);
        });

        // Viewport controls
        for (let i = 1; i <= 4; i++) {
            this.setupViewportControls(i);
        }
    }

    setupViewportControls(viewportId) {
        const startBtn = document.querySelector(`.start-btn[data-viewport="${viewportId}"]`);
        const stopBtn = document.querySelector(`.stop-btn[data-viewport="${viewportId}"]`);
        const screenshotBtn = document.querySelector(`.screenshot-btn[data-viewport="${viewportId}"]`);
        const addPersonBtn = document.querySelector(`.btn-add-person[data-viewport="${viewportId}"]`);

        startBtn.addEventListener('click', () => {
            this.startCapture(viewportId);
        });

        stopBtn.addEventListener('click', () => {
            this.stopCapture(viewportId);
        });

        screenshotBtn.addEventListener('click', () => {
            this.takeScreenshot(viewportId);
        });

        addPersonBtn.addEventListener('click', () => {
            this.addPerson(viewportId);
        });

        // Source type change handler
        document.getElementById(`source-type-${viewportId}`).addEventListener('change', (e) => {
            this.updateSourceInputPlaceholder(viewportId, e.target.value);
        });
    }

    setupSocketListeners() {
        this.socket.on('connect', () => {
            this.addLogEntry('Connected to server', 'success');
        });

        this.socket.on('disconnect', () => {
            this.addLogEntry('Disconnected from server', 'warning');
        });

        this.socket.on('person-detected', (data) => {
            this.onPersonDetected(data);
        });

        this.socket.on('capture-frame', (data) => {
            this.updatePreview(data.viewportId, data.frameData);
        });
    }

    initializeViewports() {
        for (let i = 1; i <= 4; i++) {
            this.socket.emit('join-viewport', i);
            this.updateStatus(i, 'Idle');
        }
    }

    async startCapture(viewportId) {
        try {
            const config = this.getViewportConfig(viewportId);
            
            if (!config.sourceUrl && config.sourceType !== 'screen') {
                this.showToast('Please enter a source URL or window name', 'error');
                return;
            }

            const response = await fetch('/api/start-capture', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    viewportId: viewportId,
                    sourceType: config.sourceType,
                    sourceUrl: config.sourceUrl,
                    captureType: config.captureType,
                    frameRate: config.frameRate,
                    humanDetection: config.humanDetection
                })
            });

            const data = await response.json();

            if (data.success) {
                this.activeSessions.set(viewportId, data.sessionId);
                this.isRecording.add(viewportId);
                
                this.updateStatus(viewportId, 'Recording');
                this.toggleButtons(viewportId, false);
                
                this.addLogEntry(`Capture started for Viewport ${viewportId} (${config.sourceType})`, 'success');
                this.showToast(`Capture started for Viewport ${viewportId}`, 'success');
                
                // Start preview simulation (in real implementation, this would be actual capture)
                this.startPreviewSimulation(viewportId);
                
                if (config.humanDetection) {
                    this.humanDetectionActive.add(viewportId);
                    this.startHumanDetectionSimulation(viewportId);
                }
            } else {
                this.showToast('Failed to start capture: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error starting capture:', error);
            this.addLogEntry(`Error starting capture for Viewport ${viewportId}: ${error.message}`, 'error');
            this.showToast('Error starting capture', 'error');
        }
    }

    async stopCapture(viewportId) {
        try {
            const sessionId = this.activeSessions.get(viewportId);
            
            if (!sessionId) {
                this.showToast('No active session found', 'warning');
                return;
            }

            const response = await fetch('/api/stop-capture', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: sessionId
                })
            });

            const data = await response.json();

            if (data.success) {
                this.activeSessions.delete(viewportId);
                this.isRecording.delete(viewportId);
                this.humanDetectionActive.delete(viewportId);
                
                this.updateStatus(viewportId, 'Idle');
                this.toggleButtons(viewportId, true);
                this.clearPreview(viewportId);
                
                this.addLogEntry(`Capture stopped for Viewport ${viewportId}`, 'success');
                this.showToast(`Capture stopped for Viewport ${viewportId}`, 'success');
            } else {
                this.showToast('Failed to stop capture: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error stopping capture:', error);
            this.addLogEntry(`Error stopping capture for Viewport ${viewportId}: ${error.message}`, 'error');
            this.showToast('Error stopping capture', 'error');
        }
    }

    async takeScreenshot(viewportId) {
        try {
            const sessionId = this.activeSessions.get(viewportId);
            
            const response = await fetch('/api/screenshot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: sessionId,
                    viewportId: viewportId
                })
            });

            const data = await response.json();

            if (data.success) {
                this.addLogEntry(`Screenshot taken: ${data.filename}`, 'success');
                this.showToast('Screenshot captured successfully', 'success');
                
                // Simulate screenshot flash effect
                this.flashScreenshot(viewportId);
            } else {
                this.showToast('Failed to take screenshot: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error taking screenshot:', error);
            this.addLogEntry(`Error taking screenshot for Viewport ${viewportId}: ${error.message}`, 'error');
            this.showToast('Error taking screenshot', 'error');
        }
    }

    async addPerson(viewportId) {
        const input = document.querySelector(`#viewport-${viewportId} .person-name`);
        const personName = input.value.trim();
        
        if (!personName) {
            this.showToast('Please enter a person name', 'warning');
            return;
        }

        try {
            const sessionId = this.activeSessions.get(viewportId);
            
            const response = await fetch('/api/add-person', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: sessionId,
                    personName: personName,
                    confidence: 0.95
                })
            });

            const data = await response.json();

            if (data.success) {
                this.displayDetectedPerson(viewportId, personName);
                input.value = '';
                this.addLogEntry(`Person added to Viewport ${viewportId}: ${personName}`, 'success');
                this.showToast(`Person "${personName}" added successfully`, 'success');
            } else {
                this.showToast('Failed to add person: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('Error adding person:', error);
            this.showToast('Error adding person', 'error');
        }
    }

    getViewportConfig(viewportId) {
        return {
            sourceType: document.getElementById(`source-type-${viewportId}`).value,
            sourceUrl: document.getElementById(`source-input-${viewportId}`).value,
            captureType: document.getElementById(`capture-type-${viewportId}`).value,
            frameRate: parseInt(document.getElementById(`frame-rate-${viewportId}`).value),
            humanDetection: document.getElementById(`human-detection-${viewportId}`).checked
        };
    }

    updateStatus(viewportId, status) {
        const statusElement = document.getElementById(`status-${viewportId}`);
        statusElement.textContent = status;
        statusElement.className = 'status-indicator';
        
        if (status === 'Recording') {
            statusElement.classList.add('recording');
        } else if (status === 'Active') {
            statusElement.classList.add('active');
        }
    }

    toggleButtons(viewportId, canStart) {
        const startBtn = document.querySelector(`.start-btn[data-viewport="${viewportId}"]`);
        const stopBtn = document.querySelector(`.stop-btn[data-viewport="${viewportId}"]`);
        
        startBtn.disabled = !canStart;
        stopBtn.disabled = canStart;
    }

    updateSourceInputPlaceholder(viewportId, sourceType) {
        const input = document.getElementById(`source-input-${viewportId}`);
        
        switch (sourceType) {
            case 'window':
                input.placeholder = 'Enter window name (e.g., "Chrome", "Notepad")';
                break;
            case 'url':
                input.placeholder = 'Enter URL (e.g., "https://example.com")';
                break;
            case 'screen':
                input.placeholder = 'Full screen capture (no input needed)';
                input.value = '';
                break;
        }
    }

    startPreviewSimulation(viewportId) {
        const previewArea = document.getElementById(`preview-${viewportId}`);
        
        // Create a simple animated preview placeholder
        previewArea.innerHTML = `
            <div class="preview-simulation">
                <div class="simulation-text">🎥 Live Preview</div>
                <div class="simulation-info">Viewport ${viewportId} - Recording Active</div>
                <canvas id="preview-canvas-${viewportId}" width="300" height="200"></canvas>
            </div>
        `;
        
        this.animatePreview(viewportId);
    }

    animatePreview(viewportId) {
        const canvas = document.getElementById(`preview-canvas-${viewportId}`);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const config = this.getViewportConfig(viewportId);
        let frame = 0;
        
        const animate = () => {
            if (!this.isRecording.has(viewportId)) return;
            
            // Clear canvas
            ctx.fillStyle = '#2d3748';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw simulated content
            ctx.fillStyle = '#667eea';
            ctx.fillRect(20 + Math.sin(frame * 0.1) * 10, 20, 100, 60);
            
            ctx.fillStyle = '#38a169';
            ctx.fillRect(150, 30 + Math.cos(frame * 0.15) * 15, 80, 40);
            
            // Draw frame rate indicator
            ctx.fillStyle = '#e2e8f0';
            ctx.font = '12px Arial';
            ctx.fillText(`${config.frameRate} FPS`, 10, canvas.height - 10);
            
            // Draw recording indicator
            if (frame % 30 < 15) {
                ctx.fillStyle = '#e53e3e';
                ctx.beginPath();
                ctx.arc(canvas.width - 20, 20, 8, 0, 2 * Math.PI);
                ctx.fill();
            }
            
            frame++;
            setTimeout(() => requestAnimationFrame(animate), 1000 / config.frameRate);
        };
        
        animate();
    }

    startHumanDetectionSimulation(viewportId) {
        // Simulate human detection at random intervals
        const detectHuman = () => {
            if (!this.humanDetectionActive.has(viewportId)) return;
            
            // Random chance of detecting a person
            if (Math.random() < 0.3) {
                const names = ['Person A', 'Person B', 'Unknown', 'Visitor'];
                const randomName = names[Math.floor(Math.random() * names.length)];
                const confidence = 0.7 + Math.random() * 0.3;
                
                this.onPersonDetected({
                    sessionId: this.activeSessions.get(viewportId),
                    person: {
                        name: randomName,
                        confidence: confidence,
                        detectedAt: new Date().toISOString()
                    }
                });
            }
            
            setTimeout(detectHuman, 5000 + Math.random() * 10000); // 5-15 seconds
        };
        
        setTimeout(detectHuman, 3000); // Start after 3 seconds
    }

    onPersonDetected(data) {
        // Find viewport by session ID
        for (let [viewportId, sessionId] of this.activeSessions) {
            if (sessionId === data.sessionId) {
                this.displayDetectedPerson(viewportId, data.person.name, data.person.confidence);
                this.addLogEntry(`Person detected in Viewport ${viewportId}: ${data.person.name} (${(data.person.confidence * 100).toFixed(1)}%)`, 'success');
                break;
            }
        }
    }

    displayDetectedPerson(viewportId, name, confidence = null) {
        const peopleList = document.querySelector(`#people-${viewportId} .people-list`);
        
        // Check if person already exists
        const existingTags = peopleList.querySelectorAll('.person-tag');
        for (let tag of existingTags) {
            if (tag.textContent.includes(name)) {
                return; // Person already displayed
            }
        }
        
        const personTag = document.createElement('div');
        personTag.className = 'person-tag';
        personTag.textContent = confidence ? 
            `${name} (${(confidence * 100).toFixed(1)}%)` : 
            name;
        
        peopleList.appendChild(personTag);
    }

    clearPreview(viewportId) {
        const previewArea = document.getElementById(`preview-${viewportId}`);
        previewArea.innerHTML = '<div class="preview-placeholder">No Preview Available</div>';
        
        // Clear detected people
        const peopleList = document.querySelector(`#people-${viewportId} .people-list`);
        peopleList.innerHTML = '';
    }

    flashScreenshot(viewportId) {
        const previewArea = document.getElementById(`preview-${viewportId}`);
        previewArea.style.background = 'white';
        setTimeout(() => {
            previewArea.style.background = '#2d3748';
        }, 200);
    }

    stopAllCaptures() {
        for (let viewportId of this.isRecording) {
            this.stopCapture(viewportId);
        }
        this.addLogEntry('All captures stopped', 'warning');
        this.showToast('All captures stopped', 'warning');
    }

    toggleFTPSettings(storageType) {
        const ftpSettings = document.getElementById('ftp-settings');
        ftpSettings.style.display = storageType === 'ftp' ? 'block' : 'none';
    }

    loadSettings() {
        // Load saved settings from localStorage
        const savedSettings = localStorage.getItem('humvidcap-settings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                
                // Apply saved settings
                if (settings.storageType) {
                    document.getElementById('storage-type').value = settings.storageType;
                    this.toggleFTPSettings(settings.storageType);
                }
                
                if (settings.ftpHost) document.getElementById('ftp-host').value = settings.ftpHost;
                if (settings.ftpUsername) document.getElementById('ftp-username').value = settings.ftpUsername;
                if (settings.ftpPath) document.getElementById('ftp-path').value = settings.ftpPath;
                
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        }
        
        // Save settings on change
        this.setupSettingsSaving();
    }

    setupSettingsSaving() {
        const settingsElements = [
            'storage-type', 'ftp-host', 'ftp-username', 'ftp-password', 'ftp-path'
        ];
        
        settingsElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    this.saveSettings();
                });
            }
        });
    }

    saveSettings() {
        const settings = {
            storageType: document.getElementById('storage-type').value,
            ftpHost: document.getElementById('ftp-host').value,
            ftpUsername: document.getElementById('ftp-username').value,
            ftpPath: document.getElementById('ftp-path').value
        };
        
        localStorage.setItem('humvidcap-settings', JSON.stringify(settings));
    }

    addLogEntry(message, type = 'info') {
        const logContainer = document.getElementById('activity-log');
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        
        const timestamp = new Date().toLocaleTimeString();
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
        
        // Keep only last 100 entries
        const entries = logContainer.querySelectorAll('.log-entry');
        if (entries.length > 100) {
            entries[0].remove();
        }
    }

    clearLog() {
        const logContainer = document.getElementById('activity-log');
        logContainer.innerHTML = '<div class="log-entry">Log cleared</div>';
    }

    downloadLogs() {
        const logContainer = document.getElementById('activity-log');
        const logEntries = logContainer.querySelectorAll('.log-entry');
        
        let logContent = 'HumVidCap Activity Log\n';
        logContent += '=====================\n\n';
        
        logEntries.forEach(entry => {
            logContent += entry.textContent + '\n';
        });
        
        const blob = new Blob([logContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `humvidcap-log-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        this.addLogEntry('Activity log downloaded', 'success');
        this.showToast('Activity log downloaded', 'success');
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
        
        // Make toast clickable to dismiss
        toast.addEventListener('click', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new HumVidCapApp();
    
    // Make app available globally for debugging
    window.humvidcap = app;
});