import Handlebars = require('handlebars');
import Case = require('case');
import fs = require('fs');
import path = require('path');
import mkdirp = require('mkdirp');
import { OpenAPI3 } from './schema';

export interface Options {
  generateEnums?: boolean;
}

export class Codegen {
  private engine = Handlebars.create();

  constructor(
    private templatesPath: string,
    private outputPath: string,
    private options: Options = {},
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

    this.engine.registerHelper('concat', (...values) => {
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

    this.engine.registerHelper('and?', (...values) => {
      const options = values.pop();

      return values.length && values.reduce((acc, value) => acc && value, true);
    });

    this.engine.registerHelper('or?', (...values) => {
      const options = values.pop();

      return values.reduce((acc, value) => acc || value, false);
    });

    this.engine.registerHelper('eq?', (value1: string, value2: string, _options) => {
      return value1 === value2;
    });

    this.engine.registerHelper('in?', (value1: string[], value2: string, _options) => {
      return Array.isArray(value1) && value1.indexOf(value2) >= 0;
    });

    this.engine.registerHelper('contains?', (value1: string, value2: string, _options) => {
      return value1.indexOf(value2) >= 0;
    });

    this.engine.registerHelper('successResponses', (value: OpenAPI3.Responses, _options): OpenAPI3.Responses => {
      const out: OpenAPI3.Responses = {};
      Object.keys(value).filter(_ => !_.match(/^([45][\dX]{2}|default)$/)).forEach(key => {
        out[key] = value[key];
      });
      return out;
    });

    this.engine.registerHelper('switch', function(value, options) {
      const data = {...options.data};
      data.__switch_value__ = value;
      data.__switch_triggered__ = false;
      options.fn(this, {data}); // Process the body of the switch block
      if (data.__switch_triggered__) {
        return data.__case_value__;
      } else {
        return options.inverse(this);
      }
    });

    this.engine.registerHelper('case', function(...values) {
      const options = values.pop();
      const data = options.data || {};

      if (values.indexOf(data.__switch_value__) >= 0) {
        data.__switch_triggered__ = true;
        data.__case_value__ = options.fn(this, {data: {...options.data}});
        return '';
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

    fs.readdirSync(this.templatesPath)
      .filter(_ => !!_.match(/\.partial\.handlebars$/))
      .map(fileName => {
        const templateName = fileName.match(/(\w+)\.partial\.handlebars$/)[1];
        this.engine.registerPartial(
          templateName,
          fs.readFileSync(path.join(this.templatesPath, fileName)).toString()
        );
      })
  }

  generate(data: OpenAPI3): Promise<void> {
    return Promise.all(findTemplateFiles(this.templatesPath).map(_ => {
      return this._generateFile(_, data);
    })).then(_ => {});
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
        )({...data, ...this.options});

        return when<void>(cb => fs.writeFile(outPath, generated, cb))
          .then(() => {
            console.log(`${outPath} generated`);
          });
      })
  }
}

function findTemplateFiles(dir): string[] {
  const res = [];
  fs.readdirSync(dir)
    .filter(_ => !_.match(/\.partial\.handlebars$/))
    .forEach(fileName => {
      const fullPath = path.join(dir, fileName);
      if (fs.statSync(fullPath).isDirectory()) {
        res.push(... findTemplateFiles(fullPath).map(_ => path.join(fileName, _)));
      } else if (fileName.match(/\.handlebars$/)) {
        res.push(fileName.replace(/\.handlebars$/, ''));
      }
    });

  return res;
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
