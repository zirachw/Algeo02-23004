# main.py
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import numpy as np
import mido
import json
import zipfile
import shutil
from pathlib import Path
import time
from rich.console import Console
from rich.table import Table
from typing import List, Dict, Optional

# Initialize Rich console for beautiful terminal output
console = Console()

class DatasetLoader:
    def __init__(self, testDir: str = "../../test"):
        """Initialize the dataset loader with directory paths and cleanup"""
        self.testDir = Path(testDir)
        self.tempDir = Path("temp_extracted")
        self.audiosDir = self.tempDir / "audios"
        self.mapperData = None
        
        # Cleanup on initialization
        if self.tempDir.exists():
            try:
                shutil.rmtree(self.tempDir)
            except Exception as e:
                console.print(f"[red]Warning: Could not clean up existing temp directory: {e}")
        
        self.tempDir.mkdir(exist_ok=True)
        self.audiosDir.mkdir(exist_ok=True)
    
    def extractZip(self, zipPath: str, extractTo: Path) -> None:
        """Extract MIDI files from zip archive. Aborts if non-MIDI files are found."""
        with zipfile.ZipFile(zipPath, 'r') as zipRef:
            # First check if all files are MIDI
            for file in zipRef.namelist():
                if not file.lower().endswith(('.mid', '.midi')):
                    console.print(f"[red]Error: Non-MIDI file found in zip: {file}")
                    console.print("[red]Aborting extraction - zip must contain only MIDI files.")
                    raise ValueError("Zip archive must contain only MIDI files.")
            
            # If we get here, all files are MIDI files, so extract them
            for file in zipRef.namelist():
                zipRef.extract(file, extractTo)
                console.print(f"[green]Extracted: {file}")
    
    def loadMapper(self) -> dict:
        """Load and validate mapper.json file"""
        mapperPath = self.testDir / "mapper.json"
        with open(mapperPath, 'r') as f:
            self.mapperData = json.load(f)
            
        # Validate minimum required attributes
        for song in self.mapperData["songs"]:
            if "audio" not in song or "album" not in song:
                raise ValueError("Mapper.json must contain 'audio' and 'album' attributes for each song")
        
        return self.mapperData
    
    def extractChannel1(self, inputPath: Path, outputPath: Path) -> None:
        """Extract channel 1 from input MIDI file and save to output path"""
        try:
            midiIn = mido.MidiFile(str(inputPath))
            midiOut = mido.MidiFile(ticks_per_beat=midiIn.ticks_per_beat)
            trackOut = mido.MidiTrack()
            midiOut.tracks.append(trackOut)
            
            for track in midiIn.tracks:
                for msg in track:
                    if not hasattr(msg, 'channel'):
                        trackOut.append(msg)
                    elif msg.channel == 0:  # Channel 1 is indexed as 0
                        trackOut.append(msg)
            
            midiOut.save(str(outputPath))
            console.print(f"[green]Successfully extracted channel 1 from: {inputPath.name}")
            
        except Exception as e:
            console.print(f"[red]Error processing MIDI file {inputPath}: {e}")
            raise
    
    def setupDataset(self) -> List[Dict]:
        """Set up the dataset by extracting files and processing MIDI files"""
        startTime = time.time()
        console.print("[bold blue]Setting up dataset...")
        
        # Extract zip file
        self.extractZip(str(self.testDir / "audios.zip"), self.audiosDir)
        self.loadMapper()
        
        audioMetadata = []
        for song in self.mapperData["songs"]:
            midiPath = self.audiosDir / song["audio"]
            if midiPath.exists():
                # Create output path for channel 1 extraction
                channel1Path = self.audiosDir / f"{midiPath.stem}_channel1.mid"
                self.extractChannel1(midiPath, channel1Path)
                
                # Create metadata with only required fields and default values
                metadata = {
                    "path": str(channel1Path),
                    "audio": song["audio"],
                    "album": song["album"],
                    "singer": song.get("singer", "-"),
                    "genre": song.get("genre", "-")
                }
                
                audioMetadata.append(metadata)
            else:
                console.print(f"[red]Warning: MIDI file not found: {midiPath}")
        
        setupTime = time.time() - startTime
        console.print(f"[green]Dataset setup completed in {setupTime:.2f} seconds")
        return audioMetadata
    
    def cleanup(self):
        """Clean up temporary files and directories"""
        if self.tempDir.exists():
            shutil.rmtree(self.tempDir)

