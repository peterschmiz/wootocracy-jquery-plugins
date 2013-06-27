// **jQuery wVote**
//
// Author Csaba Csecskedi, Peter Schmiz
// Copyright (c) 2013 Csaba Csecskedi, Peter Schmiz
// Usage Command Line: $.wVote(callbackFn)
// Version: 1.0
// Requires jQuery
// Date: Thu May 23 16:03:00 2013 +0100

(function ($) {

	$.fn.wVote = function (callback) {

		return this.on({

			'click.wvote': function (e) {

				e.preventDefault();

				var self = this,
					$link = $(this),
					$siblings = $(this).siblings('[data-wvote]'),
					$counter = $link.find('.nr'),
					tempValue,
					value = parseInt($counter.text(), 10);

				if ($link.attr('href') !== undefined) {

					if ($siblings.length < 1) {
						$siblings = $link.parents('.button-group').find('[data-wvote]').not($link);
					}

					if ($link.attr('data-wvote') === 'own' && !$link.hasClass('set')) {
						$siblings.filter('.set[data-wvote="list"]').each(function () {
							$(this).removeClass('set');
							tempValue = parseInt($(this).find('.nr').text(), 10);
							$(this).find('.nr').text(tempValue - 1);
						});
					}

					if ($link.attr('data-wvote') === 'list' && !$link.hasClass('set')) {
						$siblings.filter('.set[data-wvote="own"]').each(function () {
							$(this).removeClass('set');
							tempValue = parseInt($(this).find('.nr').text(), 10);
							$(this).find('.nr').text(tempValue - 1);
						});
					}

					$counter.text($link.hasClass('set') ? value - 1 : value + 1);
					$link.toggleClass('set');

					$.ajax({
						url: $link.attr('href'),
						type: 'POST',
						success: function (result) {
							if (callback !== undefined && typeof callback === 'function') {
								callback.call(self, result);
							}
							if (result.success === false) {
								$link.removeClass('set');
								$counter.text(value);
							}
						},
						error: function () {
							$link.removeClass('set');
							$counter.text(value);
						}
					});

				}

			}
		}, '[data-wvote]');

	};

}(jQuery));