// **Wootocracy popup plugin**.
//
// [Previous Plugin](jquery.w.pictureupload.html) | [Next Plugin](jquery.w.score.html)

//      Wootocracy
//      http://wootocracy.com
//      Copyright 2013, CarnationGroup, a part of POSSIBLE
//      Date: Mon Jun 26 15:22:10 2013 +0100

//      Sample usage
//      $(.target).wPopup({
//          callback: popupCallback
//      });

// ## Popup plugin for jQuery

(function ($) {

	var defaultOptions = {
			// Callback function
			callback: null
		},

		defaultVars = {
			// Popup window reference (got from window.open)
			currentWindow: null,
			// Callback target jQuery object
			$callbackTarget: null,
			$wrapper: null
		},
		
		// Init event bindings
		initBindings = function (vars, options) {
			vars.$wrapper.on({
				'click.wpopup': function (e) {
					e.preventDefault();
					vars.$callbackTarget = vars.$wrapper.find($(this).attr('data-popup-target'));
					loadPopup(vars, options, $(this).attr('href'), $(this).attr('data-popup'));
				}
			}, '[data-popup]:not([data-popup-disabled])');
			window.callback = function (data) {
				processCallback(vars, options, this, data);
			};
		},

		// Load and open popup
		loadPopup = function (vars, options, href, dimensions) {
			var sizes = dimensions.split(','),
				w = 640,
				h = 320;
			// Set popup dimensions
			if (sizes[0].search('width') !== -1) {
				w = parseInt(sizes[0].replace('width=', ''), 10);
				h = parseInt(sizes[1].replace('height=', ''), 10);
			} else {
				w = parseInt(sizes[1].replace('width=', ''), 10);
				h = parseInt(sizes[0].replace('height=', ''), 10);
			}

			// Open a new window
			vars.currentWindow = window.open(href, 'wpopup', dimensions + ',top=' + parseInt(($(window).height() - h) / 2, 10) + ',left=' + parseInt(($(window).width() - w) / 2, 10) + ',dependent=yes,menubar=no,toolbar=no,location=no,resizable=yes,scrollbars=yes');
		},

		// Call popup callback, return popup data
		processCallback = function (vars, options, popup, data) {
			if (options.callback !== null) {
				options.callback.call(this, popup, data, vars.$callbackTarget);
			}
		},

		// Plugin methods
		methods = {
			init: function (opts) {
				return this.each(function () {
					if ($(this).data('wPopup') === undefined) {
						var options = $.extend({}, defaultOptions, opts),
							vars = $.extend({}, defaultVars);
						$(this).data('wPopup', options);
						$(this).data('wPopupVars', vars);
						vars.$wrapper = $(this);
						initBindings(vars, options);
					}
				});
			}
		};

	// Extend jQuery with `wPopup`
	$.fn.extend({
		wPopup: function (method) {
			var result;
			if (methods[method]) {
				result = methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
			} else if (typeof method === 'object' || !method) {
				result = methods.init.apply(this, arguments);
			} else {
				$.error('Method ' + method + ' does not exist on jQuery.wPopup');
				result = false;
			}
			return result;
		}
	});

}(jQuery));