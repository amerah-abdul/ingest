import { task } from '@stackpress/ingest/dist/helpers';

export default task(function UserDetail(req, res) {
  //get params
  const ctx = req.ctxFromRoute('/user/:id');
  const id = parseInt(ctx.params.get('id') || '');
  if (!id) {
    return res.setError('ID is required');
  }
  //maybe get from database?
  const results = { 
    id: id, 
    name: 'John Doe', 
    age: 21, 
    created: new Date().toISOString() 
  };
  //send the response
  res.setResults(results);
});