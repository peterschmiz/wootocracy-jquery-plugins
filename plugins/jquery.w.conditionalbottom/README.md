jQuery conditionalBottom
================

jQuery [Wootocracy](http://wootocracy.com) conditional positioning plugin

Description
-----------

The plugin checks available space (relative to the wrapper of the plugin)
and switches between 'relative' and 'fixed' positioning (using classes, so
you have to define proper CSS properties)

Options
-------

Set minimum padding, default is 20px:

```javascript
padding: 20
```


Methods
-------


Refresh plugin, position, re-check space:

```javascript
$.conditionalBottom('refresh');
```

Feedback
--------

**Peter Schmiz**
<peter.schmiz@carnationgroup.com>