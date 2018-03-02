# Example Plugin

Plugins for MBEE are quite simple: The MBEE server looks in the `plugins` 
directory for plugins. It assumes each directory inside the `plugins` directory
is a plugin and should contain an `index.js` file. The MBEE server will try
to import this as a module.

The module (i.e. the index.js file) should export a single object containing
an Express Router object. 
See [http://expressjs.com/en/guide/routing.html#express-router](http://expressjs.com/en/guide/routing.html#express-router)
for more detail on Express Routers.

Each plugin is namespaced based on the name of the directory it is in (which
is also the module name). So all routes defined in the plugin `example` will
be found at `http://<my-mbee-server-url>/plugins/example/`.
