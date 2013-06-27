jQuery wSfx
================

jQuery [Wootocracy](http://wootocracy.com) audio handling plugin

Description
-----------

The plugin handles audio effects with `<audio>` + audio sprite solution or (if supported) with WebAudio.

Options
-------

Set audio effects without extension (will be detected later):

```javascript
bufferSrc: ['fx1', 'fx2', 'fx3']
```

Set audio sprite (needed if WebAudio is not supported) without extension:

```javascript
fxSrc: 'static/audio-sprite'
```

Set default volume, default is 1 (max):

```javascript
volume: 1
```

Methods
-------

Play sound:

```javascript
$.wSfx('play', start, length, volume, type, delay);
```

Feedback
--------

**Peter Schmiz**
<peter.schmiz@carnationgroup.com>