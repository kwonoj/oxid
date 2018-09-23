import * as debug from 'debug';

const getDebug = (identifier: string) => debug(`oxid:${identifier}`);

export { getDebug };
