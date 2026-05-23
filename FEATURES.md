# Rotten - Complete Feature List

## 🎯 Overview
Rotten is a powerful Doc-to-PPT converter designed specifically for creating presentation slides from Word documents. Perfect for educational content, quiz presentations, and structured documents.

---

## 📋 Core Features

### 1. **File Management**
- ✅ **Automatic Upload**: Files upload automatically when selected (no manual upload button needed)
- ✅ **DOCX Support**: Upload Word documents (.docx format)
- ✅ **Background Images**: Optional background image support (PNG, JPG, JPEG)
- ✅ **Real-time Preview**: See background images immediately in preview
- ✅ **File Size Limits**: 
  - DOCX: Up to 20 MB
  - Background Images: Up to 10 MB

### 2. **Preview System**
- ✅ **Toggle Preview**: Show/hide preview with eye icon button
- ✅ **Responsive Layout**: 
  - Preview visible: Settings panel is compact (360px)
  - Preview hidden: Settings panel expands to full width with grid layout
- ✅ **16:9 Aspect Ratio**: Standard presentation format
- ✅ **Live Background**: Background image displays in real-time

---

## 🎨 Customization Options

### **Text Sizes**
| Setting | Range | Default | Description |
|---------|-------|---------|-------------|
| **Heading Font Size** | 16pt - 60pt | 32pt | Size for main headings and titles |
| **Content Font Size** | 12pt - 48pt | 20pt | Size for questions, options, and body text |

### **Spacing Controls**
| Setting | Range | Default | Description |
|---------|-------|---------|-------------|
| **Question Gap** | 5pt - 50pt | 15pt | Space between questions |
| **Line Spacing** | 1.0x - 3.0x | 1.5x | Line height multiplier |

### **Color Customization**
| Color Setting | Default | Purpose |
|---------------|---------|---------|
| **Heading Color** | #1a1a1a (Dark Gray) | Main headings and section titles |
| **Question/Option Color** | #000000 (Black) | Question text and answer options |
| **Year Tag Color** | #e02424 (Red) | Year badges (e.g., "SSC CGL 2023") |
| **Answer Color** | #16a34a (Green) | Correct answer highlighting |

### **Display Options**
- ✅ **Show Answer**: Toggle to show/hide correct answers
- ✅ **Show Bullet Points**: Enable/disable bullet points for options
- ✅ **Bullet Styles**:
  - ● Disc (Filled Circle)
  - ○ Circle (Hollow)
  - ■ Square
  - 1. Numbers
  - None (Plain Text)

---

## 🎯 Use Cases

### **Educational Content**
- Quiz presentations
- Exam preparation slides
- MCQ (Multiple Choice Questions) presentations
- Study material slides

### **Professional Presentations**
- Training materials
- Assessment slides
- Knowledge checks
- Interactive presentations

---

## 🖥️ User Interface

### **Organized Sections**
1. **File Upload** (Blue icon)
   - DOCX file upload
   - Background image upload
   - Upload status indicator

2. **Text Sizes** (Purple icon)
   - Heading font size selector
   - Content font size selector

3. **Spacing** (Green icon)
   - Question gap slider
   - Line spacing slider

4. **Colors** (Pink icon)
   - Heading color picker
   - Question/option color picker
   - Year tag color picker
   - Answer color picker

5. **Display Options** (Orange icon)
   - Show answer checkbox
   - Show bullet points checkbox
   - Bullet style dropdown

### **Responsive Design**
- **With Preview**: Compact vertical layout
- **Without Preview**: Expanded grid layout (3 columns on large screens)
- **Mobile Friendly**: Single column on small screens

---

## ⚡ Workflow

### **Quick Start**
1. **Upload Files**: Select DOCX and optional background image
2. **Customize**: Adjust fonts, colors, spacing, and display options
3. **Preview**: Toggle preview to see changes (if needed)
4. **Generate**: Click "Generate PowerPoint" button
5. **Download**: PPT file downloads automatically

### **Auto-Upload Feature**
- Files upload automatically when selected
- No manual "Upload" button needed
- Loading spinner shows upload progress
- Success message confirms upload completion

---

## 🎨 Design Philosophy

### **User-Friendly**
- Clear visual hierarchy with icons
- Organized sections with color-coded icons
- Intuitive controls (sliders, dropdowns, color pickers)
- Real-time feedback with status messages

### **Customizable**
- Extensive color options
- Flexible text sizing
- Multiple bullet styles
- Adjustable spacing

### **Efficient**
- Automatic file uploads
- Toggle preview for more space
- Sticky header and footer
- Smooth transitions

---

## 🔧 Technical Features

### **File Processing**
- Mammoth.js for DOCX parsing
- PptxGenJS for PowerPoint generation
- Image-size for background image handling
- Zod for settings validation

### **State Management**
- React hooks for state
- Automatic upload on file change
- Real-time preview updates
- Form validation

### **Styling**
- Tailwind CSS for responsive design
- Custom color pickers
- Smooth animations
- Gradient buttons

---

## 📊 Settings Schema

```typescript
{
  // Text Sizes
  fontSize: number (12-48),
  headingFontSize: number (16-60),
  
  // Spacing
  questionGap: number (5-50),
  lineSpacing: number (1-3),
  
  // Colors
  questionOptionColor: string (hex),
  headingColor: string (hex),
  yearColor: string (hex),
  answerColor: string (hex),
  
  // Display
  showAnswer: boolean,
  showBulletPoints: boolean,
  bulletStyle: 'disc' | 'circle' | 'square' | 'number' | 'none',
  
  // Layout
  contentArea: { top, left, width, height },
  backgroundImage: string (optional)
}
```

---

## 🚀 Future Enhancements

### **Planned Features**
- [ ] Multiple slide templates
- [ ] Font family selection
- [ ] Custom bullet point characters
- [ ] Slide transition effects
- [ ] Batch processing
- [ ] Template saving/loading
- [ ] Export to PDF
- [ ] Cloud storage integration

### **UI Improvements**
- [ ] Dark mode
- [ ] Keyboard shortcuts
- [ ] Drag-and-drop file upload
- [ ] Undo/redo functionality
- [ ] Settings presets

---

## 💡 Tips & Best Practices

### **For Best Results**
1. Use high-resolution background images (1920x1080 or higher)
2. Choose contrasting colors for readability
3. Keep font sizes appropriate for presentation viewing
4. Test with preview before generating
5. Use consistent spacing throughout

### **Performance Tips**
1. Keep DOCX files under 10 MB for faster processing
2. Optimize background images before upload
3. Close preview when adjusting many settings
4. Generate PPT only when all settings are finalized

---

## 📝 Version History

### **v0.2.0** (Current)
- ✅ Added comprehensive customization options
- ✅ Implemented preview toggle
- ✅ Added automatic file upload
- ✅ Enhanced UI with organized sections
- ✅ Added bullet point customization
- ✅ Improved responsive design

### **v0.1.0** (Initial)
- ✅ Basic DOCX to PPT conversion
- ✅ Simple settings panel
- ✅ Background image support
- ✅ Preview functionality

---

## 🤝 Support

For issues, questions, or feature requests, please contact the development team.

**Happy Presenting! 🎉**
