jQuery wActivity
================

jQuery [Wootocracy](http://wootocracy.com) user activity plugin

Description
-----------

The plugin loads the activity feed, stores it in `localStorage`, shows it
in with random delays (calls the callback function)

Options
-------

Add a callback function, default is `console.log`:

```javascript
callback: console.log
```

Limit the list items length, default is 10:

```javascript
limit: 10
```

Set the feed URL, default is 'user/activity':

```javascript
url: 'user/activity'
```

Random delay maximum (in millisecs), default is 5000:

```javascript
random: 5000
```

Save to `localStorage` enabled, default is false:

```javascript
saveEnabled: true
```

Stop after initialization (no further load), default is false:

```javascript
stopOnInit: false
```

Feed load delay, default is 5000:

```javascript
timeout: 5000
```

Methods
-------

Start random showing the items:

```javascript
$.wActivity('start');
```

Stop showing the items:

```javascript
$.wActivity('stop');
```

Feedback
--------

**Peter Schmiz**
<peter.schmiz@carnationgroup.com>