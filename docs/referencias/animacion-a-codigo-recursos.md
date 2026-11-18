# Animación hecha a puro código, bien hecha: recursos encontrados

Investigación del 18/11/2026. Lo que está marcado como **instalado** ya está en `.claude/skills/` (todo MIT, revisado: sin descargas ni comandos sospechosos). Lo demás son enlaces para usar cuando haga falta.

## 1. Skills instaladas hoy

| Skill | Qué aporta | Origen |
|---|---|---|
| `voxel-animations` | Escenas de bloques con texturas pixeladas generadas en código, personaje propio con rig, partículas, "pop-in" con rebote, explosión, antorchas y render exacto por cuadro. **La más cercana a "Minecraft bien hecho".** | [normix93/voxel-animations](https://github.com/normix93/voxel-animations) |
| `3dixel` | Modelos estilo Blockbench (pocos cubos, textura pixelada pintada en código) de mobs, props y armas, con vistas previas. | [mankidev/3dixel](https://github.com/mankidev/3dixel) |
| `code-cinema` | Películas cortas 3D hechas de código: todo es función del tiempo, una línea de tiempo manda a imagen y sonido, exporta con desenfoque de movimiento y portada. Metodología de plan → muestra de 10 s → película. | [bangbuilds/code-cinema](https://github.com/bangbuilds/code-cinema) |
| `what-if-video` | Videos verticales "¿Qué pasaría si…?" con Remotion + React Three Fiber: mundo low-poly, carteles de noticias, cuenta regresiva. | [BinhL3/what-if-video-skill](https://github.com/BinhL3/what-if-video-skill) |
| 10 skills de principios de animación (`squash-stretch-mastery`, `anticipation-mastery`, `follow-through-overlapping`, `timing-principle-mastery`, `exaggeration-mastery`, `staging-mastery`, `arc-mastery`, `slow-in-out-mastery`, `secondary-action-mastery`, `appeal-mastery`) + `animation-game-designer`, `animation-3d-spatial`, `animation-video-motion` | Los 12 principios de Disney convertidos en reglas para Claude. Sirven para que los personajes se sientan vivos y no "planos". | [dylantarre/animation-principles](https://github.com/dylantarre/animation-principles) (144 skills; instalé las relevantes) |

Ya estaban instaladas y siguen siendo la base: `shorts-animados-3d`, `claude-3d-animated-shorts`, `klik-anim`, `klik-cam`, `claude-motion`, `motion-doctrine`, `earshot`, `real-sound`, `foley`.

## 2. Lo que aprendí al leerlas (aplicable a nuestros videos)

De `voxel-animations`:
- Los bloques aparecen con **rebote (overshoot)**; no hay movimientos lineales en nada físico.
- Los escombros usan gravedad (~20–22 bloques/s²) y rebotes amortiguados; el personaje camina a ~5 bloques/s y gira suave.
- Texturas 16×16 con filtro `NearestFilter`, luz dura, sombras claras y pocos colores por material.
- Un sujeto principal en el centro, cámara con órbita lenta y fondo tranquilo.

De `code-cinema`:
- **Todo es función del tiempo `t`** (sin estado acumulado ni azar sin semilla): por eso se puede retroceder, exportar exacto y poner desenfoque de movimiento.
- **Una sola línea de tiempo manda a la imagen y al sonido**: cada golpe queda registrado como evento y el sonido se coloca encima.
- Una **gramática repetida** (una misma acción que se repite y que el espectador aprende en unos segundos) y estructura con un giro final.
- Siempre una **muestra de 10 s** antes del video completo: los errores de estilo salen baratos ahí.

## 3. Librerías para sumar al proyecto de video (npm)

| Librería | Para qué | Enlace |
|---|---|---|
| `skinview3d` | Jugador de Minecraft con proporciones reales y animaciones listas: caminar, correr, volar, nadar, agacharse, saludar, golpear, reposo. Usa tu propia skin (no la de Mojang). Sirve para que Steve se mueva bien, no solo se deslice. | [bs-community/skinview3d](https://github.com/bs-community/skinview3d) |
| `minevo3d` | Lo mismo, con **codos y rodillas que se doblan de verdad**. | [DryanFTH/Minevo3D](https://github.com/DryanFTH/Minevo3D) |
| `three.quarks` | Sistema de partículas y efectos (humo, chispas, explosiones). | [Alchemist0823/three.quarks](https://github.com/Alchemist0823/three.quarks) |
| `realism-effects` | Desenfoque de movimiento, iluminación global y suavizado temporal. | [0beqz/realism-effects](https://github.com/0beqz/realism-effects) |
| `n8ao` (versión WebGPU adaptada) | Oclusión ambiental: da profundidad y sombras suaves en las esquinas. | [andrewslabmd/n8ao-webgpu](https://github.com/andrewslabmd/n8ao-webgpu) |
| `three-good-godrays` | Rayos de luz volumétricos. | [Ameobea/three-good-godrays](https://github.com/Ameobea/three-good-godrays) |
| `@remotion/three` | Ya lo usamos: la regla es no animar nada fuera de `useCurrentFrame()`. | [Remotion: 3D](https://www.remotion.dev/docs/three) |

## 4. Repos de referencia (para copiar ideas, no instalados)

- [nguyenvanlinh14/mv-studio](https://github.com/nguyenvanlinh14/mv-studio): motor de videos 3D en código con **desenfoque de movimiento por subcuadro, profundidad de campo, bloom y cortes (whip, zoom, glitch)**. Es el mejor ejemplo del acabado que buscamos.
- [m2-md/game-feel-hitstop-juice](https://github.com/m2-md/game-feel-hitstop-juice): congelado de cuadros ("hit-stop") en el impacto, temblor de cámara con decaimiento, squash & stretch con resortes y destello al golpear, todo en una función `impact()`. Se puede portar a Remotion.
- [krakujs/sceneparts](https://github.com/krakujs/sceneparts): biblioteca abierta de partes animadas (personajes, props, escenarios) en SVG (2D).
- [tuzhechen2005/opus-video-skills](https://github.com/tuzhechen2005/opus-video-skills): estilos "painted-animation" (acuarela y tinta con actuación de personajes) y tipografía cinética.
- [imjszhang/awesome-code-video](https://github.com/imjszhang/awesome-code-video): lista curada de plantillas y recetas de video-como-código.
- [zhuyansen/awesome-claude-video-skills](https://github.com/zhuyansen/awesome-claude-video-skills): 180 repos de skills de video, cada uno con nota de seguridad (guardada en este repo).
- [kai-denrei/animation-primitives](https://github.com/kai-denrei/animation-primitives): los 12 principios ilustrados con código de canvas, deterministas.

## 5. Conectores (MCP) relacionados

| Conector | Para qué sirve | Estado |
|---|---|---|
| vidIQ | Investigar YouTube: palabras clave, videos "outliers" (los que rinden muy por encima del canal), tendencias, estadísticas de canal. Útil para decidir qué formato repetir. | No conectado (se agrega en claude.ai → Conectores) |
| HyperFrames by HeyGen | Animaciones y motion graphics con HTML, con render a video. | No conectado |
| Stewdio | Motion graphics y animaciones descritos a Claude, con editor visual. | No conectado |
| ElevenLabs | En el directorio aparece enfocado en agentes de voz; **no encontré ahí uno para generar locuciones**, así que seguimos pasando el audio a mano. | — |
| [Blender MCP](https://github.com/ahujasid/blender-mcp) (no es conector del directorio: se instala en tu PC) | Controla Blender con Claude. | Solo en tu PC |

Para Blender también hay skills: [EL4CTEO/blender-skills](https://github.com/EL4CTEO/blender-skills) (28, para Blender 5.3), [arjun988/blender-skills](https://github.com/arjun988/blender-skills) (94 especializadas) y [agmmnn/awesome-blender](https://github.com/agmmnn/awesome-blender) (lista curada). No las instalé: solo sirven en tu PC.

## 6. Canales, videos y cursos

(Verifiqué que existen; no pude abrir YouTube desde la sesión, así que revisa el canal en vivo.)

- **Squared Media** (David R.B.): serie "Minecraft Animation Tutorial" en Blender, con episodios de configuración del mundo, escena, luces y render. Es la referencia para animación de Minecraft.
- **Black Plasma Studios**: uno de los canales de animación de Minecraft más grandes; sirve para estudiar ritmo y gags. Las cifras de suscriptores varían según la fuente.
- **Alan Becker** (*Animation vs. Minecraft*), **Element Animation** (*An Egg's Guide to Minecraft*, *Villager News*) y **BigSchool** (*Monster School*): ejemplos de series con personajes de Minecraft que repiten fórmula.
- **Wawa Sensei**: tutoriales de Three.js y React Three Fiber (personajes, animación con huesos, avatares), con curso propio.
- **Fireship** hizo un video sobre crear video con código usando Remotion.
- **"Juice it or lose it"** (Martin Jonasson y Petri Purho, 2012): charla clásica que muestra cómo se le agrega "jugo" (partículas, temblor, sonido, animación) a un juego simple. Es el mejor tutorial de por qué un golpe se siente bien.
- **Video de la skill de Mr omi**: [How to Make Viral Animated Shorts Using Claude](https://www.youtube.com/watch?v=SHzo1TJgKqM).

## 7. Documentos y artículos

- [The 12 Principles of Animation (cg-wire)](https://blog.cg-wire.com/12-principles-animation/)
- [12 principles for game animation (Game Developer)](https://www.gamedeveloper.com/game-platforms/12-principles-for-game-animation)
- [Squash and Stretch (Josh W. Comeau)](https://www.joshwcomeau.com/animation/squash-and-stretch/): con código y matemática.
- [Disney 12 principles for games (gamejuice)](https://gamejuice.pages.dev/articles/disney-12-animation-principles-games)
- Libros clásicos: *The Illusion of Life* (Disney, 1981), *Game Feel* (Steve Swink), *The Animator's Survival Kit* (Richard Williams).

## 8. Assets 3D con licencia libre

- [Kenney, Mini Characters](https://kenney.nl/assets/mini-characters) (3D, CC0, con animaciones). Ojo: un usuario reporta que al importar el FBX se pierden las animaciones; hay que probarlo.
- El "Voxel Pack" de Kenney es **2D (sprites)**, no 3D.
- Lo que no hay que hacer: usar texturas, sonidos, logos o nombres oficiales de Minecraft. La skill `voxel-animations` lo advierte y genera todo en código.

## 9. Descartado

- No instalé las skills de web ("genjutsu", "auteur", sitios scroll): son para páginas web, no para video.
- No instalé las que dependen de APIs pagas ni las 144 completas de principios (hay 12 variantes de lo mismo).
- Los skills de Blender, el motor de Roblox y la lista de Blender quedan para tu PC.

## 10. Siguiente paso recomendado

Con esto, un Steve "bien hecho" en código sería: **`skinview3d` o `minevo3d` para el cuerpo con animaciones reales + `voxel-animations` para el mundo de bloques + `three.quarks` y `realism-effects` para humo, polvo y desenfoque + el patrón de `game-feel-hitstop-juice` en cada golpe**, con la línea de tiempo en cuadros que ya usamos.
