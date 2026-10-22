import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { server } from './server.mjs';
let base;
before(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;});
after(()=>new Promise(resolve=>server.close(resolve)));
test('home and every catalog subject are served with subject-specific content',async()=>{
  const home=await fetch(base);assert.equal(home.status,200);assert.match(await home.text(),/과목 목록/);
  const catalog=await (await fetch(base+'/subjects.json')).json();assert.equal(catalog[0].id,'unity');
  assert.ok(catalog.some(s=>s.id==='computer-vision'));
  for(const subject of catalog){const response=await fetch(base+subject.href);assert.equal(response.status,200);const html=await response.text();
    if(subject.id==='unity'){assert.match(html,/using UnityEngine.InputSystem;/);assert.doesNotMatch(html,/Input Manager|GetKeyDown|오류·혼동 바로잡기/);}
    if(subject.id==='computer-vision'){assert.match(html,/197개/);assert.match(html,/Precision/);assert.match(html,/MAE/);assert.match(html,/id="patch-output"/);}
  }
});
test('only public files and safe methods are served',async()=>{
  for(const p of ['/server.mjs','/package.json','/.git/config','/%2e%2e%5cpackage.json','/missing'])assert.equal((await fetch(base+p)).status,404);
  assert.equal((await fetch(base,{method:'POST'})).status,405);
  assert.equal((await fetch(base+'/%xx')).status,400);
});
test('directory redirects and HEAD are supported',async()=>{
  const r=await fetch(base+'/subjects/unity',{redirect:'manual'});assert.equal(r.status,308);assert.equal(r.headers.get('location'),'/subjects/unity/');
  const h=await fetch(base+'/subjects/unity/',{method:'HEAD'});assert.equal(h.status,200);assert.equal(await h.text(),'');
});
