# main.py
from tokenize import String
import os
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import numpy as np
import cv2
from typing import List, Dict, Tuple
import json
import zipfile
import shutil
from pathlib import Path
import time
from rich.console import Console
from rich.table import Table
from rich import print as rprint
from fastapi.exceptions import HTTPException
from audio.AudioSimilarity import AudioProcessor
from image.ImageSimilarity import ImageProcessor

# Initialize Rich console
console = Console()


# Get the absolute path of the current file (main.py)
current_file_path = os.path.abspath(__file__)

# Navigate up to the root directory (one level above src)
root_directory = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(current_file_path))),'public')

# Define the path for temp_extracted in the root directory
temp_extracted_path = os.path.join(root_directory, 'temp_extracted')

# Create the temp_extracted directory if it does not exist
if not os.path.exists(temp_extracted_path):
    os.makedirs(temp_extracted_path)

print(f"'temp_extracted' created at: {temp_extracted_path}")


# FastAPI application setup
imageProcessor = ImageProcessor(temp_extracted_path)
audioProcessor = AudioProcessor(temp_extracted_path)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import time
import logging
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@app.post("/upload-image-dataset")
async def upload_dataset(file: UploadFile = File(...), mapper_file: UploadFile = File(None)):
    # console.print(mapper_file.filename)
    if not file:
        raise HTTPException(status_code=400, detail="Both mapper_file and file are required")
    try:
        if mapper_file:
            logger.info(f"Received mapper file: {mapper_file.filename}")
        logger.info(f"Received dataset file: {file.filename}")
        logger.info("Starting dataset upload...")
        
        # Cleanup any existing dataset
        # logger.info("Cleaning up existing dataset...")
        # imageProcessor.cleanup()

        # Save uploaded zip file
        zip_path = f"temp_{time.time()}.zip"
        logger.info(f"Saving file to {zip_path}...")
        with open(zip_path, 'wb') as buffer:
            buffer.write(await file.read())

        mapper_path = None
        if mapper_file:
            # Save mapper file
            mapper_path = f"temp_{mapper_file.filename}"
            logger.info(f"Saving file to {mapper_path}...")
            with open(mapper_path, 'wb') as buffer:
                buffer.write(await mapper_file.read())
        
        # Update DatasetLoader to use this specific zip
        logger.info("Loading dataset...")
        imageProcessor.dataset_loader.test_dir = Path(zip_path).parent
        imageProcessor.load_dataset(zip_path, mapper_path)

        # Optional: Remove the temporary zip file after processing
        logger.info(f"Deleting temporary zip file {zip_path}...")
        Path(zip_path).unlink(missing_ok=True)

        logger.info("Dataset loaded successfully.")
        return {"status": "Dataset loaded successfully"}

    except Exception as e:
        logger.error(f"Error during dataset upload: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/upload-audio-dataset")
async def upload_dataset(file: UploadFile = File(...), mapper_file: UploadFile = File(None)):
    console.print("anjay")
    # console.print(mapper_file.filename)
    # return {"file": file.filename, "mapper_file": mapper_file.filename if mapper_file else None}

    if not file:
        raise HTTPException(status_code=400, detail="Both mapper_file and file are required")
    try:
        if mapper_file:
            logger.info(f"Received mapper file: {mapper_file.filename}")
        logger.info(f"Received dataset file: {file.filename}")
        logger.info("Starting dataset upload...")
        
        # Cleanup any existing dataset
        # logger.info("Cleaning up existing dataset...")
        # audioProcessor.cleanup()

        # Save uploaded zip file
        zip_path = f"temp_{time.time()}.zip"
        logger.info(f"Saving file to {zip_path}...")
        with open(zip_path, 'wb') as buffer:
            buffer.write(await file.read())

        # Save mapper file
        mapper_path = None
        if mapper_file:
            mapper_path = f"temp_{mapper_file.filename}"
            logger.info(f"Saving file to {mapper_path}...")
            with open(mapper_path, 'wb') as buffer:
                buffer.write(await mapper_file.read())
        
        # Update DatasetLoader to use this specific zip
        logger.info("Loading dataset...")
        audioProcessor.dataset_loader.test_dir = Path(zip_path).parent
        audioProcessor.load_dataset(zip_path, mapper_path)

        # Optional: Remove the temporary zip file after processing
        logger.info(f"Deleting temporary zip file {zip_path}...")
        Path(zip_path).unlink(missing_ok=True)

        logger.info("Dataset loaded successfully.")
        return {"status": "Dataset loaded successfully"}

    except Exception as e:
        logger.error(f"Error during dataset upload: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})
    
@app.post("/search-image")
async def search_similar_images(
    file: UploadFile = File(...),
    similarity_threshold: float = 60.0
):
    if imageProcessor.dataset_features is None:
        return JSONResponse(status_code=400, content={"error": "Dataset not loaded. Please upload a dataset first."})
    
    try:
        if not 0 <= similarity_threshold <= 100:
            return JSONResponse(status_code=400, content={"error": "Invalid threshold"})
        
        allowed_types = {"image/jpeg", "image/png"}
        if file.content_type not in allowed_types:
            return JSONResponse(status_code=400, content={"error": "Unsupported file type"})
        
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            return JSONResponse(status_code=400, content={"error": "Invalid image file"})
        
        imageProcessor.similarity_threshold = similarity_threshold
        query_features = imageProcessor.process_query_image(image)
        results = imageProcessor.search_similar_images(query_features)
        
        return results
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/search-audio")
async def search_similar_audio(
    file: UploadFile = File(...),
    similarityThreshold: float = 60.0
):
    """Endpoint to search for similar audio files"""
    try:
        if not 0 <= similarityThreshold <= 100:
            return JSONResponse(status_code=400, content={"error": "Invalid threshold"})
        
        if not file.filename.lower().endswith(('.mid', '.midi')):
            return JSONResponse(status_code=400, content={"error": "Only MIDI files are supported"})
        
        # Save uploaded file temporarily
        tempFile = Path("temp_query.mid")
        with tempFile.open("wb") as f:
            f.write(await file.read())
        
        try:
            audioProcessor.similarityThreshold = similarityThreshold
            queryFeatures = audioProcessor.process_midi_file(str(tempFile))
            results = audioProcessor.search_similar_audio(queryFeatures)
            return results
            
        finally:
            tempFile.unlink()  # Clean up temporary file
            
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)