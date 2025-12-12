# Wie man spezielle User-Sounds zu Nikos Bot hinzufügt

## Schritt 1: Sound-Datei vorbereiten

1. Konvertiere den Sound zu MP3:
```bash
yt-dlp -x --audio-format mp3 -o "sounds/nikos_USERNAME.mp3" "YOUTUBE_URL"
```

2. Oder kopiere eine existierende MP3-Datei:
```bash
cp mein_sound.mp3 sounds/nikos_USERNAME.mp3
```

## Schritt 2: User zur Liste hinzufügen

Bearbeite `nikos-bot.js` und füge den User zur `USER_SOUND_MAP` hinzu:

```javascript
const USER_SOUND_MAP = {
  'liakos74': 'nikos_liakos.mp3',
  'P_Theo04': 'nikos_theo.mp3',
  'ektelestis2012': 'nikos_ektelestis.mp3',
  'valtonera1972': 'nikos_valtonera.mp3',
  // Neue User hier hinzufügen:
  'neuer_username': 'nikos_neuer.mp3',
  'anderer_user': 'nikos_anderer.mp3'
};
```

## Schritt 3: Deployen

```bash
git add sounds/nikos_*.mp3
git commit -m "Add special sounds for new users"
git push
railway up
```

## Wichtige Hinweise:

1. **Username muss EXAKT übereinstimmen** (Groß-/Kleinschreibung beachten!)
2. **Sound-Datei muss im `sounds/` Ordner sein**
3. **Dateiname-Convention:** `nikos_USERNAME.mp3`
4. **Fallback:** Wenn die Datei nicht existiert, wird automatisch ein Standard-Sound verwendet

## Beispiel für mehrere Sounds pro User:

Falls Sie zufällige Sounds für spezielle User wollen, können Sie Arrays verwenden:

```javascript
const USER_SOUND_MAP = {
  'liakos74': ['nikos_liakos1.mp3', 'nikos_liakos2.mp3', 'nikos_liakos3.mp3'],
  // Bot wählt zufällig einen dieser Sounds
};
```

(Benötigt kleine Code-Anpassung in der `getSoundForUser` Funktion)