class AudioProcessor:
    def __init__(self, similarityThreshold: float = 60.0):
        """Initialize the audio processor with configuration parameters"""
        self.similarityThreshold = similarityThreshold
        self.datasetFeatures = None
        self.audioMetadata = []
        self.datasetLoader = DatasetLoader()
        self.loadTime = 0
        self.processingTime = 0

    def processMidiFile(self, midiPath: str) -> np.ndarray:
        """Process MIDI file to extract features based on the reference implementation"""
        midiData = mido.MidiFile(midiPath)
        
        # Extract features as described in the reference images
        # 1. Absolute Tone Based (ATB)
        noteFrequencies = np.zeros(128)  # MIDI notes range from 0 to 127
        
        for track in midiData.tracks:
            for msg in track:
                if msg.type == 'note_on' and msg.velocity > 0:
                    noteFrequencies[msg.note] += 1
        
        # Normalize ATB histogram
        atbFeatures = noteFrequencies / np.sum(noteFrequencies) if np.sum(noteFrequencies) > 0 else noteFrequencies
        
        # 2. Relative Tone Based (RTB)
        rtbFeatures = np.zeros(255)  # -127 to +127 range
        previousNote = None
        
        for track in midiData.tracks:
            for msg in track:
                if msg.type == 'note_on' and msg.velocity > 0:
                    if previousNote is not None:
                        interval = msg.note - previousNote
                        rtbFeatures[interval + 127] += 1
                    previousNote = msg.note
        
        # Normalize RTB histogram
        rtbFeatures = rtbFeatures / np.sum(rtbFeatures) if np.sum(rtbFeatures) > 0 else rtbFeatures
        
        # 3. First Tone Based (FTB)
        ftbFeatures = np.zeros(255)  # -127 to +127 range
        
        for track in midiData.tracks:
            firstNote = None
            for msg in track:
                if msg.type == 'note_on' and msg.velocity > 0:
                    if firstNote is None:
                        firstNote = msg.note
                    else:
                        interval = msg.note - firstNote
                        ftbFeatures[interval + 127] += 1
        
        # Normalize FTB histogram
        ftbFeatures = ftbFeatures / np.sum(ftbFeatures) if np.sum(ftbFeatures) > 0 else ftbFeatures
        
        # Combine all features
        return np.concatenate([atbFeatures, rtbFeatures, ftbFeatures])

    def calculateSimilarity(self, features1: np.ndarray, features2: np.ndarray) -> float:
        """Calculate cosine similarity between two feature vectors"""
        dotProduct = np.dot(features1, features2)
        norm1 = np.linalg.norm(features1)
        norm2 = np.linalg.norm(features2)
        
        if norm1 == 0 or norm2 == 0:
            return 0
        
        similarity = dotProduct / (norm1 * norm2)
        return float(similarity * 100)  # Convert to percentage

    def loadDataset(self):
        """Load and process the dataset with timing"""
        startTime = time.time()
        
        with console.status("[bold green]Loading dataset...") as status:
            self.audioMetadata = self.datasetLoader.setupDataset()
            processedFeatures = []
            
            for idx, metadata in enumerate(self.audioMetadata):
                features = self.processMidiFile(metadata["path"])
                processedFeatures.append(features)
                console.print(f"[cyan]Processing MIDI file {idx+1}/{len(self.audioMetadata)}")
            
            self.datasetFeatures = np.array(processedFeatures)
        
        self.loadTime = time.time() - startTime
        console.print(f"[bold green]Dataset loaded and processed in {self.loadTime:.2f} seconds")

    def searchSimilarAudio(self, queryFeatures: np.ndarray) -> Dict:
        """Search for similar audio files using cosine similarity"""
        startTime = time.time()
        
        if self.datasetFeatures is None:
            raise ValueError("No dataset features available. Please load dataset first.")
        
        # Calculate similarities
        similarities = [self.calculateSimilarity(queryFeatures, features) 
                       for features in self.datasetFeatures]
        
        # Process results
        matchingResults = []
        for idx, similarity in enumerate(similarities):
            metadata = self.audioMetadata[idx]
            result = {
                'song': metadata['song'],
                'singer': metadata['singer'],
                'genre': metadata['genre'],
                'filename': metadata['filename'],
                'similarityPercentage': similarity
            }
            
            if similarity >= self.similarityThreshold:
                matchingResults.append(result)
        
        # Sort results by similarity
        matchingResults.sort(key=lambda x: x['similarityPercentage'], reverse=True)
        
        self.processingTime = time.time() - startTime
        
        results = {
            'matchesFound': len(matchingResults),
            'matchingResults': matchingResults,
            'processingMetrics': {
                'processingTime': self.processingTime,
                'loadTime': self.loadTime
            }
        }
        
        return results

    def cleanup(self):
        """Clean up resources"""
        self.datasetLoader.cleanup()

# FastAPI application setup
processor = AudioProcessor()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle management for the FastAPI application"""
    try:
        processor.loadDataset()
        yield
    finally:
        processor.cleanup()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/search")
async def searchSimilarAudio(
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
            processor.similarityThreshold = similarityThreshold
            queryFeatures = processor.processMidiFile(str(tempFile))
            results = processor.searchSimilarAudio(queryFeatures)
            return results
            
        finally:
            tempFile.unlink()  # Clean up temporary file
            
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)