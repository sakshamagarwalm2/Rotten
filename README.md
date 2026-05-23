# Rotten - Doc to PPT Converter

Save time from non-productive doc to ppt work. Convert your Word documents to PowerPoint presentations with ease!

## 🚀 Features

- Convert DOCX files to PowerPoint presentations
- Customizable fonts, colors, and layouts
- Desktop application for Windows
- Modern and intuitive UI

## 📋 Prerequisites

- Node.js (v20 or higher)
- npm or yarn

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Development Mode

#### Run as Web Application
```bash
npm run dev
```
Then open [http://localhost:3000](http://localhost:3000) in your browser.

#### Run as Electron Desktop App
```bash
npm run electron:dev
```
This will start both the Next.js dev server and Electron app.

### 3. Build for Production

#### Build Web Application
```bash
npm run build
```

#### Build Windows Desktop Application
```bash
npm run electron:build:win
```

The installer will be created in the `dist` folder.

## 📦 Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build Next.js for production
- `npm run electron` - Run Electron in development mode
- `npm run electron:dev` - Run both Next.js and Electron in development
- `npm run electron:build` - Build Electron app for all platforms
- `npm run electron:build:win` - Build Electron app for Windows only
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint

## 🖼️ Custom Icon

To use a custom icon for your Windows app:

1. Place a PNG file named `icon.png` in the `public` folder
2. Recommended size: 512x512 pixels or larger
3. Rebuild the app with `npm run electron:build:win`

## 🏗️ Project Structure

```
rotten/
├── electron/           # Electron main process files
│   ├── main.js        # Electron entry point
│   └── preload.js     # Preload script for security
├── src/               # Next.js source code
│   ├── app/           # Next.js app directory
│   ├── components/    # React components
│   ├── services/      # Business logic
│   └── types/         # TypeScript types
├── public/            # Static assets
├── electron-builder.json  # Electron builder config
└── package.json       # Dependencies and scripts
```

## 🔧 Troubleshooting

### Port Already in Use
If port 3000 is already in use, you can change it:
```bash
PORT=3001 npm run dev
```

### Electron Window Not Opening
Make sure the Next.js dev server is running before Electron starts. The `electron:dev` script handles this automatically.

## 📝 License

Private

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.
