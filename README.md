# PII Extractor — Document Processing System

An offline system for detecting and extracting **Personally Identifiable Information (PII)** from documents such as images, PDFs, Word files, and Excel sheets.

---

## Key Features

- Fully offline document processing  
- Supports multiple file formats:
  - Images (JPG, PNG)  
  - PDF documents  
  - Word files (DOCX)  
  - Excel files (XLSX)  
- OCR-based text extraction using **Tesseract**  
- Hybrid PII detection:
  - Regex for structured IDs (PAN, Aadhaar, phone, email, etc.)  
  - NLP-based name extraction using **spaCy**  
  - Fuzzy matching for noisy OCR output  
- FastAPI backend for file upload and inference  
- React-based frontend interface  

---

## Tech Stack

### Backend

- Python 3.11+  
- FastAPI  
- Uvicorn  
- OpenCV (`cv2`)  
- PyTesseract (OCR)  
- PyMuPDF (PDF parsing)  
- spaCy (NLP)  
- pandas (Excel processing)  
- python-docx  
- rapidfuzz (fuzzy string matching)  
- python-magic / python-magic-bin (file type detection)  

### Frontend

- React (Vite)  
- HTML, CSS, JavaScript  

---

## Backend Setup Instructions

### Step 1: Create Python Environment

Using Conda:

```bash
conda create -n pii-backend python=3.11
conda activate pii-backend
```
```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```
## Installation

### Verify Tesseract OCR Installation

- Make sure Tesseract is installed and added to your **User PATH**.  
- Test in terminal / Anaconda Prompt:

```bash
tesseract --version
```
# Activate your Python environment first
```bash
conda activate pii-backend   
```
# Start the server
```bash
uvicorn main:app --reload
```
# Run Frontend
```bash
npm install
npm run dev



