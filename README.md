# Personal Cloud Hub

A comprehensive personal cloud hub with advanced file management, PDF processing, rich note-taking, and analytics dashboard built with React/TypeScript and Express.

## Features

- **File Management**: Upload, organize, and preview files with drag-drop support
- **PDF Viewer**: Built-in PDF viewer with metadata extraction
- **Notes System**: Rich note-taking with Google Keep-style interface
- **Search**: Real-time search across files and notes
- **Analytics Dashboard**: Storage statistics and file type analytics
- **Dark/Light Theme**: Responsive theme switching
- **Data Export/Import**: Backup and restore your data
- **Docker Support**: Production-ready containerization

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, TanStack Query
- **Backend**: Node.js, Express, TypeScript
- **Database**: File-based document storage (no external DB required)
- **UI Components**: Radix UI, Shadcn/ui
- **File Processing**: Multer, PDF parsing
- **Containerization**: Docker, Docker Compose

## Quick Start

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd personal-cloud-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5000`

### Production Deployment with Docker

1. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` for your configuration

2. **Create data directories**
   ```bash
   mkdir -p data/{uploads,backups}
   ```

3. **Start services**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Application: `http://localhost:5000`

## Directory Structure

```
personal-cloud-hub/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilities
├── server/                 # Express backend
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Storage interface
│   └── vite.ts            # Vite integration
├── shared/                 # Shared types/schemas
├── data/                   # Docker volumes
│   ├── uploads/           # Uploaded files
│   └── backups/           # Data backups
├── docs/                   # Documentation
├── docker-compose.yml     # Docker services
├── Dockerfile             # Container definition
└── package.json           # Dependencies
```

## Environment Variables

### Development
- `NODE_ENV=development` (default)
- No additional configuration required

### Production
- `NODE_ENV=production`
- `UPLOAD_PATH` - File upload directory

## API Endpoints

### Files
- `GET /api/files` - List files
- `POST /api/files` - Upload files
- `PUT /api/files/:id` - Update file
- `DELETE /api/files/:id` - Delete file
- `POST /api/files/folder` - Create folder

### Notes
- `GET /api/notes` - List notes
- `POST /api/notes` - Create note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Search
- `GET /api/search?q=query` - Search files and notes

### Analytics
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/file-types` - File type breakdown
- `GET /api/dashboard/recent-files` - Recent files
- `GET /api/dashboard/largest-files` - Largest files

## Features Guide

### File Management
- Drag and drop files to upload
- Create folders for organization
- Preview images and PDFs
- Download files
- Search by filename

### Notes System
- Create rich text notes
- Color coding for organization
- Pin important notes
- Auto-save functionality
- Search note content

### PDF Viewer
- View PDFs directly in browser
- Extract and display metadata
- Navigate between pages
- Zoom controls

### Search
- Real-time search across files and notes
- Dropdown results with quick navigation
- Search by filename and note content

### Settings
- Theme switching (Light/Dark/System)
- File compression settings
- Auto-save configuration
- Data export/import
- Cache management

## Docker Volumes

All data is stored in the `./data` directory:

- `./data/uploads/` - User uploaded files
- `./data/backups/` - Data backups

## Backup and Restore

### Manual Backup
1. Export data via Settings → Data Management → Export Data
2. Save the JSON file securely

### Docker Backup
```bash
# Backup files
tar -czf backup-$(date +%Y%m%d).tar.gz data/
```

### Restore
1. Import data via Settings → Data Management → Import Data
2. Select your backup JSON file

## Security Features

- Non-root Docker user
- File type validation
- Input sanitization
- CORS protection

## Performance Optimizations

- File compression support
- Lazy loading components
- Image optimization
- Query caching
- Bundle splitting

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using port 5000
   lsof -i :5000
   # Kill the process or change port in docker-compose.yml
   ```

2. **File upload fails**
   ```bash
   # Check upload directory permissions
   ls -la data/uploads/
   # Ensure directory exists and is writable
   ```

### Logs
```bash
# Application logs
docker logs cloud-hub-app

# All services logs
docker-compose logs -f
```

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript check

### Adding Features
1. Update shared schema in `shared/schema.ts`
2. Add storage methods in `server/storage.ts`
3. Create API routes in `server/routes.ts`
4. Build frontend components in `client/src/`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review Docker logs
3. Verify environment configuration
4. Check network connectivity

## Version History

### v1.0.0
- Initial release
- File management system
- Notes functionality
- PDF viewer
- Search capabilities
- Docker support