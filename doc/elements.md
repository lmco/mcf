# Elements

Elements are the core of the system model and therefore the core of MBEE.


## Element Schema

Mongoose discriminators are used to provide a sort of schema inheritance
capability for elements. This allows us to define different types of elements.

The base schema for elements is the *Element*. It defines all the common things
about an element such as an ID, name, documentation, tags, etc.

A *block* is our first element discriminator. For now, blocks don't add anything
to the schema. However, creating a block creates an element of *type* 'Block'.

A *relationship* is an element discriminator that adds *source* and *target*
fields to the element and is used to represent a link between two elements.

A *package* is an element discriminator that adds a *contains* field to
represent the model hierarchy. In other words, packages can contain other
elements.
