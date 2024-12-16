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
import logging

# Initialize Rich console for beautiful terminal output
console = Console()

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class AudioDatasetLoader:
    def __init__(self, temp_extracted_path, test_dir: str = "../../test"):
        """Initialize the dataset loader with directory paths and cleanup"""
        self.test_dir = Path(test_dir)
        self.temp_dir = Path(temp_extracted_path)
        self.audios_dir = self.temp_dir / "audio"
        self.mapper_data = None
        
        # Cleanup on initialization
        if self.temp_dir.exists():
            try:
                shutil.rmtree(self.temp_dir)
            except Exception as e:
                console.print(f"[red]Warning: Could not clean up existing temp directory: {e}")
        
        self.temp_dir.mkdir(exist_ok=True)
        self.audios_dir.mkdir(exist_ok=True)
    
    def extract_zip(self, zipPath: str, extractTo: Path) -> None:
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
    
    def load_mapper(self, mapper_path) -> dict:
        """Load and validate mapper.json file"""
        mapperPath = self.test_dir / mapper_path
        with open(mapperPath, 'r') as f:
            self.mapperData = json.load(f)
            
        # Validate minimum required attributes
        for song in self.mapperData["songs"]:
            if "audio" not in song or "album" not in song:
                raise ValueError("Mapper.json must contain 'audio' and 'album' attributes for each song")
        
        return self.mapperData
    
    def extract_channel1(self, inputPath: Path, outputPath: Path) -> None:
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
    
    def setup_dataset(self, zip_path, mapper_path) -> List[Dict]:
        """Set up the dataset by extracting files and processing MIDI files"""
        startTime = time.time()
        console.print("[bold blue]Setting up dataset...")
        
        # Extract zip file
        self.extract_zip(str(self.test_dir / zip_path), self.audios_dir)
        self.load_mapper(mapper_path)
        
        audioMetadata = []
        for song in self.mapperData["songs"]:
            midiPath = self.audios_dir / song["audio"]
            if midiPath.exists():
                # Create output path for channel 1 extraction
                channel1Path = self.audios_dir / f"{midiPath.stem}_channel1.mid"
                self.extract_channel1(midiPath, channel1Path)
                
                # Create metadata with only required fields and default values
                metadata = {
                    "path": str(channel1Path),
                    "song": song["song"],
                    "album": song["album"],
                    "singer": song.get("singer", "-"),
                    "genre": song.get("genre", "-"),
                    "audio": song["audio"]
                }
                
                audioMetadata.append(metadata)
            else:
                console.print(f"[red]Warning: MIDI file not found: {midiPath}")
        
        setupTime = time.time() - startTime
        console.print(f"[green]Dataset setup completed in {setupTime:.2f} seconds")
        return audioMetadata
    
    def cleanup(self):
        """Clean up temporary files and directories"""
        if self.temp_dir.exists():
            shutil.rmtree(self.temp_dir)

