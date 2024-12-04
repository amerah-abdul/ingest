//modules
import { Readable } from 'node:stream';
import * as cookie from 'cookie';
//stackpress
import type { Method, UnknownNest } from '@stackpress/types/dist/types';
//common
import type { 
  Body,
  FetchServer,
  NodeRequest,
  NodeResponse,
  LoaderResults,
  CookieOptions
} from '../types';
import Route from '../Route';
import Request from '../Request';
import Response from '../Response';
import { 
  isHash,
  objectFromQuery,
  formDataToObject
} from '../helpers';
//local
import { 
  NativeResponse,
  fetchToURL,
  readableToReadableStream
} from './helpers';

export default class Adapter<C extends UnknownNest = UnknownNest> {
  /**
   * Server request handler
   */
  public static async plug<C extends UnknownNest = UnknownNest>(
    context: FetchServer<C>, 
    request: NodeRequest
  ) {
    const server = new Adapter(context, request);
    return server.plug();
  };

  //the parent server context
  protected _context: FetchServer<C>;
  //the native request
  protected _request: NodeRequest;

  /**
   * Sets up the server
   */
  constructor(context: FetchServer<C>, request: NodeRequest) {
    this._context = context;
    this._request = request;
  }

  /**
   * Handles the request
   */
  public async plug() {
    //initialize the request
    const req = this.request();
    const res = this.response();
    //determine event name
    const event = `${req.method} ${req.url.pathname}`;
    //load the body
    await req.load();
    //hook the plugins
    await Route.emit<C, NodeRequest, NodeResponse|undefined>(
      event, req, res
    );
    //if the response was not sent by now,
    if (!res.sent) {
      //send the response
      return res.dispatch();
    }
    return res.resource;
  }

  /**
   * Sets up the request
   */
  public request() {
    //set context
    const context = this._context;
    //set resource
    const resource = this._request;
    //set method
    const method = (this._request.method?.toUpperCase() || 'GET') as Method;
    //set the type
    const mimetype = this._request.headers.get('content-type') || 'text/plain';
    //set the headers
    const headers: Record<string, string|string[]> = {};
    this._request.headers.forEach((value, key) => {
      if (typeof value !== 'undefined') {
        headers[key] = value;
      }
    });
    //set session
    const session = cookie.parse(
      this._request.headers.get('cookie') as string || ''
    ) as Record<string, string>;
    //set url
    const url = fetchToURL(this._request);
    //set query
    const query = objectFromQuery(url.searchParams.toString());
    //setup the payload
    const request = new Request<NodeRequest, FetchServer<C>>({
      context,
      resource,
      headers,
      method,
      mimetype,
      query,
      session,
      url
    });
    request.loader = loader<C>(this._request);
    return request;
  }

  /**
   * Sets up the response
   */
  public response() {
    const response = new Response<NodeResponse|undefined>();
    response.dispatcher = dispatcher(
      this._context.config<CookieOptions>('cookie') || { path: '/' }
    );
    return response;
  }
};

/**
 * Request body loader
 */
export function loader<C extends UnknownNest = UnknownNest>(
  resource: NodeRequest
) {
  return async (req: Request<NodeRequest, FetchServer<C>>) => {
    //if the body is cached
    if (req.body !== null) {
      return undefined;
    }
    //TODO: limit the size of the body
    const body = await resource.text();
    const post = formDataToObject(req.type, body)

    return { body, post } as LoaderResults;
  } 
};

/**
 * Maps out an Ingest Response to a Fetch Response
 */
export function dispatcher(options: CookieOptions = { path: '/' }) {
  return async (res: Response<NodeResponse|undefined>) => {
    //fetch type responses dont start with a resource
    //so if it magically has a resource, then it must 
    //have been set in a route. So we can just return it.
    if (res.resource instanceof NativeResponse) {
      return res.resource;
    }
    let mimetype = res.mimetype;
    let body: Body|null = null;
    //if body is a valid response
    if (typeof res.body === 'string' 
      || Buffer.isBuffer(res.body) 
      || res.body instanceof Uint8Array
      || res.body instanceof ReadableStream
    ) {
      body = res.body;
    //if it's a node stream
    } else if (res.body instanceof Readable) {
      body = readableToReadableStream(res.body);
    //if body is an object or array
    } else if (isHash(res.body) || Array.isArray(res.body)) {
      res.mimetype = 'application/json';
      body = JSON.stringify({
        code: res.code,
        status: res.status,
        results: res.body,
        error: res.error,
        errors: res.errors.size > 0 ? res.errors.get() : undefined,
        total: res.total > 0 ? res.total : undefined
      });
    } else if (res.code && res.status) {
      res.mimetype = 'application/json';
      body = JSON.stringify({
        code: res.code,
        status: res.status,
        error: res.error,
        errors: res.errors.size > 0 ? res.errors.get() : undefined,
        stack: res.stack ? res.stack : undefined
      });
    }
    //create response
    const resource = new NativeResponse(body, {
      status: res.code,
      statusText: res.status
    });
    //write cookies
    for (const [name, entry] of res.session.revisions.entries()) {
      if (entry.action === 'remove') {
        resource.headers.set(
          'Set-Cookie', 
          cookie.serialize(name, '', { ...options, expires: new Date(0) })
        );
      } else if (entry.action === 'set' 
        && typeof entry.value !== 'undefined'
      ) {
        const { value } = entry;
        const values = Array.isArray(value) ? value : [ value ];
        for (const value of values) {
          resource.headers.set(
            'Set-Cookie', 
            cookie.serialize(name, value, options)
          );
        }
      }
    }
    //write headers
    for (const [ name, value ] of res.headers.entries()) {
      const values = Array.isArray(value) ? value : [ value ];
      for (const value of values) {
        resource.headers.set(name, value);
      }
    }
    //set content type
    if (mimetype) {
      resource.headers.set('Content-Type', mimetype);
    }
    return resource;
  };
};