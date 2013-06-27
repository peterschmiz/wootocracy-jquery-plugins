// **Wootocracy search plugin**.
//
// [Previous Plugin](jquery.w.scroll.html) | [Next Plugin](jquery.w.sfx.html)

//      Wootocracy
//      http://wootocracy.com
//      Copyright 2013, CarnationGroup, a part of POSSIBLE
//      Date: Mon Jun 26 16:25:09 2013 +0100

//      Sample usage
//      $(.target).wSearch();

// ## Search plugin for jQuery

(function ($) {

	var defaultOptions = {
			// Set default mode (array index)
			defaultMode: 0,
			// jQuery selector for the input
			inputSelector: '.query',
			// jQuery selector for the suggestion part
			suggestionSelector: '.suggestion',
			// Fun (easter egg) callback function
			funCallback: function () {},
			// Key-up callback
			keyUpCallback: function () {},
			// Key up delay in millisec
			keyUpDelay: 200,
			// Search modes (used as CSS classes also)
			modes: ['mode-1', 'mode-2'],
			// Prevent default action for these keycodes
			preventKeys: [16, 17, 18, 35, 36, 37, 38, 39, 40],
			// Submit callback
			submitCallback: function () {},
			// Switching between modes enabled or not
			switchEnabled: true
		},

		defaultVars = {
			// Current search mode
			currentMode: null,
			// Delay timer id (`window.setTimeout` ID)
			delayTid: null,
			// Fun (easter egg) is active
			funActive: false,
			// Search input wrapper jQuery object
			$input: null,
			// Search wrapper jQuery object
			$search: null,
			// Suggestion wrapper jQuery object
			$suggestion: null,
			// Switch wrapper jQuery object
			$switch: null,
			// Tooltip is active or not
			tooltipActive: false
		},

		// Init (cache) the used DOM elements
		initDOMElements = function (vars, options) {
			vars.$input = vars.$search.find(options.inputSelector);
			vars.$switch = vars.$search.find('.switch');
			vars.$suggestion = vars.$search.find(options.suggestionSelector);
			if (vars.$suggestion.length < 1) { vars.$suggestion = null; }
			if (options.switchEnabled === true) {
				options.switchEnabled = vars.$switch.length > 0;
			}
			// Check DOM structure
			if (vars.$input.length === 0 || (vars.$switch.length === 0 && options.switchEnabled)) {
				$.error('This is not a valid wSearch structure!');
			}
			if (options.switchEnabled === false) {
				vars.$search.addClass('no-switch');
			} else {
				vars.$search.removeClass('no-switch');
			}
		},

		// Init event bindings
		initBindings = function (vars, options) {
			var hoverClasses = [],
				modeClass = '';

			$.each(options.modes, function (k) {
				hoverClasses.push('hover-' + options.modes[k]);
			});

			vars.$search.find('form').on({
				'submit': function (e) {
					e.preventDefault();
				}
			});
			vars.$input.on({
				'click.wsearch touchstart.wsearch': function (e) {
					if (e.type === 'touchstart') {
						vars.$input.focus();
						window.scrollTo(0, 1);
					}
					vars.$search.addClass('focus');
					if ($.trim($(this).val()) !== '') {
						if (options.keyUpCallback !== null) {
							keyUpAction(e, vars, options);
						}
					}
				},
				'keyup.wsearch': function (e) {
					checkFun(vars, options);
					if (vars.funActive === false) {
						if (vars.tooltipActive === false) {
							if (e.keyCode === 13) {
								if (options.submitCallback !== null) {
									submitAction(e, vars, options);
								}
							} else if ($.inArray(e.keyCode, options.preventKeys) === -1 && $.trim($(this).val()) !== '') {
								if (options.keyUpCallback !== null) {
									keyUpAction(e, vars, options);
								}
							}
						}
					}
				}
			});
			if (options.switchEnabled === true) {
				vars.$switch.on({
					'click.wsearch': function () {
						modeClass = $.trim($(this).attr('class').replace('use-sprite', ''));
						switchMode(modeClass, vars, options);
					},
					'mouseenter.wsearch': function () {
						if ($.trim(vars.$input.val()) === '') {
							modeClass = $.trim($(this).attr('class').replace('use-sprite', ''));
							vars.$switch.removeClass('hover ' + hoverClasses.join(' ')).addClass('hover hover-' + modeClass);
							vars.tooltipActive = true;
							showToolTip(false, modeClass, vars, options);
						}
					},
					'mouseleave.wsearch': function () {
						if ($.trim(vars.$input.val()) === '' && vars.tooltipActive === true) {
							vars.$switch.removeClass('hover ' + hoverClasses.join(' '));
							vars.tooltipActive = false;
							restorePlaceholder(vars);
							restoreQuery(vars);
						}
					}
				}, 'span');
			}
			$(document).on({
				'click.wsearch': function () {
					vars.$search.removeClass('focus');
				}
			});
		},

		// Check for easter-egg input
		checkFun = function (vars, options) {
			var val = $.trim(vars.$input.val());
			// Check for ':'
			vars.funActive = val.search(/\:/ig) === 0;
			if (vars.funActive === true) {
				// Call fun callback
				if (options.keyUpCallback !== null) {
					funAction(val, vars, options);
				}
			}
		},

		// Init search mode switcher
		initSwitch = function (vars, options) {
			if (options.switchEnabled === true) {
				vars.$switch.find('span').each(function (i) {
					$(this).addClass(options.modes[i]);
				});
				vars.currentMode = options.modes[options.defaultMode];
				vars.$switch.addClass(vars.currentMode);
				setSwitch(vars.currentMode, vars, options);
			}
		},

		// Keyup actions
		keyUpAction = function (e, vars, options) {
			window.clearTimeout(vars.delayTid);
			vars.delayTid = window.setTimeout(function () {
				options.keyUpCallback(vars.$search, [
					{event: e, query: vars.$input.val(), mode: vars.currentMode}
				]);
			}, options.keyUpDelay);
		},

		// Call submit callback
		submitAction = function (e, vars, options) {
			options.submitCallback(vars.$search, [
				{event: e, query: $.trim(vars.$input.val()), mode: vars.currentMode}
			]);
		},

		// Call fun (easter-egg) callback 
		funAction = function (val, vars, options) {
			options.funCallback(vars.$search, [
				{ term: val }
			]);
		},

		// Switch search mode
		switchMode = function (mode, vars, options) {
			vars.currentMode = mode;
			setSwitch(vars.currentMode, vars, options);
			if ($.trim(vars.$input.val()) === '') {
				showToolTip(true, mode, vars, options);
			}
		},

		// Set search mode switch (CSS class)
		setSwitch = function (mode, vars, options) {
			vars.$switch.removeClass(options.modes.join(' ')).addClass(mode);
		},

		// Show search mode tooltip
		showToolTip = function (set, mode, vars, options) {
			var tooltip = '',
				tooltipMode1 = vars.$switch.find('span.' + options.modes[0]).attr('data-tooltip'),
				tooltipMode2 = vars.$switch.find('span.' + options.modes[1]).attr('data-tooltip');

			if (mode === options.modes[0]) {
				tooltip = tooltipMode1;
			} else {
				tooltip = tooltipMode2;
			}

			if (vars.$input.data('originalTooltip') === undefined) {
				vars.$input.data({originalTooltip: vars.$input.attr('placeholder')});
			}

			if (vars.$input.val() !== tooltipMode1 && vars.$input.val() !== tooltipMode2) {
				vars.$input.data({originalQuery: vars.$input.val()});
			}

			if ($.trim(vars.$input.attr('placeholder')) !== tooltip && vars.$input.val() === '') {
				vars.$input.attr('placeholder', tooltip);
			}

			if (vars.$input.val() !== '' && $.trim(vars.$input.val()) !== tooltip) {
				vars.$input.val(tooltip);
			}

			if (set === true) {
				vars.$input.data({originalTooltip: tooltip});
			}
			if (vars.$suggestion !== null) {
				vars.$suggestion.hide();
			}
		},

		// Restore search placeholder
		restorePlaceholder = function (vars) {
			var original = vars.$input.data('originalTooltip');
			if (original !== undefined) {
				vars.$input.attr('placeholder', original);
			}
		},

		// Restore search query
		restoreQuery = function (vars) {
			var original = vars.$input.data('originalQuery');
			if (original !== undefined) {
				vars.$input.val(original);
				if (vars.$suggestion !== null) {
					vars.$suggestion.show();
				}
			}
		},

		// Plugin methods
		methods = {

			init: function (opts) {
				return this.each(function () {
					if ($(this).data('wSearch') === undefined) {
						var options = $.extend({}, defaultOptions, opts),
							vars = $.extend({}, defaultVars);
						$(this).data('wSearch', options);
						$(this).data('wSearchVars', vars);
						vars.$search = $(this);
						initDOMElements(vars, options);
						initBindings(vars, options);
						initSwitch(vars, options);
					}
				});
			},

			// Switch search mode  
			// *mode:* mode, `String` 
			switchMode: function (mode) {
				return this.each(function () {
					var vars = $(this).data('wSearchVars'),
						options = $(this).data('wSearch');
					vars.currentMode = mode;
					setSwitch(mode, vars, options);
				});
			}

		};

	// Extend jQuery with `wSearch`
	$.fn.extend({
		wSearch: function (method) {
			var result;
			if (methods[method]) {
				result = methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
			} else if (typeof method === 'object' || !method) {
				result = methods.init.apply(this, arguments);
			} else {
				$.error('Method ' + method + ' does not exist on jQuery.wSearch');
				result = false;
			}
			return result;
		}
	});

}(jQuery));