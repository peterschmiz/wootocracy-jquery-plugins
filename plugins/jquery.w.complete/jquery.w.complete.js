// **Wootocracy autocomplete plugin**.
//
// [Previous Plugin](jquery.w.animatefavicon.html) | [Next Plugin](jquery.w.conditionalbottom.html)

//      Wootocracy
//      http://wootocracy.com
//      Copyright 2013, CarnationGroup, a part of POSSIBLE
//      Date: Mon Jun 26 08:07:23 2013 +0100

//      Sample usage
//      $(.target).wComplete({
//          autoFeed: 'products/feed',
//          grouped: true
//      });

// ## Autocomplete plugin for jQuery

(function ($) {

	var defaultOptions = {
			// Feed url
			autoFeed: null,
			// Feed update delay
			autoFeedDelay: 250,
			autoCompleteTarget: null,
			autoCompleteTargetKey: null,
			// Results are grouped or not
			grouped: true,
			// Group headers
			groupHeaders: ['Products', 'Categories', 'Brands'],
			// Default filter
			filterValues: ['value'],
			// Dropdown insert mode
			insertMode: 'append',
			// Prevent default keycodes
			preventKeys: [9, 13, 27, 38, 40],
			// Suggestion target jQuery selector
			suggestionSelector: '.suggestion',
			tabbed: true,
			targetInputSelector: 'input[type=search]',
			wrapperClassName: 'auto-complete'
		},

		defaultVars = {
			// Autocomplete is active
			active: false,
			// Feed timer id (`window.setTimeout` ID)
			autoFeedTid: null,
			// Loading animation timer id (`window.setTimeout` ID)
			loadingTid: null,
			// Loading animation phase index
			loadingIndex: 0,
			// Loaded or not
			loaded: false,
			// Loading animation loop
			loadingLooped: false,
			// List target wrapper jQuery object
			$list: null,
			// Voice recognition
			recognition: null,
			// Feed target jQuery object
			$target: null,
			// Feed input wrapper jQuery object 
			$targetInput: null,
			// Autocomplete suggestion (hint) jQuery object
			$targetSuggestion: null,
			// Current autocomplete term
			term: '',
			// Current terms and categories
			termsAndCategories: {},
			// Structured term categories 
			termCategories: {
				brands: [],
				products: [],
				categories: [],
				subcategories: []
			},
			// Voice recognition result
			transcript: '',
			// Speech icon jQuery wrapper
			$speech: null,
			// Voice recongnition activated
			speechActivated: false,
			// Voice recognition inited
			speechInited: false,
			// Voice recognition enabled
			speechEnabled: false
		},

		// Init (cache) the used DOM elements
		initDOMElements = function (vars, options) {
			vars.$list = $('<div class="' + options.wrapperClassName + '"></div>');
			if (options.insertMode === 'append') {
				vars.$target.append(vars.$list);
			} else if (options.insertMode === 'after') {
				vars.$target.after(vars.$list);
			}
			if (options.targetInputSelector !== 'self') {
				vars.$targetInput = vars.$target.find(options.targetInputSelector);
			} else {
				vars.$targetInput = vars.$target;
			}
			vars.$targetSuggestion = vars.$target.find(options.suggestionSelector);
			vars.$speech = vars.$target.find('.speech');
		},

		// Init event bindings
		initBindings = function (vars, options) {
			vars.$targetInput.on({
				'click.wcomplete': function () {
					// If the feed input is empty, then reset plugin
					if ($.trim(vars.$targetInput.val()) === '') { reset(vars, options); }
				},
				'keyup.wcomplete': function (e) {
					// Do nothing on escape
					if (e.keyCode === 27) { e.stopPropagation(); }
					// Strip input field
					stripInput(vars);
					if ($.inArray(e.keyCode, [27]) !== -1) { e.stopPropagation(); }
					if ($.trim($(this).val()) === '') {
						reset(vars, options);
					} else if (options.autoFeed !== null && ($.inArray(e.keyCode, [13, 37, 38, 39, 40]) === -1)) {
						autoFeedList(vars, options);
					}
				},
				'keydown.wcomplete': function (e) {
					deleteSuggestion(vars);
					if (e.keyCode === 27) {
						e.preventDefault();
						hideList(vars);
					} else if ($.inArray(e.keyCode, [9, 13, 38, 40]) !== -1) {
						if (vars.active === true && $.trim(vars.$targetInput.val()) !== '') {
							navigateList(e, vars, options);
						}
					}
				}
			});
			vars.$list.on({
				'click.wcomplete': function (e) {
					e.stopPropagation();
					if (!$(this).hasClass('group-header')) {
						selectItem(vars, options, $(this).parent().find('li').not('.group-header').index($(this)));
						hideList(vars);
					}
				},
				'mouseover.wcomplete': function () {
					if (!$(this).hasClass('group-header')) {
						setSelection(vars, $(this).parent().find('li').not('.group-header').index($(this)));
					}
				}
			}, 'ul li');
			// Voice recognition
			vars.$speech.on({
				'click.wcomplete': function () {
					if (vars.speechInited === false) {
						initSpeech(vars);
					}
					reset(vars, options);
					vars.transcript = '';
					if (vars.speechActivated === true) {
						vars.recognition.stop();
						vars.speechActivated = false;
						vars.$speech.removeClass('rec');
					} else {
						vars.recognition.lang = 'en';
						vars.recognition.start();
						vars.speechActivated = true;
						vars.$speech.addClass('rec');
					}
				}
			});
			// Hide list
			$(document).on({
				'click.wcomplete': function () {
					hideList(vars, true);
				}
			});
		},

		// Init voice recognition
		initSpeech = function (vars) {
			if (window.webkitSpeechRecognition !== undefined) {
				vars.recognition = new webkitSpeechRecognition();
				vars.recognition.continuous = false;
				vars.recognition.interimResults = true;
				vars.speechEnabled = true;

				vars.recognition.onresult = function (event) {
					recognitionReady(event, vars);
				};
				vars.recognition.onerror = function () {
					vars.speechActivated = false;
					vars.$speech.removeClass('rec');
					vars.recognition.stop();
				};
				vars.recognition.onend = function () {
					vars.speechActivated = false;
					vars.$speech.removeClass('rec');
					vars.recognition.stop();
				};
			}
			vars.speechInited = true;
		},

		// Recognition result
		recognitionReady = function (event, vars) {
			var interim_transcript = '', i;

			for (i = event.resultIndex; i < event.results.length; ++i) {
				if (event.results[i].isFinal) {
					vars.transcript += event.results[i][0].transcript;
				} else {
					interim_transcript += event.results[i][0].transcript;
				}
			}
			vars.transcript = $.trim(vars.transcript).toLowerCase();
			vars.term = vars.transcript;
			vars.$targetInput.val(vars.term);
		},

		// Strip input (tags, html, script etc.)
		stripInput = function (vars) {
			if (vars.$targetInput.val().search(/(<([^>]+)>)/ig, '') !== -1) {
				vars.$targetInput.val(vars.$targetInput.val().replace(/(<([^>]+)>)/ig, ''));
			}
		},

		// Get autocomplete list
		autoFeedList = function (vars, options) {
			var term = $.trim(vars.$targetInput.val()),
				$list = vars.$list,
				currentIndex = parseInt($list.data('currentIndex'), 10);
			window.clearTimeout(vars.autoFeedTid);
			vars.term = term;
			vars.autoFeedTid = window.setTimeout(function () {
				$.ajax({
					type: 'GET',
					url: options.autoFeed,
					data: {term: term},
					success: function (result) {
						buildList(vars, options, result);
					}
				});
			}, options.autoFeedDelay);
		},

		// Build autocomplete list
		buildList = function (vars, options, data) {
			var items = '',
				$list = vars.$list;
			$list.data({currentIndex: 0}).empty();
			vars.loaded = true;
			vars.active = false;
			if (data.length > 0) {
				items = createList(vars, options.grouped === true ? sortData(vars, data) : data, items, options);
				$list.append('<ul>' + items + '</ul>');
				setSelection(vars, -1);
				// Set suggestion
				setSuggestion(vars, options);
				// Show dropdown
				showList(vars);
			} else {
				// Hide dropdown
				hideList(vars);
			}
		},

		// Construct dropdown list
		createList = function (vars, data, items, options) {
			var listLength = 0,
				rowDataAttributes = '';

			$.each(data, function (k, v) {
				if (v.group !== undefined) {
					items += '<li class="group-header">' + options.groupHeaders[v.group] + '</li>';
				} else {
					rowDataAttributes = createRowDataAttributes(vars, options, v);
					items += '<li ' + rowDataAttributes + '>' + v.value + '</li>';
					listLength++;
				}
			});
			vars.$list.data({length: listLength});
			return items;
		},

		// Create dropdown list item attributes (category, subcategory)
		createRowDataAttributes = function (vars, options, value) {
			var attributes = '';
			$.each(value, function (k, v) {
				if ($.inArray(k, options.filterValues) === -1 && (v instanceof Array === false)) {
					attributes += 'data-' + k + '="' + v + '" ';
				}
			});
			if (value.type === 1) {
				attributes += 'data-categories="' + value.category.join(',') + '" data-subcategory="' + value.value + '" ';
			}
			return $.trim(attributes);
		},

		// Sort data, make groups
		sortData = function (vars, data) {
			var orderedData = [],
				groupedData = [],
				prevType = null,
				tempItem;
			$.each(data, function (k, v) {
				if (v.type === 3) {
					tempItem = $.extend({}, v);
					tempItem.type = 2;
					orderedData.push(tempItem);
					tempItem = $.extend({}, v);
					tempItem.type = 0;
					orderedData.push(tempItem);
				} else {
					orderedData.push(v);
				}
			});
			orderedData.sort(function (obj1, obj2) {
				return obj2.type - obj1.type;
			});
			$.each(orderedData, function (k, v) {
				if (prevType === null || prevType !== v.type) {
					prevType = v.type;
					groupedData.push({group: v.type});
				}
				groupedData.push(v);
			});
			return groupedData;
		},

		// Hide dropdown
		hideList = function (vars, noFocus) {
			vars.active = false;
			vars.$list.hide();
			deleteSuggestion(vars);
			if (noFocus !== true) {
				vars.$targetInput.focus();
			}
			vars.$target.parents('.input-grp').removeClass('autocomplete-focus');
		},

		// Show dropdown
		showList = function (vars) {
			vars.active = true;
			vars.$list.show();
			vars.$targetInput.focus();
			vars.$target.parents('.input-grp').addClass('autocomplete-focus');
		},

		// Dropdown navigation controller
		navigateList = function (e, vars, options) {
			var $list = vars.$list,
				currentIndex = parseInt($list.data('currentIndex'), 10),
				l = parseInt($list.data('length'), 10),
				cancelEvent = false;

			switch (e.keyCode) {
				case 9:
					cancelEvent = true;
					if (currentIndex === -1) { currentIndex = 0; }
					break;
				case 13:
					vars.term = $.trim(vars.$targetInput.val());
					cancelEvent = true;
					break;
				case 38:
					cancelEvent = true;
					if (currentIndex === -1) {
						currentIndex = l - 1;
					} else {
						currentIndex = currentIndex - 1 < 0 ? -1 : currentIndex - 1;
					}
					break;
				case 40:
					cancelEvent = true;
					if (currentIndex === -1) {
						currentIndex = 0;
					} else {
						currentIndex = currentIndex + 1 > l - 1 ? -1 : currentIndex + 1;
					}
					break;
				default:
					break;
			}

			if (cancelEvent === true) {
				if ($.inArray(e.keyCode, options.preventKeys) !== -1) {
					e.preventDefault();
					e.stopImmediatePropagation();
				}
				if ($.inArray(e.keyCode, [9, 13, 27]) !== -1) {
					deleteSuggestion(vars);
					hideList(vars);
				} else {
					setSuggestion(vars, options, currentIndex);
				}
				if ($.inArray(e.keyCode, [9, 13]) === -1) {
					setSelection(vars, currentIndex);
				}
				if (e.keyCode !== 13) {
					selectItem(vars, options, currentIndex, e.keyCode);
				}
			}
		},

		// Set dropdown selection
		setSelection = function (vars, index) {
			var $list = vars.$list;
			vars.$list.data({currentIndex: index});
			if (index === -1) {
				vars.$targetInput.focus();
				$list.find('ul li').not('.group-header').removeClass('selected');
			} else {
				$list.find('ul li').not('.group-header').eq(index).addClass('selected').siblings().removeClass('selected');
			}
		},

		// Set feed suggestion (hint)
		setSuggestion = function (vars, options, index) {
			var term = vars.term,
				termArr = term.split(' '),
				text = '';

			if (index === undefined || index === -1) { index = 0; }

			if (options.tabbed === true) {
				termArr.pop();
				text = termArr.join(' ');
			}
			text = (text !== '' ? text + ' ' : '') + vars.$list.find('ul li').not('.group-header').eq(index).text();

			vars.$targetSuggestion.val(text);
		},

		// Select dropdown item, add to the terms and categories
		selectItem = function (vars, options, index, keyCode) {
			var $elem = null,
				term = vars.term,
				termArr = term.split(' '),
				text = '';

			if (options.tabbed === true) {
				if (keyCode !== 13) {
					termArr.pop();
				}
				text = termArr.join(' ');
			}

			if (index !== -1) {
				$elem = vars.$list.find('ul li').not('.group-header').eq(index);
				if (keyCode !== 13) {
					text = (text !== '' ? text + ' ' : '') + $elem.text();
				}
				if (options.autoCompleteTarget !== null) {
					options.autoCompleteTarget.val($elem.attr(options.autoCompleteTargetKey));
				}
			} else {
				if (text === '') { text = term; }
				if (options.autoCompleteTarget !== null) {
					options.autoCompleteTarget.val(null);
				}
			}

			if (keyCode === 9 || (keyCode === 13 && index !== -1)) {
				text += ' ';
			}

			if (keyCode === 9 || (keyCode === 13 && index !== -1) || keyCode === undefined) {
				addToTermCategories(vars, $elem);
			}

			vars.$targetInput.val(text);
			checkTermCategories(vars);
		},

		// Add item to terms and categories
		addToTermCategories = function (vars, $elem) {
			var type = parseInt($elem.attr('data-type'), 10),
				val = $elem.text(),
				termCategories = vars.termCategories,
				brands = termCategories.brands,
				categories = termCategories.categories,
				subcategories = termCategories.subcategories,
				products = termCategories.products,
				rawCategories;

			switch (type) {
				case 0:
					if ($.inArray(val, products) === -1) { products.push(val); }
					break;
				case 1:
					rawCategories = $elem.attr('data-categories').split(',');
					vars.termsAndCategories[val] = rawCategories;
					$.each(rawCategories, function (k, v) { if ($.inArray(v, categories) === -1) { categories.push(v); } });
					if ($.inArray($elem.attr('data-subcategory'), subcategories) === -1) { subcategories.push($elem.attr('data-subcategory')); }
					break;
				case 2:
					if ($.inArray(val, brands) === -1) { brands.push(val); }
					break;
				default:
					break;
			}

		},

		// Check term duplications or missing terms
		checkTermCategories = function (vars) {
			var term = $.trim(vars.$targetInput.val()),
				termCategories = vars.termCategories,
				brands = termCategories.brands,
				categories = termCategories.categories,
				subcategories = termCategories.subcategories,
				products = termCategories.products,
				termsAndCategories = vars.termsAndCategories,
				toDelete = [],
				toDeleteFromTermsAndCategories = [];

			$.each(brands, function (k, v) { if (term.search(v) === -1) { toDelete.push(k); } });
			$.each(toDelete, function (k, v) { brands.splice(v, 1); });

			toDelete = [];
			$.each(termsAndCategories, function (k, v) {
				if (term.search(v) === -1) {
					toDelete.push($.inArray(v, categories));
					toDeleteFromTermsAndCategories.push(k);
				}
			});
			$.each(toDelete, function (k, v) { categories.splice(v, 1); });
			$.each(toDeleteFromTermsAndCategories, function (k) {
				delete termsAndCategories[k];
			});

			toDelete = [];
			$.each(subcategories, function (k, v) { if (term.search(v) === -1) { toDelete.push(k); } });
			$.each(toDelete, function (k, v) { subcategories.splice(v, 1); });

			toDelete = [];
			$.each(products, function (k, v) { if (term.search(v) === -1) { toDelete.push(k); } });
			$.each(toDelete, function (k, v) { products.splice(v, 1); });

			termCategories.brands = brands;
			termCategories.categories = categories;
			termCategories.subcategories = subcategories;
			termCategories.products = products;
		},

		// Delete feed suggestion (hint)
		deleteSuggestion = function (vars) {
			vars.$targetSuggestion.val('');
		},

		// Show loading animation
		showLoading = function (vars) {
			if ($.trim(vars.$targetInput.val()) !== '') {
				vars.$target.removeClass('loading-1 loading-2 loading-3 loading-4 loading-5').addClass('loading loading-' + parseInt(vars.loadingIndex + 1, 10));
				vars.loadingTid = window.setTimeout(function () {
					vars.loadingIndex++;
					if (vars.loadingIndex > 3) {
						vars.loadingIndex = 0;
						vars.loadingLooped = true;
					}
					if (vars.loaded && vars.loadingLooped) {
						hideLoading(vars);
					} else {
						showLoading(vars);
					}
				}, 101);
			}
		},

		// Hide loading animation
		hideLoading = function (vars) {
			window.clearTimeout(vars.loadingTid);
			vars.$target.removeClass('loading loading-1 loading-2 loading-3 loading-4 loading-5');
		},

		// Reset autocomplete (set to default)
		reset = function (vars, options) {
			vars.queries = [];
			vars.termCategories = {
				brands: [],
				products: [],
				categories: [],
				subcategories: []
			};
			vars.$list.data({originalQuery: '', currentIndex: -1});
			vars.term = '';
			window.clearTimeout(vars.autoFeedTid);
			if (options.autoCompleteTarget !== null) {
				options.autoCompleteTarget.val(null);
			}
			vars.$targetInput.val(null);
			deleteSuggestion(vars);
			hideList(vars);
		},

		// Plugin methods
		methods = {

			// Init plugin
			init: function (opts) {
				return this.each(function () {
					if ($(this).data('wComplete') === undefined) {
						var options = $.extend({}, defaultOptions, opts),
							vars = $.extend({}, defaultVars);
						$(this).data('wComplete', options);
						$(this).data('wCompleteVars', vars);
						vars.$target = $(this);
						if (vars.$target.attr('data-autocomplete-feed') !== undefined) {
							options.autoFeed = vars.$target.attr('data-autocomplete-feed');
						}
						if (vars.$target.attr('data-autocomplete-target') !== undefined) {
							options.autoCompleteTarget = $(vars.$target.attr('data-autocomplete-target').split('|')[0].toString());
							options.autoCompleteTargetKey = vars.$target.attr('data-autocomplete-target').split('|')[1];
						}
						initDOMElements(vars, options);
						initBindings(vars, options);
					}
				});
			},

			// Build dropdown list form data  
			// *data:* feed data, `JSON`
			build: function (data) {
				return this.each(function () {
					var options = $(this).data('wComplete'),
						vars = $(this).data('wCompleteVars');
					buildList(vars, options, data);
				});
			},

			// Set feed term and feed input value  
			// *term:* feed term, `String`  
			// *setValue:* input value, `String`
			setTerm: function (term, setValue) {
				return this.each(function () {
					var vars = $(this).data('wCompleteVars');
					vars.term = term;
					if (setValue !== undefined) {
						vars.$targetInput.val(term);
					}
				});
			},

			// Get term categories
			getTermCategories: function () {
				var vars = $(this).data('wCompleteVars');
				return vars.termCategories;
			},

			// Show loading animation 
			loading: function () {
				return this.each(function () {
					var vars = $(this).data('wCompleteVars');
					vars.loaded = false;
					vars.loadingLooped = false;
					showLoading(vars);
				});
			},

			// Reset plugin to defaults
			reset: function () {
				return this.each(function () {
					var options = $(this).data('wComplete'),
						vars = $(this).data('wCompleteVars');
					vars.loaded = false;
					vars.loadingLooped = false;
					reset(vars, options);
				});
			}
		};

	// Extend jQuery with `wComplete`
	$.fn.extend({
		wComplete: function (method) {
			var result;
			if (methods[method]) {
				result = methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
			} else if (typeof method === 'object' || !method) {
				result = methods.init.apply(this, arguments);
			} else {
				$.error('Method ' + method + ' does not exist on jQuery.wComplete');
				result = false;
			}
			return result;
		}
	});

}(jQuery));