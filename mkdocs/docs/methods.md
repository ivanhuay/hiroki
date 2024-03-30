# Methods
Detailed methods of hiroki objects.

### importModel:

```js
hiroki.importModel(model, options);
```
* model: Mongoose model object.
* options: options json

### importModels:

```js
hiroki.importModels(models, options);
```

* models: model objects array or object.
The object should be { ModelOne, ModelTwo }
* options: options json
#### Options format:
```js
options: {
    fastUpdate: 'disabled', // 'enabled', 'disabled', 'optional' faster update without getting the updated document.
    basePath: '/api', //default from config.
    disabledMethods: '', // It could be ['get', 'post', 'put', 'delete']
    disabledPluralize: false, // to disable the default pluralized name in the path
}
```


### setConfig:

```js
hiroki.setConfig(options);
```
Config format:
```
config = {
    basePath: '/api'
}
```