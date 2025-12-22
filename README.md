# FlexyOrbit

### Yet Another Newton's Cannon in 3D

FlexyOrbit is a small educational project for having fun with the Earth and its gravity.

The idea to develop this project came to me after seeing the interactive simulations of [ScienceEtonnante](https://www.youtube.com/@ScienceEtonnante), a fantastic YouTube channel for popularizing science, particularly [the one about Newton's cannon](https://explorables.scienceetonnante.com/newton-cannon/).

Many thanks to the authors of the [Three.js](https://threejs.org/), a Javascript library which makes it easy to build 3D scenes in a browser, to [Grok](https://grok.com), which helped me develop the code, and of course to Isaac Newton, who was the first to understand that the Moon was in free fall ! ;)

### About the Earth texture images

By default the used texture is that one : https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg. It is an image in 4K from the NASA Blue Marble project.

But note that you can download better textures and host them locally (in order to avoid CORS issues), for examples:
- 5K: https://sbcode.net/topoearth/blue-marble-texture-5400x2700/ 
- 8K: https://www.solarsystemscope.com/textures/download/8k_earth_daymap.jpg
- 21K: https://sgr_a.artstation.com/store/5oNl/solar-system-in-16k-texture-pack?referrer=grok.com

But most of 3D renderers fixe a size limit of 8K, or 16K for high end graphic cards.
