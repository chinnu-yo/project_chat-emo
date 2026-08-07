import colorsys

def valence_arousal_to_hex(valence: float, arousal: float) -> str:
    """
    Convert Valence (-1.0 to 1.0) and Arousal (0.0 to 1.0) to a HEX color string.
    Algorithm per DESIGN.md:
    - Hue: 0° (Red/Negative) -> 60° (Yellow/Neutral) -> 120° (Green/Positive)
    - Saturation: 50% (Calm) -> 100% (High Intensity)
    - Lightness: ~45% - 55%
    """
    v = max(-1.0, min(1.0, float(valence)))
    a = max(0.0, min(1.0, float(arousal)))

    hue_deg = ((v + 1.0) / 2.0) * 120.0
    hue_ratio = hue_deg / 360.0

    saturation = 0.50 + (a * 0.50)
    lightness = 0.45 + (max(0.0, v) * 0.10)

    r, g, b = colorsys.hls_to_rgb(hue_ratio, lightness, saturation)

    r_int = max(0, min(255, int(round(r * 255))))
    g_int = max(0, min(255, int(round(g * 255))))
    b_int = max(0, min(255, int(round(b * 255))))

    return f"#{r_int:02X}{g_int:02X}{b_int:02X}"

def derive_emotion_label(valence: float, arousal: float) -> str:
    """
    Derive granular 13-zone emotion label from Russell's Circumplex Model.
    Valence (X): -1.0 (Negative) to 1.0 (Positive)
    Arousal (Y): 0.0 (Calm) to 1.0 (Intense)
    """
    x = max(-1.0, min(1.0, float(valence)))
    y = max(0.0, min(1.0, float(arousal)))

    if y > 0.6:
        if x < -0.5:
            return "Enraged / Furious"
        elif x < 0.0:
            return "Anxious / Frustrated"
        elif x < 0.5:
            return "Enthusiastic / Eager"
        else:
            return "Ecstatic / Excited / Joyful"
    elif y >= 0.3:
        if -0.2 <= x <= 0.2:
            return "Neutral / Balanced"
        elif x < -0.5:
            return "Angry / Resentful"
        elif x < -0.2:
            return "Annoyed / Irritated"
        elif x <= 0.5:
            return "Pleasant / Friendly"
        else:
            return "Happy / Delightful"
    else:  # y < 0.3
        if x < -0.5:
            return "Gloomy / Depressed"
        elif x < 0.0:
            return "Sad / Melancholy"
        elif x < 0.5:
            return "Calm / Relaxed"
        else:
            return "Serene / Peaceful"
