import Handlebars = require('handlebars');
import Case = require('case');
import fs = require('fs');
import path = require('path');
import mkdirp = require('mkdirp');
import { OpenAPI3 } from './schema';

const files = [
  'schemas.ts',
  'angular/client.ts',
];

export class Codegen {
  private engine = Handlebars.create();

  constructor(
    private templatesPath: string,
    private outputPath: string,
  ) {
    this.engine.registerHelper('schemaRefToTypeName', (ref: string, _options) => {
      const [lastPart] = ref.split('/').reverse();
      return Case.camel(lastPart);
    });

    this.engine.registerHelper('valueName', (value: string, _options) => {
      return Case.camel(value);
    });

    this.engine.registerHelper('className', (value: string, _options) => {
      return Case.pascal(value);
    });

    this.engine.registerHelper('concat', (...values: string[]) => {
      const options = values.pop();

      return values.join('');
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

    this.engine.registerHelper('successResponses', (value: OpenAPI3.Responses, _options): OpenAPI3.Responses => {
      const out: OpenAPI3.Responses = {};
      Object.keys(value).filter(_ => !_.match(/^([45][\dX]{2}|default)$/)).forEach(key => {
        out[key] = value[key];
      });
      return out;
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

    this.engine.registerHelper('first', function(value: any[] | any, options): typeof value {
      if (Array.isArray(value)) {
        return value.length
          ? options.fn(value[0])
          : options.inverse(this);
      } else if (value) {
        const key = Object.keys(value)[0];
        if (key) {
          return options.fn(value[key], {data: {key}});
        } else {
          return options.inverse(this);
        }
      } else {
        return options.inverse(this);
      }
    });

    this.engine.registerHelper('coalesce', function(...values) {
      const options = values.pop();

      return values.find(_ => !!_);
    });

    this.engine.registerHelper('deref', function<T>(value: T | OpenAPI3.Reference, root: any, _options): T {
      const recursor = function(ref: string[], obj: any) {
        const [key, ...rest] = ref;
        const value = obj[key];
        if (rest.length && value) {
          return recursor(rest, value);
        }
        return value;
      };

      if (value && value.hasOwnProperty('$ref')) {
        const refString: string = value['$ref'];
        if (refString.match(/^#(\/\w+)+$/)) {
          const [_, ...ref] = refString.split('/');
          return recursor(ref, root);
        }
      } else {
        return <T> value;
      }
    });

    this.engine.registerPartial(
      'schema',
      fs.readFileSync(path.join(this.templatesPath, 'schema.partial.handlebars')).toString()
    );
  }

  generate(data: OpenAPI3): Promise<void> {
    return Promise.all(files.map(_ => this._generateFile(_, data))).then(_ => {});
  }

  private _generateFile(fileName: string, data: any): Promise<void> {
    const inPath = path.join(this.templatesPath, `${fileName}.handlebars`);
    const outPath = path.join(this.outputPath, fileName);
    return when(cb => mkdirp(path.dirname(outPath), cb))
      .then(() => when<Buffer>(cb => fs.readFile(inPath, cb)))
      .then(buf => {
        const generated = this.engine.compile(
          // fs.readFileSync(`${this.templatesPath}/typescript/interfaces.ts.handlebars`).toString(),
          buf.toString(),
          { noEscape: true },
        )(data);

        return when<void>(cb => fs.writeFile(outPath, generated, cb))
      })
  }
}

function when<T>(unit: (cb: ((err: Error, res?: T) => void)) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    unit((err: Error, res: T) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}
