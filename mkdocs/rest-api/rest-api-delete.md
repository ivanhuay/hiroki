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
