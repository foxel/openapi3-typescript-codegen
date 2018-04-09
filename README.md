# openapi3-typescript-codegen

TypeScript code generator for OpenAPI 3.0.0

Inspired by problems with [openapi-codegen](https://github.com/Mermade/openapi-codegen)

Idea is to provide native OpenAPI 3 generator with all language-specific code being put into templates with help of generic helpers.

Currently only TypeScript language and Angular frameworks are supported.

**Work in progress**

## Usage

### Installing

`npm i -g openapi3-typescript-codegen`

### CLI

```
op3-codegen {openapi-definition.yaml} [options]

Options:
  -o, --output     Specify output directory         [string] [default: "./out/"]
  -t, --templates  Specify templates directory (pro only)               [string]
```

## Limitations in OpenAPI support (to be removed)

* support only for 'http' ('basic' and 'bearer') and 'apiKey' Security schemas,
* parameters encoder supports only style='form',explode=false encoding scheme,
* only GET, POST, PUT, DELETE operations code is generated 
