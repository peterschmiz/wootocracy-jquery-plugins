// **Wootocracy sound FX plugin**.
//
// [Previous Plugin](jquery.w.search.html) | [Next Plugin](jquery.w.tabvis.html)

//      Wootocracy
//      http://wootocracy.com
//      Copyright 2013, CarnationGroup, a part of POSSIBLE
//      Date: Mon Jun 26 16:33:30 2013 +0100

//      Sample usage
//      $(document).wSfx();

// ## Sound FX plugin for jQuery

(function ($) {

	var defaultOptions = {
			// Audio file prefixes (without extension)
			bufferSrcs: ['score', 'spin', 'notification', 'badge', 'levelup'],
			// Audio fx sprite prefix (without extension)
			fxSrc: 'static/audio/set',
			// Force preloading files
			forcePreload: false,
			// Number of tracks
			tracks: 5,
			// Number of clips
			clips: 3,
			// Volume
			volume: 1
		},

		defaultVars = {
			// Audio buffers
			buffers: {},
			// Audio context
			ctx: null,
			// Audio disabled
			disabled: false,
			// FX object
			fx: null,
			// Player object
			player: null,
			$wrapper: null
		},

		// Check WebAudio support
		checkWebAudio = function (vars) {
			if (window.hasOwnProperty('AudioContext')) {
				vars.ctx = new AudioContext();
			} else if (window.hasOwnProperty('webkitAudioContext')) {
				vars.ctx = new webkitAudioContext();
			}
		},

		// Init player
		initPlayer = function (params) {
			var tracks = [],
				total = params.tracks;

			// Create new tracks
			while (params.tracks--) {
				tracks.push(new Track(params.src, params.nokickoff));
			}

			return {
				tracks: tracks,
				play: function (player, start, length, volume) {
					var i = total,
						track = null;

					while (i--) {
						if (tracks[i].playing === false) {
							track = tracks[i];
							break;
						} else if (track === null || tracks[i].lastUsed < track.lastUsed) {
							track = tracks[i];
						}
					}

					if (track) {
						track.play(player, start, length, volume);
					}
				}
			};
		},

		// Load sound sprite
		loadSfxSprite = function (vars, options) {
			var canPlayMp3, canPlayOgg, postfix;

			vars.fx = document.createElement('audio');

			// Check supported audio file type
			canPlayMp3 = !!vars.fx.canPlayType && '' !== vars.fx.canPlayType('audio/mpeg');
			canPlayOgg = !!vars.fx.canPlayType && '' !== vars.fx.canPlayType('audio/ogg; codecs="vorbis"');

			// Set file extension
			if (canPlayMp3 === true) {
				postfix = '.mp3';
			} else if (canPlayOgg) {
				postfix = '.ogg';
			} else {
				vars.disabled = true;
				$.error('No audio support');
				return false;
			}

			// Init player if WebAudio is not supported  
			// or it's iOS and audio is not disabled
			if ((vars.ctx === null || vars.ios) && vars.disabled !== true) {
				vars.fx = initPlayer({src: options.fxSrc + postfix, tracks: vars.ios ? 1 : options.tracks, clips: options.clips, lead: 0, nokickoff: false});
			}
		},

		// Load audio files to buffer
		loadBuffer = function (vars, type, volume, noplay) {
			var request = new XMLHttpRequest();
			request.open("GET", 'static/audio/' + type + '.mp3', true);
			request.responseType = "arraybuffer";
			request.onload = function () {
				vars.buffers[type] = this.response;
				if (noplay !== true) {
					playBuffer(vars, type, volume);
				}
			};
			request.send();
		},

		// Play audio buffer (WebAudio)
		playBuffer = function (vars, type, volume) {
			var source,
				volumeNode;

			// Create and set buffer
			source = vars.ctx.createBufferSource();
			source.buffer = vars.ctx.createBuffer(vars.buffers[type], false);
			volumeNode = vars.ctx.createGainNode();
			volumeNode.gain.value = volume;
			source.connect(volumeNode);
			volumeNode.connect(vars.ctx.destination);
			source.noteOn(vars.ctx.currentTime + 0.01);
		},

		// Play sound
		playSound = function (start, length, volume, type, vars) {
			// Play normal method (`<audio>` tag mode)
			if (vars.ctx === null || vars.ios) {
				vars.fx.play(vars.fx, start, length, volume);
			// Play sound using WebAudio
			} else {
				// If it's not loaded load it first
				if (vars.buffers[type] === undefined) {
					loadBuffer(vars, type, volume);
				} else {
					playBuffer(vars, type, volume);
				}
			}
		},

		// Plugin methods
		methods = {

			init: function (opts) {
				return this.each(function () {
					if ($(this).data('wSfx') === undefined) {
						var options = $.extend({}, defaultOptions, opts),
							vars = $.extend({}, defaultVars);
						$(this).data('wSfx', options);
						$(this).data('wSfxVars', vars);
						vars.$wrapper = $(this);
						vars.ios = $('html').hasClass('ios');
						checkWebAudio(vars);
						loadSfxSprite(vars, options);
						if (options.forcePreload === true) {
							loadBuffer(vars, options.bufferSrcs[0], 1, true);
						}
						vars.inited = true;
					}
				});
			},

			// Play sound
			play: function (start, length, volume, type, delay) {
				return this.each(function () {
					var vars = $(this).data('wSfxVars'),
						options = $(this).data('wSfx');
					if (vars.disabled !== true) {
						if (delay === undefined) { delay = 4; }
						if (volume === undefined) { volume = options.volume; }
						window.setTimeout(function () {
							playSound(start, length, volume, type, vars);
						}, delay);
					}
				});
			}

		};

	// Extend jQuery with `wSfx`
	$.fn.extend({
		wSfx: function (method) {
			var result;
			if (methods[method]) {
				result = methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
			} else if (typeof method === 'object' || !method) {
				result = methods.init.apply(this, arguments);
			} else {
				$.error('Method ' + method + ' does not exist on jQuery.wSfx');
				result = false;
			}
			return result;
		}
	});

}(jQuery));