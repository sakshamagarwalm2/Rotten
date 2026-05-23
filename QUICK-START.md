# Quick Start Guide

## 🎯 Get Started in 3 Steps

### Step 1: Development Mode (Test the App)

Run the app as a desktop application in development mode:

```bash
npm run electron:dev
```

This will:
- Start the Next.js development server on http://localhost:3000
- Wait for the server to be ready
- Launch the Electron desktop window automatically

### Step 2: Test Your App

The Electron window will open with your application. You can:
- Upload DOCX files
- Customize settings (fonts, colors, layouts)
- Generate PowerPoint presentations
- Test all features

### Step 3: Build Windows Installer

When you're ready to distribute your app:

```bash
npm run electron:build:win
```

This will:
- Build the Next.js app for production
- Package it with Electron
- Create a Windows installer in the `dist` folder

The installer will be named something like:
- `Rotten Setup 0.1.0.exe` (NSIS installer)

## 🎨 Customization

### Change App Icon
1. Add `icon.png` to the `public` folder (512x512px recommended)
2. Rebuild: `npm run electron:build:win`

### Change App Name
Edit `electron-builder.json`:
```json
{
  "productName": "Your App Name"
}
```

### Change Window Size
Edit `electron/main.js`:
```javascript
mainWindow = new BrowserWindow({
  width: 1400,  // Change this
  height: 900,  // Change this
  // ...
});
```

## 🐛 Common Issues

### Issue: Port 3000 already in use
**Solution:** Stop other apps using port 3000, or change the port:
```bash
PORT=3001 npm run dev
```

### Issue: Electron window is blank
**Solution:** Wait a few seconds for Next.js to compile. Check the terminal for "Ready" message.

### Issue: Build fails
**Solution:** 
1. Delete `node_modules` and `.next` folders
2. Run `npm install` again
3. Try building again

## 📚 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Customize the UI in `src/components/`
- Add new features in `src/services/`
- Configure build options in `electron-builder.json`

## 🚀 Distribution

After building, you can:
1. Share the installer (`dist/Rotten Setup 0.1.0.exe`) with users
2. Users run the installer to install the app on their Windows PC
3. The app will be available in Start Menu and Desktop (if selected)

That's it! You now have a fully functional Windows desktop application! 🎉
