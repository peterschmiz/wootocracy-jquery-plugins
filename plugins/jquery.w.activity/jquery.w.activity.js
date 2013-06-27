// **Wootocracy wActivity plugin**.
//
// [Home](jquery.w.activity.html) | [Next Chapter](jquery.w.animatefavicon.html)

//      Wootocracy
//      http://wootocracy.com
//      Copyright 2013, CarnationGroup, a part of POSSIBLE
//      Date: Mon Jun 25 16:55:01 2013 +0100

// ## User activity plugin for jQuery

(function ($) {

	// Refresh timer id (`window.setTimeout` ID) 
	var timer,
		// Storage data, parsed from `localStorage` or inited empty if not available
		storage = $.parseJSON(window.sessionStorage.getItem('wActivity')) || {
			done: [],
			queue: [],
			time: 0
		},
		// Plugin is inited
		inited = false,

		// Plugin methods
		methods = {

			// Init plugin  
			// *options:* plugin options, Object
			init: function (options) {
				var $this = this;
				// Extend plugin options
				options = $.extend({
					callback: console.log,
					// Item limit
					limit: 10,
					// Feed URL
					url: 'user/activity',
					// Random delay maximum in millisecs
					random: 5000,
					// Save is enabled
					saveEnabled: false,
					// No refresh after init
					stopOnInit: false,
					// Default refresh timeout in millisecs
					timeout: 5000,
					// Original timeout in millisecs
					origTimeout: 5000

				}, options);

				// Set the original timeout 
				options.origTimeout = options.timeout;
				// Set jQuery data with the key 'wActivity'
				$this.data('wActivity', options);

				// Iterate through the already processed items and call the callback
				$(storage.done).each(function (i, item) {
					options.callback.call($this, item, false);
				});

				// If 'stopOnInit' is false, then start the timer
				if (options.stopOnInit === false) {
					setTimeout(function () {
						$this.wActivity('start', !storage.done.length);
					}, 500);
				}
				return $this;
			},

			// Start showing activity items
			start: function (now) {
				var $this = $(this),
					options = $this.data('wActivity'),
					random;
				options.timeout = options.origTimeout;
				// If the 'storage.done' is empty
				if (now) {
					// Load the next item
					$this.wActivity('next');
				} else {
					// Randomize delay
					random = Math.floor(Math.random() * options.random) + 1500;
					window.clearTimeout(timer);
					// Load the next item with delay
					timer = window.setTimeout(function () {
						$this.wActivity('next');
					}, options.timeout + random);
				}
			},

			// Stop auto-refresh
			stop: function () {
				if (timer) {
					window.clearTimeout(timer);
				}
			},

			// Slow down refresh rate (etc. the page is on inactive tab)
			slow: function () {
				var $this = $(this),
					options = $this.data('wActivity');
				options.timeout = 60000;
				window.clearTimeout(timer);
				timer = window.setTimeout(function () {
					$this.wActivity('next');
				}, options.timeout);
			},

			// Load next item
			next: function () {
				var $this = this,
					// Get the next item from the queue
					item = storage.queue.shift();
				// If there is an item
				if (item && item.activity.length > 0) {
					// Set the timestamp to the last item's create timestamp
					storage.time = item.activity[0].created;
					// Add item to the list and load next
					$this.wActivity('add', item).wActivity('start');
				} else {
					// Load next item
					$this.wActivity('load');
				}
				return this;
			},

			// Add item to the list  
			// *item:* activity item, Object
			add: function (item) {
				var $this = this,
					options = $this.data('wActivity'),
					add = true;

				// Check item occurance
				$.each(storage.done, function (k, v) {
					if (v._id === item._id && v.activity[0].id === item.activity[0].id && v.activity[0].type === item.activity[0].type) {
						add = false;
					}
				});

				// Check item occurance
				$.each(storage.queue, function (k, v) {
					if (v._id === item._id && v.activity[0].id === item.activity[0].id && v.activity[0].type === item.activity[0].type) {
						add = false;
					}
				});

				// If it's a new item
				if (add === true) {
					// Add it to the done queue
					storage.done.push(item);
					// Trim done queue if too long
					storage.done = storage.done.slice(-options.limit);

					// If save is enabled, then save it to the `localStorage`
					if (options.saveEnabled === true) {
						$this.wActivity('save');
					}
					// Call callback function
					options.callback.call($this, item, inited);
				}
				return $this;
			},
			
			// Load activity feed items
			load: function () {
				var $this = $(this),
					options = $this.data('wActivity');
				// Load items with timestamp greater then the storage timestamp
				$.ajax({
					type: 'POST',
					url: options.url,
					data: {time: storage.time},
					dataType: 'json',
					success: function (result) {
						// If there are new item(s)
						if (result.success && result.data.length > 0) {
							storage.queue = storage.queue.concat(result.data);
							$this.wActivity('next');
						// If not, then try it later
						} else {							
							window.clearTimeout(timer);
							timer = window.setTimeout(function () {
								$this.wActivity('load');
							}, options.timeout);
						}
						// If it's the first load
						if (inited === false) {
							// Iterate the storage until it reaches the fill limit
							while (storage.done.length < options.limit && storage.queue.length > 0) {
								$this.wActivity('next');
							}
							inited = true;
						}
					}
				});
				return this;
			},

			save: function () {
				var data = window.JSON.stringify(storage);
				window.sessionStorage.setItem('wActivity', data);
				return this;
			}

		};

	// Extend jQuery with `wActivity`
	$.fn.wActivity = function (method) {
		var result;
		if (methods[method]) {
			result = methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			result = methods.init.apply(this, arguments);
		} else {
			$.error('Method ' + method + ' does not exist on jQuery.wActivity');
			result = false;
		}
		return result;
	};

}(jQuery));