# Recent Changes

## Summary of Updates

### 1. ✅ Preview Toggle Button
- Added a toggle button in the settings panel header to show/hide the preview
- Button shows eye icon with "Show" or "Hide" text
- Preview can be toggled on/off to give more space for settings

### 2. ✅ Automatic File Upload
- **Removed** the "Upload Files" button
- Files now upload **automatically** when selected
- Shows "Uploading..." indicator with spinner during upload
- Success message appears briefly after upload completes
- No manual upload step required anymore

### 3. ✅ Background Image Preview
- Background image now displays in the preview panel
- When you upload a background image, it shows immediately in the slide preview
- If no background is uploaded, shows default gray background
- Uses `FileReader` to convert uploaded image to data URL for preview

## Files Modified

### `src/app/page.tsx`
- Made the page a client component to manage state
- Added `showPreview` state for toggle functionality
- Added `backgroundImage` state to pass to Preview component
- Passes props to SettingsPanel and Preview components

### `src/components/SettingsPanel.tsx`
- Added props: `onBackgroundChange`, `showPreview`, `onTogglePreview`
- Added `useEffect` hook to auto-upload files when they change
- Added `useEffect` hook to update background preview when file changes
- Removed manual "Upload Files" button
- Added preview toggle button in header with eye icons
- Added loading spinner during upload
- Added `isUploading` state to prevent duplicate uploads
- Disabled "Generate PPT" button while uploading

### `src/components/Preview.tsx`
- Added `backgroundImage` prop
- Conditionally renders background image or default background
- Uses inline style with `backgroundImage` CSS property

## How It Works Now

1. **Upload Files**: Just click and select files - they upload automatically
2. **Toggle Preview**: Click the eye icon button to show/hide preview
3. **See Background**: Background image appears in preview immediately after selection
4. **Generate PPT**: Click "Generate PPT" when ready (only enabled after successful upload)

## User Experience Improvements

- ✨ Faster workflow - no manual upload button needed
- ✨ Instant visual feedback - see background immediately
- ✨ More screen space - toggle preview when not needed
- ✨ Clear loading states - spinner shows during upload
- ✨ Better error handling - disabled states prevent invalid actions
