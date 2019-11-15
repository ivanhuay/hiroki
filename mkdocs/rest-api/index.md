# Rest Api methods

## GET
get list of resources or a particular resource using filter or ids.

### Basic request:

* Basic
```
GET /api/books
```
Response:
```json
[
  {
    "id":"5d234073a00ebf1921a9225a",
    "title":"Example",
    "createdAt" : ISODate("2019-07-08T13:09:07.346Z"),
	   "updatedAt" : ISODate("2019-07-08T18:26:01.800Z"),
  },
  {
    "id":"5d234073a00ebf1921a9225b",
    "title":"Example 2",
    "createdAt" : ISODate("2019-07-08T13:02:07.346Z"),
     "updatedAt" : ISODate("2019-07-08T18:28:01.800Z"),
  },
  ...
]
```
* By Id
```json
{
  "id":"5d234073a00ebf1921a9225a",
  "title":"Example",
  "createdAt" : ISODate("2019-07-08T13:09:07.346Z"),
   "updatedAt" : ISODate("2019-07-08T18:26:01.800Z"),
}
```

### Query filtering:

#### Conditions

`Consitions` paramer is like mongoose `find` parameter but you always should use the stringified version.

* Basic Example
```
    GET /api/books?conditions={ "title": "Example1" }
```
* Using mongoose `$near`
```
    GET /api/people?conditions={ "location": { "$near": [44, -97] } }
```
* Using mongoose `$search`
```
    GET /api/people?conditions={ "$text": { "$search": "dog bites man" } }
```

#### Skip

Same as mongoose `skip`

```
    GET /api/horses?skip=3
```
returns only 3 documents.

#### Limit

Same as mongoose `limit`.

    GET /api/horses?limit=3

#### Sort

Similar to mongoose `sort`.

this example sort by name / decreasing age
```
    GET /api/cheeses?sort=name -age
```

#### Select

Similar to mongoose `select`. It is a string space separated. Also you can use `-[String]` to not select some field.

* Basic Example
```
    GET /api/phones?select=name
```
* Negative select
```
    GET /api/phones?select=-_id -year
```
this show all the document except `_id` & `year`.

#### Populate
Same as mongoose populate.

* Basic Example:
```
    GET /api/boats?populate=captain
```
* Using match
```
    GET /api/cities?populate={ "path": "captain", "match": { "age": "44" } }
```

*The `select` option of `populated` documents is disallowed.*

#### Count

Same as mongoose `count`.

* Basic:
```
    GET /api/stereos?count=true
```
* Using conditions:
```
    GET /api/stereos?count=true&conditions={"age":{"$gt":2}}
```

#### Distinct

Same as mongoose `distinct`:
```
    GET /api/restaurants?distinct=category
```

[Detailed version of this document.](./rest-api)

## POST
this option is to create documents.

* Basic:
```
POST /api/birds
body:
{
  "name": "poli",
  "age":3
}
```

No mistery here. If the document is created you will receive a 200 status with the document.



## PUT
Updating documents.

### Basic:
This request will update a particular document.
```
PUT /api/books/:id
Body:
{
  title: 'new title',
  tags: ['new tags']
}
```
### Update with conditions:
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

### The `$pull` and `$push` param:
Append or remove an element from an array.

* $push:
```
PUT /api/books/?conditions={"tag":"asd"}
Body:
{
  title: 'new title',
  tags: {$push:['new tags']}
}
```
This will add the new tag to the previous list of tags.

* $pull:
if you want to remove an element from an array you can use the `$pull` param.
```
PUT /api/books/?conditions={"tag":"asd"}
Body:
{
  title: 'new title',
  tags: {$pull:['asd']}
}
```
This will remove the `asd` tag from the existing list.

## DELETE
**DANGER HERE**

It's possible to delete a document using a request DELETE with the id as a parameter.

```
DELETE /api/books/5c5303574ffead2c606d773b
```

Response: status 200 & deleted document.

Personally i recommend use decorators to validate all delete request.
