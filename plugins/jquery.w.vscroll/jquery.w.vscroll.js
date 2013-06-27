// **Wootocracy vertical scroll plugin**.
//
// [Previous Plugin](jquery.w.vote.html)

//      Wootocracy
//      http://wootocracy.com
//      Copyright 2013, CarnationGroup, a part of POSSIBLE
//      Date: Mon Jun 27 10:38:01 2013 +0100

//      Sample usage
//      $(.target).wVScroll();

// ## Vertical scroll plugin for jQuery

(function ($) {

	var defaultOptions = {
			// Handler wrapper jQuery object  
			// (you can pass your own handler object)
			$handler: null,
			// Keyboard navigation enabled
			keyboardEnabled: true,
			// Keyboard navigation speed
			keyboardSpeed: 20,
			// Minimum handler width
			minHandlerWidth: 40,
			// Maximum handler width (calculated after init)
			maxHandlerWidth: -1,
			// Scroll event callback function
			scrollCallback: null,
			// Scrollbar wrapper jQuery object
			$scrollBar: null,
			// Scroll main wrapper jQuery object
			$scrollWrapper: null,
			// Scroll speed
			speed: 6
		},

		defaultVars = {
			// Handler wrapper jQuery object
			$handler: null,
			// Scrollbar wrapper jQuery object 
			$scrollbar: null,
			// Scroll main wrapper jQuery object
			$scrollWrapper: null,
			$wrapper: null,
			// Scroll is active
			active: true,
			// Dragging
			dragging: false,
			// Scroll is enabled
			enabled: true,
			// Event bindings are inited
			eventsBinded: false,
			// Fake element for measurement
			fakeElement: document.createElement('div'),
			// Handler width
			handlerWidth: 0,
			// Handler positions
			handlerOffsetX: 0,
			handlerTranslateX: 0,
			// Plugin ID
			id: null,
			// Prefixes for feature testing
			prefixes: ['transform', 'WebkitTransform', 'MozTransform', 'OTransform', 'msTransform', 'none'],
			// Scroll ratio
			scrollRatio: 1,
			// Scroll width
			scrollWrapperWidth: 0,
			// Scroll position
			scrollWrapperTranslateX: 0,
			// Touch mode enabled
			touchMode: false,
			// Touch start position
			touchStartX: 0,
			touchWrapperPrevPosition: 0,
			touchHandlerPrevPosition: 0,
			transformPrefix: 'none',
			// Simple CSS transform supported
			transformSupported: 0,
			// 3D CSS transform supported
			transform3dSupported: false,
			wrapperHeight: 0,
			wrapperOffsetX: 0
		},

		// Test for CSS transform support
		testProps = function (vars) {
			while (vars.transformSupported !== true && vars.transformSupported !== vars.prefixes.length - 1) {
				vars.transformPrefix = vars.prefixes[vars.transformSupported];
				vars.transformSupported = vars.fakeElement.style[vars.prefixes[vars.transformSupported++]] !== undefined || vars.transformSupported;
			}

			if (vars.transformSupported !== true) {
				vars.transformSupported = false;
			} else {
				if ($('html').hasClass('csstransforms3d')) {
					vars.transform3dSupported = true;
				}
				switch (vars.transformPrefix.toLowerCase()) {
					case 'transform':
						vars.transformPrefix = 'transform';
						break;
					case 'webkittransform':
						vars.transformPrefix = '-webkit-transform';
						break;
					case 'moztransform':
						vars.transformPrefix = '-moz-transform';
						break;
					case 'otrasform':
						vars.transformPrefix = '-o-transform';
						break;
					case 'mstransform':
						vars.transformPrefix = '-ms-transform';
						break;
				}
			}
		},

		// Init (cache) the used DOM elements
		initDOMElements = function (vars, options) {
			if (options.$scrollbar === null || options.$handler === null || options.$scrollWrapper === null) {
				$.error('Please add $scrollbar, $handler, $scrollWrapper element as a jQuery object');
			} else {
				vars.$scrollbar = options.$scrollbar;
				vars.$handler = options.$handler;
				vars.$scrollWrapper = options.$scrollWrapper;
			}
		},

		// Init event bindings
		initBindings = function (vars, options) {
			$(window).on({
				'resize.wscroll': function () {
					window.setTimeout(function () {
						setup(vars, options);
					}, 50);
				}
			});
		},

		// Setup positions, dimensions
		setup = function (vars, options) {
			vars.wrapperWidth = vars.$wrapper.width();
			vars.wrapperOffsetX = vars.$wrapper.offset().left;
			vars.scrollWrapperWidth = vars.$scrollWrapper.width();
			vars.handlerWidth = (vars.wrapperWidth / vars.scrollWrapperWidth) * vars.wrapperWidth;
			if (vars.handlerWidth < options.minHandlerWidth) { vars.handlerWidth = options.minHandlerWidth; }
			if (vars.handlerWidth > options.maxHandlerWidth && options.maxHandlerWidth !== -1) { vars.handlerWidth = options.maxHandlerWidth; }
			resizeHandler(vars.handlerWidth, vars);
			vars.scrollRatio = (vars.scrollWrapperWidth - vars.wrapperWidth) / (vars.wrapperWidth - vars.handlerWidth) * -1;
			vars.enabled = vars.scrollRatio < -1;
			if (vars.enabled === false) {
				disableScroll(vars, options);
			} else {
				enableScroll(vars, options);
			}
		},

		// Disable scroll
		disableScroll = function (vars, options) {
			vars.$scrollbar.hide();
			unbindEvents(vars);
			resetPositions(vars, options);
		},

		// Enable scroll
		enableScroll = function (vars, options) {
			vars.$scrollbar.show();
			if (vars.eventsBinded === false) {
				bindEvents(vars, options);
			}
			resetPositions(vars, options);
		},

		// Bind events
		bindEvents = function (vars, options) {
			var ret;
			vars.$handler.on({
				'mousedown.wvscroll': function (e) {
					e.preventDefault();
					if (e.offsetX !== undefined) {
						vars.handlerOffsetX = e.offsetX;
					} else {
						vars.handlerOffsetX = e.clientX - $(e.currentTarget).offset().left;
					}
					vars.dragging = true;
				}
			});
			vars.$wrapper.on({
				'mouseover.wvscroll': function () {
					vars.active = true;
				},
				'mouseleave.wvscroll': function () {
					vars.active = false;
				},
				'touchstart.wvscroll': function (e) {
					e.stopPropagation();
					vars.active = true;
					vars.touchMode = true;
					vars.touchStartX = e.originalEvent.targetTouches[0].pageX;
				},
				'touchend.wvscroll': function (e) {
					e.stopPropagation();
					vars.active = false;
					vars.touchMode = false;
					vars.touchHandlerPrevPosition = vars.handlerTranslateX;
					vars.touchWrapperPrevPosition = vars.scrollWrapperTranslateX;
				}
			});

			$(document).on('mouseup.' + vars.id, function () {
				vars.dragging = false;
				vars.handlerOffsetX = 0;
			});
			$(document).on('mousemove.' + vars.id, function (e) {
				if (vars.dragging === true) {
					e.preventDefault();
					moveByDrag(e, vars, options);
				}
			});
			$(document).on('touchstart.' + vars.id + 'touchend.' + vars.id, function () {
				vars.dragging = false;
				vars.touchMode = false;
			});
			$(document).on('touchmove.' + vars.id, function (e) {
				if (vars.touchMode === true) {
					if (Math.abs(vars.touchStartX - (e.originalEvent.targetTouches[0].pageX)) > 10) {
						e.preventDefault();
						e.stopPropagation();
						moveByTouch(e.originalEvent, vars, options);
					}
				}
			});
			$(document).on('selectstart.' + vars.id, function (e) {
				ret = true;
				if (vars.active === true) {
					e.preventDefault();
					ret = false;
				}
				return ret;
			});
			$(document).on('keydown.' + vars.id, function (e) {
				if (options.keyboardEnabled === true && vars.active === true) {
					if (e.keyCode === 37) {
						e.preventDefault();
						moveByKey(-options.keyboardSpeed, vars, options);
					} else if (e.keyCode === 39) {
						e.preventDefault();
						moveByKey(options.keyboardSpeed, vars, options);
					}
				}
			});

			vars.eventsBinded = true;
		},

		// Unbind events
		unbindEvents = function (vars) {
			vars.$handler.off('.wvscroll');
			vars.$wrapper.off('.wvscroll');
			$(document).off('.' + vars.id);
			vars.eventsBinded = false;
		},

		// Reset scroller positions
		resetPositions = function (vars, options) {
			vars.touchStartX = 0;
			vars.touchWrapperPrevPosition = 0;
			vars.touchHandlerPrevPosition = 0;
			setTransform(vars.$scrollWrapper, 0, vars);
			setTransform(vars.$handler, 0, vars);
			scrollCallback(options, 0);
		},

		// Resize scrollbar handler
		resizeHandler = function (w, vars) {
			vars.$handler.css({width: w});
		},

		// Move by dragging
		moveByDrag = function (event, vars, options) {
			updatePositions(event.originalEvent.pageX - vars.wrapperOffsetX - vars.handlerOffsetX, vars, options);
		},

		// Move by touch
		moveByTouch = function (event, vars, options) {
			updatePositions(vars.touchStartX - (event.targetTouches[0].pageX), vars, options);
		},

		// Move by keyboard
		moveByKey = function (delta, vars, options) {
			updatePositions(parseInt(vars.handlerTranslateX + delta, 10), vars, options);
		},

		// Update scrolbar positions
		updatePositions = function (x, vars, options) {
			if (vars.enabled === true) {
				positionHandler(x, vars);
				positionWrapper(x, vars, options);
			}
		},

		// Set handler position
		positionHandler = function (x, vars) {
			var maxX = vars.wrapperWidth - vars.handlerWidth;
			if (vars.touchMode === true) { x = x / -vars.scrollRatio; }
			x = parseInt(x + vars.touchHandlerPrevPosition, 10);
			if (x < 0) { x = 0; }
			if (x > maxX) { x = maxX; }
			setTransform(vars.$handler, x, vars);
			vars.handlerTranslateX = x;
		},

		// Set content position
		positionWrapper = function (x, vars, options) {
			var maxX = vars.scrollWrapperWidth - vars.wrapperWidth;
			x = vars.touchMode === true ? x * -1 : vars.scrollRatio * x;
			x = parseInt(x + vars.touchWrapperPrevPosition, 10);
			if (x > 0) { x = 0; }
			if (x * -1 > maxX) { x = maxX * -1; }
			setTransform(vars.$scrollWrapper, x, vars);
			vars.scrollWrapperTranslateX = x;
			scrollCallback(options, x);
		},

		// Call callback on scroll
		scrollCallback = function (options, x) {
			if (options.scrollCallback !== null) {
				options.scrollCallback.call(this, x);
			}
		},

		// Set CSS tranform values
		setTransform = function ($obj, val, vars) {			
			if (vars.transformSupported === true) {
				// Set CSS3 transform if supported
				if (vars.transform3dSupported === true) {
					$obj.css(vars.transformPrefix, 'translate3d(' + val + 'px, 0, 0)');
				// Or use simple CSS top positioning
				} else {
					$obj.css(vars.transformPrefix, 'translateX(' + val + 'px)');
				}
			} else {
				$obj.css('left', val + 'px');
			}
		},

		// Plugin methods
		methods = {

			init: function (opts) {
				return this.each(function () {
					if ($(this).data('wVScroll') === undefined) {
						var options = $.extend({}, defaultOptions, opts),
							vars = $.extend({}, defaultVars);
						$(this).data('wVScroll', options);
						$(this).data('wVScrollVars', vars);
						vars.$wrapper = $(this);
						vars.id = 'wvscroll_' + Math.random() * 9999999;
						testProps(vars);
						initDOMElements(vars, options);
						initBindings(vars, options);
						setup(vars, options);
					}
				});
			},

			// Refresh scroll
			refresh: function () {
				return this.each(function () {
					var options = $(this).data('wVScroll'),
						vars = $(this).data('wVScrollVars');
					setup(vars, options);
				});
			},

			// Reset scroll
			reset: function () {
				return this.each(function () {
					var options = $(this).data('wVScroll'),
						vars = $(this).data('wVScrollVars');
					resetPositions(vars, options);
				});
			}
		};

	// Extend jQuery with `wVScroll`
	$.fn.extend({
		wVScroll: function (method) {
			var result;
			if (methods[method]) {
				result = methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
			} else if (typeof method === 'object' || !method) {
				result = methods.init.apply(this, arguments);
			} else {
				$.error('Method ' + method + ' does not exist on jQuery.wVScroll');
				result = false;
			}
			return result;
		}
	});

}(jQuery));