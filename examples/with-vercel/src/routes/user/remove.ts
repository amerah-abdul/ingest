import { Request, Response } from '@stackpress/ingest';

export default function UserRemove(req: Request, res: Response) {
  //get params
  const ctx = req.fromRoute('/user/:id');
  const id = parseInt(ctx.params.get('id') || '');
  if (!id) {
    return res.setError('ID is required');
  }
  //maybe get from database?
  const results = { 
    id: 1, 
    name: 'John Doe', 
    age: 21, 
    created: new Date().toISOString() 
  };
  //send the response
  res.setResults(results);
};