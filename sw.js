/* IT Geek Academy service worker: offline-first. Bump VERSION when index.html changes. */
const VERSION='geek-v4-11';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'].concat(['reader','scientist','traveller','pilot','astronaut','doctor','cricketer','chef'].map(n=>'./assets/rudraksh/'+n+'.webp'));
const EXT='geek-ext-v1';
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VERSION).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>null)))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION&&k!==EXT).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
/* fonts are cached the first time they load; YouTube is never touched */
const FONT_HOSTS=['fonts.googleapis.com','fonts.gstatic.com'];
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin===location.origin){
    e.respondWith(caches.open(VERSION).then(async c=>{
      const hit=await c.match(r,{ignoreSearch:true});
      const net=fetch(r).then(res=>{if(res&&res.ok&&res.type==='basic')c.put(r,res.clone());return res;}).catch(()=>null);
      if(hit){e.waitUntil(net);return hit;}                         /* cache first, refresh in background */
      const res=await net;if(res)return res;
      if(r.mode==='navigate'){const idx=await c.match('./index.html')||await c.match('./');if(idx)return idx;}
      return new Response('Offline',{status:503,statusText:'Offline'});
    }));
    return;
  }
  if(FONT_HOSTS.indexOf(u.hostname)>=0){
    e.respondWith(caches.open(EXT).then(async c=>{
      const hit=await c.match(r);
      const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone());return res;}).catch(()=>null);
      return hit||(await net)||new Response('',{status:504});
    }));
  }
});
