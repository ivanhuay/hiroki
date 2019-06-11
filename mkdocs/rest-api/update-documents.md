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
