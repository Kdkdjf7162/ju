# Taller de YouTube Shorts con Claude

Este repo trae instaladas **172 skills** en `.claude/skills/`. Cualquier sesión de Claude Code que abras en este repo las carga solas.
El origen de cada una está en `.claude/skills-sources.tsv`. Para instalar las herramientas de terminal, corre `./setup.sh` (instala yt-dlp, markitdown, graphify y ffmpeg).

## Flujo recomendado para un Short

1. **Investigar el canal de referencia**: `yt-dlp` descarga los videos y subtítulos, `youtube-stats` saca las métricas, y `content-analyzer` y `yt-viral` explican por qué funciona cada video (gancho, guion, ritmo). `last30days` muestra lo que es tendencia ahora.
2. **Guion**: con `yt-script` / `yt-shorts` (fórmulas de gancho con puntuación), más `marketing-psychology` y `copywriting`.
3. **Video con código**: `becario-reels` (tu skill) o `remotion-*` / `hyperframes` + `gsap-*`. Para el gusto visual y los zoom in/out con intención: `motion-design`, `claude-motion`, `motion-doctrine`, `klik-cam`, `shot-composition`, `beat-sync-editing`.
4. **Sonido**: `foley` (efectos CC0 de Openverse), `real-sound` (efectos reales y licenciados), `earshot` (Claude "escucha" y verifica el audio) y `sound-effects` (mezcla y sincronía con el beat).
5. **Edición y entrega**: `short-form-edit`, `cut-silences`, `remotion-captions`, `captions-overlay`, `reel-export`, `yt-package`, `yt-seo`.

## Qué se instaló, por grupo

| Grupo | Skills / origen |
|---|---|
| Tu skill | `becario-reels` (zip v1.2) |
| Remotion oficial | 13 de `remotion-dev/skills` |
| HyperFrames | 15 oficiales de `heygen-com/hyperframes`, 11 de `hyperframes-student-kit` y `hyperframes-motion-reel` |
| GSAP oficial | 8 de `greensock/gsap-skills` |
| Motion design | `motion-design` (LottieFiles), `claude-motion` y `claude-motion-review-loop` (whaleyxbt), `claude-motion-design` (howseen), 7 de iart-ai, 4 de awesome-motion-design, 15 de motion-graphics-skills, 6 de Barty-Bart/motion-graphics, 3 de klik-anim, `product-launch-motion`, `onetake`, `lemo-opuscar`, `animate`, `claude-animated-shorts`, `claude-shorts` |
| Video toolkit | `video-toolkit`, `ffmpeg`, `moviepy`, `elevenlabs`, `playwright-recording`, `youtube-stats`, `parody-short`, `video-design` |
| Sonido | `earshot`, `real-sound`, `foley` (Openverse) |
| YouTube y análisis | 11 `yt-*` (youtube-agent-skill), `content-analyzer`, `last30days` |
| Video con IA (ComfyUI, necesita GPU) | 37 de `open-higgsfield-skills` |
| Diseño / UI | `impeccable`, `ui-ux-pro-max` |
| Marketing | `marketing-psychology`, `copywriting`, `social` |
| Anthropic | canvas-design, algorithmic-art, slack-gif-creator, web-artifacts-builder, mcp-builder, webapp-testing, theme-factory, brand-guidelines, doc-coauthoring |
| Utilidades | `find-skills`, `headroom`, `graphify` |
| Plugins (`.claude/settings.json`) | `ponytail` activado; marketplaces `claude-plugins-official` y `anthropics/skills` registrados, para instalar más con `/plugin` |

## Duplicados que se descartaron (se dejó la mejor versión)

- `claude-remotion-skill` y las skills de Remotion de otros kits → las reemplaza la **oficial de Remotion**.
- `hyperframes`, `gsap` y `hyperframes-cli` del student kit → se usan las **oficiales** de HeyGen y GreenSock.
- `frontend-design` (Anthropic) → **impeccable** es su versión ampliada.
- `animation-principles` (iart) → se queda la `motion-design` de LottieFiles.
- `sfx` (sxhzju) y `sound-design` (whaleyxbt, que depende de su propio motor) → `foley` + `real-sound` + `earshot`.
- `free-claude-code` y `OmniRoute` hacen lo mismo (pasarela a modelos gratis); ninguna es una skill (ver abajo).
- marketing-psychology de HaydenLundin → se usa la de `coreyhaines31/marketingskills`.

## Lo que no es una skill (se instala en tu propia PC)

| Nombre | Qué es | Cómo se instala |
|---|---|---|
| yt-dlp | Descarga videos y subtítulos | `pip install yt-dlp` (ya está en `setup.sh`) |
| markitdown | Convierte PDF, Word, etc. a Markdown | `pip install 'markitdown[all]'` (en `setup.sh`) |
| lottie-web | Librería JS de animaciones Lottie | `npm i lottie-web` dentro del proyecto de video |
| VoiceStudio (debpalash) | Voces locales, alternativa a ElevenLabs | App de escritorio: github.com/debpalash/VoiceStudio |
| OpenWhispr | Dictado por voz | App de escritorio: github.com/OpenWhispr/openwhispr |
| OmniRoute / free-claude-code | Pasarela para usar Claude Code con otros modelos | En tu PC; no aplica a sesiones en la nube |
| skillui | Genera un sistema de diseño a partir de una web | `npx skillui` |
| ClaudeAnimationBase | Kit de inicio para animación pintada a mano (p5.js) | `git clone https://github.com/JohnHeibel/ClaudeAnimationBase` |
| Notion | Conector de claude.ai | Ajustes → Conectores |

## Agregadas después (shorts animados y video con IA)

| Skill | Para qué |
|---|---|
| `shorts-animados-3d` | Shorts tipo caricatura 2D en mundo 3D (three.js + Remotion) o realistas en Blender. En español. Reemplaza a `claude-animated-shorts`. |
| `claude-3d-animated-shorts` | Personajes 3D redondos (estilo RicksClips), parecido al video de "Chuy" |
| `roblox-engine` | Shorts estilo Roblox en Blender (necesita Blender; ideal en tu PC con la 5070 Ti) |
| `minecraft`, `low-poly`, `stick-figure`, `zach-d-films`, `kurzgesagt`, `map-route`, `breakdown`, `graph`, `dan-koe`, `minimalistic-graphics` | 10 estilos de animación para reels (artemnovitckii). Comparten la carpeta `.claude/kit` |
| `motion-styles` | 74 estilos de explicador animado (pizarrón, acuarela, manga, Game Boy…) |
| `line-art-animation` | Animaciones de dibujo a tinta (personas que caminan, pueblos, día/noche) |
| `faceless-channel-recreator` | Copia el **formato** de un canal faceless que está pegando, con tus historias (usa el conector Higgsfield) |
| `cinematic-director` | Director para video con IA: guion técnico, tomas, prompts de imagen/video |
| `seedance-prompt-en` | Prompts para Seedance 2.0 (el modelo de video que usa Higgsfield) |

Lista curada de 180 repos de skills de video con nota de seguridad: `docs/referencias/awesome-claude-video-skills.md`.

## Agregadas el 18/11 (animación a código, estilo Minecraft)

`voxel-animations`, `3dixel`, `code-cinema`, `what-if-video` y 13 skills de principios de animación (squash & stretch, anticipación, timing…). Guía completa con repos, librerías, conectores, canales y documentos: `docs/referencias/animacion-a-codigo-recursos.md`.
