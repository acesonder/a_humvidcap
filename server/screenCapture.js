const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ScreenCaptureService {
    constructor() {
        this.browsers = new Map();
        this.pages = new Map();
    }

    async initializeBrowser(sessionId) {
        try {
            const browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu'
                ]
            });
            
            this.browsers.set(sessionId, browser);
            return browser;
        } catch (error) {
            console.error('Error initializing browser:', error);
            throw error;
        }
    }

    async startUrlCapture(sessionId, url, options = {}) {
        try {
            const browser = await this.initializeBrowser(sessionId);
            const page = await browser.newPage();
            
            await page.setViewport({
                width: options.width || 1280,
                height: options.height || 720,
                deviceScaleFactor: 1
            });
            
            await page.goto(url, { waitUntil: 'networkidle2' });
            this.pages.set(sessionId, page);
            
            return {
                success: true,
                message: 'URL capture started successfully'
            };
        } catch (error) {
            console.error('Error starting URL capture:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    async takeScreenshot(sessionId, options = {}) {
        try {
            const page = this.pages.get(sessionId);
            if (!page) {
                throw new Error('No active page found for session');
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `screenshot_${sessionId}_${timestamp}.png`;
            const filepath = path.join(__dirname, '../uploads', filename);

            await page.screenshot({
                path: filepath,
                fullPage: options.fullPage || false,
                quality: options.quality || 90
            });

            return {
                success: true,
                filename: filename,
                filepath: filepath
            };
        } catch (error) {
            console.error('Error taking screenshot:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    async startVideoRecording(sessionId, options = {}) {
        try {
            const page = this.pages.get(sessionId);
            if (!page) {
                throw new Error('No active page found for session');
            }

            // This is a simplified implementation
            // In a real scenario, you would use screen recording libraries
            const frameRate = options.frameRate || 10;
            const duration = options.duration || 30; // seconds
            
            const frames = [];
            const interval = 1000 / frameRate; // milliseconds between frames
            
            const captureFrame = async () => {
                try {
                    const screenshot = await page.screenshot({ 
                        encoding: 'base64',
                        fullPage: false 
                    });
                    frames.push(screenshot);
                } catch (error) {
                    console.error('Error capturing frame:', error);
                }
            };

            // Capture frames at specified intervals
            const captureInterval = setInterval(captureFrame, interval);
            
            // Stop after specified duration
            setTimeout(() => {
                clearInterval(captureInterval);
                this.saveVideoFrames(sessionId, frames, options);
            }, duration * 1000);

            return {
                success: true,
                message: 'Video recording started',
                expectedFrames: Math.floor(duration * frameRate)
            };
        } catch (error) {
            console.error('Error starting video recording:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    async saveVideoFrames(sessionId, frames, options = {}) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `video_${sessionId}_${timestamp}.json`;
            const filepath = path.join(__dirname, '../uploads', filename);

            const videoData = {
                sessionId: sessionId,
                timestamp: timestamp,
                frameRate: options.frameRate || 10,
                frameCount: frames.length,
                frames: frames
            };

            fs.writeFileSync(filepath, JSON.stringify(videoData, null, 2));

            return {
                success: true,
                filename: filename,
                frameCount: frames.length
            };
        } catch (error) {
            console.error('Error saving video frames:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    async getPageMetadata(sessionId) {
        try {
            const page = this.pages.get(sessionId);
            if (!page) {
                throw new Error('No active page found for session');
            }

            const title = await page.title();
            const url = await page.url();
            const viewport = await page.viewport();

            return {
                success: true,
                metadata: {
                    title: title,
                    url: url,
                    viewport: viewport
                }
            };
        } catch (error) {
            console.error('Error getting page metadata:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    async stopCapture(sessionId) {
        try {
            const page = this.pages.get(sessionId);
            const browser = this.browsers.get(sessionId);

            if (page) {
                await page.close();
                this.pages.delete(sessionId);
            }

            if (browser) {
                await browser.close();
                this.browsers.delete(sessionId);
            }

            return {
                success: true,
                message: 'Capture stopped successfully'
            };
        } catch (error) {
            console.error('Error stopping capture:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    async simulateWindowCapture(sessionId, windowName, options = {}) {
        // This is a placeholder for window capture functionality
        // In a real implementation, you would use native APIs or libraries
        // like node-desktop-screenshot or similar
        
        try {
            console.log(`Simulating window capture for: ${windowName}`);
            
            // Create a simulated screenshot
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `window_${sessionId}_${timestamp}.txt`;
            const filepath = path.join(__dirname, '../uploads', filename);
            
            const simulatedData = `
                Window Capture Simulation
                ========================
                Session ID: ${sessionId}
                Window Name: ${windowName}
                Timestamp: ${timestamp}
                Options: ${JSON.stringify(options, null, 2)}
                
                Note: This is a simulation. In a production environment,
                you would integrate with native screen capture APIs.
            `;
            
            fs.writeFileSync(filepath, simulatedData);
            
            return {
                success: true,
                filename: filename,
                message: 'Window capture simulation completed'
            };
        } catch (error) {
            console.error('Error in window capture simulation:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    async simulateScreenCapture(sessionId, options = {}) {
        // Placeholder for full screen capture
        try {
            console.log('Simulating full screen capture');
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `screen_${sessionId}_${timestamp}.txt`;
            const filepath = path.join(__dirname, '../uploads', filename);
            
            const simulatedData = `
                Screen Capture Simulation
                ========================
                Session ID: ${sessionId}
                Timestamp: ${timestamp}
                Options: ${JSON.stringify(options, null, 2)}
                
                Note: This is a simulation. In a production environment,
                you would integrate with native screen capture APIs.
            `;
            
            fs.writeFileSync(filepath, simulatedData);
            
            return {
                success: true,
                filename: filename,
                message: 'Screen capture simulation completed'
            };
        } catch (error) {
            console.error('Error in screen capture simulation:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Clean up resources
    async cleanup() {
        try {
            for (let [sessionId, browser] of this.browsers) {
                await browser.close();
            }
            this.browsers.clear();
            this.pages.clear();
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
}

module.exports = ScreenCaptureService;