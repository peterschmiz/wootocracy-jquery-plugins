// **Wootocracy score plugin**.
//
// [Previous Plugin](jquery.w.popup.html) | [Next Plugin](jquery.w.scroll.html)

//      Wootocracy
//      http://wootocracy.com
//      Copyright 2013, CarnationGroup, a part of POSSIBLE
//      Date: Mon Jun 26 15:22:10 2013 +0100

//      Sample usage
//      $(document).wScore({
//          callback: scoreCallbackFunction
//      });

// ## Score plugin for jQuery

(function ($) {
	// Extend jQuery with `wScore`
	$.fn.wScore = function (callback) {
		var data = null,
			target = this,
			// Initiator position (we're going to show the  
			// score indicator, bubble there)
			mousePosition = {
				x: target.offsetX,
				y: target.offsetY
			},
			// *X-User* meta tags
			$meta = $('meta[name=X-User]'),
			check;

		// Check for new alerts and call callback
		check = function(alerts) {
			if (alerts.length > 0) {
				$.each(alerts, function(k ,v) {
					// There is an alert with type score
					if (v.type === 'score') {
						callback.call(target, v.score, mousePosition);
					}
				});
			}
		};

		// Listen for every click on the selected DOM elements
		$('body').on('click', 'a, button.button', function (e) {
			target = this;
			mousePosition.x = e.pageX;
			mousePosition.y = e.pageY;
		});

		// If there is a *X-User* meta tag
		if ($meta.length > 0) {
			// Parse user data from it
			data = $.parseJSON($meta.attr('content'));
			if (data !== null) {
				// Check for alerts
				if (data.alerts !== undefined) {
					check(data.alerts);
				}
			}
		}

		// On every `ajaxComplete`
		return this.on('ajaxComplete', function (e, xhr) {
			// Check for user data
			data = $.parseJSON(xhr.getResponseHeader('X-User'));
			if (data !== null) {
				// Check for alerts
				if (data.alerts !== undefined) {
					check(data.alerts);
				}
			}
		});
	};
}(jQuery));