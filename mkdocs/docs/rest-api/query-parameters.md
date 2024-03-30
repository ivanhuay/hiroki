# Query Parameters List

Use query options from the client to make dynamic requests.  Query options can be mixed as you see fit.

### conditions

The Mongoose query's `find` or `remove` arguments can be customized to take full advantage of the MongoDB query syntax. This allows you to use geolocation, regular expressions, and full text search. Special query operators are supported, and your API clients have access to geolocation, regular expression, and full text search capabilities by default!

    GET /api/people?conditions={ "location": { "$near": [44, -97] } }
    GET /api/people?conditions={ "$text": { "$search": "dog bites man" } }
    GET /api/cats?sort=-name&limit=1&conditions={ "features": "stripes" }
    DELETE /api/people?conditions={ "name": { "$regex": "^Bob W", "$options": "i" } }

### Skip

Use the `skip` query option to exclude the first *n* matched documents from the response. This is commonly used for implementing pagination functionality.

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
```
    GET /api/phones?select=-_id -year
```
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


# Requests

## Update using PUT
to update documents there are two options using PUT request.

* PUT /api/:collection/:id
* PUT /api/:collection?conditions[example]=true
and Body object

it can be updated using the id as a parameter or by sending the conditions object. In both cases, only one document is updated

#### Example:
```
PUT /api/books?conditions={"title":"El juguete rabioso"}
PUT /api/books/5c5303574ffead2c606d773b

#Body:
{
    author: 'Roberto Arlt'
}
```

## Delete document
it is possible to delete a document using a request DELETE with the id as a parameter

```
DELETE /api/books/5c5303574ffead2c606d773b
```


# Update documents

For make an update we use the `PUT` method

## Basic Put Request
This request will update a particular document
```
PUT /api/books/:id
Body:
{
  title: 'new title',
  tags: ['new tags']
}
```
## Update Using conditions
Also you can update documents using a `condition` filter as a query param.

```
PUT /api/books/?conditions={"tag":"asd"}
Body:
{
  title: 'new title',
  tags: ['new tags']
}
```
This will update all documents that satisfy the conditions filter.

## The $pull and $push param
You can these params for append or remove an element from an array.
```
PUT /api/books/?conditions={"tag":"asd"}
Body:
{
  title: 'new title',
  tags: {$push:['new tags']}
}
```
this will add the new tag to the previous list of tags.

if you want to remove an element from an array you can use the $pull param.
```
PUT /api/books/?conditions={"tag":"asd"}
Body:
{
  title: 'new title',
  tags: {$pull:['asd']}
}
```
this will remove the `asd` tag from the existing list.

