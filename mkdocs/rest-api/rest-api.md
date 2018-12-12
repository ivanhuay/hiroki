# Query string parameters

Use query options from the client to make dynamic requests.  Query options can be mixed as you see fit.

### conditions

Set the Mongoose query's `find` or `remove` arguments.  This can take full advtange of the MongoDB query syntax, using geolocation, regular expressions, or full text search.  Special query operators are fine, and in fact geolocation, regular expression, and full text search capabilities are available to your API clients by default!

    GET /api/people?conditions={ "location": { "$near": [44, -97] } }
    GET /api/people?conditions={ "$text": { "$search": "dog bites man" } }
    GET /api/cats?sort=-name&limit=1&conditions={ "features": "stripes" }
    DELETE /api/people?conditions={ "name": { "$regex": "^Bob W", "$options": "i" } }

### skip

Skip sending the first *n* matched documents in the response.  Useful for paging.

    GET /api/horses?skip=3

### limit

Limit the response document count to *n* at maximum.

    GET /api/horses?limit=3

If both limit and skip are used on a request, the response `Link` header will be set with extra relations that give URLs for paging.

### sort

Sort response documents by the given criteria. Here's how you'd sort the collection by `name` in ascending order, then by `age` in descending order.

    GET /api/cheeses?sort=name -age

### select

Set which fields should be selected for response documents.

    GET /api/phones?select=-_id -year

It is not permitted to use the `select` query option to select deselected paths.  This is to allow a mechanism for hiding fields from client software.

You can deselect paths in the Mongoose schema definition using `select: false` or in the controller by calling e.g. `controller.select('-foo')`.  Your server middleware will be able to select these fields as usual using `query.select`, while preventing the client from selecting the field.

Note that mixing inluding and excluding fields causes an error.

### populate

Set which fields should be populated for response documents.  See the Mongoose [population documentation](http://mongoosejs.com/docs/populate.html) for more information.  The string or object syntax can be used:

    GET /api/boats?populate=captain
    GET /api/cities?populate={ "path": "captain", "match": { "age": "44" } }

The `select` option of `populate` is disallowed.  Only paths deselected at the model level will be deselected in populate queries.

### count

May be set to true for GET requests to specify that a count should be returned instead of documents

    GET /api/stereos?count=true

### distinct

Set to a path name to retrieve an array of distinct values.

    GET /api/restaurants?distinct=category



this documentation is based on [baucis wiki](https://github.com/wprl/baucis/wiki/Query-String-Parameters)
