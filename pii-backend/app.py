# app.py
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
import shutil
from typing import List

# Import your finalized engine
from pii_engine import run_pii_extraction

app = FastAPI(title="PII Extraction API")

# CORS Setup for Frontend (React/Vite/Vue)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/extract")
async def extract_pii(files: List[UploadFile] = File(...)):
   
    # Create a unique temporary directory for this specific request
    temp_dir = tempfile.mkdtemp()
    file_paths = []

    try:
        for file in files:
            # Preserve original filename for engine metadata
            file_path = os.path.join(temp_dir, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            file_paths.append(file_path)

        # Call the engine. Note: run_pii_extraction handles lists perfectly.
        # We pass the list of temporary paths.
        results = run_pii_extraction(file_paths)

        return {
            "status": results.get("status", "success"),
            "count": len(results.get("rows", [])),
            "rows": results.get("rows", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

    finally:
        # Crucial: Clean up the entire temp directory and its files
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)