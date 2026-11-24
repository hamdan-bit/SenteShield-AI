import test from 'node:test';
import assert from 'node:assert/strict';
import checkLink from '../api/check-link.js';
function req(body,method='POST'){
 return {method,headers:{'content-type':'application/json','x-forwarded-for':'203.0.113.'+(Math.floor(Math.random()*200)+1)},body};
}
function res(){return {statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;return this;},status(n){this.statusCode=n;return this;},json(value){this.body=value;return this;}};}
test('Vercel link endpoint returns plain structured assessment with no raw URL',async()=>{
 const response=res(); await checkLink(req({link:'https://sample.example/ref?code=HELLO',context:'Join today; deposit UGX 50,000 to earn money'}),response);
 assert.equal(response.statusCode,200);assert.ok(response.body.result.signals.length);
 assert.ok(!JSON.stringify(response.body).includes('HELLO'));
});
test('Vercel link endpoint validates HTTP method and missing URL',async()=>{
 const r1=res();await checkLink(req({},'GET'),r1);assert.equal(r1.statusCode,405);
 const r2=res();await checkLink(req({link:'not a link'}),r2);assert.equal(r2.statusCode,400);
});
