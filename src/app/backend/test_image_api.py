import requests
from pathlib import Path
from rich.console import Console
from rich.table import Table
from rich import print as rprint
import time

console = Console()

def format_results(results: dict) -> None:
    """Format and display search results using Rich"""
    # Create main results table
    main_table = Table(title="Image Search Results", show_header=True, header_style="bold magenta")
    
    main_table.add_column("Metric", style="cyan")
    main_table.add_column("Value", style="green")
    
    # Add processing metrics
    main_table.add_row(
        "Processing Time",
        f"{results['processing_metrics']['processing_time']:.3f} seconds"
    )
    main_table.add_row(
        "Dataset Load Time", 
        f"{results['processing_metrics']['load_time']:.3f} seconds"
    )
    main_table.add_row(
        "Matches Found",
        str(results['matches_found'])
    )
    
    # Print main results
    console.print("\n")
    console.print(main_table)
    
    # Create matches table
    if results['matches_found'] > 0:
        matches_table = Table(
            title="\nMatching Results", 
            show_header=True, 
            header_style="bold magenta"
        )
        
        matches_table.add_column("Rank", style="cyan", justify="right")
        matches_table.add_column("Song", style="green")
        matches_table.add_column("Artist", style="blue")
        matches_table.add_column("Genre", style="yellow")
        matches_table.add_column("Similarity", style="red", justify="right")
        
        # Add matching results
        for idx, match in enumerate(results['matching_results'], 1):
            matches_table.add_row(
                str(idx),
                match['song'],
                match['singer'],
                match['genre'],
                f"{match['similarity_percentage']:.2f}%"
            )
        
        console.print(matches_table)
    
    # Create all similarities table
    all_sim_table = Table(
        title="\nAll Similarities", 
        show_header=True, 
        header_style="bold magenta"
    )
    
    all_sim_table.add_column("Rank", style="cyan", justify="right")
    all_sim_table.add_column("Song", style="green")
    all_sim_table.add_column("Artist", style="blue")
    all_sim_table.add_column("Genre", style="yellow")
    all_sim_table.add_column("Similarity", style="red", justify="right")
    
    # Add all similarities
    for idx, sim in enumerate(results['all_similarities'], 1):
        all_sim_table.add_row(
            str(idx),
            sim['song'],
            sim['singer'],
            sim['genre'],
            f"{sim['similarity_percentage']:.2f}%"
        )
    
    console.print(all_sim_table)
    console.print("\n")

def test_image_search():
    api_url = 'http://127.0.0.1:8000/search'
    
    current_dir = Path(__file__).parent.parent.parent
    file_name = input("Enter the name of the image file (with extension): ")
    image_path = current_dir / 'test' / file_name
    
    if not image_path.exists():
        console.print(f"[red]Error: Test image not found at {image_path}")
        return
    
    try:
        with console.status("[bold green]Sending request to API...") as status:
            with open(image_path, 'rb') as image_file:
                files = {
                    'file': ('test.jpeg', image_file, 'image/jpeg')
                }
                data = {
                    'similarity_threshold': 60.0
                }
                
                start_time = time.time()
                response = requests.post(api_url, files=files, data=data)
                request_time = time.time() - start_time
        
        console.print(f"[bold cyan]Status Code:[/] {response.status_code}")
        console.print(f"[bold cyan]Request Time:[/] {request_time:.3f} seconds\n")
        
        if response.status_code == 200:
            results = response.json()
            format_results(results)
        else:
            console.print(f"[red]Error: {response.text}")
            
    except Exception as e:
        console.print(f"[red]Error occurred: {str(e)}")

if __name__ == "__main__":
    test_image_search()