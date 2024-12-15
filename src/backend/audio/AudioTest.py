import os
from pathlib import Path
from Converter import ToMidi

def processAudioFile(inputPath: str, outputPath: str, isMonophonic: bool = False) -> bool:
    """
    Process an audio file to MIDI using the ToMidi converter.
    
    Args:
        inputPath: Path to the input audio file
        outputPath: Path where the output MIDI file will be saved
        isMonophonic: Whether the audio is monophonic/vocal-only.
                     If True, skips vocal separation.
                     If False, applies vocal separation.
    
    Returns:
        bool: True if conversion was successful, False otherwise
    """
    try:
        # Create converter instance with optimized settings for vocal conversion
        # These parameters are carefully chosen for vocal processing:
        # - Longer note duration helps capture sustained vocals
        # - Moderate amplitude threshold balances sensitivity
        # - Stability window of 5 provides good pitch detection stability
        converter = ToMidi(
            minNoteDuration=0.1,      # Longer notes for clearer melody
            amplitudeThreshold=0.05,   # Standard threshold for note detection
            stabilityWindow=5,         # Window for analyzing note stability
            velocity=100,              # Standard MIDI velocity
            minMidiNote=40,           # E2 - good lower bound for vocals
            maxMidiNote=84            # C6 - reasonable upper limit for voices
        )
        
        # For monophonic audio (like isolated vocals), we skip the separation step
        # For polyphonic audio (like full songs), we need to separate vocals first
        separateVocals = not isMonophonic
        
        # Perform the conversion with appropriate vocal separation setting
        success = converter.convertToMidi(
            inputPath,
            outputPath,
            separateVocals=separateVocals
        )
        
        return success
        
    except Exception as e:
        print(f"Error during conversion: {str(e)}")
        return False

# def main():
#     """
#     Interactive command-line interface for the ToMidi converter.
#     Guides users through the conversion process with intelligent defaults
#     and helpful prompts for better user experience.
#     """
#     try:
#         # Collect input file path with validation
#         while True:
#             inputFile = input("Enter the path to your audio file: ").strip()
#             if os.path.exists(inputFile):
#                 break
#             print("File not found. Please enter a valid file path.")

#         # Set up output file path with smart defaults
#         outputFile = input("Enter the desired output MIDI file path (press Enter for automatic): ").strip()
#         if not outputFile:
#             # Automatically generate output path by replacing the extension
#             outputFile = str(Path(inputFile).with_suffix('.mid'))
            
#         # Determine audio type through user input
#         while True:
#             isMonophonic = input("Is your audio monophonic / vocal only? (y/n): ").strip().lower()
#             if isMonophonic in ('y', 'n'):
#                 break
#             print("Please enter 'y' for yes or 'n' for no.")
        
#         # Convert the boolean response and process the file
#         success = processAudioFile(
#             inputFile,
#             outputFile,
#             isMonophonic=(isMonophonic == 'y')
#         )
        
#         if success:
#             print(f"\nSuccessfully converted {inputFile} to {outputFile}")
        
#     except KeyboardInterrupt:
#         print("\nConversion cancelled by user.")
#     except Exception as e:
#         print(f"\nConversion failed: {str(e)}")

if __name__ == "__main__":
    # You can either use the simplified version:
    inputFile = input("Enter the path to your audio file: ")
    outputFile = str(Path(inputFile).with_suffix('.mid'))
    isMonophonic = True  # Set based on your needs
    
    success = processAudioFile(inputFile, outputFile, isMonophonic)
    
    if success:
        print(f"Successfully converted {inputFile} to {outputFile}")
    else:
        print("Conversion failed. Please check the error messages above.")
    
    # Or uncomment the following line to use the interactive version:
    # main()