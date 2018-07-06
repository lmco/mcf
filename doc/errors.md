# Errors

For the sake of better error logs and easier debugging, a specified error
format has been created. The details of this and some examples are below.


### Format

Currently, all errors from the controllers are being returned as JSON object,
consisting of a status, message and description. The status is the standard
HTML status code, such as 404 or 500. The message is the string associated with
the status code, like 'Not Found' for 404 or 'Internal Server Error' for 500. The
description is a custom error message which is specified by the developer. This
is used for better debugging and logging.

Here is an example error response that might get returned from a controller:

```javascript
{
    status: 404,
    message: 'Not Found',
    description: 'No organization found.'
}
```

### User Viewpoint

Right now, the decision has been made to return this entire object to the user.
It allows them to see what the issue was so that they may fix it. For some messages,
we return a 500 status and default description, as we do not want the user knowing
what the true error was. In many cases, the default response is as simple as
'Save Failed' or 'Request Failed'.


### Returning an Error

Below is some example code of how to return an error to the API, and then how to return
that error to the user.


```javascript
// In the controller
const errorData = JSON.stringify({ status: 404, message: 'Not Found', description: 'No organization found.' });
const error = new Error(errorData);
return reject(error);
```

The above code was done in 3 lines to better show the format, but it is done most places in the code
in only a single line

```javascript
// In the API Controller
// This is returned to the user

.catch((error) => {
  const err = JSON.parse(error.message);
  M.log.error(err.description);
  return res.status(err.status).send(err);
});
```


### Status Codes

Here is a list of different HTML status codes used in the system. There are many more codes
used on the web; if you don't find what you need below, check out [this link](https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html)
for more ideas.

| Code | Message               | Description                                            |
| ---- | --------------------- | ------------------------------------------------------ |
| 200  | OK                    | Everthing worked properly                              |
| 400  | Bad Request           | Improper syntax or missing parameters                  |
| 401  | Unauthorized          | The user does not have proper permissions              |
| 404  | Not Found             | Some data searched for was not found                   |
| 500  | Internal Server Error | Something went wrong on the server side                |
| 501  | Not Implemented       | The specific API endpoint has not yet been implemented |

*If you choose to use an additional HTML status code, please update this list above.*
