export type StringMap<T> = {[key: string]: T};

export interface OpenAPI3 {
  openapi: string;
  info: OpenAPI3.Info;
  servers?: OpenAPI3.Server[];
  paths?: OpenAPI3.Paths;
  components?: OpenAPI3.Components;
  security?: OpenAPI3.SecurityRequirement[];
  tags?: OpenAPI3.Tag[];
  externalDocs?: OpenAPI3.ExternalDocs;
}

export namespace OpenAPI3 {
  export interface Info {
    title: string;
    description?: string;
    termsOfService?: string;
    contact?: OpenAPI3.Contact;
    license?: OpenAPI3.License;
    version: string;
  }

  export interface Contact {
    name?: string;
    url?: string;
    email?: string;
  }

  export interface License {
    name: string;
    url?: string;
  }

  export interface Server {
    name: string;
    description?: string;
    variables?: StringMap<OpenAPI3.ServerVariable>;
  }

  export interface ServerVariable {
    enum?: string[];
    default: string;
    description?: string;
  }

  export interface Components {
    schemas?: StringMap<OpenAPI3.Schema | OpenAPI3.Reference>;
    responses?: StringMap<OpenAPI3.Response | OpenAPI3.Reference>;
    parameters?: StringMap<OpenAPI3.Parameter | OpenAPI3.Reference>;
    examples?: StringMap<OpenAPI3.Example | OpenAPI3.Reference>;
    requestBodies?: StringMap<OpenAPI3.RequestBody | OpenAPI3.Reference>;
    headers?: StringMap<OpenAPI3.Header | OpenAPI3.Reference>;
    securitySchemes?: StringMap<OpenAPI3.SecurityScheme | OpenAPI3.Reference>;
    links?: StringMap<OpenAPI3.Link | OpenAPI3.Reference>;
    callbacks?: StringMap<OpenAPI3.Callback | OpenAPI3.Reference>;
  }

  export interface Paths {
    [path: string]: OpenAPI3.Path; // path is like /{path}
  }

  export interface Path extends OpenAPI3.Reference {
    summary?: string;
    description?: string;
    get?: OpenAPI3.Operation;
    put?: OpenAPI3.Operation;
    post?: OpenAPI3.Operation;
    delete?: OpenAPI3.Operation;
    options?: OpenAPI3.Operation;
    head?: OpenAPI3.Operation;
    patch?: OpenAPI3.Operation;
    trace?: OpenAPI3.Operation;
    servers?: OpenAPI3.Server[];
    parameters?: (OpenAPI3.Parameter | OpenAPI3.Reference)[];
  }

  export interface Operation {
    tags?: string[];
    summary?: string;
    description?: string;
    externalDocs?: OpenAPI3.ExternalDocs;
    operationId?: string;
    parameters?: (OpenAPI3.Parameter | OpenAPI3.Reference)[];
    requestBody?: OpenAPI3.RequestBody | OpenAPI3.Reference;
    responses: OpenAPI3.Responses;
    callbacks?: StringMap<OpenAPI3.Callback | OpenAPI3.Reference>;
    deprecated?: boolean;
    security?: OpenAPI3.SecurityRequirement[];
    servers?: OpenAPI3.Server[];
  }

  export interface ExternalDocs {
    description?: string;
    url: string;
  }

  export interface Parameter {
    name: string;
    in: "query" | "header" | "path" | "cookie";
    description?: string;
    required?: boolean;
    deprecated?: boolean;
    allowEmptyValue?: boolean;

    style?: 'matrix' | 'label' | 'form' | 'simple' | 'spaceDelimited' | 'pipeDelimited' | 'deepObject';
    explode?: boolean;
    allowReserved?: boolean;
    schema?: OpenAPI3.Schema | OpenAPI3.Reference;
    example?: any;
    examples?: StringMap<OpenAPI3.Example | OpenAPI3.Reference>;

    content?: StringMap<OpenAPI3.MediaType>; // no support i think
  }

  export interface RequestBody {
    description?: string;
    content: StringMap<OpenAPI3.MediaType>;
    required?: boolean;
  }

  export interface MediaType {
    schema?: OpenAPI3.Schema | OpenAPI3.Reference;
    example?: any;
    examples?: StringMap<OpenAPI3.Example | OpenAPI3.Reference>;
    encoding?: StringMap<OpenAPI3.Encoding>;
  }

  export interface Encoding {
    contentType?: string;
    headers?: StringMap<OpenAPI3.Header | OpenAPI3.Reference>;
    style?: 'matrix' | 'label' | 'form' | 'simple' | 'spaceDelimited' | 'pipeDelimited' | 'deepObject';
    explode?: boolean;
    allowReserved?: boolean;
  }

  export interface Responses {
    default?: OpenAPI3.Response | OpenAPI3.Reference;
    [status: string]: OpenAPI3.Response | OpenAPI3.Reference; // 200, 20X, 2XX, etc.
  }

