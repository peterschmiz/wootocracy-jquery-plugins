// **Wootocracy overlay plugin**.
//
// [Previous Plugin](jquery.w.map.html) | [Next Plugin](jquery.w.pager.html)

//      Wootocracy
//      http://wootocracy.com
//      Copyright 2013, CarnationGroup, a part of POSSIBLE
//      Date: Mon Jun 26 15:02:55 2013 +0100

//      Sample usage
//      $(.target).wOverlay();

// ## Overlay plugin for jQuery

(function ($) {

	var defaultOptions = {
			// Overlay callback function
			callback: function (result) { }
		},

		defaultVars = {
			// Pre-fill datas
			fill: [],
			// Contents datas
			contents: [],
			// Overlay params
			params: [],
			// From history
			history: false,
			// Scroll top position
			scrollTop: 0,
			$wrapper: null
		},

		// Init event bindings
		initBindings = function (vars, options) {
			// Bind click event to every link or DOM element  
			// which has `data-overlay` attribute
			vars.$wrapper.on({
				'click.woverlay touchstart.woverlay': function (e) {
					e.preventDefault();
					loadOverlay($(e.currentTarget), vars, options);
				}
			}, '[data-overlay]');
		},

		// Load overlay
		loadOverlay = function ($elem, vars, options) {
			// Get the URL to load
			var href = $.trim($elem.attr('href')),
				// Get the overlay type
				type = $.trim($elem.attr('data-overlay')) || 'default';

			// Reset everything
			vars.params = [];
			vars.fill = [];
			vars.contents = [];
			vars.history = false;
			vars.scrollTop = $(window).scrollTop();

			// Check for params
			if ($elem.attr('data-overlay-params') !== undefined) {
				vars.params = $elem.attr('data-overlay-params').split('|');
			}

			// Check for contents
			if ($elem.attr('data-overlay-contents') !== undefined) {
				vars.contents = $elem.attr('data-overlay-contents').split('|');
			}

			// Check for pre-fill values
			if ($elem.attr('data-overlay-fill') !== undefined) {
				vars.fill = $elem.attr('data-overlay-fill').split('|');
			}

			// Load actual content
			loadTemplate(href, type, vars, options, $elem);
		},

		// Load overlay template
		loadTemplate = function (href, type, vars, options, $elem) {
			var $html = $('html'),
				data = {},
				temp = [],
				$item = null,
				$result = null;

			// If not disabled, then show loading animation
			if ($.inArray('noloading', vars.params) === -1) { $html.addClass('overlay-loading'); }
			if ($.inArray('nohistory', vars.params) !== -1) { vars.history = true; }

			$.ajax({
				type: 'GET',
				dataType: 'html',
				url: href,
				success: function (result) {
					// Check for disabled scroll
					if ($.inArray('noclass', vars.params) === -1) {
						$html.addClass('noscroll');
					} else {
						$html.removeClass('noscroll');
					}
					// Remove loading
					$html.removeClass('overlay-loading');
					$result = $(result);
					// If there are pre-fill values, then apply them
					if (vars.fill !== undefined) {
						if (vars.fill.length > 0) {
							$.each(vars.fill, function (k, v) {
								// Get inputs by name, parsed from the values
								temp = v.split(':');
								$item = $result.find('input[name="' + temp[0] + '"]');
								if (temp[0] !== 'picture') {
									$item.val(temp[1]);
								} else {
									temp.shift();
									if (temp.length > 1) { temp[0] = temp[0] + ':'; }
									data.picture = temp.join('');
								}
							});
						}
					}
					// If there are contents, then apply them
					if (vars.contents !== undefined) {
						if (vars.contents.length > 0) {
							$.each(vars.contents, function (k, v) {
								temp = v.split(':');
								// Get items by jQuery selector
								$item = $result.find(temp[0]);
								// Replace inner text
								$item.text(temp[1].replace(/#/ig, ':'));
							});
						}
					}
					// Call callback function
					options.callback.call(this, true, type, $result, $elem, href, data, vars.history, vars.scrollTop);
				},
				error: function () {
					vars.$overlay = null;
					options.callback.call(this, false, vars.scrollTop);
				}
			});
		},

		// Plugin methods
		methods = {

			init: function (opts) {
				return this.each(function () {
					if ($(this).data('wOverlay') === undefined) {
						var options = $.extend({}, defaultOptions, opts),
							vars = $.extend({}, defaultVars);
						$(this).data('wOverlay', options);
						$(this).data('wOverlayVars', vars);
						vars.$wrapper = $(this);
						initBindings(vars, options);
					}
				});
			},

			// Load overlay  
			// *href:* overlay URL, `String`  
			// *type:* overlay type, `String`  
			// *contents:* overlay contents, `Array`  
			// *fill:* overlay pre-fill values, `Array`˛ 
			// *history:* initiated from history, `Boolean`
			load: function (href, type, params, contents, fill, history) {
				return this.each(function () {
					var options = $(this).data('wOverlay'),
						vars = $(this).data('wOverlayVars');
					vars.params = [];
					vars.contents = [];
					vars.fill = [];
					if (params !== undefined) { vars.params = params; }
					if (contents !== undefined) { vars.contents = contents; }
					if (fill !== undefined) { vars.fill = fill; }
					vars.history = history !== undefined;
					loadTemplate(href, type, vars, options);
				});
			}

		};

	// Extend jQuery with `wOverlay`
	$.fn.extend({
		wOverlay: function (method) {
			var result;
			if (methods[method]) {
				result = methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
			} else if (typeof method === 'object' || !method) {
				result = methods.init.apply(this, arguments);
			} else {
				$.error('Method ' + method + ' does not exist on jQuery.wOverlay');
				result = false;
			}
			return result;
		}
	});

}(jQuery));