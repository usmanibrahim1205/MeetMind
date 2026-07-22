import httpx
import os
import logging
from app.utils.config import settings

logger = logging.getLogger("meetmind.whisper")

# Demo mock scripts removed. Local transcription is mandatory.

# Correct MIME types per file extension
MIME_TYPE_MAP = {
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".m4a": "audio/mp4",   # m4a is actually mp4 container
    ".mp4": "audio/mp4",
}


def _extract_active_mfcc(data, samplerate):
    """
    Extracts MFCC features only from active speech frames (filtering out silence/noise).
    """
    from python_speech_features import mfcc
    import numpy as np

    win_len = int(0.025 * samplerate)
    win_step = int(0.010 * samplerate)
    
    mfcc_feat = mfcc(data, samplerate, numcep=13, nfilt=26, winlen=0.025, winstep=0.01, nfft=2048)
    
    # Calculate RMS energy for each frame
    frame_energies = []
    for i in range(len(mfcc_feat)):
        start = i * win_step
        end = start + win_len
        if end <= len(data):
            frame_energies.append(np.sqrt(np.mean(np.square(data[start:end]))))
        else:
            frame_energies.append(0.0)
            
    if not frame_energies:
        return mfcc_feat.mean(axis=0)[1:] if len(mfcc_feat) > 0 else np.zeros(12)
        
    max_energy = max(frame_energies)
    # Filter frames below 15% of peak energy or minimum threshold
    threshold = max(0.15 * max_energy, 0.002)
    
    active_frames = []
    for i, energy in enumerate(frame_energies):
        if energy > threshold and i < len(mfcc_feat):
            active_frames.append(mfcc_feat[i])
            
    if active_frames:
        return np.mean(active_frames, axis=0)[1:]
    else:
        return mfcc_feat.mean(axis=0)[1:]


async def transcribe_audio(
    filepath: str,
    duration: float,
    custom_api_key: str = None,
    custom_gemini_key: str = None
) -> str:
    """
    Transcribes an audio file locally using faster-whisper.
    Falls back to mock transcripts only if local transcription fails.
    """
    filename = os.path.basename(filepath)

    logger.info(
        f"Using local offline faster-whisper ({settings.WHISPER_MODEL}) "
        f"for transcription of '{filename}'..."
    )
    try:
        from faster_whisper import WhisperModel
        # Run model on CPU with int8 quantization for speed/resource efficiency
        model = WhisperModel(settings.WHISPER_MODEL, device="cpu", compute_type="int8")
        segments, info = model.transcribe(filepath, beam_size=5)
        
        # Collect segments in memory
        segments_list = []
        for segment in segments:
            segments_list.append({
                "start": segment.start,
                "end": segment.end,
                "text": segment.text.strip()
            })
            
        local_transcript = ""
        if segments_list:
            # Perform speaker diarization using voice clustering
            logger.info(f"Performing offline speaker diarization on {len(segments_list)} segments...")
            speaker_labels = [0] * len(segments_list)
            try:
                import soundfile as sf
                from sklearn.cluster import AgglomerativeClustering
                from sklearn.preprocessing import StandardScaler
                from sklearn.metrics import silhouette_score
                from scipy.spatial.distance import cdist
                import numpy as np
                
                features = []
                valid_indices = []
                
                with sf.SoundFile(filepath) as f:
                    samplerate = f.samplerate
                    total_frames = len(f)
                    
                    for idx, seg in enumerate(segments_list):
                        start_frame = int(seg["start"] * samplerate)
                        end_frame = int(seg["end"] * samplerate)
                        
                        if start_frame >= total_frames:
                            continue
                        end_frame = min(end_frame, total_frames)
                        
                        f.seek(start_frame)
                        data = f.read(end_frame - start_frame)
                        
                        # Convert to mono
                        if len(data.shape) > 1:
                            data = data.mean(axis=1)
                            
                        # Must have at least 0.15s of audio for stable MFCC extraction
                        if len(data) < int(0.15 * samplerate):
                            continue
                            
                        feat_mean = _extract_active_mfcc(data, samplerate)
                        features.append(feat_mean)
                        valid_indices.append(idx)
                        
                if len(features) >= 2:
                    features = np.array(features)
                    
                    # Filter anchors (duration >= 1.5s) to establish clean speaker centers
                    anchors = []
                    anchor_indices = []
                    for idx, val_idx in enumerate(valid_indices):
                        seg = segments_list[val_idx]
                        if (seg["end"] - seg["start"]) >= 1.5:
                            anchors.append(features[idx])
                            anchor_indices.append(idx)
                    anchors = np.array(anchors)
                    
                    n_clusters = 1
                    if len(anchors) >= 3:
                        scaler = StandardScaler()
                        anchors_scaled = scaler.fit_transform(anchors)
                        
                        best_score = -1
                        best_k = 1
                        max_k = min(6, len(anchors) - 1)
                        if max_k >= 2:
                            for k in range(2, max_k + 1):
                                clusterer = AgglomerativeClustering(n_clusters=k)
                                labels_temp = clusterer.fit_predict(anchors_scaled)
                                score = silhouette_score(anchors_scaled, labels_temp)
                                if score > best_score:
                                    best_score = score
                                    best_k = k
                                    
                        # If best silhouette score is below 0.18, default to 1 speaker
                        if best_score >= 0.18:
                            n_clusters = best_k
                            
                    if n_clusters == 1:
                        logger.info("Single speaker detected or too few anchors. Defaulting to 1 speaker.")
                        clustered_labels = [0] * len(features)
                    else:
                        logger.info(f"Detected {n_clusters} speakers. Mapping segments...")
                        clusterer = AgglomerativeClustering(n_clusters=n_clusters)
                        anchor_labels = clusterer.fit_predict(anchors_scaled)
                        
                        # Compute centroids
                        centroids = []
                        for cid in range(n_clusters):
                            centroids.append(np.mean(anchors_scaled[anchor_labels == cid], axis=0))
                        centroids = np.array(centroids)
                        
                        # Project all segments (anchors + non-anchors) using cosine distance
                        all_scaled = scaler.transform(features)
                        dists = cdist(all_scaled, centroids, metric='cosine')
                        clustered_labels = np.argmin(dists, axis=1)
                        
                    # Map labels back to all segments (handling skipped segments)
                    for val_idx, label in zip(valid_indices, clustered_labels):
                        speaker_labels[val_idx] = label
                        
                    last_label = 0
                    for i in range(len(segments_list)):
                        if i in valid_indices:
                            last_label = speaker_labels[i]
                        else:
                            speaker_labels[i] = last_label
                else:
                    logger.info("Not enough segments or audio data for speaker clustering. Defaulting to Speaker 1.")
            except Exception as diar_err:
                logger.warning(f"Offline diarization failed: {diar_err}. Falling back to single-speaker labels.")
                speaker_labels = [0] * len(segments_list)
                
            text_parts = []
            for idx, seg in enumerate(segments_list):
                minutes = int(seg["start"] // 60)
                seconds = int(seg["start"] % 60)
                time_str = f"[{minutes:02d}:{seconds:02d}]"
                speaker_name = f"Speaker {speaker_labels[idx] + 1}"
                text_parts.append(f"{time_str} {speaker_name}: {seg['text']}")
                
            local_transcript = "\n".join(text_parts).strip()
            
        if local_transcript:
            logger.info(f"Local faster-whisper transcription and diarization successful for '{filename}'.")
            return local_transcript
        else:
            raise Exception("Local faster-whisper transcript was empty.")
    except Exception as e:
        logger.error(f"Local faster-whisper transcription failed for '{filename}': {e}")
        raise e