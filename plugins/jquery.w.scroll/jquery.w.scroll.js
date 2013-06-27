// **Wootocracy scroll plugin**.
//
// [Previous Plugin](jquery.w.score.html) | [Next Plugin](jquery.w.search.html)

//      Wootocracy
//      http://wootocracy.com
//      Copyright 2013, CarnationGroup, a part of POSSIBLE
//      Date: Mon Jun 26 15:51:10 2013 +0100

//      Sample usage
//      $(.target).wScroll();

// ## Scroll plugin for jQuery

(function ($) {

	var defaultOptions = {
			// Auto hide handler
			autoHide: true,
			// Handler hide delay
			autoHideDelay: 1000,
			// Handler color
			handlerColor: 'rgba(8, 38, 23, 0.25)',
			// Handler mouse over color
			handlerOverColor: 'rgba(8, 38, 23, 0.5)',
			// Keyboard navigation enabled
			keyboardEnabled: true,
			// Keyboard speed
			keyboardSpeed: 20,
			// Minimum handler height
			minHandlerHeight: 40,
			// Maximum handler height
			maxHandlerHeight: -1,
			// Handler top padding
			paddingTop: 2,
			// Handler bottom padding
			paddingBottom: 2,
			scrollCallback: null,
			// Scroll speed
			speed: 6
		},

		defaultVars = {
			// Handler wrapper jQuery object
			$handler: null,
			// Scrollbar wrapper jQuery object
			$scrollbar: null,
			// Scroll wrapper jQuery object  
			$scrollWrapper: null,
			// Main container wrapper jQuery object
			$wrapper: null,
			// Scroll is active
			active: false,
			// Auto hide timer id (`window.setTimeout` ID)
			autoHideTid: 0,
			// Dragging
			dragging: false,
			// Scroll enabled
			enabled: false,
			// Events are binded or not
			eventsBinded: false,
			// Fake element for size testing
			fakeElement: document.createElement('div'),
			// Handler height
			handlerHeight: 0,
			// Handler top offset
			handlerOffsetY: 0,
			// Handler translate (Y)
			handlerTranslateY: 0,
			// Plugin ID
			id: null,
			// Prefixes for feature testing
			prefixes: ['transform', 'WebkitTransform', 'MozTransform', 'OTransform', 'msTransform', 'none'],
			// Scroll ratio
			scrollRatio: 1,
			scrollWrapperHeight: 0,
			scrollWrapperTranslateY: 0,
			// Touch mode enabled
			touchMode: false,
			touchStartY: 0,
			touchWrapperPrevPosition: 0,
			touchHandlerPrevPosition: 0,
			transformPrefix: 'none',
			// Simple CSS transform supported
			transformSupported: 0,
			// 3D CSS transform supported
			transform3dSupported: false,
			wrapperHeight: 0,
			wrapperOffsetY: 0
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
			vars.$wrapper.css({overflow: 'hidden'});
			vars.$scrollbar = $('<div class="w-scroll-bar"></div>');
			vars.$handler = $('<div class="w-scroll-handler"></div>').css({backgroundColor: options.handlerColor});
			setTransform(vars.$handler, options.paddingTop, vars);
			vars.$scrollbar.append(vars.$handler);
			vars.$wrapper.find('> *').wrapAll('<div class="w-scroll-wrapper"></div>');
			vars.$scrollWrapper = vars.$wrapper.find('.w-scroll-wrapper');
			vars.$wrapper.append(vars.$scrollbar);
		},

		// Init event bindings
		initBindings = function (vars, options) {
			$(window).on('resize.' + vars.id, function () {
				window.setTimeout(function () {
					setup(vars, options);
				}, 50);
			});
		},

		// Setup positions, dimensions
		setup = function (vars, options) {
			vars.wrapperHeight = vars.$wrapper.height();
			vars.wrapperOffsetY = vars.$wrapper.offset().top;
			vars.scrollWrapperHeight = vars.$scrollWrapper.height();
			vars.handlerHeight = (vars.wrapperHeight / vars.scrollWrapperHeight) * vars.wrapperHeight;
			if (vars.handlerHeight < options.minHandlerHeight) { vars.handlerHeight = options.minHandlerHeight; }
			if (vars.handlerHeight > options.maxHandlerHeight && options.maxHandlerHeight !== -1) { vars.handlerHeight = options.maxHandlerHeight; }
			resizeHandler(vars.handlerHeight, vars);
			vars.scrollRatio = (vars.scrollWrapperHeight - vars.wrapperHeight) / (vars.wrapperHeight - vars.handlerHeight - options.paddingTop - options.paddingBottom) * -1;
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
				'mouseover.wscroll': function () {
					vars.$handler.css({backgroundColor: options.handlerOverColor});
				},
				'mouseout.wscroll': function () {
					if (vars.dragging === false) { vars.$handler.css({backgroundColor: options.handlerColor}); }
				},
				'mousedown.wscroll': function (e) {
					e.stopPropagation();
					if (e.offsetY !== undefined) {
						vars.handlerOffsetY = e.offsetY;
					} else {
						vars.handlerOffsetY = e.clientY - $(e.currentTarget).offset().top;
					}
					vars.dragging = true;
					vars.$handler.css({backgroundColor: options.handlerOverColor});
				},
				'selectstart.wscroll': function (e) {
					e.preventDefault();
					return false;
				}
			});
			vars.$wrapper.on({
				'mousewheel.wscroll DOMMouseScroll.wscroll': function (e) {
					moveByScroll(e, vars, options);
				},
				'mouseover.wscroll': function () {
					vars.active = true;
					if (options.autoHide === true) {showScrollBar(vars); }
				},
				'mouseleave.wscroll': function () {
					vars.active = false;
					if (options.autoHide === true && vars.dragging === false) { hideScrollBar(vars, options); }
				},
				'touchstart.wscroll': function (e) {
					e.stopPropagation();
					if (options.autoHide === true) { showScrollBar(vars); }
					vars.active = true;
					vars.touchMode = true;
					vars.touchStartY = e.originalEvent.targetTouches[0].pageY;
				},
				'touchend.wscroll': function (e) {
					e.stopPropagation();
					if (options.autoHide === true) { hideScrollBar(vars, options); }
					vars.active = false;
					vars.touchMode = false;
					vars.touchHandlerPrevPosition = vars.handlerTranslateY;
					vars.touchWrapperPrevPosition = vars.scrollWrapperTranslateY;
				}
			});

			$(document).on('mousewheel.' + vars.id + ' DOMMouseScroll.' + vars.id, function (e) {
				if (vars.active === true && vars.enabled === true) { e.preventDefault(); }
			});
			$(document).on('mouseup.' + vars.id, function () {

				vars.dragging = false;
				vars.handlerOffsetY = 0;
				vars.$handler.css({backgroundColor: options.handlerColor});
				if (options.autoHide === true && vars.active === false) {
					hideScrollBar(vars, options);
				}
			});
			$(document).on('mousemove.' + vars.id, function (e) {
				if (vars.dragging === true) {
					moveByDrag(e, vars, options);
				}
			});
			$(document).on('touchstart.' + vars.id + 'touchend.' + vars.id, function () {
				vars.dragging = false;
				vars.touchMode = false;
			});
			$(document).on('touchmove.' + vars.id, function (e) {
				if (vars.touchMode === true) {
					e.preventDefault();
					moveByTouch(e.originalEvent, vars, options);
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
					if (e.keyCode === 38) {
						e.preventDefault();
						moveByKey(-options.keyboardSpeed, vars, options);
					} else if (e.keyCode === 40) {
						e.preventDefault();
						moveByKey(options.keyboardSpeed, vars, options);
					}
				}
			});

			vars.eventsBinded = true;
		},

		// Unbind events
		unbindEvents = function (vars) {
			vars.$handler.off('.wscroll');
			vars.$wrapper.off('.wscroll');
			$(document).off('.' + vars.id);
			vars.eventsBinded = false;
		},

		// Reset scroller positions
		resetPositions = function (vars, options) {
			vars.touchStartY = 0;
			vars.touchWrapperPrevPosition = 0;
			vars.touchHandlerPrevPosition = 0;
			setTransform(vars.$scrollWrapper, 0, vars);
			setTransform(vars.$handler, options.paddingTop, vars);
			scrollCallback(options, 0);
		},

		// Resize scrollbar handler
		resizeHandler = function (h, vars) {
			vars.$handler.css({height: h});
		},

		// Hide scrollbar
		hideScrollBar = function (vars, options) {
			window.clearTimeout(vars.autoHideTid);
			vars.autoHideTid = window.setTimeout(function () {
				vars.$scrollbar.addClass('hidden');
			}, options.autoHideDelay);
		},

		// Show scrollbar
		showScrollBar = function (vars) {
			window.clearTimeout(vars.autoHideTid);
			vars.$scrollbar.removeClass('hidden');
		},

		// Move by drag
		moveByDrag = function (event, vars, options) {
			updatePositions(event.originalEvent.pageY - vars.wrapperOffsetY - vars.handlerOffsetY, vars, options);
		},

		// Move by touch
		moveByTouch = function (event, vars, options) {
			updatePositions(vars.touchStartY - (event.targetTouches[0].pageY), vars, options);
		},

		// Move by mouse scroll
		moveByScroll = function (event, vars, options) {
			var delta = 0;
			if (event.originalEvent.wheelDelta !== undefined) {
				delta = event.originalEvent.wheelDelta;
			} else {
				delta = event.originalEvent.detail * -40;
			}
			updatePositions(parseInt(vars.handlerTranslateY + ((delta * -1) / options.speed), 10), vars, options);
		},

		// Move by keyboard
		moveByKey = function (delta, vars, options) {
			updatePositions(parseInt(vars.handlerTranslateY + delta, 10), vars, options);
		},

		// Update scrolbar positions
		updatePositions = function (y, vars, options) {
			if (vars.enabled === true) {
				// Update handler positions
				positionHandler(y, vars, options);
				// Update content position
				positionWrapper(y, vars, options);
			}
		},

		// Set handler position
		positionHandler = function (y, vars, options) {
			var maxY = vars.wrapperHeight - vars.handlerHeight;
			if (vars.touchMode === true) { y = y / -vars.scrollRatio; }
			y = parseInt(y + vars.touchHandlerPrevPosition, 10);
			if (y < 0) { y = options.paddingTop; }
			if (y > maxY - options.paddingBottom) { y = maxY - options.paddingBottom; }
			setTransform(vars.$handler, y, vars);
			vars.handlerTranslateY = y;
		},

		// Set content position
		positionWrapper = function (y, vars, options) {
			var maxY = vars.scrollWrapperHeight - vars.wrapperHeight;
			y = vars.touchMode === true ? y * -1 : vars.scrollRatio * y;
			y = parseInt(y + vars.touchWrapperPrevPosition, 10);
			if (y > 0) { y = 0; }
			if (y * -1 > maxY) { y = maxY * -1; }
			setTransform(vars.$scrollWrapper, y, vars);
			vars.scrollWrapperTranslateY = y;
			scrollCallback(options, y);
		},

		// Call callback on scroll
		scrollCallback = function (options, y) {
			if (options.scrollCallback !== null) {
				options.scrollCallback.call(this, y);
			}
		},

		// Set CSS tranform values
		setTransform = function ($obj, val, vars) {
			// Set CSS3 transform if supported
			if (vars.transformSupported === true) {
				if (vars.transform3dSupported === true) {
					$obj.css(vars.transformPrefix, 'translate3d(0,' + val + 'px, 0)');
				} else {
					$obj.css(vars.transformPrefix, 'translateY(' + val + 'px)');
				}
			// Or use simple CSS top positioning
			} else {
				$obj.css('top', val + 'px');
			}
		},

		// Plugin methods
		methods = {

			init: function (opts) {
				return this.each(function () {
					if ($(this).data('wScroll') === undefined) {
						var options = $.extend({}, defaultOptions, opts),
							vars = $.extend({}, defaultVars);
						$(this).data('wScroll', options);
						$(this).data('wScrollVars', vars);
						vars.$wrapper = $(this);
						vars.id = 'wscroll_' + Math.random() * 9999999;
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
					var options = $(this).data('wScroll'),
						vars = $(this).data('wScrollVars');
					setup(vars, options);
				});
			},

			// Reset scroll
			reset: function () {
				return this.each(function () {
					var options = $(this).data('wScroll'),
						vars = $(this).data('wScrollVars');
					resetPositions(vars, options);
				});
			}
		};

	// Extend jQuery with `wScroll`
	$.fn.extend({
		wScroll: function (method) {
			var result;
			if (methods[method]) {
				result = methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
			} else if (typeof method === 'object' || !method) {
				result = methods.init.apply(this, arguments);
			} else {
				$.error('Method ' + method + ' does not exist on jQuery.wScroll');
				result = false;
			}
			return result;
		}
	});

}(jQuery));