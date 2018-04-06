import { Codegen } from './codegen';
import * as path from 'path';
import readYaml = require('read-yaml');

readYaml(path.join(__dirname, '../example/petstore.yaml'), (err, data) => {
  if (err) {
    process.stdout.write(`error ${err}`);
    return;
  }

  const generator = new Codegen(
    path.join(__dirname, '../templates/typescript'),
    path.join(__dirname, '../out'),
  );


  generator.generate(data);
});