  export interface Response {
    description: string;
    headers?: StringMap<OpenAPI3.Header | OpenAPI3.Reference>
    content?: StringMap<OpenAPI3.MediaType>;
    links?: StringMap<OpenAPI3.Link | OpenAPI3.Reference>;
  }

  export interface Callback {
    [callbackKey: string]: OpenAPI3.Path;
  }

  export interface Example {
    summary?: string;
    description?: string;
    value?: any;
    externalValue?: string; // A URL that points to the literal example
  }

  export interface Link {
    operationRef?: string;
    operationId?: string;
    parameters?: StringMap<any>;
    requestBody?: any;
    description?: string;
    server?: OpenAPI3.Server;
  }

  export interface Header {
    description?: string;
    required?: boolean;
    deprecated?: boolean;
    allowEmptyValue?: boolean;

    style?: 'simple';
    explode?: boolean;
    allowReserved?: boolean;
    schema?: OpenAPI3.Schema;
    example?: any;
    examples?: StringMap<OpenAPI3.Example | OpenAPI3.Reference>;
  }

  export interface Tag {
    name: string;
    description?: string;
    externalDocs?: OpenAPI3.ExternalDocs;
  }

  export interface Reference {
    '$ref': string;
  }

  export interface Schema {
    title?: string;
    multipleOf?: number;
    maximum?: number;
    exclusiveMaximum?: number;
    minimum?: number;
    exclusiveMinimum?: number;
    maxLength?: number;
    minLength?: number;
    pattern?: string; // regexp
    maxItems?: number;
    minItems?: number;
    uniqueItems?: number;
    maxProperties?: number;
    minProperties?: number;
    required?: boolean;
    enum?: string[];

    type?: string; // - Value MUST be a string. Multiple types via an array are not supported.
    allOf?: (OpenAPI3.Schema | OpenAPI3.Reference)[]; // - Inline or referenced schema MUST be of a Schema Object and not a standard JSON Schema.
    oneOf?: (OpenAPI3.Schema | OpenAPI3.Reference)[]; // - Inline or referenced schema MUST be of a Schema Object and not a standard JSON Schema.
    anyOf?: (OpenAPI3.Schema | OpenAPI3.Reference)[]; // - Inline or referenced schema MUST be of a Schema Object and not a standard JSON Schema.
    not?: (OpenAPI3.Schema | OpenAPI3.Reference)[]; // - Inline or referenced schema MUST be of a Schema Object and not a standard JSON Schema.
    items?: OpenAPI3.Schema | OpenAPI3.Reference; // - Value MUST be an object and not an array. Inline or referenced schema MUST be of a Schema Object and not a standard JSON Schema. items MUST be present if the type is array.
    properties?: StringMap<OpenAPI3.Schema | OpenAPI3.Reference>; // - Property definitions MUST be a Schema Object and not a standard JSON Schema (inline or referenced).
    additionalProperties?: boolean | OpenAPI3.Schema | OpenAPI3.Reference; // - Value can be boolean or object. Inline or referenced schema MUST be of a Schema Object and not a standard JSON Schema.
    description?: string; // - CommonMark syntax MAY be used for rich text representation.
    format?: string; // - See Data Type Formats for further details. While relying on JSON Schema's defined formats, the OAS offers a few additional predefined formats.
    default?: any; //

    nullable?: boolean;
    discriminator?: OpenAPI3.Discriminator;
    readOnly?: boolean;
    writeOnly?: boolean;
    xml?: OpenAPI3.XML;
    externalDocs?: OpenAPI3.ExternalDocs;
    example?: any;
    deprecated?: boolean;
  }

  export interface Discriminator {
    propertyName: string;
    mapping?: StringMap<string>;
  }

  export interface XML {
    name?: string;
    namespace?: string;
    prefix?: string;
    attribute?: boolean;
    wrapped?: boolean;
  }

  export type SecurityScheme = {
    type: "apiKey";
    description?: string;
    name: string;
    in: "query" | "header" | "cookie";
  } | {
    type: "http";
    description?: string;
    scheme: 'basic' | 'bearer' | string;
    bearerFormat?: string;
  } | {
    type: "oauth2";
    description?: string;
    flows: OpenAPI3.OAuthFlows;
  } | {
    type: "openIdConnect";
    description?: string;
    openIdConnectUrl: string;
  };

  export interface OAuthFlows {
    implicit?: OpenAPI3.OAuthFlow;
    password?: OpenAPI3.OAuthFlow;
    clientCredentials?: OpenAPI3.OAuthFlow;
    authorizationCode?: OpenAPI3.OAuthFlow;
  }

  export interface OAuthFlow {
    authorizationUrl: string;
    tokenUrl: string;
    refreshUrl?: string;
    scopes: StringMap<string>; // A map between the scope name and a short description for it.
  }

  export interface SecurityRequirement {
    // If the security scheme is of type "oauth2" or "openIdConnect",
    // then the value is a list of scope names required for the execution.
    // For other security scheme types, the array MUST be empty.
    [securitySchemeName: string]: string[];
  }
}
