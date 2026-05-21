# Taki AI Image Studio

A simple AI image and wallpaper generator built with [Pollinations.ai](https://pollinations.ai).

## Features

- Prompt-based image generation through the Pollinations API
- Style presets for realistic, anime, cinematic, and minimal outputs
- Square, landscape, and portrait image sizes
- Optional browser-side `pk_` publishable key support
- Image preview, download, URL copy, and recent image strip

## Live Demo

After GitHub Pages deploys, the app will be available at:

https://takiff507.github.io/taki-ai-image-studio/

## Local Use

Open `index.html` in a browser, or serve the folder with any static server.

```bash
python -m http.server 4173
```

Then visit:

```text
http://localhost:4173
```

## Pollinations

This app uses the Pollinations image endpoint:

```text
https://gen.pollinations.ai/image/{prompt}
```

Use a publishable `pk_` key for browser experiments. Do not put secret `sk_` keys in client-side code.

## License

MIT
