import Handlebars = require('handlebars');
import Case = require('case');
import fs = require('fs');
import path = require('path');
import mkdirp = require('mkdirp');
import { OpenAPI3 } from './schema';

const files = [
  'schemas.ts',
  'angular/client.ts',
  'angular/client.module.ts',
];

export class Codegen {
  private engine = Handlebars.create();

  constructor(
    private templatesPath: string,
    private outputPath: string,
  ) {
    this.engine.registerHelper('schemaRefToTypeName', (ref: string, _options) => {
      const [lastPart] = ref.split('/').reverse();
      return Case.pascal(lastPart);
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
      return Array.isArray(value1) && value1.indexOf(value2) >= 0;
    });

    this.engine.registerHelper('successResponses', (value: OpenAPI3.Responses, _options): OpenAPI3.Responses => {
      const out: OpenAPI3.Responses = {};
      Object.keys(value).filter(_ => !_.match(/^([45][\dX]{2}|default)$/)).forEach(key => {
        out[key] = value[key];
      });
      return out;
    });

    this.engine.registerHelper('switch', function(value, options) {
      const context = {...this};
      context.__switch_value__ = value;
      context.__switch_triggered__ = false;
      let html = options.fn(context); // Process the body of the switch block
      if (!context.__switch_triggered__) {
        html = options.inverse(this);
      }
      return html;
    });

    this.engine.registerHelper('case', function(...values) {
      const options = values.pop();

      if (values.indexOf(this.__switch_value__) >= 0) {
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
          return options.fn(value[key], {data: {...options.data, key}}); // @TODO: dunno how to do it right
        } else {
          return options.inverse(this);
        }
      } else {
        return options.inverse(this);
      }
    });

    this.engine.registerHelper('coalesce', function<T>(...values: T[]): T {
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

      // here is the dirty one ))
      if (value && value.hasOwnProperty('$ref')) {
        const refString: string = value['$ref'];
        if (refString.match(/^#(\/\w+)+$/)) {
          const [_, ...ref] = refString.split('/');
          return recursor(ref, root);
        }
      } else if (typeof value === 'string' && String(value).match(/^#(\/\w+)+$/)) {
        const [_, ...ref] = String(value).split('/');
        return recursor(ref, root);
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
