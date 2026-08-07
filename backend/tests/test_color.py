import pytest
from app.services.color_service import valence_arousal_to_hex, derive_emotion_label

def test_valence_arousal_to_hex_positive():
    hex_color = valence_arousal_to_hex(1.0, 1.0)
    assert hex_color.startswith("#")
    assert len(hex_color) == 7

def test_valence_arousal_to_hex_negative():
    hex_color = valence_arousal_to_hex(-1.0, 1.0)
    assert hex_color.startswith("#")
    assert len(hex_color) == 7

def test_valence_arousal_to_hex_neutral():
    hex_color = valence_arousal_to_hex(0.0, 0.0)
    assert hex_color.startswith("#")

def test_derive_emotion_label_granular_zones():
    # High Arousal
    assert derive_emotion_label(-0.8, 0.8) == "Enraged / Furious"
    assert derive_emotion_label(-0.3, 0.8) == "Anxious / Frustrated"
    assert derive_emotion_label(0.3, 0.8) == "Enthusiastic / Eager"
    assert derive_emotion_label(0.8, 0.8) == "Ecstatic / Excited / Joyful"

    # Mid Arousal
    assert derive_emotion_label(0.0, 0.5) == "Neutral / Balanced"
    assert derive_emotion_label(-0.8, 0.5) == "Angry / Resentful"
    assert derive_emotion_label(-0.3, 0.5) == "Annoyed / Irritated"
    assert derive_emotion_label(0.3, 0.5) == "Pleasant / Friendly"
    assert derive_emotion_label(0.8, 0.5) == "Happy / Delightful"

    # Low Arousal
    assert derive_emotion_label(-0.8, 0.1) == "Gloomy / Depressed"
    assert derive_emotion_label(-0.3, 0.1) == "Sad / Melancholy"
    assert derive_emotion_label(0.3, 0.1) == "Calm / Relaxed"
    assert derive_emotion_label(0.8, 0.1) == "Serene / Peaceful"
