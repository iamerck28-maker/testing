"""
Vercel Serverless Function for Crypto Scalping Assistant
"""
import requests
import random
from datetime import datetime
import json

# Konfigurasi Hugging Face API
HF_API_URL = "https://api-inference.huggingface.co/models"
SENTIMENT_MODEL = "distilbert-base-uncased-finetuned-sst-2-english"

def get_sentiment_analysis(text):
    """Analisis sentimen dari teks berita/sosial media crypto"""
    try:
        response = requests.post(
            f"{HF_API_URL}/{SENTIMENT_MODEL}",
            headers={"Authorization": ""},
            json={"inputs": text}
        )
        result = response.json()
        
        if isinstance(result, list) and len(result) > 0:
            sentiment = result[0][0]['label']
            confidence = result[0][0]['score']
            
            if sentiment == "POSITIVE":
                score = confidence
            else:
                score = -confidence
            
            return {
                "sentiment": sentiment.lower(),
                "confidence": round(confidence * 100, 2),
                "score": round(score, 3)
            }
    except Exception as e:
        print(f"Error sentiment analysis: {e}")
    
    return {
        "sentiment": "neutral",
        "confidence": 50.0,
        "score": 0.0
    }

def simulate_price_pattern():
    """Simulasi deteksi pola harga untuk scalping"""
    patterns = [
        {"name": "Bullish Engulfing", "signal": "BUY", "strength": 0.85},
        {"name": "Bearish Harami", "signal": "SELL", "strength": 0.72},
        {"name": "Doji Star", "signal": "WAIT", "strength": 0.45},
        {"name": "Hammer", "signal": "BUY", "strength": 0.78},
        {"name": "Shooting Star", "signal": "SELL", "strength": 0.81},
        {"name": "Sideways", "signal": "WAIT", "strength": 0.30}
    ]
    
    detected = random.choice(patterns)
    strength_variation = random.uniform(-0.1, 0.1)
    detected["strength"] = max(0.1, min(1.0, detected["strength"] + strength_variation))
    detected["strength"] = round(detected["strength"], 2)
    
    return detected

def calculate_scalp_score(sentiment_data, pattern_data):
    """Hitung skor scalping berdasarkan sentimen dan pola"""
    sentiment_score = sentiment_data["score"]
    pattern_strength = pattern_data["strength"]
    
    if pattern_data["signal"] == "BUY":
        pattern_score = pattern_strength
    elif pattern_data["signal"] == "SELL":
        pattern_score = -pattern_strength
    else:
        pattern_score = 0
    
    combined_score = (sentiment_score * 0.4) + (pattern_score * 0.6)
    normalized_score = int((combined_score + 1) * 50)
    normalized_score = max(0, min(100, normalized_score))
    
    if normalized_score >= 70:
        recommendation = "STRONG BUY"
        color = "green"
    elif normalized_score >= 55:
        recommendation = "BUY"
        color = "light-green"
    elif normalized_score <= 30:
        recommendation = "STRONG SELL"
        color = "red"
    elif normalized_score <= 45:
        recommendation = "SELL"
        color = "orange"
    else:
        recommendation = "HOLD/WAIT"
        color = "gray"
    
    return {
        "score": normalized_score,
        "recommendation": recommendation,
        "color": color
    }

def main(event, context):
    """Vercel serverless function handler"""
    news_samples = [
        "Bitcoin breaks $45,000 resistance level with strong volume",
        "Ethereum network upgrade delayed, investors concerned",
        "Major exchange announces new security measures after hack",
        "Institutional adoption of crypto continues to grow",
        "Regulatory uncertainty causes market volatility",
        "DeFi protocol launches innovative yield farming feature",
        "Whale moves large amount of Bitcoin to exchange",
        "Central bank hints at digital currency development"
    ]
    
    selected_news = random.choice(news_samples)
    sentiment_result = get_sentiment_analysis(selected_news)
    pattern_result = simulate_price_pattern()
    scalp_result = calculate_scalp_score(sentiment_result, pattern_result)
    
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true"
        },
        "body": json.dumps({
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "news": selected_news,
            "sentiment": sentiment_result,
            "pattern": pattern_result,
            "scalp_signal": scalp_result
        })
    }
