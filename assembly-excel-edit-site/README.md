# Assembly Excel Editor - Web Application

Web version of the Assembly Excel Editor that generates Excel files with dynamic VLOOKUP formulas.

## Overview

This web application allows users to upload three Excel files (Assembly List, Part List, and Template Mapping) and automatically generates an Excel file with VLOOKUP formulas that connect the data from all three sources.

### Key Features

- **Web-based Interface**: No installation required, accessible from any browser
- **File Upload**: Simple drag-and-drop or file selection interface
- **Dynamic Formula Generation**: Creates VLOOKUP formulas with absolute paths
- **Real-time Progress**: Visual feedback during file processing
- **Statistics Display**: Shows detailed stats about processed assemblies, parts, and formulas
- **Automatic Download**: Generated file downloads automatically

## Architecture

```
Frontend (HTML/CSS/JS) → Express Server → ExcelFormulaGenerator → Excel File
```

### Tech Stack

- **Backend**: Node.js, Express.js
- **File Upload**: Multer
- **Excel Processing**: ExcelJS
- **Frontend**: Vanilla JavaScript, HTML5, CSS3

## Installation

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables (optional):**
   ```
   PORT=3000
   NODE_ENV=development
   UPLOAD_DIR=./uploads
   OUTPUT_DIR=./output
   MAX_FILE_SIZE=52428800
   ```

## Usage

### Development Mode

```bash
npm run dev
```

Starts server with nodemon for auto-restart on file changes.

### Production Mode

```bash
npm start
```

### Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## How It Works

### User Workflow

1. **Upload Files**: Select three Excel files:
   - Assembly List (ASSEMBLY_LIST.xlsx)
   - Part List (PART_LIST.xlsx)
   - Template Mapping (ASSEMBLY_PART_LIST.xlsx)

2. **Generate**: Click "GENERA FILE CON FORMULE" button

3. **Download**: The generated file downloads automatically

4. **View Stats**: See processing statistics on the results page

### API Endpoints

#### POST /generate

Generates Excel file with formulas.

**Request:**
```
Content-Type: multipart/form-data

Fields:
- assemblyList: File (Excel)
- partList: File (Excel)
- template: File (Excel)
```

**Response:**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="ASSEMBLY_PART_LIST_*.xlsx"

[Binary Excel file data]
```

**Error Response:**
```json
{
  "error": "Error message",
  "details": "Additional details"
}
```

#### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "uptime": 12345,
  "timestamp": "2025-11-28T14:25:13.000Z",
  "environment": "development"
}
```

## Project Structure

```
ASSEMBLY_EXCEL_EDIT_WEB/
│
├── server.js                 # Express server main file
├── package.json              # Dependencies and scripts
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
│
├── lib/
│   └── excelFormulaGenerator.js  # Core logic (from desktop app)
│
├── public/                   # Frontend files
│   ├── index.html           # Main HTML page
│   ├── styles.css           # Styles
│   └── app.js               # Client-side JavaScript
│
├── uploads/                  # Temporary uploaded files
│   └── .gitkeep
│
└── output/                   # Temporary generated files
    └── .gitkeep
```

## Deployment

### Deploy to Render

1. **Create a new Web Service** on [Render](https://render.com)

2. **Connect your Git repository**

3. **Configure settings:**
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node

4. **Set environment variables:**
   ```
   NODE_ENV=production
   PORT=10000
   MAX_FILE_SIZE=52428800
   ```

5. **Deploy**: Render will automatically deploy your app

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment (development/production) | development |
| UPLOAD_DIR | Upload directory | ./uploads |
| OUTPUT_DIR | Output directory | ./output |
| MAX_FILE_SIZE | Max file size in bytes | 52428800 (50MB) |

## Security Considerations

- **File Validation**: Only .xlsx and .xls files are accepted
- **File Size Limits**: Default 50MB max per file
- **CORS**: Configured for security
- **Automatic Cleanup**: Temporary files are deleted after processing
- **Error Handling**: Comprehensive error handling prevents crashes

## Troubleshooting

### File Upload Fails

- Check file size (default limit: 50MB)
- Ensure file format is .xlsx or .xls
- Check server logs for detailed error

### Server Won't Start

- Verify Node.js version (>= 16.0.0)
- Check if port is already in use
- Ensure all dependencies are installed (`npm install`)

### Generated File Has Errors

- Verify input files have correct structure
- Check server logs for processing errors
- Ensure template file has "Data" worksheet

## Development

### Running Tests

```bash
npm test
```

### Code Style

- ES6+ JavaScript
- Async/await for promises
- Comprehensive error handling
- Detailed logging

## Future Enhancements

- [ ] WebSocket for real-time progress updates
- [ ] User authentication
- [ ] File history/logging
- [ ] Database integration for analytics
- [ ] Preview file before download
- [ ] Batch processing multiple file sets
- [ ] API rate limiting

## Related Projects

- **Desktop Version**: [ASSEMBLY_EXCEL_EDIT_DESKTOP](https://github.com/GraphXpert/ASSEMBLY_EXCEL_EDIT_DESKTOP)

## License

MIT

## Author

GraphXpert

## Support

For issues and feature requests, please use the GitHub issue tracker.

---

**Version**: 1.0.0
**Last Updated**: 2025-11-28
