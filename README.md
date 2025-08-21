# HumVidCap - Web-Based Screen Capture & Human Detection

A comprehensive web-based application for multi-viewport screen capture with human detection capabilities, designed for monitoring and recording from multiple sources simultaneously.

## 🚀 Features

### Multi-Viewport Capture
- **4 Independent Viewports**: Record from up to 4 different sources simultaneously
- **Flexible Source Types**: 
  - Desktop Window capture (specific applications)
  - Remote URL capture (web pages)
  - Full screen capture
- **Configurable Frame Rates**: 5, 10, or 15 FPS for optimal performance vs. quality

### Advanced Capture Options
- **Video Recording**: Continuous recording with configurable frame rates
- **Screenshot Capture**: Instant screenshots on demand
- **Real-time Preview**: Live preview of captured content in each viewport

### Human Detection & Recognition
- **AI-Powered Detection**: Automatic human detection in captured content
- **Person Management**: Add and track detected individuals
- **Confidence Scoring**: Detection confidence levels for accuracy assessment
- **Manual Addition**: Manually add people to the detection database

### Storage & Upload Options
- **Local Storage**: Save files directly to the server
- **FTP Upload**: Automatic upload to remote FTP servers
- **Configurable Paths**: Customizable storage locations and organization

### Activity Logging
- **Comprehensive Logging**: All activities are logged with timestamps
- **Real-time Log Display**: Live activity feed in the interface
- **Log Export**: Download activity logs for analysis
- **Session Tracking**: Track capture sessions and detected people

## 🛠️ Technology Stack

- **Backend**: Node.js with Express
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Real-time Communication**: Socket.IO
- **Screen Capture**: Puppeteer for web content
- **File Upload**: Multer for file handling
- **FTP Integration**: Built-in FTP client support
- **Logging**: Winston for comprehensive logging

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/acesonder/a_humvidcap.git
   cd a_humvidcap
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the application**:
   ```bash
   npm start
   ```

4. **Access the application**:
   Open your browser and navigate to `http://localhost:3000`

## 🖥️ Usage

### Basic Setup
1. **Select Source Type**: Choose between Desktop Window, Remote URL, or Full Screen
2. **Configure Source**: Enter the window name or URL to capture
3. **Set Capture Type**: Choose between video recording or screenshots
4. **Select Frame Rate**: Pick 5, 10, or 15 FPS based on your needs
5. **Enable Human Detection**: Toggle on for AI-powered person detection

### Starting Capture
1. Click **"Start Capture"** to begin recording
2. The viewport will show a live preview of the captured content
3. Use **"Take Screenshot"** for instant captures
4. Monitor the activity log for real-time status updates

### Human Detection
- **Automatic Detection**: When enabled, the system will automatically detect people
- **Manual Addition**: Use the "Add person name" field to manually add detected individuals
- **Confidence Levels**: View detection confidence percentages
- **Person Tracking**: All detected people are logged and tracked per session

### File Management
- **Local Storage**: Files are saved to the `uploads/` directory
- **FTP Upload**: Configure FTP settings in the File & Upload Settings panel
- **Activity Logs**: Download comprehensive logs of all activities

## 🔧 Configuration

### FTP Settings
Configure remote file storage by switching to "FTP Upload" and entering:
- **FTP Host**: Server hostname or IP address
- **Username**: FTP account username
- **Password**: FTP account password
- **Remote Path**: Destination directory on the FTP server

### Application Settings
Edit `config/app.json` to customize:
- **Port Configuration**: Change the default port (3000)
- **Logging Levels**: Adjust logging verbosity
- **Capture Limits**: Set maximum recording duration and file sizes
- **Human Detection**: Configure AI detection parameters

## 📁 Project Structure

```
a_humvidcap/
├── server/
│   ├── app.js              # Main server application
│   ├── screenCapture.js    # Screen capture service
│   ├── ftpService.js       # FTP upload functionality
│   └── humanDetection.js   # AI human detection service
├── public/
│   ├── index.html          # Main application interface
│   ├── styles.css          # Application styling
│   └── app.js              # Frontend JavaScript
├── config/
│   └── app.json            # Application configuration
├── uploads/                # Local file storage
├── logs/                   # Application logs
└── package.json            # Node.js dependencies
```

## 🔒 Security Features

- **CORS Protection**: Configurable cross-origin resource sharing
- **File Type Validation**: Restricted file upload types
- **Rate Limiting**: Protection against excessive requests
- **Input Sanitization**: Safe handling of user inputs

## 🚦 API Endpoints

- `POST /api/start-capture` - Start a capture session
- `POST /api/stop-capture` - Stop a capture session
- `POST /api/screenshot` - Take an instant screenshot
- `POST /api/add-person` - Add a person to the detection database
- `GET /api/sessions` - Get all active sessions
- `POST /api/upload` - Upload files to the server

## 🔍 Monitoring & Debugging

### Activity Log
- Real-time activity logging in the interface
- Downloadable log files for analysis
- Color-coded log entries (success, warning, error)

### Session Management
- Track active capture sessions
- Monitor detection statistics
- View session summaries and reports

## 🎯 Use Cases

- **Security Monitoring**: Monitor multiple areas or websites simultaneously
- **Content Creation**: Record web content and presentations
- **Compliance Monitoring**: Track and log human activity in recorded content
- **Remote Surveillance**: Capture content from remote sources
- **Research & Analysis**: Collect visual data for analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues, questions, or contributions, please:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Include screenshots and error logs when applicable

## 🔮 Future Enhancements

- **Mobile Support**: Responsive design for mobile devices
- **Cloud Storage**: Integration with cloud storage providers
- **Advanced AI**: Enhanced human recognition and behavior analysis
- **Multi-user Support**: User authentication and role management
- **Streaming**: Live streaming capabilities
- **Analytics Dashboard**: Advanced analytics and reporting
