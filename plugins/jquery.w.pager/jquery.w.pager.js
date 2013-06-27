// **Wootocracy pager plugin**.
//
// [Previous Plugin](jquery.w.overlay.html) | [Next Plugin](jquery.w.pictureupload.html)

//      Wootocracy
//      http://wootocracy.com
//      Copyright 2013, CarnationGroup, a part of POSSIBLE
//      Date: Mon Jun 26 15:09:50 2013 +0100

//      Sample usage
//      $(.target).wPager();

// ## Pager plugin for jQuery

(function ($) {

	var defaultOptions = {
			initPage: 0,
			// Callback when navigating between pages
			nextPageCallback: function () {}
		},

		defaultVars = {
			// Current page
			currentPage: 0,
			// Indicator wrapper jQuery object
			$indicator: null,
			// Indicator is visible
			indicatorVisible: false,
			// Last page was reached
			lastPageReached: false,
			// Maximum pages
			maxPage: -1,
			// Mouse down timer id (`window.setTimeout` ID)
			mouseDownTid: null,
			// Mouse down delay
			mouseDownDelay: 500,
			// Step timer id (`window.setTimeout` ID)
			stepPagerTid: null,
			// Step delay
			stepPagerDelay: 750,
			$wrapper: null
		},

		// Init event bindings
		initBindings = function (vars, options) {
			var pressed, preventPage = false, $pager;
			vars.$wrapper.on({
				'click.pager': function (e) {
					e.preventDefault();
					if (preventPage === false) {
						$pager = $(this);
						pageList($pager, vars, options);
					}
				},
				'mousedown.pager': function () {
					pressed = new Date().getTime();
					preventPage = false;
					$pager = $(this);
					window.clearTimeout(vars.mouseDownTid);
					vars.mouseDownTid = window.setTimeout(function () {
						showPageSteps($pager, vars);
					}, vars.mouseDownDelay);
				},
				'mouseup.pager': function () {
					if (pressed + vars.mouseDownDelay < new Date().getTime()) {
						preventPage = true;
					}
					$pager = $(this);
					window.clearTimeout(vars.mouseDownTid);
					if (vars.indicatorVisible === true) {
						hidePageSteps(vars);
						pageList($pager, vars, options, true);
					}
				}
			}, '.pager:not(.disabled)');
		},

		// Show page steps 
		showPageSteps = function ($pager, vars) {
			if (vars.maxPage !== -1) {
				vars.$indicator.text(parseInt(vars.currentPage + 1, 10) + '/' + vars.maxPage);
				vars.$wrapper.addClass('indicator-visible');
				vars.indicatorVisible = true;
				stepPager($pager, vars);
			}
		},

		// Hide page steps
		hidePageSteps = function (vars) {
			window.clearTimeout(vars.stepPagerTid);
			vars.$wrapper.removeClass('indicator-visible');
			vars.indicatorVisible = false;
		},

		// Step pager (prev or next)
		stepPager = function ($pager, vars) {
			window.clearTimeout(vars.stepPagerTid);
			vars.stepPagerTid = window.setTimeout(function () {
				vars.currentPage += $pager.hasClass('prev') ? -1 : 1;
				if (vars.currentPage < 0) { vars.currentPage = 0; }
				if (vars.currentPage > parseInt(vars.maxPage - 1, 10)) {
					vars.currentPage = parseInt(vars.maxPage - 1, 10);
				}
				vars.$indicator.text(parseInt(vars.currentPage + 1, 10) + '/' + vars.maxPage);
				stepPager($pager, vars);
			}, vars.stepPagerDelay);
		},

		// Page list, call callback
		pageList = function ($pager, vars, options, nochange) {
			if (nochange !== true) {
				vars.currentPage += $pager.hasClass('prev') ? -1 : 1;
				if (vars.currentPage < 0) { vars.currentPage = 0; }
			}
			$(window).scrollTop(0);
			options.nextPageCallback.call(this);
		},

		// Set pager state (button states etc.)
		setPagerState = function (vars) {
			showPager(vars);
			if (vars.currentPage === 0) { hidePager('prev', vars); }
			if (vars.lastPageReached === true || parseInt(vars.currentPage + 1, 10) === vars.maxPage) {
				hidePager(vars.currentPage === 0 ? 'all' : 'next', vars);
			}
		},

		// Hide pager
		hidePager = function (pager, vars) {
			vars.$wrapper.show();
			if (pager === 'all') {
				vars.$wrapper.hide();
			} else if (pager === 'prev') {
				vars.$wrapper.find('.pager.prev').addClass('disabled');
			} else if (pager === 'next') {
				vars.$wrapper.find('.pager.next').addClass('disabled');
			}
		},

		// Show pager
		showPager = function (vars) {
			vars.$wrapper.show();
			vars.$wrapper.find('.pager').removeClass('disabled');
		},

		// Plugin methods
		methods = {

			// Init plugin
			init: function (opts) {
				return this.each(function () {
					if ($(this).data('wPager') === undefined) {
						var options = $.extend({}, defaultOptions, opts),
							vars = $.extend({}, defaultVars);
						$(this).data('wPager', options);
						$(this).data('wPagerVars', vars);
						vars.$wrapper = $(this);
						vars.$indicator = vars.$wrapper.find('.pager-indicator');
						vars.currentPage = options.initPage;
						initBindings(vars, options);
						hidePager('all', vars);
					}
				});
			},

			// Reset values, pager
			reset: function () {
				return this.each(function () {
					var vars = $(this).data('wPagerVars');
					vars.currentPage = 0;
					vars.lastPageReached = false;
					hidePager('all', vars);
					setPagerState(vars);
				});
			},

			// Hide pager
			hide: function () {
				return this.each(function () {
					var vars = $(this).data('wPagerVars');
					hidePager('all', vars);
				});
			},

			// Check if last page reached
			getLastPage: function () {
				var vars = $(this).data('wPagerVars');
				return vars.lastPageReached;
			},

			// Set last page reached to true
			setLastPage: function (val) {
				return this.each(function () {
					var vars = $(this).data('wPagerVars');
					vars.lastPageReached = val;
				});
			},

			// Update pager (state)
			update: function () {
				return this.each(function () {
					var vars = $(this).data('wPagerVars');
					setPagerState(vars);
				});
			},

			// Get current page
			getPage: function () {
				var vars = $(this).data('wPagerVars');
				return parseInt(vars.currentPage, 10);
			},

			// Set current page
			setPage: function (page) {
				return this.each(function () {
					var vars = $(this).data('wPagerVars');
					if (page === '++') {
						vars.currentPage++;
					} else {
						vars.currentPage = parseInt(page, 10);
					}
				});
			},

			// Get max page
			getMaxPage: function () {
				var vars = $(this).data('wPagerVars');
				return parseInt(vars.maxPage, 10);
			},

			// Set max page
			setMaxPage: function (page) {
				return this.each(function () {
					var vars = $(this).data('wPagerVars');
					vars.maxPage = parseInt(page, 10);
					setPagerState(vars);
				});
			}

		};

	// Extend jQuery with `wPager`
	$.fn.extend({
		wPager: function (method) {
			var result;
			if (methods[method]) {
				result = methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
			} else if (typeof method === 'object' || !method) {
				result = methods.init.apply(this, arguments);
			} else {
				$.error('Method ' + method + ' does not exist on jQuery.wPager');
				result = false;
			}
			return result;
		}
	});

}(jQuery));