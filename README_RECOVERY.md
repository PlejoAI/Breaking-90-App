# Breaking 90 recovery notes

Recovered locally from available fragments on Danny's Mac.

## Found

- `App.js` from `~/Desktop/App.js`
- Logo/icon from `~/Desktop/breaking90.png`
- Shop/merch placeholders from desktop apparel images
- Backend source from `~/Desktop/SavageGolf-Upload`

## Missing from original project

- Original Expo project folder was referenced in shell history as `~/.openclaw/workspace/SavageGolf`, but it is not present now.
- Original `geminiEngine.js` and `components/FitnessPrescription.js` were not found, so recovery versions were created.
- Original App Store bundle identifier / EAS project ID still needs verification before building or submitting.

## Run locally

```bash
cd /Users/dannyboy/.openclaw/workspace/Breaking90
npm install
npx expo start
```

If the backend URL is different, start Expo with:

```bash
EXPO_PUBLIC_API_BASE_URL="https://your-backend-url" npx expo start
```
