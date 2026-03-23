# Automated Certificate Generation System

Generate personalized DOCX certificates quickly by filling a Word template with data from your Excel sheet. Preview what you’ll get, then export finished files ready to print or share.

## Features
- Upload a DOCX template that contains placeholders like `{{name}}`
- Import recipient data from Excel (`.xlsx` or `.csv`)
- Validate that your Excel columns match the template tags
- Preview certificates in the browser
- Export:
  - a single certificate DOCX (current page/record)
  - or a merged DOCX for all entries

## How It Works
1. **Template**
   - Upload your DOCX file.
   - Add placeholders in Word where you want data inserted, for example: `{{name}}`, `{{school}}`, `{{date}}`.
2. **Data Import**
   - Upload an Excel file with column headers that match the placeholder names (same spelling).
3. **Export**
   - Use the preview to check the result.
   - Download the DOCX and open it in Word to verify the final look.

## Warning About Preview
The in-browser preview is approximate and may not match Word exactly (layout, fonts, and fine details can differ). Always download the DOCX and open it in Word to confirm before printing or sharing.

## Tech Stack
- React + TypeScript
- Vite
- Tailwind CSS
- `docxtemplater` / `pizzip` for filling DOCX templates
- `docx-preview` for in-browser preview
- `docx-merger` for merged exports
- Zustand for app state
- `react-router-dom` for navigation

## Local Setup
### Prerequisites
- Node.js

### Run Locally
1. Install dependencies:
   `npm install`
2. Start the development server:
   `npm run dev`
3. Open:
   `http://localhost:3000`

### Build for Production
- `npm run build`
- (optional) `npm run preview`

## Deployment (Vercel)
This app uses Vite, so set Vercel build settings to:
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`

## Credits
Made by Emil Joaquin H. Diaz, with Carl Iglesia and Peter Kent Hinolan.