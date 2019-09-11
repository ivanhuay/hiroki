# Custom configuration


using `hiroki.rest` you can pass as a second parameter a configuration object.

```jasvascript

const options = {
    shareQueryEnabled: false, //Bool
    fastUpdate: 'enabled', //Enum - options enabled, disabled, optional
    disabledPluralize: false //Bool
};
hiroki.rest(model, options);

```

* shareQueryEnabled: enable shared queries route. (more info here)[#share-query]
* fastUpdate: with enabled UPDATE methods run faster but pre save method of models won't run. There are some posibles values:
  * optional: with optional you have to send a query param `?fast=true`
  * enabled: always working.
  * disabled: not working.
