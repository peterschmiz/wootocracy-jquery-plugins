jQuery wList
================

jQuery [Wootocracy](http://wootocracy.com) column based card list plugin

Description
-----------

The plugin builds columns with cards based on the window dimensions.

Options
-------

Set template for the card items:

```javascript
cardTemplate: '<div class="card"></div>'
```

Set template for the column items:

```javascript
columnTemplate: '<div class="card-column"></div>'
```

Set image load limit (after reaching limit with lazy load enabled, the images will load later), default is 15:

```javascript
imageLoadLimit: 30
```

Enabled lazy load, default is false:

```javascript
lazyLoadEnabled: true
```

Methods
-------

Build list:

```javascript
$.wList('build', data, reset, voteAction);
```

Add a single card to the list

```javascript
$.wList('addCard', data, position, replace);
```

Set loading animation for the list:

```javascript
$.wList('loading');
```

Remove loading animation from the list:

```javascript
$.wList('loaded');

Feedback
--------

**Peter Schmiz**
<peter.schmiz@carnationgroup.com>