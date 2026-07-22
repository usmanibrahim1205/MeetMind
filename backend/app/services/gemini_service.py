import httpx
import json
import logging
from typing import Dict, Any, List
from app.utils.config import settings

logger = logging.getLogger("meetmind.gemini")

# Demo mock analyses removed. Local NLP processing is mandatory.

async def analyze_transcript(transcript: str, custom_api_key: str = None) -> Dict[str, Any]:
    """
    Analyzes a meeting transcript locally using Python NLP heuristics.
    No external API keys or external server requests.
    """
    logger.info("Using local Python NLP heuristic for offline transcript analysis...")
    try:
        return _analyze_transcript_locally(transcript)
    except Exception as e:
        logger.error(f"Local Python analysis failed: {e}")
        raise e


def _analyze_transcript_locally(transcript: str) -> Dict[str, Any]:
    """
    Analyzes a meeting transcript locally using Python NLP heuristics.
    No external API keys or heavy models required.
    """
    import re
    
    # 1. Clean transcript into sentences/words and map to speaker
    lines = transcript.strip().split("\n")
    cleaned_sentences = []
    sentence_to_speaker = []
    
    # Simple regex to parse [MM:SS] Speaker: Sentence
    pattern = re.compile(r"^\[\d{2}:\d{2}\]\s*([^:]+):\s*(.*)")
    
    for line in lines:
        match = pattern.match(line)
        if match:
            speaker = match.group(1).strip()
            content = match.group(2).strip()
            # Split content into sentences
            sub_sentences = re.split(r'(?<=[.!?])\s+', content)
            for s in sub_sentences:
                if s.strip():
                    cleaned_sentences.append(s.strip())
                    sentence_to_speaker.append(speaker)
        else:
            if line.strip():
                # Fallback for lines that don't match the pattern
                sub_sentences = re.split(r'(?<=[.!?])\s+', line)
                for s in sub_sentences:
                    if s.strip():
                        cleaned_sentences.append(s.strip())
                        sentence_to_speaker.append("Speaker")

    # If no sentences found, fallback
    if not cleaned_sentences:
        cleaned_sentences = [transcript]
        sentence_to_speaker = ["Speaker"]

    # 2. Stopwords list for keyword frequency analysis
    stopwords = {
        "the", "a", "an", "and", "or", "but", "if", "then", "else", "when", 
        "at", "by", "for", "with", "about", "against", "between", "into", 
        "through", "during", "before", "after", "above", "below", "to", "from", 
        "up", "down", "in", "out", "on", "off", "over", "under", "again", 
        "further", "then", "once", "here", "there", "all", "any", "both", 
        "each", "few", "more", "most", "other", "some", "such", "no", "nor", 
        "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", 
        "can", "will", "just", "don", "should", "now", "i", "me", "my", 
        "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", 
        "yourself", "yourselves", "he", "him", "his", "himself", "she", 
        "her", "hers", "herself", "it", "its", "itself", "they", "them", 
        "their", "theirs", "themselves", "what", "which", "who", "whom", 
        "this", "that", "these", "those", "am", "is", "are", "was", "were", 
        "be", "been", "being", "have", "has", "had", "having", "do", "does", 
        "did", "doing", "would", "could", "get", "go", "make", "think", "say",
        "like", "just", "so", "thanks", "hello", "hi", "ok", "okay", "yeah", "yes",
        "need", "needs", "want", "wants", "meeting", "sync", "discussion", "discuss"
    }

    # 3. Tokenize and count frequencies
    word_counts = {}
    all_words = []
    for s in cleaned_sentences:
        words = re.findall(r'\b[a-zA-Z]{3,}\b', s.lower())
        for w in words:
            if w not in stopwords:
                word_counts[w] = word_counts.get(w, 0) + 1
                all_words.append(w)

    sorted_words = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)
    top_keywords = [w[0].capitalize() for w in sorted_words[:4]]

    title = "Local Sync: " + (" & ".join(top_keywords) if top_keywords else "General Discussion")
    topics = top_keywords if top_keywords else ["Discussion"]

    # 4. Extractive Summary
    # Score sentences by summing the frequencies of their words
    sentence_scores = []
    for s in cleaned_sentences:
        score = 0
        words = re.findall(r'\b[a-zA-Z]{3,}\b', s.lower())
        for w in words:
            if w not in stopwords:
                score += word_counts.get(w, 0)
        sentence_scores.append(score)

    # Pick top sentences (chronological order)
    if len(cleaned_sentences) <= 4:
        summary_sentences = cleaned_sentences
    else:
        indexed_scores = list(enumerate(sentence_scores))
        indexed_scores.sort(key=lambda x: x[1], reverse=True)
        top_indices = [x[0] for x in indexed_scores[:4]]
        top_indices.sort() # sort chronologically
        summary_sentences = [cleaned_sentences[idx] for idx in top_indices]

    # Structure the summary in Markdown
    summary_md = "### Overall Discussion\n"
    summary_md += "The team sync covered key topics, with particular focus on " + (", ".join(topics).lower() if topics else "general items") + ".\n\n"
    summary_md += "Summary of critical discussion points:\n"
    for s in summary_sentences:
        summary_md += f"- {s}\n"

    # Add key discussion points section
    summary_md += "\n### Key Discussion Points\n"
    if len(cleaned_sentences) > 4:
        for idx in range(min(5, len(cleaned_sentences))):
            speaker = sentence_to_speaker[idx]
            sentence = cleaned_sentences[idx]
            summary_md += f"- **{speaker}** initiated the discussion regarding: *\"{sentence}\"*\n"
    else:
        summary_md += "- Active review of deliverables, requirements alignment, and implementation strategies.\n"

    # Add important decisions section
    summary_md += "\n### Important Decisions\n"
    decision_sentences = []
    decision_keywords = ["decide", "agreed", "approve", "agree", "resolve", "conclude", "settle", "confirm", "fixed", "implemented"]
    for s in cleaned_sentences:
        if any(dk in s.lower() for dk in decision_keywords):
            decision_sentences.append(s)
    if decision_sentences:
        for ds in decision_sentences[:3]:
            summary_md += f"- {ds}\n"
    else:
        summary_md += "- The team reached alignment on implementation targets and assigned responsibilities to maintain development momentum.\n"

    # 5. Action Items Extraction
    action_items = []
    action_keywords = ["will", "need to", "needs to", "should", "must", "tasked", "action item", "todo"]
    for idx, s in enumerate(cleaned_sentences):
        s_lower = s.lower()
        if any(ak in s_lower for ak in action_keywords):
            speaker = sentence_to_speaker[idx]
            clean_s = s.strip()
            # Heuristic pronoun resolution to actor names
            clean_s = re.sub(r'^[iI]\s+will\b', f"{speaker} will", clean_s)
            clean_s = re.sub(r'^[wW]e\s+will\b', "The team will", clean_s)
            clean_s = re.sub(r'^[iI]\s+need\s+to\b', f"{speaker} needs to", clean_s)
            action_items.append(clean_s)
            
    # Deduplicate and limit action items
    seen = set()
    deduped_action_items = []
    for item in action_items:
        if item.lower() not in seen:
            seen.add(item.lower())
            deduped_action_items.append(item)
    
    if not deduped_action_items:
        deduped_action_items = ["The team will review project progress and coordinate actions in the next sync."]
    else:
        deduped_action_items = deduped_action_items[:6]

    # 6. Sentiment analysis
    pos_words = {"great", "good", "excellent", "success", "resolved", "perfect", "happy", "awesome", "agree", "progress", "done", "fine", "helpful"}
    neg_words = {"error", "fail", "slow", "bad", "issue", "problem", "difficult", "delay", "unable", "cannot", "wrong", "broken"}
    
    pos_count = 0
    neg_count = 0
    for w in all_words:
        if w in pos_words:
            pos_count += 1
        elif w in neg_words:
            neg_count += 1
            
    if pos_count > neg_count + 1:
        sentiment = "Positive"
        sentiment_explanation = "The discussion was positive, emphasizing resolution of tasks and milestone progress."
    elif neg_count > pos_count + 1:
        sentiment = "Negative"
        sentiment_explanation = "The discussion highlighted outstanding bugs, process friction, or structural bottlenecks."
    else:
        sentiment = "Neutral"
        sentiment_explanation = "The team maintained a balanced, operational tone focusing on informative status updates."

    return {
        "title": title,
        "summary": summary_md,
        "action_items": deduped_action_items,
        "topics": topics[:5],
        "sentiment": sentiment,
        "sentiment_explanation": sentiment_explanation
    }

