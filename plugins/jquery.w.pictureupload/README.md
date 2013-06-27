jQuery wPictureUpload
================

jQuery [Wootocracy](http://wootocracy.com) AJAX based picture upload plugin.

Description
-----------

AJAX based picture upload plugin with drag and drop support.

Options
-------

Set upload target URL:

```javascript
action: 'upload/picture'
```

Enable or disable drag and drop support, default is true:

```javascript
dragndropSupport: true
```

Set loading class:

```javascript
loadingClass: 'loading'
```

Set error class:

```javascript
errorClass: 'error'
```

Methods
-------

Upload image:

```javascript
$.wPictureUpload('addImage', imgsrc);
```

Feedback
--------

**Peter Schmiz**
<peter.schmiz@carnationgroup.com>