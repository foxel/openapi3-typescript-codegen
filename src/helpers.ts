import { Handlebars } from 'handlebars';
import * as Case from 'case';

Handlebars.registerHelper('schemaToInterface', (ref, options) => {
  return Case.camel(ref);
});
