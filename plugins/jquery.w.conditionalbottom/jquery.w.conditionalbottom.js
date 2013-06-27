// **Wootocracy conditional position plugin**.
//
// [Previous Plugin](jquery.w.complete.html) | [Next Plugin](jquery.w.list.html)

//      Wootocracy
//      http://wootocracy.com
//      Copyright 2013, CarnationGroup, a part of POSSIBLE
//      Date: Mon Jun 26 09:26:06 2013 +0100

//      Sample usage
//      $(.target).conditionalBottom({
//          padding: 20
//      });

// ## Conditional positioning (relative or fixed) plugin for jQuery

(function ($) {
	
	var defaultOptions = { padding: 27 },
		defaultVars = {
			// Plugin target's container jQuery object
			$wrapper: null,
			// Plugin target jQuery object
			$container: null,
			// Sibling elements jQuery object collection
			$siblings: null,
			// Current container height
			containerHeight: 0,
			// Plugin ID
			id: 0,
			// Current mode
			mode: 'fixed',
			// Resize timer id (`window.setTimeout` ID)
			resizeTid: 0,
			// Sibling elements height
			siblingsHeight: 0,
			// Parent container height
			wrapperHeight: 0
		},

		// Init (cache) the used DOM elements
		initDOMElements = function (vars) {
			vars.$container = vars.$wrapper.parent();
			vars.$siblings = vars.$wrapper.siblings();
		},

		// Init event bindings
		initBindings = function (vars, options) {
			$(window).on('resize.' + vars.id, function () {
				window.clearTimeout(vars.resizeTid);
				vars.resizeTid = window.setTimeout(function () {
					// Check available space
					checkSpace(vars, options);
				}, 50);
			});
		},

		// Check available space
		checkSpace = function (vars, options) {
			// Get parent height
			vars.wrapperHeight = vars.$wrapper.outerHeight(true);
			// Get plugin wrapper's height
			vars.containerHeight = vars.$container.outerHeight(true);
			// Get siblings height, but only the visible ones
			vars.$siblings = vars.$wrapper.siblings().filter(':visible');
			vars.siblingsHeight = 0;
			// Summarize sibling heights
			$.each(vars.$siblings, function () {
				vars.siblingsHeight += $(this).outerHeight(true);
			});

			// Set mode based on the available space
			if (vars.wrapperHeight + vars.siblingsHeight + options.padding < vars.containerHeight) {
				vars.mode = 'fixed';
			} else {
				vars.mode = 'normal';
			}

			// Update DOM elements
			updateLayout(vars);
		},

		// Set mode (add/remove class)
		updateLayout = function (vars) {
			vars.$wrapper.removeClass('fixed normal').addClass(vars.mode);
		},

		// Plugin methods
		methods = {

			// Init plugin
			init: function (opts) {
				return this.each(function () {
					if ($(this).data('conditionalBottom') === undefined) {
						var options = $.extend({}, defaultOptions, opts),
							vars = $.extend({}, defaultVars);
						$(this).data('conditionalBottom', options);
						$(this).data('conditionalBottomVars', vars);
						vars.$wrapper = $(this);
						vars.id = 'condbottom_' + Math.random() * 9999999;
						initDOMElements(vars);
						initBindings(vars, options);
						checkSpace(vars, options);
					}
				});
			},

			// Refresh plugin, re-check space
			refresh: function () {
				return this.each(function () {
					var options = $(this).data('conditionalBottom'),
						vars = $(this).data('conditionalBottomVars');
					checkSpace(vars, options);
				});
			}
		};

	// Extend jQuery with `conditionalBottom`
	$.fn.extend({
		conditionalBottom: function (method) {
			var result;
			if (methods[method]) {
				result = methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
			} else if (typeof method === 'object' || !method) {
				result = methods.init.apply(this, arguments);
			} else {
				$.error('Method ' + method + ' does not exist on jQuery.conditionalBottom');
				result = false;
			}
			return result;
		}
	});

}(jQuery));