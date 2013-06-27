// **Wootocracy card list plugin**.
//
// [Previous Plugin](jquery.w.conditionalbottom.html) | [Next Plugin](jquery.w.map.html)

//      Wootocracy
//      http://wootocracy.com
//      Copyright 2013, CarnationGroup, a part of POSSIBLE
//      Date: Mon Jun 26 08:32:44 2013 +0100

//      Sample usage
//      $(.target).wList();

// ## Card list plugin for jQuery

(function ($) {

	var defaultOptions = {
			// Default card template wrapper
			cardTemplate: '<div class="card"></div>',
			// Category click callback
			categoryCallback: null,
			// Default column template wrapper
			columnTemplate: '<div class="card-column"></div>',
			// Image load on init limit
			imageLoadLimit: 15,
			// Image lazy load enabled
			lazyLoadEnabled: false,
			// Lazy load delay
			lazyLoadTime: 3000,
			// Reset list or not
			noreset: false,
			// Clarify (unknown) callback (category, brand or name)
			unknownActionCallback: function ($elem) { },
			// Standalone list
			standAlone: false
		},

		defaultVars = {
			// Cards array
			cards: [],
			// Columns array
			columns: [],
			// Current card index
			index: 0,
			// Current column index
			currentColumn: 0,
			// Image load queue
			imageQueue: [],
			// Lazy load timer id (`window.setTimeout` ID)
			lazyLoadTid: null,
			// Resize timer id (`window.setTimeout` ID) 
			resizeTid: null,
			// Visible columns number
			visibleColumns: 3,
			// Main wrapper jQuery object
			$wrapper: null
		},

		// Init list columns
		initColumns = function (vars, options) {
			var i = 0,
				$columnHtml = null;

			// Get column number (based on the available width)
			vars.visibleColumns = getColumnNumber();
			// Get wrapper offset position
			vars.wrapperOffset = vars.$wrapper.offset().top;
			// Get window height
			vars.winH = $(window).height();
			// Reset columns array
			vars.columns = [];

			// If reset is enabled
			if (options.noreset !== true) {
				// Empty list
				vars.$wrapper.empty();
				// Rebuild columns
				for (i; i < vars.visibleColumns; i++) {
					$columnHtml = $(options.columnTemplate);
					vars.$wrapper.append($columnHtml);
					vars.columns.push($columnHtml);
				}
			}
		},

		// Init event bindings
		initBindings = function (vars, options) {
			$(window).on({
				'resize.wlist': function () {
					window.clearTimeout(vars.resizeTid);
					vars.resizeTid = window.setTimeout(function () {
						refreshLayout(vars, options);
					}, 50);
				}
			});
			vars.$wrapper.on({
				'mouseover.wlist': function (e) {
					showUnknownInfo($(e.currentTarget));
				},
				'mouseleave.wlist': function (e) {
					hideUnknownInfo($(e.currentTarget));
				},
				'click.wlist': function (e) {
					unknownAction(options, $(e.currentTarget));
				}
			}, '.unknown');
			vars.$wrapper.on({
				'click.wlist': function (e) {
					categoryAction(options, $(e.currentTarget));
				}
			}, '.card-category:not(.unknown)');
		},

		// Show unknown hover infos
		showUnknownInfo = function ($elem) {
			var type = $elem.attr('data-clarify');
			if (type === 'brand') {
				$elem.text('→ Add brand');
			} else if (type === 'subcategory') {
				$elem.text('→ Add subcategory');
			} else {
				$elem.text('Add name');
			}
		},

		// Hide unknown hover infos
		hideUnknownInfo = function ($elem) {
			var type = $elem.attr('data-clarify');
			if (type === 'brand') {
				$elem.text('Brand');
			} else if (type === 'subcategory') {
				$elem.text('Subcategory');
			} else {
				$elem.text('Name');
			}
		},

		// Call unknown callback action 
		unknownAction = function (options, $elem) {
			options.unknownActionCallback.call(this, $elem);
		},

		// Category click action 
		categoryAction = function (options, $elem) {
			var category = $elem.attr('data-category') || '',
				subcategory = '&subcategory=' + $elem.attr('data-subcategory') || '',
				url = '/index/categories?category=' + category + subcategory;
			if (options.categoryCallback !== null) {
				options.categoryCallback.call(this, $elem);
			} else {
				if (category !== '') {
					window.location.href = url;
				} else {
					window.location.href = '/index/search?term=' + $elem.text() + '&subcategory=' + $elem.text();
				}
			}
		},

		// Get available columns number
		getColumnNumber = function () {
			var winW = document.body.clientWidth,
				cols = 0,
				$html = $('html');

			// Calculate column number
			if (winW <= 747) {
				cols = 2;
			} else if (winW > 747 && winW < 991) {
				cols = 3;
			} else if (winW >= 991 && winW < 1234) {
				cols = 4;
			} else if (winW >= 1234 && winW < 1477) {
				cols = 5;
			} else if (winW >= 1477 && winW < 1720) {
				cols = 6;
			} else if (winW >= 1720) {
				cols = 7;
			} else {
				cols = 8;
			}

			// If sidebar is optional, then reduce column number, but only if column  
			// number was greater then 3 (because below 3 column the sidebar is  
			// always optional
			if ($html.hasClass('sidebar-optional') === false && cols > 3) {
				cols = cols - 1;
			}

			return cols;
		},

		// Refresh layout, column numbers, re-build list 
		refreshLayout = function (vars, options, force) {
			var diff = getColumnNumber() - vars.visibleColumns;

			if (diff !== 0 || force === true) {

				vars.visibleColumns = getColumnNumber();

				if (diff < 0) {
					removeExtraColumns(vars, options, Math.abs(diff));
				} else {
					addExtraColumns(vars, options, diff);
				}

				vars.currentColumn = 0;
				buildList(vars, options);
			}

		},

		// Remove unneccesary columns
		removeExtraColumns = function (vars, options, diff) {
			var i = 0,
				$toRemove;
			for (i; i < diff; i++) {
				$toRemove = vars.columns.pop();
				$toRemove.remove();
			}
		},

		// Add extra columns
		addExtraColumns = function (vars, options, diff) {
			var i = 0,
				$toAdd;
			for (i; i < diff; i++) {
				$toAdd = $(options.columnTemplate);
				vars.$wrapper.append($toAdd);
				vars.columns.push($toAdd);
			}
		},

		// Build columns, build cards, build the list
		buildList = function (vars, options, data, reset, voteAction) {
			var cards,
				cardList = [],
				$card,
				i;

			// If the list was reseted
			if (reset === true) {
				vars.index = 0;
				vars.cards = [];
				vars.currentColumn = 0;
				// Re-init columns
				initColumns(vars, options);
			}

			// If external data was supplied
			if (data !== undefined) {
				cards = data.data;
			} else {
				// Use the available card data and sort them by id
				vars.cards.sort(function (a, b) {
					return parseInt($(a).attr('data-card-id'), 10) - parseInt($(b).attr('data-card-id'), 10);
				});
				cards = vars.cards;
			}

			// Generate card elements
			for (i = 0; i < cards.length; i++) {
				vars.index++;
				if (data !== undefined) {
					$card = generateCard(vars, options, cards[i], vars.index, i, voteAction);
					if ($card !== false) {
						vars.cards.push($card);
					}
				} else {
					$card = cards[i];
				}

				// If the column isn't created yet, then create one
				if (cardList[vars.currentColumn % vars.visibleColumns] === undefined) {
					cardList[vars.currentColumn % vars.visibleColumns] = $();
				}
				// Push the card into the correct cardList slot
				cardList[vars.currentColumn % vars.visibleColumns] = cardList[vars.currentColumn % vars.visibleColumns].add($card);
				vars.currentColumn++;
			}

			// Sort and append card lists into columns
			for (i = 0; i < cardList.length; i++) {
				if (cardList[i] !== undefined) {
					cardList[i] = sortCardList(cardList[i]);
					vars.columns[i].append(cardList[i]);
				}
			}

			// If image lazy load is enabled
			if (options.lazyLoadEnabled === true) {
				window.clearTimeout(vars.lazyLoadTid);
				vars.lazyLoadTid = window.setTimeout(function () {
					// Load images
					lazyLoadImages(vars);
				}, options.lazyLoadTime);
			}
		},

		// Lazy load images
		lazyLoadImages = function (vars) {
			var img,
				$img;

			// If there is anything to load
			while (vars.imageQueue.length > 0) {
				// Get one
				img = vars.imageQueue.pop();
				// Find target `<img>` tag
				$img = vars.$wrapper.find('.card[data-card-id="' + img.id + '"] .card-img img').eq(0);
				// Set `src`
				$img.attr('src', $img.attr('data-src'));
			}
		},

		// Sort card list by id
		sortCardList = function (list) {
			list.sort(function (a, b) {
				return parseInt($(a).attr('data-card-id'), 10) - parseInt($(b).attr('data-card-id'), 10);
			});
			return list;
		},

		// Generate card template  
		// *vars:* plugin vars, `Object`  
		// *options:* plugin options, `Object`  
		// *data:* card data, `Object`  
		// *index:* current card index, `Number`  
		// *localIndex:* current card index in the column, `Number`  
		// *voteAction:* vote type on the card, `String`
		generateCard = function (vars, options, data, index, localIndex, voteAction) {
			var card,
				id = data.product_id || data._id,
				name = data.name || 'Name',
				nameClass,
				picture = data.picture,
				pictureSrc = picture.src !== undefined ? (picture.src.search(/^https?:\/\//i) !== -1 ? '' : '/') + picture.src : null,
				woot = 0,
				own = 0,
				list = 0,
				brand = data.brand || 'Brand',
				clarifyPopup = ' data-overlay="clarify" data-overlay-params="noloading" href="product/clarify/id/' + id + '"',
				brandClass,
				category = data.subcategory || 'Subcategory',
				categoryClass,
				extended = false,
				extendedList = '',
				sumActivity = data.activities || 0,
				ret = false;

			// There has to be a picture, no picture, no cookie
			if (pictureSrc !== null) {

				// If there were any friend activity, extend card
				if (data.activity !== undefined) {
					extended = true;
					extendedList = generateFriendList(data.activity, voteAction, sumActivity, id);
				}

				// Get votes
				if (data.votes !== undefined) {
					woot = data.votes.woot || 0;
					own = data.votes.ownz || 0;
					list = data.votes.list || 0;
				}

				// Set clarify classes
				nameClass = data.name ? '' : ' unknown';
				brandClass = data.brand ? '' : ' unknown';
				categoryClass = data.subcategory ? '' : ' unknown';

				// Push images to lazy load if enabled and limit is leaded
				if (localIndex > options.imageLoadLimit && options.lazyLoadEnabled === true) {
					vars.imageQueue.push({id: index});
				}

				// Card template
				card = '<div class="card' + (extended ? ' extended' : '') + '" data-card-id="' + index + '" data-id="' + id + '"' + (index === 1 ? ' data-guide-target="1"' : '') + '>' +
					'<a href="/product/' + id + '" class="card-img" title="' + name + '" alt="' + name + '">' +
					'<img ' + ((localIndex <= options.imageLoadLimit || options.lazyLoadEnabled === false) ? '' : 'data-') + 'src="' + pictureSrc + '" width="225"' + (picture.width ? (' height="' + Math.round((225 / picture.width) * picture.height) + '"') : ' height="auto"') + ' title="' + name + '" />' +
					'</a>' +
					'<div class="button-group">' +
					'<a href="/product/vote/id/' + id + '/type/woot" data-wvote="woot" title="Woot this!" class="woot' + (data.vote & 1 ? ' set' : '') + '"><span class="nr">' + woot + '</span></a>' +
					'<a href="/product/vote/id/' + id + '/type/ownz" data-wvote="own" title="I own this!"class="own' + (data.vote & 4 ? ' set' : '') + '"><span class="nr">' + own + '</span></a>' +
					'<a href="/product/vote/id/' + id + '/type/list" data-wvote="list" title="Wish!" class="list' + (data.vote & 2 ? ' set' : '') + '"><span class="nr">' + list + '</span></a>' +
					'</div>' +
					'<div class="card-info">' +
					'<a class="card-brand' + brandClass + '" data-clarify="brand"' + (data.brand ? '' : clarifyPopup) + (data.brand ? ' href="/brand/' + data.brand + '"' : '') + '>' + (data.brand || 'Brand') + '</a>' +
					'<a class="card-product' + nameClass + '" data-clarify="name"' + (data.name ? '' : clarifyPopup) + '>' + name + '</a>' +
					'<a class="card-category' + categoryClass + '" data-clarify="subcategory"' + (data.category ? ' data-category="' + data.category + '"' : '') + (data.subcategory ? ' data-subcategory="' + data.subcategory + '"' : clarifyPopup) + '>' + category + '</a>' +
					'</div>' + extendedList +
					'</div>';

				ret = $(card);

			}

			return ret;
		},

		// Generate friend list template (card part)
		generateFriendList = function (activity, voteAction, sum, id) {
			var html = '<div class="card-friend-list"><ul>',
				type = 'vote-woot',
				isGuest = false,
				item,
				i = 0,
				diff = 0,
				l = activity.length;

			if (l > 3) {
				diff = sum - l;
				l = 3;
			}

			for (i; i < l; i++) {
				item = activity[i];
				if (voteAction === 'all' || voteAction === undefined) {
					if (item.vote & 4) {
						type = 'vote-own';
					} else if (item.vote & 2) {
						type = 'vote-wish';
					} else if (item.vote & 1) {
						type = 'vote-woot';
					}
				} else if (voteAction === 'own') {
					type = 'vote-own';
				} else if (voteAction === 'woot') {
					type = 'vote-woot';
				} else if (voteAction === 'wish') {
					type = 'vote-wish';
				}

				isGuest = (!!(item.nickname === null || item.nickname === undefined));
				html += '<li class="' + type + '">' +
					'<a href="/' + (isGuest ? item.id : item.nickname) + '" class="avatar"><img width="36" height="36" src="' + item.picture.src + '" title="' + (isGuest ? item.id : item.nickname) + '" alt="' + (isGuest ? item.id : item.nickname) + '" /></a>' +
					'<a href="/' + (isGuest ? item.id : item.nickname) + '" class="name">' +
					'<h4>' + (isGuest ? 'Guest' : item.nickname) + '</h4>' +
					'<h6>' + (isGuest ? '' : item.city) + '</h6>' +
					'</a>' +
					'<span class="use-mini-sprite vote"></span>' +
					'</li>';
			}

			if (diff > 0) {
				html += '<li class="sum"><a href="/product/' + id + '">...and ' + diff + ' more friend' + (diff > 1 ? 's' : '') + '</a></li>';
			}

			html += '</ul></div>';
			return html;
		},

		// Add card to list
		addCardToList = function (vars, options, data, position, replace) {
			var $card,
				i = 0,
				l = vars.cards.length,
				temp,
				tempCard,
				ret = true;

			// Generate card from data
			$card = generateCard(vars, options, data, 1, 0);

			if (replace !== true) {

				if (position === undefined || position === 'before') {

					for (i; i < l; i++) {
						tempCard = vars.cards[i];
						temp = parseInt(tempCard.attr('data-card-id'), 10);
						tempCard.attr('data-card-id', temp++);
						vars.cards[i] = tempCard;
					}
				}
				// Add to list and re-init layout
				vars.cards.push($card);
				refreshLayout(vars, options, true);
			} else {
				ret = $card;
			}
			return ret;
		},

		// Plugin methods
		methods = {

			// Init plugin
			init: function (opts) {
				return this.each(function () {
					if ($(this).data('wList') === undefined) {
						var options = $.extend({}, defaultOptions, opts),
							vars = $.extend({}, defaultVars);
						$(this).data('wList', options);
						$(this).data('wListVars', vars);
						vars.$wrapper = $(this);
						if (options.standAlone === false) {
							initColumns(vars, options);
							initBindings(vars, options);
						}
					}
				});
			},

			// Build list from data  
			// *data:* card data, `Object`  
			// *reset:* reset list, `Boolean`  
			// *voteAction: vote type on the card, `String`
			build: function (data, reset, voteAction) {
				return this.each(function () {
					var options = $(this).data('wList'),
						vars = $(this).data('wListVars');
					buildList(vars, options, data, reset, voteAction);
				});
			},

			// Add card to list  
			// *data:* card data, `Object`  
			// *position:* position to insert to, `Number`  
			// *replace:* replace existing card, `Boolean` 
			addCard: function (data, position, replace) {
				var options = $(this).data('wList'),
					vars = $(this).data('wListVars');
				return addCardToList(vars, options, data, position, replace);
			},

			// Show loading animation 
			loading: function () {
				return this.each(function () {
					var vars = $(this).data('wListVars');
					vars.$wrapper.addClass('loading');
				});
			},

			// Set loaded state (remove loading animation)
			loaded: function () {
				return this.each(function () {
					var vars = $(this).data('wListVars');
					vars.$wrapper.removeClass('loading');
				});
			},

			// Trigger category click callback 
			categoryClick: function($elem) {
				var options = $(this).data('wList');
				categoryAction(options, $elem);
			}
		};

	// Extend jQuery with `wList`
	$.fn.extend({
		wList: function (method) {
			var result;
			if (methods[method]) {
				result = methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
			} else if (typeof method === 'object' || !method) {
				result = methods.init.apply(this, arguments);
			} else {
				$.error('Method ' + method + ' does not exist on jQuery.wList');
				result = false;
			}
			return result;
		}
	});

}(jQuery));