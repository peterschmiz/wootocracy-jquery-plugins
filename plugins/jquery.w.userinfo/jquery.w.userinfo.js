// **Wootocracy user info parser plugin**.
//
// [Previous Plugin](jquery.w.thumbnail.html) | [Next Plugin](jquery.w.validator.html)

//      Wootocracy
//      http://wootocracy.com
//      Copyright 2013, CarnationGroup, a part of POSSIBLE
//      Date: Mon Jun 26 16:39:10 2013 +0100

//      Sample usage
//      $(document).userInfo(callbackFn);

// ## User info parser from meta tag plugin for jQuery

(function ($) {

	$.fn.userInfo = function (callback) {
		// Get *X-User* meta tag
		var $meta = $('meta[name=X-User]');
		return this.each(function () {
			if ($meta.length > 0) {
				// Parse data
				var data = $.parseJSON($meta.attr('content'));
				$(this).data('userInfo', data);
				// Call callback
				callback.call(this, data, false);
			}
			// On every `ajaxComplete`
			$(this).on('ajaxComplete', function (e, xhr) {
				// Get the *X-User* XHR response header 
				var header = xhr.getResponseHeader('X-User'),
					data;
				if (header) {
					// Parse data
					data = $.parseJSON(header);
					$(this).data('userInfo', data);
					// Call callback
					callback.call(this, data);
				}
			});
		});
	};

}(jQuery));