# YouTube zu MP3 Konvertierung mit yt-dlp

## Grundbefehl
```bash
yt-dlp -x --audio-format mp3 "URL"
```

## Befehl-Erklärung
- `-x` oder `--extract-audio`: Extrahiert nur Audio (kein Video)
- `--audio-format mp3`: Konvertiert zu MP3 Format
- `"URL"`: YouTube Video/Shorts URL (in Anführungszeichen)

## Beispiele

### 1. Einfache MP3 Konvertierung
```bash
yt-dlp -x --audio-format mp3 "https://www.youtube.com/watch?v=VIDEO_ID"
```

### 2. YouTube Shorts
```bash
yt-dlp -x --audio-format mp3 "https://www.youtube.com/shorts/SHORT_ID"
```

### 3. Mit benutzerdefiniertem Dateinamen
```bash
yt-dlp -x --audio-format mp3 -o "nikos1.mp3" "https://www.youtube.com/watch?v=VIDEO_ID"
```

### 4. Mit Qualitätseinstellungen
```bash
# Beste Audio-Qualität
yt-dlp -x --audio-format mp3 --audio-quality 0 "URL"

# Mittlere Qualität (kleinere Datei)
yt-dlp -x --audio-format mp3 --audio-quality 5 "URL"
```

### 5. Mehrere Videos auf einmal (Batch)
```bash
# Aus einer Textdatei mit URLs
yt-dlp -x --audio-format mp3 -a urls.txt

# Oder direkt mehrere URLs
yt-dlp -x --audio-format mp3 "URL1" "URL2" "URL3"
```

### 6. Playlist herunterladen
```bash
# Ganze Playlist
yt-dlp -x --audio-format mp3 "https://www.youtube.com/playlist?list=PLAYLIST_ID"

# Nur bestimmte Videos aus Playlist (z.B. 1-5)
yt-dlp -x --audio-format mp3 --playlist-items 1-5 "PLAYLIST_URL"
```

## Nützliche Zusatzoptionen

### Dateinamen-Templates
```bash
# Mit Video-Titel als Dateiname
yt-dlp -x --audio-format mp3 -o "%(title)s.mp3" "URL"

# Mit Nummer prefix (für Bot-Sounds)
yt-dlp -x --audio-format mp3 -o "nikos%(playlist_index)s.mp3" "URL"

# In bestimmten Ordner
yt-dlp -x --audio-format mp3 -o "sounds/%(title)s.mp3" "URL"
```

### Metadaten und Tags
```bash
# Metadaten einbetten (Artist, Title, etc.)
yt-dlp -x --audio-format mp3 --embed-metadata "URL"

# Thumbnail als Cover einbetten
yt-dlp -x --audio-format mp3 --embed-thumbnail "URL"
```

### Download-Beschränkungen
```bash
# Nur wenn Video kürzer als 10 Minuten
yt-dlp -x --audio-format mp3 --match-filter "duration < 600" "URL"

# Download-Geschwindigkeit limitieren
yt-dlp -x --audio-format mp3 --limit-rate 200K "URL"
```

## Für Discord Bot Sounds

### Sounds für Nikos Bot vorbereiten
```bash
# Standard Nikos Sounds
yt-dlp -x --audio-format mp3 -o "sounds/nikos1.mp3" "URL1"
yt-dlp -x --audio-format mp3 -o "sounds/nikos2.mp3" "URL2"
yt-dlp -x --audio-format mp3 -o "sounds/nikos3.mp3" "URL3"

# Spezielle User Sounds
yt-dlp -x --audio-format mp3 -o "sounds/nikos_liakos.mp3" "URL"
yt-dlp -x --audio-format mp3 -o "sounds/nikos_theo.mp3" "URL"
```

### Audio trimmen (mit ffmpeg)
Falls Sie nur einen Teil des Audios brauchen:

```bash
# Erste 10 Sekunden
yt-dlp -x --audio-format mp3 --postprocessor-args "-t 10" "URL"

# Von Sekunde 30 bis 40
yt-dlp -x --audio-format mp3 --postprocessor-args "-ss 30 -t 10" "URL"
```

### Audio-Normalisierung für Discord
```bash
# Lautstärke normalisieren für konsistente Bot-Sounds
yt-dlp -x --audio-format mp3 --postprocessor-args "-af loudnorm" "URL"
```

## Batch-Download für Bot Sounds

Erstellen Sie eine `urls.txt` Datei:
```
https://www.youtube.com/shorts/VIDEO1
https://www.youtube.com/shorts/VIDEO2
https://www.youtube.com/shorts/VIDEO3
```

Dann ausführen:
```bash
# Automatisch nummeriert
yt-dlp -x --audio-format mp3 -o "sounds/nikos%(autonumber)s.mp3" -a urls.txt

# Oder mit Video-Titel
yt-dlp -x --audio-format mp3 -o "sounds/%(title)s.mp3" -a urls.txt
```

## Troubleshooting

### Fehler: "Unable to extract uploader id"
Ignorieren - ist nur eine Warnung, Download funktioniert trotzdem.

### Fehler: ffmpeg nicht gefunden
```bash
# Windows: ffmpeg installieren
winget install ffmpeg
# Oder von https://ffmpeg.org/download.html

# Alternativ: yt-dlp mit ffmpeg Bundle
pip install yt-dlp[ffmpeg]
```

### Update yt-dlp (für neue YouTube Änderungen)
```bash
pip install --upgrade yt-dlp
# oder
yt-dlp -U
```

## Rechtliche Hinweise
- Nur Videos herunterladen, für die Sie die Berechtigung haben
- Eigene Inhalte oder Creative Commons lizenzierte Inhalte
- Beachten Sie YouTube's Nutzungsbedingungen
- Respektieren Sie Urheberrechte

## Beispiel-Workflow für Discord Bot

1. YouTube Shorts finden
2. URLs sammeln
3. Konvertieren:
```bash
# Nikos standard sounds
yt-dlp -x --audio-format mp3 -o "C:\Users\phala\Downloads\NodeJs\NodeJs\sounds\nikos1.mp3" "URL1"
yt-dlp -x --audio-format mp3 -o "C:\Users\phala\Downloads\NodeJs\NodeJs\sounds\nikos2.mp3" "URL2"

# Special user sounds
yt-dlp -x --audio-format mp3 -o "C:\Users\phala\Downloads\NodeJs\NodeJs\sounds\nikos_liakos.mp3" "URL3"
```

4. Testen mit lokalem Bot
5. Zu Git hinzufügen und deployen