from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import numpy as np
import cv2
from typing import Dict, Any, Set
from image import ImageProcessor

# Initialize the image processor
processor: ImageProcessor = ImageProcessor()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle management for the FastAPI application"""
    try:
        processor.loadDataset()
        yield
    finally:
        processor.cleanup()

# Initialize FastAPI application with CORS middleware
app: FastAPI = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/search-images")
async def searchSimilarImages(
    file: UploadFile = File(...),
    similarityThreshold: float = 60.0
) -> Dict[str, Any]:
    """
    Endpoint for searching similar images based on uploaded image.
    
    Args:
        file: Uploaded image file
        similarityThreshold: Minimum similarity percentage for matches (0-100)
    
    Returns:
        Dict containing search results or error message
    """
    try:
        # Validate similarity threshold
        if not 0 <= similarityThreshold <= 100:
            return JSONResponse(status_code=400, content={"error": "Invalid threshold"})
        
        # Validate file type
        allowedTypes: Set[str] = {"image/jpeg", "image/png"}
        if file.content_type not in allowedTypes:
            return JSONResponse(status_code=400, content={"error": "Unsupported file type"})
        
        # Read and decode image
        contents: bytes = await file.read()
        nparr: np.ndarray = np.frombuffer(contents, np.uint8)
        image: np.ndarray = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            return JSONResponse(status_code=400, content={"error": "Invalid image file"})
        
        # Process image and search for similarities
        processor.similarityThreshold = similarityThreshold
        queryFeatures: np.ndarray = processor.processQueryImage(image)
        results: Dict[str, Any] = processor.searchSimilarImages(queryFeatures)
        
        return results
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)