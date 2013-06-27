// **Wootocracy picture upload plugin**.
//
// [Previous Plugin](jquery.w.pager.html) | [Next Plugin](jquery.w.popup.html)

//      Wootocracy
//      http://wootocracy.com
//      Copyright 2013, CarnationGroup, a part of POSSIBLE
//      Date: Mon Jun 26 15:14:50 2013 +0100

//      Sample usage
//      $(.target).wPictureUpload(
//          action: 'user/picture',
//          dragndropSupport: true,
//          preview: true,
//          successCallback: pictureUploadSuccess
//      );

// ## Picture upload plugin for jQuery

(function ($) {

	var defaultOptions = {
			// Action URL to post to
			action: null,
			// Drag and drop enabled
			dragndropSupport: true,
			// Upload error callback
			errorCallback: null,
			// Error class
			errorClass: 'error',
			// Loading class
			loadingClass: 'loading',
			// Show or not show progress
			noProgress: false,
			// Preview enabled
			preview: true,
			// Label for upload ready
			readyLabel: 'Change profile image',
			// Starting label
			startLabel: '',
			// Upload success callback
			successCallback: null
		},

		defaultVars = {
			// Selected files
			files: null,
			// Hidden input
			$fileHidden: null,
			// File input jQuery object
			$fileInput: null,
			// Label wrapper jQuery object
			$label: null,
			// Target area wrapper jQuery object
			$targetArea: null,
			$wrapper: null
		},

		// Init (cache) the used DOM elements
		initDOMElements = function (vars) {
			vars.$wrapper.find('.target-area').each(function () { vars.$targetArea = $(this); });
			vars.$wrapper.find('input[type=file]').each(function () { vars.$fileInput = $(this); });
			vars.$wrapper.find('input[type=hidden]').each(function () { vars.$fileHidden = $(this); });
			vars.$targetArea.find('label').each(function () { vars.$label = $(this); });
		},

		// Init event bindings
		initBindings = function (vars, options) {
			var offsetX, offsetY, x, y;
			vars.$targetArea.on({
				'mousemove.pictureupload touchstart.pictureupload': function (e) {
					e.stopPropagation();
					offsetX = $(this).offset().left;
					offsetY = $(this).offset().top;
					x = (e.type === 'mousemove' ? e.originalEvent.pageX : e.originalEvent.targetTouches[0].pageX) - offsetX;
					y = (e.type === 'mousemove' ? e.originalEvent.pageY : e.originalEvent.targetTouches[0].pageY) - offsetY;
					vars.$fileInput.css({top: y, left: x});
				}
			});
			vars.$fileInput.on({
				'change.pictureupload': function (e) {
					uploadPicture(vars, options, e.currentTarget.files);
				}
			});
			// If drag and drop enabled, then add bindings
			if (options.dragndropSupport === true) {
				vars.$targetArea.on({
					'dragover.pictureupload': function (e) {
						e.stopPropagation();
						e.preventDefault();
					},
					'drop.pictureupload': function (e) {
						e.stopPropagation();
						e.preventDefault();
						getDragFiles(e.originalEvent, vars, options);
					},
					'dragend.pictureupload': function (e) {
						e.stopPropagation();
					}
				});
			}
		},

		// Get file list from drag and drop 
		getDragFiles = function (event, vars, options) {
			var files = event.dataTransfer.files,
				i = 0,
				l = files.length,
				match,
				output = [];

			// Check only for image files (MIME type)
			for (i; i < l; i++) {
				match = files[i].type.match(/image\/*/);
				if (match.length > 0) {
					output.push(files[i]);
				}
			}
			// If there is something to upload
			if (output.length > 0) {
				uploadPicture(vars, options, output);
			}
		},

		// Upload picture
		uploadPicture = function (vars, options, files) {
			var xhr, loaded, total,
				formData = new FormData();

			// Create `formData`
			formData.append(vars.$fileInput.attr('name'), files[0]);
			vars.$fileInput.html(vars.$fileInput.html());
			vars.$fileInput.val('');

			vars.$wrapper.addClass(options.loadingClass);

			// Get XHR object
			xhr = $.ajaxSettings.xhr();

			// Listen for progress
			if (options.noProgress === false) {
				if (xhr.upload) {
					$(xhr.upload).on({
						'progress.pictureupload': function (e) {
							total = e.originalEvent.total;
							loaded = e.originalEvent.total;
							if (vars.$label.data('original') === undefined) {
								vars.$label.data({original: vars.$label.text()});
							}
							vars.$label.text(Math.round((loaded / total) * 100) + ' %');
						}
					});
				}
			}

			// Post `formData`
			$.ajax({
				type: 'POST',
				url: options.action,
				xhr: function () { return xhr; },
				dataType: 'json',
				processData: false,
				contentType: false,
				data: formData,
				success: function (data) {
					uploadReady(vars, options, data);
				},
				error: function (xhr) {
					console.log('error: ' + xhr);
				}
			});
		},

		// Upload is ready
		uploadReady = function (vars, options, data) {
			var img = new Image(), $img;

			if (data.success === true) {
				// Get thumbnail picture with the help of `wThumbnail` plugin
				data = $.wThumbnail(data.data, 'normal');
				if (options.preview === true) {
					img.onload = function () {
						if (vars.$targetArea.find('img.uploaded-picture').length < 1) {
							$img = $('<img class="uploaded-picture" src="' + data.src + '" />').css({opacity: 0});
							vars.$targetArea.append($img);
						} else {
							$img = vars.$targetArea.find('img.uploaded-picture');
							$img.attr('src', data.src).css({opacity: 0});
						}
						$img.stop().animate({
							opacity: 1
						}, 500, function () {
							setReadyState(vars, options, data);
						});
					};
					img.src = data.src;
				} else {
					setReadyState(vars, options, data);
				}
			} else {
				setErrorState(vars, options, data);
			}
		},

		// Set ready class and state
		setReadyState = function (vars, options, data) {
			vars.$wrapper.removeClass(options.loadingClass + ' ' + options.errorClass);
			vars.$label.removeClass('empty').text(options.readyLabel).show();
			if (data !== undefined) {
				if (options.successCallback !== null) {
					options.successCallback.call(vars.$wrapper, [vars.$wrapper, data]);
				}
			}
		},

		// Set error class and state
		setErrorState = function (vars, options, data) {
			vars.$wrapper.removeClass(options.loadingClass).addClass(options.errorClass);
			if (options.errorCallback !== null) {
				options.errorCallback.call(vars.$wrapper, [vars.$wrapper, data]);
			}
			if (vars.$label.length > 0 && options.noProgress === false) {
				vars.$label.hide();
				vars.$targetArea.find('img.uploaded-picture').remove();
				vars.$wrapper.removeClass('upload-progress');
				vars.$label.addClass('empty').text(vars.$label.data('original')).show();
			}
		},

		// Add image
		addImage = function (vars, options, imgsrc) {
			var img = new Image(), $img, data;

			data = $.wThumbnail(imgsrc, 'normal');

			img.onload = function () {

				if (vars.$targetArea.find('img.uploaded-picture').length < 1) {
					$img = $('<img class="uploaded-picture" src="' + data.src + '" />').css({opacity: 0});
					vars.$targetArea.append($img);
				} else {
					$img = vars.$targetArea.find('img.uploaded-picture');
					$img.attr('src', data.src).css({opacity: 0});
				}
				$img.stop().animate({
					opacity: 1
				}, 500, function () {
					setReadyState(vars, options);
				});

			};

			img.src = data.src;
		},

		// Plugin methods
		methods = {

			init: function (opts) {
				return this.each(function () {
					if ($(this).data('wPictureUpload') === undefined) {
						var options = $.extend({}, defaultOptions, opts),
							vars = $.extend({}, defaultVars);
						vars.$wrapper = $(this);
						$(this).data('wPictureUpload', options);
						$(this).data('wPictureUploadVars', vars);
						if (options.action === null) {
							options.action = vars.$wrapper.attr('data-picture-upload-action');
						}
						options.dragndropSupport = Modernizr.draganddrop;
						initDOMElements(vars);
						initBindings(vars, options);
					}
				});
			},

			// Add image  
			// *imgsrc:* image path, `String`
			addImage: function (imgsrc) {
				return this.each(function () {
					var options = $(this).data('wPictureUpload'),
						vars = $(this).data('wPictureUploadVars');
					vars.$wrapper.addClass(options.loadingClass);
					addImage(vars, options, imgsrc);
				});
			},

			// Reset plugin
			reset: function () {
				return this.each(function () {
					var options = $(this).data('wPictureUpload'),
						vars = $(this).data('wPictureUploadVars');
					vars.files = null;
					vars.$wrapper.removeClass('upload-progress ' + options.loadingClass + ' ' + options.errorClass);
					vars.$targetArea.find('img.uploaded-picture').remove();
					vars.$label.removeClass().addClass('empty').html(options.startLabel);
					vars.$label.removeData('original');
				});
			}

		};

	// Extend jQuery with wPictureUpload
	$.fn.extend({
		wPictureUpload: function (method) {
			var result;
			if (methods[method]) {
				result = methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
			} else if (typeof method === 'object' || !method) {
				result = methods.init.apply(this, arguments);
			} else {
				$.error('Method ' + method + ' does not exist on jQuery.wPictureUpload');
				result = false;
			}
			return result;
		}
	});

}(jQuery));