class AudioProcessor:
    def __init__(self, temp_extracted_path,similarityThreshold: float = 60.0):
        """Initialize the audio processor with configuration parameters"""
        self.similarityThreshold = similarityThreshold
        self.dataset_features = None
        self.audioMetadata = []
        self.dataset_loader = AudioDatasetLoader(temp_extracted_path)
        self.loadTime = 0
        self.processingTime = 0

    def process_midi_file(self, midiPath: str) -> np.ndarray:
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
        logger.info("nyampe sini")
        # Combine all features
        return np.concatenate([atbFeatures, rtbFeatures, ftbFeatures])

    def calculate_similarity(self, features1: np.ndarray, features2: np.ndarray) -> float:
        """Calculate cosine similarity between two feature vectors"""
        dotProduct = np.dot(features1, features2)
        norm1 = np.linalg.norm(features1)
        norm2 = np.linalg.norm(features2)
        
        if norm1 == 0 or norm2 == 0:
            return 0
        
        similarity = dotProduct / (norm1 * norm2)
        return float(similarity * 100)  # Convert to percentage
    def create_results_table(self, results: Dict) -> Table:
        """Create a formatted table for results"""
        table = Table(show_header=True, header_style="bold magenta", title="Search Results")
        
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="green")
        
        table.add_row("Processing Time", f"{self.processing_time:.2f} seconds")
        table.add_row("Dataset Load Time", f"{self.load_time:.2f} seconds")
        table.add_row("Matches Found", str(results['matches_found']))
        
        return table

    def create_matches_table(self, matching_results: List[Dict]) -> Table:
        """Create a formatted table for matching results"""
        table = Table(show_header=True, header_style="bold magenta", title="Matching Songs")
        
        table.add_column("No.", style="cyan", justify="right")
        table.add_column("Song", style="green")
        table.add_column("Artist", style="blue")
        table.add_column("Genre", style="yellow")
        table.add_column("Similarity", style="red", justify="right")
        
        for idx, match in enumerate(matching_results, 1):
            table.add_row(
                str(idx),
                match['song'],
                match['singer'],
                match['genre'],
                f"{match['similarity_percentage']:.2f}%"
            )
        
        return table
    
    def load_dataset(self, temp_zip, mapper_path):
        """Load and process the dataset with timing"""
        startTime = time.time()
        
        with console.status("[bold green]Loading dataset...") as status:
            self.audioMetadata = self.dataset_loader.setup_dataset(temp_zip, mapper_path)
            processedFeatures = []
            
            for idx, metadata in enumerate(self.audioMetadata):
                features = self.process_midi_file(metadata["path"])
                processedFeatures.append(features)
                console.print(f"[cyan]Processing MIDI file {idx+1}/{len(self.audioMetadata)}")
            
            self.dataset_features = np.array(processedFeatures)
            logger.info("ini dataset features bro: ", self.dataset_features)
            
        
        self.loadTime = time.time() - startTime
        console.print(f"[bold green]Dataset loaded and processed in {self.loadTime:.2f} seconds")

    def search_similar_audio(self, queryFeatures: np.ndarray) -> Dict:
        """Search for similar audio files using cosine similarity"""
        startTime = time.time()
        console.print("plis bisaaa")
        if self.dataset_features is None:
            raise ValueError("No dataset features available. Please load dataset first.")
        
        console.print("dataset feature ada")
        console.print("ini query features", queryFeatures)
        console.print("ini features", self.dataset_features)

        # Calculate similarities
        similarities = [self.calculate_similarity(queryFeatures, features) 
                       for features in self.dataset_features]
        console.print("similarity udah keitung")
        console.print("similarity: ",similarities)
        # Process results
        matching_results = []
        for idx, similarity in enumerate(similarities):
            metadata = self.audioMetadata[idx]
            console.print(metadata)
            result = {
                'song': metadata['song'],
                'singer': metadata['singer'],
                'genre': metadata['genre'],
                'album': metadata['album'],
                'similarity_percentage': similarity
            }
            
            if similarity >= self.similarityThreshold:
                matching_results.append(result)
        
        console.print("matching_results belum ke-sort")
        # Sort results by similarity
        matching_results.sort(key=lambda x: x['similarity_percentage'], reverse=True)
        console.print("matching_results udah ke-sort")
        self.processingTime = time.time() - startTime
        
        console.print(matching_results)
        results = {
            'matches_found': len(matching_results),
            'matching_results': matching_results,
            'processing_metrics': {
                'processing_time': self.processingTime,
                'load_time': self.loadTime
            }
        }
        console.print(result)
        # Print formatted results
        # console.print("\n")
        # console.print(self.create_results_table(results))
        # console.print("\n")
        # console.print(self.create_matches_table(matching_results))
        # console.print("\n")
        
        return results

    def cleanup(self):
        """Clean up resources"""
        self.dataset_loader.cleanup()