// **Wootocracy image size calculator plugin**.
//
// [Previous Plugin](jquery.w.tabvis.html) | [Next Plugin](jquery.w.userinfo.html)

//      Wootocracy
//      http://wootocracy.com
//      Copyright 2013, CarnationGroup, a part of POSSIBLE
//      Date: Mon Jun 26 16:39:10 2013 +0100

//      Sample usage
//      $.wThumbnail('i/product-picture.jpg, 'normal');

// ## Image size calculator plugin for jQuery

(function ($) {

	// Extend jQuery with `wThumbnail`
	$.wThumbnail = function (picture, name, fallback) {

		// If it's already an object return it
		if (typeof picture === 'object') {
			return picture;
		}

		var fallbacks = $.wThumbnail.config.fallbacks,
			thumbs = $.wThumbnail.config.thumbs,
			result = {src: $.wThumbnail.config.url},
			// Is it a thumbnail
			thumb = name && thumbs[name] ? thumbs[name].match(/^(\d+)x(\d+)([a-z]*)$/) : false,
			match = false,
			size,
			width,
			height,
			sw, sh, tw, th;

		if (!picture) {
			fallback = fallback || 'user';
			if (fallbacks[fallback]) {
				picture = thumb ? fallbacks[fallback].replace('normal.png', name + '.png') : fallbacks[fallback];
			}
		} else {
			match = picture.match(/(\d+x\d+|)\.jpg$/);
		}

		if (!match) {
			result.src = picture;
			if (thumb && !thumb[3]) {
				result.width = parseInt(thumb[1], 10);
				result.height = parseInt(thumb[2], 10);
			}
		} else {
			// Get sizes (width and height)
			size = match[1] ? match[1].match(/^(\d+)x(\d+)$/) : false;
			// If it's not a thumbnail
			if (!thumb) {
				result.src += picture;
				if (size) {
					result.width = parseInt(size[1], 10);
					result.height = parseInt(size[2], 10);
				}
			} else {
				result.src += thumbs[name] + '/' + picture;
				if (!thumb[3]) {
					result.width = parseInt(thumb[1], 10);
					result.height = parseInt(thumb[2], 10);
				} else if (size) {
					// Calculate size
					width = parseInt(thumb[1], 10);
					height = parseInt(thumb[2], 10);
					sw = parseInt(size[1], 10);
					sh = parseInt(size[2], 10);
					switch (width) {
						case 0:
							tw = Math.round(height / sh * sw);
							th = height;
							break;
						case 1:
							tw = Math.round(sw / height);
							th = Math.round(sh / height);
							break;
						default:
							tw = width;
							th = Math.round(width / sw * sh);
							if (height > 0 && th > height) {
								th = height;
								tw = Math.round(height / sh * sw);
							}
							break;
					}
					if (sw > tw || sh > th) {
						result.width = tw;
						result.height = th;
					} else {
						result.width = sw;
						result.height = sh;
					}
				}
			}
		}
		return result;
	};

	// Default config values
	$.wThumbnail.config = {
		url: 'upload/',
		thumbs: {
			tiny: '36x36',
			small: '63x63',
			square: '90x90',
			medium: '0x180f',
			normal: '144x144',
			large: '225x0f',
			rect: '225x217'
		},
		// Default fallback picture
		fallbacks: {
			user: 'static/i/png/default-avatar-normal.png'
		}
	};

}(jQuery));