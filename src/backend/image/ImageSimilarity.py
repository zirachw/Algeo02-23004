import json
import zipfile
import shutil
from rich.console import Console
from rich.table import Table
from typing import List, Dict
from pathlib import Path
import os
import time
import logging
import cv2
import numpy as np
from PIL import Image

console = Console()

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class ImageDatasetLoader:
    def __init__(self, temp_extracted_path, test_dir: str = "../../test"):
        self.test_dir = Path(test_dir)
        self.temp_dir = Path(temp_extracted_path)
        self.images_dir = self.temp_dir / "images"
        self.mapper_data = None
        
        # Add cleanup on initialization
        if self.temp_dir.exists():
            try:
                shutil.rmtree(self.temp_dir)
            except Exception as e:
                console.print(f"[red]Warning: Could not clean up existing temp directory: {e}")
        
        self.temp_dir.mkdir(exist_ok=True)
        self.images_dir.mkdir(exist_ok=True)
    
    def extract_zip(self, zip_path: str, extract_to: Path):
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_to)
    
    def load_mapper(self, mapper_path) -> dict:
        mapper_path = self.test_dir / mapper_path
        logger.info(f"this is the mapper_path {mapper_path}")
        with open(mapper_path, 'r') as f:
            self.mapper_data = json.load(f)
        return self.mapper_data
    
    def setup_dataset(self, zip_path, mapper_path:None):
        start_time = time.time()
        console.print("[bold blue]Setting up dataset...")
        self.extract_zip(str(self.test_dir / zip_path), self.images_dir)

        
        image_metadata = []
        if mapper_path:
            self.load_mapper(mapper_path)
            for song in self.mapper_data["songs"]:
                image_path = self.find_image_file(song["album"])
                if image_path:
                    image_metadata.append({
                        "path": str(image_path),
                        "song": song["song"],
                        "singer": song["singer"],
                        "genre": song["genre"],
                        "album": song["album"],
                        "audio": song["audio"]
                    })
        else:
            for album in os.listdir(self.images_dir):
                image_path = self.images_dir / album
                if image_path:
                    image_metadata.append({
                        "path": str(image_path),
                        "song": album,
                        "singer": "-",
                        "genre": "-",
                        "album": album,
                        "audio":"-"
                    })
        setup_time = time.time() - start_time
        console.print(f"[green]Dataset setup completed in {setup_time:.2f} seconds")
        return image_metadata
    
    def find_image_file(self, filename: str) -> Path:
        base_name = Path(filename).stem
        for ext in ['.jpg', '.jpeg', '.png']:
            potential_file = self.images_dir / f"{base_name}{ext}"
            if potential_file.exists():
                return potential_file
        return None
    
    def cleanup(self):
        if self.temp_dir.exists():
            shutil.rmtree(self.temp_dir)

