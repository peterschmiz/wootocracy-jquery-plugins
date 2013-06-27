// **Wootocracy map plugin**.
//
// [Previous Plugin](jquery.w.list.html) | [Next Plugin](jquery.w.overlay.html)

//      Wootocracy
//      http://wootocracy.com
//      Copyright 2013, CarnationGroup, a part of POSSIBLE
//      Date: Mon Jun 26 14:54:10 2013 +0100

//      Sample usage
//      $(.target).wMap();

// ## Map plugin for jQuery

(function ($) {

	var defaultOptions = {
			// Path to the SVG map
			mapSVG: 'static/i/svg/worldmap.' + WOOT.assetVersion + '.svgz',
			// URL for the map data
			mapDataUrl: null,
			// Map ratio (width / height)
			mapRatio: 2000 / 1294,
			// Map render is ready callback
			mapReadyCallback: function () { },
			// Map resize callback
			mapResizeCallback: function () { }
		},

		defaultVars = {
			cityCanvas: null,
			cityCtx: null,
			cities: [],
			mapCanvas: null,
			mapCtx: null,
			resizeTid: null,
			redraw: false,
			$wrapper: null
		},

		// Init (cache) the used DOM elements
		initDOMElements = function (vars) {
		},

		// Init event bindings
		initBindings = function (vars, options) {
			$(window).on({
				'resize.wmap': function () {
					window.clearTimeout(vars.resizeTid);
					vars.resizeTid = window.setTimeout(function () {
						resizeMap(vars, options);
					}, 200);
				}
			});
		},

		// Init map, create canvas elements
		initMap = function (vars, options) {
			var w = vars.$wrapper.width(),
				h = Math.ceil(vars.$wrapper.width() / options.mapRatio);

			// Create map layer
			vars.mapCanvas = document.createElement('canvas');
			vars.mapCtx = vars.mapCanvas.getContext('2d');
			vars.mapCanvas.setAttribute('width', w);
			vars.mapCanvas.setAttribute('height', h);

			// Create city layer
			vars.cityCanvas = document.createElement('canvas');
			vars.cityCtx = vars.cityCanvas.getContext('2d');
			vars.cityCanvas.setAttribute('width', w);
			vars.cityCanvas.setAttribute('height', h);

			vars.$wrapper.css({height: h});
			vars.$wrapper.append(vars.mapCanvas);
			vars.$wrapper.append(vars.cityCanvas);

			// Load map SVG
			loadMapSVG(vars, options);
		},

		// Load map SVG
		loadMapSVG = function (vars, options) {
			$.ajax({
				url: options.mapSVG,
				type: 'GET',
				success: function (result) {
					options.mapSVG = result;
					setCanvasBackground(vars, options);
				}
			});
		},

		// Parse SVG to canvas with `canvg` plugin
		setCanvasBackground = function (vars, options) {
			if (canvg !== undefined) {
				canvg(vars.mapCanvas, options.mapSVG, {
					ignoreMouse: true,
					ignoreAnimation: true,
					ignoreDimensions: true,
					vars: vars,
					options: options,
					renderCallback: function () {
						mapReady(this.vars, this.options);
					},
					forceRedraw: function () {
						return refreshMap(this.vars, this.options);
					}
				});
			}
		},

		// Map is loaded and ready
		mapReady = function (vars, options) {
			options.mapReadyCallback.call(this);
			loadCities(vars, options);
		},

		// Load city datas
		loadCities = function (vars, options) {
			var url = vars.$wrapper.attr('data-url');
			$.ajax({
				type: 'GET',
				url: url,
				dataType: 'json',
				success: function (result) {
					initCities(vars, options, result.data);
				}
			});
		},

		// Set city properties (position, votes, etc.)
		initCities = function (vars, options, result) {
			var i = 0,
				l = result.length,
				coord,
				corrX = (vars.$wrapper.width() / 8192) * 266,
				corrY = (vars.$wrapper.width() / 100) * 4.17,
				city = {};

			for (i; i < l; i++) {
				city = {};
				city.city = result[i].name;
				city.pos = result[i].geometry;
				city.id = result[i]._id;
				city.action = result[i].votes;

				// Convert GPS coordinates to pixels
				coord = gpsToPixels(city.pos.lat, city.pos.lon, vars.$wrapper.width(), vars.$wrapper.width());

				city.pos.x = Math.round(coord.x - corrX);
				city.pos.y = Math.round(coord.y - corrY);
				city.radius = 0;
				city.showdata = false;

				if (city.action.ownz === undefined) {
					city.action.ownz = 0;
				}
				if (city.action.woot === undefined) {
					city.action.woot = 0;
				}
				if (city.action.list === undefined) {
					city.action.list = 0;
				}

				city.action.sum = city.action.ownz + city.action.woot + city.action.list;
				city.action.ownz_percent = Math.round((city.action.ownz / city.action.sum) * 100);
				city.action.woot_percent = Math.round((city.action.woot / city.action.sum) * 100);
				city.action.list_percent = 100 - city.action.ownz_percent - city.action.woot_percent;

				vars.cities.push(city);
			}

			// Render cities to canvas
			renderCities(vars);
		},

		// Refresh map
		refreshMap = function (vars, options) {
			var res = false;
			if (vars.redraw === true) {
				vars.redraw = false;
				res = true;
				options.mapResizeCallback.call(this);
			}
			return res;
		},

		// Resize map
		resizeMap = function (vars, options) {
			var w = vars.$wrapper.width(),
				h = Math.ceil(vars.$wrapper.width() / options.mapRatio);
			vars.mapCanvas.setAttribute('width', w);
			vars.mapCanvas.setAttribute('height', h);
			vars.cityCanvas.setAttribute('width', w);
			vars.cityCanvas.setAttribute('height', h);
			vars.$wrapper.css({height: h});
			vars.redraw = true;
			renderCities(vars);
		},

		// Render city datas to canvas
		renderCities = function (vars) {
			var city,
				dotcolor,
				i = 0,
				j,
				lastend,
				actions = ['ownz', 'woot', 'list'],
				percent = 0,
				actionColors = ['#4139d7', '#45be81', '#ff6060'],
				l = vars.cities.length;

			for (i; i < l; i++) {
				city = vars.cities[i];
				dotcolor = '#4139d7';
				lastend = 0;
				j = 0;

				if (city.action.woot > city.action.ownz && city.action.woot > city.action.list) { dotcolor = '#45be81'; }
				if (city.action.list > city.action.woot && city.action.list > city.action.ownz) { dotcolor = '#ff6060'; }
				if (city.action.ownz > city.action.list && city.action.ownz > city.action.woot) { dotcolor = '#4139d7'; }

				// Generate pie-charts
				for (j; j < actions.length; j++) {
					percent = city.action[actions[j] + '_percent'] / 100;

					vars.cityCtx.fillStyle = actionColors[j];
					vars.cityCtx.beginPath();
					vars.cityCtx.moveTo(city.pos.x, city.pos.y);
					vars.cityCtx.arc(city.pos.x, city.pos.y, 10, lastend, lastend + (Math.PI * 2 * percent), false);
					vars.cityCtx.lineTo(city.pos.x, city.pos.y);
					vars.cityCtx.fill();

					lastend += Math.PI * 2 * percent;
				}
			}
		},

		// GPS to pixels converter
		gpsToPixels = function (lat, lng, w, h) {
			var xPixelToDegreeRatio = w / 360,
				yPixelToDegreeRatio = w / (2 * Math.PI),
				origin = {x: w / 2, y: h / 2},
				point = {},
				f;

			point.x = Math.round(origin.x + (lng * xPixelToDegreeRatio));
			f = Math.min(Math.max(Math.sin(lat * (Math.PI / 180)), -0.9999), 0.9999);
			point.y = Math.round(origin.y + 0.5 * Math.log((1 + f) / (1 - f)) * -yPixelToDegreeRatio);

			return point;
		},

		// Plugin methods
		methods = {

			init: function (opts) {
				return this.each(function () {
					if ($(this).data('wMap') === undefined) {
						var options = $.extend({}, defaultOptions, opts),
							vars = $.extend({}, defaultVars);
						$(this).data('wMap', options);
						$(this).data('wMapVars', vars);
						vars.$wrapper = $(this);
						initDOMElements(vars);
						initBindings(vars, options);
						initMap(vars, options);
					}
				});
			},

			// Refresh map and re-load cities
			refresh: function () {
				return this.each(function () {
					var options = $(this).data('wMap'),
						vars = $(this).data('wMapVars');
					loadCities(vars, options);
				});
			}

		};

	// Extend jQuery with `wMap`
	$.fn.extend({
		wMap: function (method) {
			var result;
			if (methods[method]) {
				result = methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
			} else if (typeof method === 'object' || !method) {
				result = methods.init.apply(this, arguments);
			} else {
				$.error('Method ' + method + ' does not exist on jQuery.wMap');
				result = false;
			}
			return result;
		}
	});

}(jQuery));