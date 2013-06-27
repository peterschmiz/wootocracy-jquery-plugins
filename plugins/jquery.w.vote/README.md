jQuery wVote
===============

jQuery [Wootocracy](http://wootocracy.com) vote plugin

Description
-----------

The plugin is binded to every DOM element with `data-wvote` attribute.
It catches the `click` event and calls the element's `href` value through AJAX.
The return value is passed to the `callback` function.

Also the element's state will be updated.

Callback option
---------------

Add a callback function by passing a `callbackFn`:

```javascript
$.wVote(callbackFn);
```

Feedback
--------

**Peter Schmiz**
<peter.schmiz@carnationgroup.com>