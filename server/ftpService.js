const FTP = require('ftp');
const fs = require('fs');
const path = require('path');

class FTPService {
    constructor() {
        this.client = new FTP();
        this.isConnected = false;
        this.connectionConfig = null;
    }

    async connect(config) {
        return new Promise((resolve, reject) => {
            this.connectionConfig = {
                host: config.host,
                port: config.port || 21,
                user: config.username,
                password: config.password,
                secure: config.secure || false,
                secureOptions: config.secureOptions || null
            };

            this.client.on('ready', () => {
                this.isConnected = true;
                console.log('FTP connection established');
                resolve({
                    success: true,
                    message: 'Connected to FTP server successfully'
                });
            });

            this.client.on('error', (error) => {
                this.isConnected = false;
                console.error('FTP connection error:', error);
                reject({
                    success: false,
                    message: `FTP connection failed: ${error.message}`
                });
            });

            this.client.on('close', () => {
                this.isConnected = false;
                console.log('FTP connection closed');
            });

            try {
                this.client.connect(this.connectionConfig);
            } catch (error) {
                reject({
                    success: false,
                    message: `Failed to initiate FTP connection: ${error.message}`
                });
            }
        });
    }

    async disconnect() {
        return new Promise((resolve) => {
            if (this.isConnected) {
                this.client.end();
            }
            this.isConnected = false;
            resolve({
                success: true,
                message: 'Disconnected from FTP server'
            });
        });
    }

    async uploadFile(localFilePath, remoteFilePath) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject({
                    success: false,
                    message: 'Not connected to FTP server'
                });
                return;
            }

            if (!fs.existsSync(localFilePath)) {
                reject({
                    success: false,
                    message: 'Local file does not exist'
                });
                return;
            }

            const readStream = fs.createReadStream(localFilePath);
            
            this.client.put(readStream, remoteFilePath, (error) => {
                if (error) {
                    console.error('FTP upload error:', error);
                    reject({
                        success: false,
                        message: `Upload failed: ${error.message}`
                    });
                } else {
                    console.log(`File uploaded successfully: ${remoteFilePath}`);
                    resolve({
                        success: true,
                        message: 'File uploaded successfully',
                        localPath: localFilePath,
                        remotePath: remoteFilePath
                    });
                }
            });
        });
    }

    async uploadMultipleFiles(fileList) {
        const results = [];
        
        for (const file of fileList) {
            try {
                const result = await this.uploadFile(file.localPath, file.remotePath);
                results.push(result);
            } catch (error) {
                results.push(error);
            }
        }

        return {
            success: true,
            message: `Processed ${fileList.length} files`,
            results: results
        };
    }

    async createDirectory(remotePath) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject({
                    success: false,
                    message: 'Not connected to FTP server'
                });
                return;
            }

            this.client.mkdir(remotePath, true, (error) => {
                if (error) {
                    console.error('FTP mkdir error:', error);
                    reject({
                        success: false,
                        message: `Failed to create directory: ${error.message}`
                    });
                } else {
                    console.log(`Directory created: ${remotePath}`);
                    resolve({
                        success: true,
                        message: 'Directory created successfully',
                        path: remotePath
                    });
                }
            });
        });
    }

    async listDirectory(remotePath = '/') {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject({
                    success: false,
                    message: 'Not connected to FTP server'
                });
                return;
            }

            this.client.list(remotePath, (error, list) => {
                if (error) {
                    console.error('FTP list error:', error);
                    reject({
                        success: false,
                        message: `Failed to list directory: ${error.message}`
                    });
                } else {
                    resolve({
                        success: true,
                        message: 'Directory listed successfully',
                        path: remotePath,
                        files: list
                    });
                }
            });
        });
    }

    async deleteFile(remotePath) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject({
                    success: false,
                    message: 'Not connected to FTP server'
                });
                return;
            }

            this.client.delete(remotePath, (error) => {
                if (error) {
                    console.error('FTP delete error:', error);
                    reject({
                        success: false,
                        message: `Failed to delete file: ${error.message}`
                    });
                } else {
                    console.log(`File deleted: ${remotePath}`);
                    resolve({
                        success: true,
                        message: 'File deleted successfully',
                        path: remotePath
                    });
                }
            });
        });
    }

    async getFileSize(remotePath) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject({
                    success: false,
                    message: 'Not connected to FTP server'
                });
                return;
            }

            this.client.size(remotePath, (error, size) => {
                if (error) {
                    console.error('FTP size error:', error);
                    reject({
                        success: false,
                        message: `Failed to get file size: ${error.message}`
                    });
                } else {
                    resolve({
                        success: true,
                        message: 'File size retrieved successfully',
                        path: remotePath,
                        size: size
                    });
                }
            });
        });
    }

    async testConnection(config) {
        try {
            await this.connect(config);
            const testResult = await this.listDirectory('/');
            await this.disconnect();
            
            return {
                success: true,
                message: 'FTP connection test successful',
                serverInfo: testResult
            };
        } catch (error) {
            return {
                success: false,
                message: `FTP connection test failed: ${error.message || error}`
            };
        }
    }

    // Helper method to generate remote path based on session and file type
    generateRemotePath(sessionId, filename, basePath = '/humvidcap') {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return path.posix.join(basePath, `${year}/${month}/${day}`, sessionId, filename);
    }

    // Helper method to upload session files (screenshots, videos, logs)
    async uploadSessionFiles(sessionId, files, basePath = '/humvidcap') {
        const uploadResults = [];
        
        try {
            // Create session directory
            const sessionPath = path.posix.join(basePath, sessionId);
            await this.createDirectory(sessionPath);
            
            for (const file of files) {
                const remotePath = this.generateRemotePath(sessionId, file.filename, basePath);
                
                try {
                    const result = await this.uploadFile(file.localPath, remotePath);
                    uploadResults.push({
                        filename: file.filename,
                        success: true,
                        remotePath: remotePath,
                        result: result
                    });
                } catch (error) {
                    uploadResults.push({
                        filename: file.filename,
                        success: false,
                        error: error.message,
                        localPath: file.localPath
                    });
                }
            }
            
            return {
                success: true,
                message: `Uploaded ${uploadResults.filter(r => r.success).length} of ${files.length} files`,
                results: uploadResults
            };
        } catch (error) {
            return {
                success: false,
                message: `Failed to upload session files: ${error.message}`,
                results: uploadResults
            };
        }
    }

    // Get connection status
    getStatus() {
        return {
            connected: this.isConnected,
            config: this.connectionConfig ? {
                host: this.connectionConfig.host,
                port: this.connectionConfig.port,
                user: this.connectionConfig.user,
                secure: this.connectionConfig.secure
            } : null
        };
    }
}

module.exports = FTPService;