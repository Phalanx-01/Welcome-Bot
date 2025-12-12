# Nikos Bot Sound Files Required

## Required Sound Files

Place the following MP3 files in the `sounds/` directory:

### Standard Nikos Sounds
These will be played randomly for regular users:
- `nikos1.mp3`
- `nikos2.mp3`
- `nikos3.mp3`
- `nikos4.mp3`
- `nikos5.mp3`
- (You can add more: `nikos6.mp3`, `nikos7.mp3`, etc.)

### Special User Sounds
These will be played for specific users when they join or trigger the bot:
- `nikos_liakos.mp3` - For user: **liakos74**
- `nikos_theo.mp3` - For user: **P_Theo04**
- `nikos_ektelestis.mp3` - For user: **ektelestis2012**
- `nikos_valtonera.mp3` - For user: **valtonera1972**

## Sound File Structure

```
sounds/
├── welcome*.mp3         (Rodulis Bot sounds)
├── rodis*.mp3          (Rodis Bot sounds)
├── nikos*.mp3          (Nikos Bot standard sounds)
├── nikos_liakos.mp3    (Special sound for liakos74)
├── nikos_theo.mp3      (Special sound for P_Theo04)
├── nikos_ektelestis.mp3 (Special sound for ektelestis2012)
└── nikos_valtonera.mp3  (Special sound for valtonera1972)
```

## How It Works

1. When a special user (liakos74, P_Theo04, ektelestis2012, or valtonera1972) triggers the bot:
   - The bot will play their special sound file

2. When any other user triggers the bot:
   - The bot will randomly select one of the standard `nikos*.mp3` files

3. Triggers:
   - User joins a voice channel
   - User types "nikos" in chat (while in voice)
   - Auto-play every 10 minutes (picks random user from voice channel)

## Adding More Sounds

To add more standard sounds, simply add files with the naming pattern:
- `nikos6.mp3`
- `nikos7.mp3`
- etc.

The bot will automatically detect and use all files matching the `nikos*.mp3` pattern (excluding special user sounds with underscore).

## Note

If special user sound files are missing, the bot will fall back to using standard nikos sounds. If no nikos sounds are available, it will use any available MP3 files as a last resort.