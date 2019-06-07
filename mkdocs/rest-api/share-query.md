# Share query
This feature is available since v0.2.0

now we have a new path `/api/share/:shareCondition`.

`:shareCondition` is a stringify object with this format:
```
{
    modelName:{ params }
}
```

the `params` object is like the tradicional params.

`params`:
```
{
  limit: ...
  select: ...
  count: ...
  skip: ...
  conditions: ...
}
```
now instead of query params is an object.

you can check details [here](../rest-api)


### Example Share query

`GET '/api/share/{"books":{},"users":{"conditions":{"_id":"5c01997482c8985ad9a7eb5c"}}}'`

#### Response
```
{
  users:
   [ { role: [],
       books: [],
       _id: '5c01997482c8985ad9a7eb5b',
       name: 'test user',
       email: 'test@lts.com',
       __v: 0 } ],
  books:
   [ { tag: [Array],
       _id: '5cfa87a6615ab0eb6fed5cf6',
       title: 'first book',
       tagCount: 1,
       __v: 0 } ]
}
```
