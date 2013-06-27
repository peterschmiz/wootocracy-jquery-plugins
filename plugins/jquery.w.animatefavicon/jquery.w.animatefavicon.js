// **Wootocracy animateFavicon plugin**.
//
// [Previous Plugin](jquery.w.activity.html) | [Next Plugin](jquery.w.complete.html)

//      Wootocracy
//      http://wootocracy.com
//      Copyright 2013, CarnationGroup, a part of POSSIBLE
//      Date: Mon Jun 26 07:58:11 2013 +0100

//      Sample usage
//      $.animateFavicon({
//          phases: ['icon1.png', 'icon2.png', 'icon3.png'],
//          timing: 500
//      });

// ## Favicon animation plugin for jQuery

(function ($) {

	// Get favicon tag (has to have the 'favicon' ID)
	var $favicon = $('#favicon'),
		// Animation timer id (`window.setTimeout` ID) 
		timerId = 0,
		// Current phase index
		phase = 0,
		// If the timings are given as an Array 
		pattern = false,
		// Default options
		options = {
			phases: ['/favicon.ico'],
			timing: 500
		},

		// Plugin methods
		methods = {

			// Init plugin  
			// *opts:* plugin options, `Object`
			init: function (opts) {
				// Extend default options
				$.extend(options, opts);
				// Check timings format
				pattern = $.isArray(options.timing);
				// If it is an Array and the phases length don't match the timings length raise error
				if (pattern && (options.phases.length !== options.timing.length)) {
					$.error('If you use timing pattern the phases count and the timing count should match!');
				} else {
					// Start plugin
					this.animateFavicon('animate');
				}
			},

			// Run animation phases 
			animate: function () {
				var $this = this;
				window.clearTimeout(timerId);
				timerId = window.setTimeout(function () {
					$this.animateFavicon('setPhase');
				}, (pattern ? options.timing[phase] : options.timing));
			},

			// Get icon for the phase and set it as a favicon
			setPhase: function () {
				$favicon.attr({href: options.phases[phase]});
				phase = phase > options.phases.length - 1 ? 0 : phase + 1;
				this.animateFavicon('animate');
			}
		};

	// Extend jQuery with `animateFavicon`
	$.extend({
		animateFavicon: function (method) {
			var result;
			if (methods[method]) {
				result = methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
			} else if (typeof method === 'object' || !method) {
				result = methods.init.apply(this, arguments);
			} else {
				$.error('Method ' + method + ' does not exist on jQuery.animateFavicon');
				result = false;
			}
			return result;
		}
	});

}(jQuery));