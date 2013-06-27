// **Wootocracy form validator plugin**.
//
// [Previous Plugin](jquery.w.userinfo.html) | [Next Plugin](jquery.w.vote.html)

//      Wootocracy
//      http://wootocracy.com
//      Copyright 2013, CarnationGroup, a part of POSSIBLE
//      Date: Mon Jun 26 16:39:10 2013 +0100

//      Sample usage
//      $('body form').wValidator({
//          callback: submitForm
//      });

// ## Form validator plugin for jQuery


(function ($) {

	var defaultOptions = {
			// Submit callback
			callback: function (result) { },
			// jQuery selector for elements need to be validated
			elementSelector: '[data-validate]',
			// Error CSS class
			errorClass: 'error',
			// jQuery selector for item selection
			itemSelector: '[data-validate-rules]',
			// Error messages
			messages: {
				required: 'This field is required.',
				email: 'Please enter a valid email address.',
				url: 'Please enter a valid URL.',
				date: 'Please enter a valid date.',
				number: 'Please enter a valid number.',
				digits: 'Please enter only digits.',
				equalTo: 'Please enter the same value again.',
				maxlength: 'Please enter no more than {0} characters.',
				minlength: 'Please enter at least {0} characters.',
				rangelength: 'Please enter a value between {0} and {1} characters long.',
				range: 'Please enter a value between {0} and {1}.',
				max: 'Please enter a value less than or equal to {0}.',
				min: 'Please enter a value greater than or equal to {0}.'
			},
			// Validation rule attributes
			rulesAttribute: 'data-validate-rules',
			// jQuery selector for submit element
			submitSelector: 'button[type=submit]',
			// Valid CSS class
			validClass: 'valid'
		},

		defaultVars = {
			// Form was submited already
			submited: false,
			$wrapper: null
		},

		// Init event bindings
		initBindings = function (vars, options) {
			var $form, result;
			vars.$wrapper.find(options.submitSelector).on({
				'click.form': function (e) {
					e.preventDefault();
					$form = $(e.currentTarget).parents('form').first();
					vars.submited = true;
					result = validateForm($form, vars, options);
					options.callback.call(this, $form, result);
				}
			});
			vars.$wrapper.on({
				'click.form keyup.form': function (e) {
					if (vars.submited === true) {
						result = validateGroup($(e.target), $(this), vars, options);
					}
				}
			}, options.elementSelector);
		},

		// Validate form  
		// *$form:* form to validate, `jQuery object`
		validateForm = function ($form, vars, options) {
			var errors = [],
				valid = true,
				$parent = null,
				okays = [],
				result = null;

			// First reset the form
			resetForm($form, vars, options);

			
			// Find every element for validation
			$form.find(options.elementSelector).each(function () {
				$parent = $(this);
				// Get errors and okays
				result = collectErrorsOkays(vars, options, $parent, errors, okays, valid);
				errors = result.errors;
				okays = result.okays;
				valid = result.valid;
			});

			// Set CSS classes, messages, labels
			decorateForm(vars, options, errors, okays);

			return {valid: valid, errors: errors, okays: okays, url: $form.attr('action')};
		},

		// Validate input groups
		validateGroup = function ($elem, $group, vars, options) {
			var errors = [],
				okays = [],
				result;

			// Reset group
			resetElement($group, vars, options, false, $elem);
			// Get errors and okays
			result = collectErrorsOkays(vars, options, $group, errors, okays);
			// Decorate form
			decorateForm(vars, options, result.errors, result.okays);

			return {valid: result.valid};
		},

		// Validate single element
		validateElement = function ($element, vars, options) {
			// Get rules
			var rules = $element.attr(options.rulesAttribute).split('|');
			// Check rules
			return checkRules($element, rules, vars, options);
		},

		// Check errors and valid elements
		collectErrorsOkays = function (vars, options, $element, errors, okays, valid) {
			var result;

			$element.find(options.itemSelector).each(function () {
				// Validate single element
				result = validateElement($(this), vars, options);
				// If it's not valid
				if (result.valid === false) {
					valid = false;
					errors.push({
						messages: result.errors,
						element: $(this),
						group: $element
					});
				// If it is valid
				} else {
					okays.push({
						element: $(this),
						group: $element
					});
				}
			});

			return {errors: errors, okays: okays, valid: valid};
		},

		// Set CSS classes, error messages, labels
		decorateForm = function (vars, options, errors, okays) {
			var $label = null;

			// Set error messages, error CSS classes
			$.each(errors, function (k, v) {
				v.group.addClass(options.errorClass).removeClass(options.validClass);
				v.element.addClass(options.errorClass).removeClass(options.validClass);
				$label = v.element.siblings('label[for=' + v.element.attr('id') + ']');
				if ($label.length < 1) {
					$label = v.element.parents('.input-grp, [data-validate-ext]').find('label[for=' + v.element.attr('data-validate-label') + ']');
				}
				$label.data({originalText: $label.text()}).text(v.messages[0]).attr('title', v.messages[0]);
			});

			// Set valid CSS classes
			$.each(okays, function (k, v) {
				if (v.group.find('.error' + options.itemSelector).length < 1) {
					v.group.addClass(options.validClass).removeClass(options.errorClass);
				}
				v.element.addClass(options.validClass).removeClass(options.errorClass);
			});
		},

		// Check validation rule for an element
		checkRules = function ($elem, rules, vars, options) {
			var i = 0,
				rule = null,
				l = rules.length,
				errors = [],
				valid = true,
				result = null;

			// Check every rule
			for (i; i < l; i++) {
				rule = rules[i].split(':');
				// Check single rule
				result = applyRule(vars, options, rule, $elem);
				if (result.valid === false) {
					valid = false;
					errors.push(result.error);
				}
			}

			return {valid: valid, errors: errors};
		},
		
		// Apply rule to an element
		applyRule = function (vars, options, rule, $elem) {
			var valid = true,
				error = '',
				// Element type
				type = $elem.attr('type'),
				// Element value
				val = elementValue($elem[0]);

			// Switch between rules
			switch (rule[0]) {
				case 'required':
					if (!required(val, $elem[0])) {
						valid = false;
						error = options.messages.required;
					}
					break;
				case 'minlength':
					if (!minlength(val, $elem[0], rule[1])) {
						valid = false;
						error = options.messages.minlength.replace('{0}', rule[1]);
					}
					break;
				case 'maxlength':
					if (!maxlength(val, $elem[0], rule[1])) {
						valid = false;
						error = options.messages.maxlength.replace('{0}', rule[1]);
					}
					break;
				case 'email':
					if (!email(val, $elem[0])) {
						valid = false;
						error = options.messages.email;
					}
					break;
				case 'number':
					if (!number(val, $elem[0])) {
						valid = false;
						error = options.messages.number;
					}
					break;
				default:
					break;
			}
			return {valid: valid, error: error};
		},
		
		// Check required rule
		required = function (value, element) {
			// It's a `<select>`
			if (element.nodeName.toLowerCase() === 'select') {
				var val = $(element).val();
				return val && val.length > 0;
			}
			// It's a `<input type="checkbox">` or `<input type="radio" />`
			if (checkable(element)) {
				return getLength(value, element) > 0;
			}
			return $.trim(value).length > 0;
		},

		// Check email format rule
		email = function (value, element) {
			return optional(element) || /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(value);
		},

		// Check number format rule
		number = function (value, element) {
			return optional(element) || /^\d{1,9}(|\.\d{1,2})$/.test(value);
		},

		// Check minimal length rule
		minlength = function (value, element, param) {
			var length = $.isArray(value) ? value.length : getLength($.trim(value), element);
			return optional(element) || length >= param;
		},

		// Check maximum length rule
		maxlength = function (value, element, param) {
			var length = $.isArray(value) ? value.length : getLength($.trim(value), element);
			return optional(element) || length <= param;
		},

		// Check if input is checkable (checkbox or radio)
		checkable = function (element) {
			return (/radio|checkbox/i).test(element.type);
		},

		// Optional rule
		optional = function (element) {
			var val = elementValue(element);
			return !required.call(this, val, element);
		},

		// Get checkable length
		getLength = function (value, element) {
			switch (element.nodeName.toLowerCase()) {
				case 'select':
					return $('option:selected', element).length;
			}
			return value.length;
		},

		// Get elements value
		elementValue = function (element) {
			var type = $(element).attr("type"),
				val = $(element).val();

			if (type === "radio" || type === "checkbox") {
				return $("input[name='" + $(element).attr("name") + "']:checked").val();
			}

			if (typeof val === "string") {
				return val.replace(/\r/g, "");
			}
			return val;
		},

		// Reset form
		resetForm = function ($form, vars, options, onlyError) {
			var $group;
			$form.find(options.elementSelector).each(function () {
				$group = $(this);
				$group.find(options.itemSelector).each(function () {
					resetElement($group, vars, options, onlyError, $(this));
				});
			});
		},

		// Reset single element
		resetElement = function ($group, vars, options, onlyError, $elem) {
			var classesToRemove = options.errorClass + (onlyError === true ? '' : ' ' + options.validClass),
				combined = false;
			if ($elem.parents(options.elementSelector).find('.error' + options.itemSelector).length > 1) {
				combined = true;
			}
			if (combined === false) {
				$group.removeClass(classesToRemove).find(options.itemSelector).removeClass(classesToRemove);
			} else {
				$elem.removeClass(classesToRemove);
			}
			$group.find('label').each(function () {
				if ($(this).data('originalText') !== undefined) {
					$(this).text($(this).data('originalText')).attr('title', $(this).data('originalText'));
				}
			});
			$group.parents('[data-validate-ext]').find('label').each(function () {
				if ($(this).data('originalText') !== undefined) {
					$(this).text($(this).data('originalText')).attr('title', $(this).data('originalText'));
				}
			});
		},

		// Decorate form from external error messages
		decorateFormFromExternal = function (vars, options, $form, errs) {
			var $elem,
				$parent,
				errors = [];

			resetForm($form, vars, options, true);

			$.each(errs, function (k, v) {
				$elem = $form.find('[name="' + k + '"]');
				$parent = $elem.parents(options.elementSelector);
				errors.push({
					messages: [v],
					element: $elem,
					group: $parent
				});
			});

			decorateForm(vars, options, errors, []);
		},

		// Plugin methods
		methods = {

			init: function (opts) {
				return this.each(function () {
					if ($(this).data('wValidator') === undefined) {
						var options = $.extend({}, defaultOptions, opts),
							vars = $.extend({}, defaultVars);
						vars.$wrapper = $(this);
						$(this).data('wValidator', options);
						$(this).data('wValidatorVars', vars);
						initBindings(vars, options);
					}
				});
			},

			// Reset form
			reset: function ($form) {
				return this.each(function () {
					var options = $(this).data('wValidator'),
						vars = $(this).data('wValidatorVars');
					vars.submited = false;
					resetForm($form, vars, options);
				});
			},

			// Decorate form
			decorateForm: function ($form, errors) {
				return this.each(function () {
					var options = $(this).data('wValidator'),
						vars = $(this).data('wValidatorVars');
					decorateFormFromExternal(vars, options, $form, errors);
				});
			}

		};

	// Extend jQuery with `wValidator`
	$.fn.extend({
		wValidator: function (method) {
			var result;
			if (methods[method]) {
				result = methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
			} else if (typeof method === 'object' || !method) {
				result = methods.init.apply(this, arguments);
			} else {
				$.error('Method ' + method + ' does not exist on jQuery.wValidator');
				result = false;
			}
			return result;
		}
	});

}(jQuery));