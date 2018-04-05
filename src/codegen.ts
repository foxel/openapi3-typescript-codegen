import Handlebars = require('handlebars');
import Case = require('case');
import fs = require('fs');
import { OpenAPI3 } from './schema';

export class Codegen {
  private engine = Handlebars.create();

  constructor(
    private templatesPath: string,
  ) {
    this.engine.registerHelper('schemaToTypeName', (ref: string, _options) => {
      const [lastPart] = ref.split('/').reverse();
      return Case.camel(lastPart);
    });

    this.engine.registerHelper('value', (value: string, type: string = 'string', _options) => {
      switch (type) {
        case 'string':
          return JSON.stringify(String(value));
        default:
          return String(value);
      }
    });

    this.engine.registerHelper('eq?', (value1: string, value2: string, _options) => {
      return value1 === value2;
    });

    this.engine.registerHelper('in?', (value1: string[], value2: string, _options) => {
      return value1.includes(value2);
    });

    this.engine.registerHelper('switch', function(value, options) {
      this.__switch_value__ = value;
      this.__switch_triggered__ = false;
      let html = options.fn(this); // Process the body of the switch block
      if (!this.__switch_triggered__) {
        html = options.inverse(this);
      }
      delete this.__switch_value__;
      delete this.__switch_triggered__;
      return html;
    });

    this.engine.registerHelper('case', function(...values) {
      const options = values.pop();

      if (values.includes(this.__switch_value__)) {
        this.__switch_triggered__ = true;
        return options.fn(this);
      }
    });

    this.engine.registerPartial('schema', fs.readFileSync(`${this.templatesPath}/typescript/schema.partial.handlebars`).toString());
  }

  generate(data: OpenAPI3) {
    return this.engine.compile(
      fs.readFileSync(`${this.templatesPath}/typescript/interfaces.ts.handlebars`).toString(),
    )(data);
  }
}
