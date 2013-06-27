// **Wootocracy tab visibility plugin**.
//
// [Previous Plugin](jquery.w.sfx.html) | [Next Plugin](jquery.w.thumbnail.html)

//      Wootocracy
//      http://wootocracy.com
//      Copyright 2013, CarnationGroup, a part of POSSIBLE
//      Date: Mon Jun 26 16:39:10 2013 +0100

//      Sample usage
//      $(document).wTabvis();

// ## Browser tab visibility plugin for jQuery

(function ($) {

	var defaultOptions = {
			// Visibility change callback
			callback: function (result) { }
		},

		defaultVars = {
			visProp: null,
			visState: null,
			visPropEvent: null,
			$wrapper: null
		},

		// Init event bindings
		initBindings = function (vars, options) {
			if (vars.visProp) {
				document.addEventListener(vars.visPropEvent, function() {
					options.callback.call(this, {visible: !isHidden(), state: document[vars.visState]});
				});
			}
		},

		// Check and set proper prefix
		getHiddenProp = function () {
			var prefixes = ['webkit', 'moz', 'ms', 'o'],
				ret = null;
			if ('hidden' in document) { ret = 'hidden'; }
			if (ret === null) {
				for (var i = 0; i < prefixes.length; i++) {
					if ((prefixes[i] + 'Hidden') in document) {
						ret = prefixes[i] + 'Hidden';
					}
				}
			}
			return ret;
		},

		// Get current visibility state
		getStateProp = function () {
			var prefixes = ['webkit', 'moz', 'ms', 'o'],
				ret = null;
			if ('visibilityState' in document) { ret = 'visibilityState'; }
			if (ret === null) {
				for (var i = 0; i < prefixes.length; i++) {
					if ((prefixes[i] + 'VisibilityState') in document) {
						ret = prefixes[i] + 'VisibilityState';
					}
				}
			}
			return ret;
		},

		// Is the tab hidden or not
		isHidden = function () {
			var prop = getHiddenProp(),
				ret = false;
			if (!prop) {
				ret = false;
			} else {
				ret = document[prop];
			}
			return ret;
		},

		// Plugin methods
		methods = {
			init: function (opts) {
				return this.each(function () {
					if ($(this).data('wTabvis') === undefined) {
						var options = $.extend({}, defaultOptions, opts),
							vars = $.extend({}, defaultVars);
						$(this).data('wTabvis', options);
						$(this).data('wTabvisVars', vars);
						vars.$wrapper = $(this);
						vars.visProp = getHiddenProp();
						vars.visState = getStateProp();
						if (vars.visProp !== null){
							vars.visPropEvent = vars.visProp.replace(/[H|h]idden/, '') + 'visibilitychange';
							initBindings(vars, options);
						}
					}
				});
			}
		};

	// Extend jQuery with `wTabvis`
	$.fn.extend({
		wTabvis: function (method) {
			var result;
			if (methods[method]) {
				result = methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
			} else if (typeof method === 'object' || !method) {
				result = methods.init.apply(this, arguments);
			} else {
				$.error('Method ' + method + ' does not exist on jQuery.wTabvis');
				result = false;
			}
			return result;
		}
	});

}(jQuery));