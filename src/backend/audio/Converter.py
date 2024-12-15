# Type hints and basic Python utilities
from typing import Tuple, Optional, Union
from pathlib import Path
import array
import time
import os
import shutil

# Numerical and scientific computing
import numpy as np
import numpy.typing as npt
from scipy.signal import medfilt

# Audio processing libraries
import librosa                # Advanced audio processing
import pyworld as pw          # Pitch detection using SWIPE
import soundfile as sf        # WAV file handling

# MIDI processing libraries
import pretty_midi            # High-level MIDI handling
import mido                   # Low-level MIDI operations
import io                     # For MIDI file I/O

# Demucs for vocal separation
import demucs.separate

# Type aliases for improved code readability and type checking
AudioArray = npt.NDArray[np.float64]      # Raw audio data
TimeArray = npt.NDArray[np.float64]       # Time points for audio samples
NoteArray = npt.NDArray[np.float64]       # MIDI note numbers
ConfidenceArray = npt.NDArray[np.float64] # Confidence values for pitch detection

class ToMidi:
    """
    A comprehensive class for converting audio (especially vocals) to MIDI format.
    Features high-quality pitch detection, sophisticated filtering, and optional
    vocal separation using Demucs.
    """

    def __init__(self, 
                 minNoteDuration: float = 0.08,
                 amplitudeThreshold: float = 0.05,
                 stabilityWindow: int = 5,
                 velocity: int = 100,
                 minMidiNote: int = 40,
                 maxMidiNote: int = 84) -> None:
        """
        Initialize the converter with customizable parameters.

        Args:
            minNoteDuration (float): Minimum duration (in seconds) for a note to be considered valid
            amplitudeThreshold (float): Minimum amplitude threshold for note detection
            stabilityWindow (int): Window size for pitch stability analysis
            velocity (int): MIDI velocity (volume) for generated notes (0-127)
            minMidiNote (int): Lowest allowed MIDI note number
            maxMidiNote (int): Highest allowed MIDI note number
        """
        self.minNoteDuration = minNoteDuration
        self.amplitudeThreshold = amplitudeThreshold
        self.stabilityWindow = stabilityWindow
        self.velocity = velocity
        self.minMidiNote = minMidiNote
        self.maxMidiNote = maxMidiNote

    def hzToMidi(self, frequencies: npt.NDArray[np.float64]) -> NoteArray:
        """
        Convert frequencies in Hz to MIDI note numbers.

        Args:
            frequencies (NDArray[float64]): Array of frequencies in Hz

        Returns:
            NoteArray: Array of corresponding MIDI note numbers
        """
        frequencies = np.array(frequencies)
        frequencies = np.where(frequencies > 0, frequencies, np.nan)
        midiNotes = 12 * np.log2(frequencies/440) + 69
        return np.round(midiNotes)

    def separateVocals(self, inputPath: Union[str, Path]) -> Tuple[AudioArray, int]:
        """
        Separate vocals from the input audio using Demucs.

        Args:
            inputPath (Union[str, Path]): Path to the input audio file

        Returns:
            Tuple[AudioArray, int]: Tuple containing separated vocals array and sample rate

        Raises:
            FileNotFoundError: If Demucs fails to create the vocals file
        """
        inputPath = Path(inputPath).absolute()
        model = "htdemucs"
        
        print(f"Running Demucs vocal separation with model: {model}")
        t0 = time.perf_counter()
        
        demucs.separate.main([
            "--two-stems", "vocals",
            "-n", model,
            str(inputPath)
        ])
        
        print(f"Separation completed in {time.perf_counter() - t0:.1f} seconds")
        
        vocalsPath = Path("separated") / model / inputPath.stem / "vocals.wav"
        
        if not vocalsPath.exists():
            raise FileNotFoundError(f"Demucs failed to create vocals file at {vocalsPath}")
            
        vocals, sr = sf.read(vocalsPath)
        vocals = vocals.astype(np.float64)
        
        if vocalsPath.parent.exists():
            shutil.rmtree(vocalsPath.parent.parent)
            
        return vocals, sr

    def processAudio(self, audio: AudioArray, sr: int) -> Tuple[TimeArray, NoteArray]:
        """
        Process audio data with pitch detection and filtering pipeline.

        Args:
            audio (AudioArray): Input audio data
            sr (int): Sample rate of the audio

        Returns:
            Tuple[TimeArray, NoteArray]: Time points and corresponding MIDI notes
        """
        if len(audio.shape) > 1:
            audio = audio.mean(axis=1)
        
        f0, t = pw.dio(audio, sr)
        f0 = pw.stonemask(audio, f0, t, sr)
        times = np.arange(len(f0)) * pw.default_frame_period / 1000.0
        
        midiNotes = self.hzToMidi(f0)
        adaptiveFiltered = self.adaptiveMedianFilter(midiNotes)
        confidence = np.ones_like(midiNotes)
        weightedFiltered = self.weightedMedianFilter(adaptiveFiltered, confidence)
        
        processedNotes = self.processMidiNotes(weightedFiltered, confidence)
        processedNotes = self.filterShortNotes(processedNotes, times)
        
        return times, processedNotes

    def adaptiveMedianFilter(self,
                           data: NoteArray,
                           minWindow: int = 3,
                           maxWindow: int = 7,
                           noiseThreshold: float = 2.0) -> NoteArray:
        """
        Apply adaptive median filter based on local noise levels.

        Args:
            data (NoteArray): Input note array to filter
            minWindow (int): Minimum window size for filtering
            maxWindow (int): Maximum window size for filtering
            noiseThreshold (float): Threshold for considering local variation as noise

        Returns:
            NoteArray: Filtered note array
        """
        filteredData = data.copy()
        padSize = maxWindow // 2
        paddedData = np.pad(data, padSize, mode='edge')
        
        for i in range(len(data)):
            windowData = paddedData[i:i + maxWindow]
            validData = windowData[~np.isnan(windowData)]
            
            if len(validData) < 2:
                filteredData[i] = np.nan
                continue
                
            localStd = np.std(validData) if len(validData) > 1 else 0
            windowSize = maxWindow if localStd > noiseThreshold else minWindow
            if windowSize % 2 == 0:
                windowSize += 1
            
            startIdx = i + (maxWindow - windowSize) // 2
            window = paddedData[startIdx:startIdx + windowSize]
            
            validWindow = window[~np.isnan(window)]
            if len(validWindow) > 0:
                filteredData[i] = np.median(validWindow)
            else:
                filteredData[i] = np.nan
        
        return filteredData

    def weightedMedianFilter(self,
                           data: NoteArray,
                           confidence: ConfidenceArray,
                           windowSize: int = 5) -> NoteArray:
        """
        Apply median filtering with confidence-based weighting.

        Args:
            data (NoteArray): Input note array to filter
            confidence (ConfidenceArray): Confidence values for each note
            windowSize (int): Size of the filtering window

        Returns:
            NoteArray: Filtered note array
        """
        filteredData = data.copy()
        padSize = windowSize // 2
        paddedData = np.pad(data, padSize, mode='edge')
        paddedConf = np.pad(confidence, padSize, mode='edge')
        
        for i in range(len(data)):
            windowData = paddedData[i:i + windowSize]
            windowConf = paddedConf[i:i + windowSize]
            
            sortedIndices = np.argsort(windowData)
            cumsumWeights = np.cumsum(windowConf[sortedIndices])
            medianIdx = np.searchsorted(cumsumWeights, cumsumWeights[-1] / 2)
            filteredData[i] = windowData[sortedIndices[medianIdx]]
        
        return filteredData

    def processMidiNotes(self,
                        midiNotes: NoteArray,
                        confidence: Optional[ConfidenceArray] = None,
                        minNote: Optional[int] = None,
                        maxNote: Optional[int] = None,
                        amplitudeThreshold: Optional[float] = None) -> NoteArray:
        """
        Process MIDI notes with filtering and range constraints.

        Args:
            midiNotes (NoteArray): Array of MIDI note numbers
            confidence (Optional[ConfidenceArray]): Confidence values for each note
            minNote (Optional[int]): Minimum allowed MIDI note number
            maxNote (Optional[int]): Maximum allowed MIDI note number
            amplitudeThreshold (Optional[float]): Threshold for note detection

        Returns:
            NoteArray: Processed note array
        """
        processedNotes = midiNotes.copy()
        
        minNote = minNote if minNote is not None else self.minMidiNote
        maxNote = maxNote if maxNote is not None else self.maxMidiNote
        
        processedNotes = np.clip(processedNotes, minNote, maxNote)
        processedNotes = np.where(
            (processedNotes >= minNote) & (processedNotes <= maxNote),
            processedNotes,
            np.nan
        )
        
        threshold = amplitudeThreshold if amplitudeThreshold is not None else self.amplitudeThreshold
        
        if confidence is not None:
            windowSize = 5
            rollingMean = np.convolve(confidence, np.ones(windowSize)/windowSize, mode='same')
            dynamicThreshold = threshold * rollingMean
            processedNotes = np.where(confidence > dynamicThreshold, processedNotes, np.nan)
        
        processedNotes = self.adaptiveMedianFilter(processedNotes)
        if confidence is not None:
            processedNotes = self.weightedMedianFilter(processedNotes, confidence)
        
        return processedNotes

    def filterShortNotes(self,
                        notes: NoteArray,
                        times: TimeArray) -> NoteArray:
        """
        Remove short duration notes while preserving musical phrases.

        Args:
            notes (NoteArray): Array of MIDI note numbers
            times (TimeArray): Array of corresponding time points

        Returns:
            NoteArray: Filtered note array with short notes removed
        """
        filteredNotes = notes.copy()
        noteStarts = np.where(np.diff(notes) != 0)[0]
        noteStarts = np.append(0, noteStarts + 1)
        noteEnds = np.append(noteStarts[1:], len(notes))
        
        for i, (start, end) in enumerate(zip(noteStarts, noteEnds)):
            duration = times[end-1] - times[start]
            
            if duration < self.minNoteDuration:
                if i > 0 and i < len(noteStarts)-1:
                    prevDuration = times[noteStarts[i]-1] - times[noteStarts[i-1]]
                    nextDuration = times[noteEnds[i+1]-1] - times[noteStarts[i+1]]
                    
                    if prevDuration > self.minNoteDuration and nextDuration > self.minNoteDuration:
                        continue
                
                filteredNotes[start:end] = np.nan
                
        return filteredNotes

    def createMidiFile(self,
                      times: TimeArray,
                      notes: NoteArray,
                      outputFile: Union[str, Path]) -> None:
        """
        Create a MIDI file from processed note data.

        Args:
            times (TimeArray): Array of time points
            notes (NoteArray): Array of MIDI note numbers
            outputFile (Union[str, Path]): Path where the MIDI file will be saved
        """
        pm = pretty_midi.PrettyMIDI()
        piano = pretty_midi.Instrument(
            program=pretty_midi.instrument_name_to_program('Acoustic Grand Piano')
        )
        
        currentNote = None
        startTime = None
        
        for i in range(len(times)):
            if np.isnan(notes[i]):
                if currentNote is not None and (times[i] - startTime) >= self.minNoteDuration:
                    piano.notes.append(pretty_midi.Note(
                        velocity=self.velocity,
                        pitch=int(currentNote),
                        start=startTime,
                        end=times[i]
                    ))
                currentNote = None
            else:
                if currentNote != notes[i]:
                    if currentNote is not None and (times[i] - startTime) >= self.minNoteDuration:
                        piano.notes.append(pretty_midi.Note(
                            velocity=self.velocity,
                            pitch=int(currentNote),
                            start=startTime,
                            end=times[i]
                        ))
                    currentNote = notes[i]
                    startTime = times[i]
        
        if currentNote is not None and (times[-1] - startTime) >= self.minNoteDuration:
            piano.notes.append(pretty_midi.Note(
                velocity=self.velocity,
                pitch=int(currentNote),
                start=startTime,
                end=times[-1]
            ))
        
        pm.instruments.append(piano)
        pm.write(str(outputFile))

    def convertToMidi(self,
                     inputPath: Union[str, Path],
                     outputPath: Union[str, Path],
                     separateVocals: bool = False) -> bool:
        """
        Convert any audio format to MIDI with optional vocal separation.
        
        Args:
            inputPath (Union[str, Path]): Path to the input audio file
            outputPath (Union[str, Path]): Path where the output MIDI file will be saved
            separateVocals (bool): Whether to use Demucs for vocal separation. 
                                 Should be False for monophonic/vocal-only audio.
        
        Returns:
            bool: True if conversion was successful
            
        Raises:
            Exception: If any step of the conversion process fails
        """
        try:
            if separateVocals:
                print("Starting vocal separation...")
                audio, sr = self.separateVocals(inputPath)
                print("Vocal separation completed successfully")
            else:
                print("Loading audio file...")
                audio, sr = sf.read(str(inputPath))
                audio = audio.astype(np.float64)
                
                if len(audio.shape) > 1:
                    audio = np.mean(audio, axis=1)
                    print("Converted stereo audio to mono")
            
            print("Detecting and processing pitches...")
            times, notes = self.processAudio(audio, sr)
            
            print("Generating MIDI file...")
            self.createMidiFile(times, notes, outputPath)

            print(f"Successfully created MIDI file at: {outputPath}")
            return True
            
        except Exception as e:
            error_msg = f"Error converting to MIDI: {str(e)}"
            print(error_msg)
            raise Exception(error_msg)

# Example usage:
"""
# Create a converter instance with custom parameters
converter = ToMidi(
    minNoteDuration=0.1,          # Minimum note duration in seconds
    amplitudeThreshold=0.06,      # Minimum amplitude for note detection
    stabilityWindow=7,            # Window size for pitch stability
    velocity=90,                  # MIDI note velocity (volume)
    minMidiNote=36,              # Lowest allowed note (C2)
    maxMidiNote=84               # Highest allowed note (C6)
)

# Convert an audio file to MIDI
converter.convertToMidi(
    inputPath="input_audio.wav",   # Input audio file path
    outputPath="output.midi",      # Output MIDI file path
    separateVocals=True           # Use vocal separation if input is not vocals-only
)
"""