class ImageProcessor:
    def __init__(self, temp_extracted_path, target_size=(64, 64), similarity_threshold=60):
        self.target_size = target_size
        self.dataset_features = None
        self.U_k = None
        self.mean_vector = None
        self.image_metadata = []
        self.dataset_loader = ImageDatasetLoader(temp_extracted_path)
        self.similarity_threshold = similarity_threshold
        self.load_time = 0
        self.processing_time = 0

    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """Convert image to grayscale, resize, and flatten"""
        # Convert to PIL Image if not already
        if not isinstance(image, Image.Image):
            # If it's a numpy array with 3 channels, convert to grayscale
            if len(image.shape) == 3:
                image = Image.fromarray(image).convert('L')
            else:
                image = Image.fromarray(image)
        
        # Resize the image
        resized = image.resize(self.target_size, Image.LANCZOS)
        
        # Convert to numpy array and flatten
        return np.array(resized).flatten()

    def compute_pca(self, X: np.ndarray, k: int = 100):
        """Manual PCA computation using eigendecomposition"""
        n_samples = X.shape[0]
        
        # Compute mean and center the data
        mean_vector = np.mean(X, axis=0)
        X_centered = X - mean_vector
        
        # Compute covariance matrix C = (1/N)X'X
        C = np.dot(X_centered.T, X_centered) / n_samples
        C = np.dot(C, C.T)
        
        # Compute eigenvalues and eigenvectors
        eigenvalues, eigenvectors = np.linalg.eigh(C)
        
        # Sort eigenvalues and eigenvectors in descending order
        idx = eigenvalues.argsort()[::-1]
        eigenvalues = eigenvalues[idx]
        eigenvectors = eigenvectors[:, idx]
        
        # Select k principal components
        k = min(k, len(eigenvalues))
        U_k = eigenvectors[:, :k]
        
        # Print explained variance
        explained_variance = eigenvalues[:k].sum() / eigenvalues.sum() * 100
        console.print(f"[yellow]Using {k} components explaining {explained_variance:.2f}% of variance")
        
        return U_k, mean_vector

    def process_query_image(self, image: np.ndarray) -> np.ndarray:
        """Process query image according to PCA projection formula"""
        processed_query = self.preprocess_image(image)
        # Project query image: q = (q' - μ)Uk
        q = np.dot((processed_query - self.mean_vector), self.U_k)
        return q

    def calculate_similarity_percentage(self, query_features: np.ndarray) -> np.ndarray:
        """Calculate Euclidean distances and convert to similarity percentages"""
        # Calculate Euclidean distances between query and all dataset images
        distances = np.sqrt(np.sum((self.dataset_features - query_features) ** 2, axis=1))
        
        # Convert distances to similarity percentages (inverse relationship)
        max_distance = np.max(distances) if np.max(distances) != 0 else 1
        similarities = 100 * (1 - distances / max_distance)
        
        return similarities

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

    def load_dataset(self, temp_zip, mapper_path: None):
        """Load and process the dataset with timing"""
        start_time = time.time()
        
        with console.status("[bold green]Loading dataset...") as status:
            # Load images
            self.image_metadata = self.dataset_loader.setup_dataset(temp_zip, mapper_path)
            processed_images = []
            
            for idx, metadata in enumerate(self.image_metadata):
                image = cv2.imread(metadata["path"])
                if image is not None:
                    processed = self.preprocess_image(image)
                    processed_images.append(processed)
                console.print(f"[cyan]Processing image {idx+1}/{len(self.image_metadata)}")
            
            X = np.array(processed_images)
            
            # Compute PCA
            k = min(100, X.shape[0])  # Number of principal components
            self.U_k, self.mean_vector = self.compute_pca(X, k)
            
            # Project all images to PCA space: Z = X'Uk
            self.dataset_features = np.dot((X - self.mean_vector), self.U_k)
        
        self.load_time = time.time() - start_time
        console.print(f"[bold green]Dataset loaded and processed in {self.load_time:.2f} seconds")

    def search_similar_images(self, query_features: np.ndarray) -> Dict:
        """Search for similar images using Euclidean distance"""
        start_time = time.time()
        
        if self.dataset_features is None:
            raise ValueError("No dataset features available. Please load dataset first.")

        # Calculate similarities
        similarities = self.calculate_similarity_percentage(query_features)
        
        # Process results
        all_similarities = []
        matching_results = []

        for idx, similarity in enumerate(similarities):
            metadata = self.image_metadata[idx]
            console.print(metadata)
            similarity_info = {
                'song': metadata['song'],
                'singer': metadata['singer'],
                'genre': metadata['genre'],
                'album': metadata['album'],
                'similarity_percentage': round(float(similarity), 2)
            }
            
            all_similarities.append(similarity_info)
            
            if similarity >= self.similarity_threshold:
                matching_results.append(similarity_info)

        # Sort results by similarity
        all_similarities.sort(key=lambda x: x['similarity_percentage'], reverse=True)
        matching_results.sort(key=lambda x: x['similarity_percentage'], reverse=True)
        
        self.processing_time = time.time() - start_time
        
        # Create result tables
        results = {
            'matches_found': len(matching_results),
            'matching_results': matching_results,
            'highest_similarity': all_similarities[0] if all_similarities else None,
            'all_similarities': all_similarities,
            'processing_metrics': {
                'processing_time': self.processing_time,
                'load_time': self.load_time
            }
        }
        
        # Print formatted results
        console.print("\n")
        console.print(self.create_results_table(results))
        console.print("\n")
        console.print(self.create_matches_table(matching_results))
        console.print("\n")
        
        return results
    
    def cleanup(self):
        self.dataset_loader.cleanup()