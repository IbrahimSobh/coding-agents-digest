// "This week at a glance": the tools on a ring, each with its releases of the last 7 days in a halo above it.
// The data comes from the #wkData block (counted by _includes/week-map.html, in the same window as the 7-day grid).
// Drag left or right to turn the scene; hover a tool or a release to preview it; click one to open a panel beside
// it; click a release again to jump to the update that explains it (assets/jump.js), or, when no update does,
// to open the release on GitHub. Plain canvas, no library. It draws only while the card is on screen, and only
// when something changes. Without this script the card is a plain list of the tools and their releases.
(function(){
  var sec=document.getElementById('wk'), dataEl=document.getElementById('wkData');
  var box=document.getElementById('wkCv'), cv=document.getElementById('wkC'), tip=document.getElementById('wkTip'), side=document.getElementById('wkSide'), resetBtn=document.getElementById('wkReset');
  if(!sec||!dataEl||!cv||!cv.getContext) return;
  var ctx=cv.getContext('2d'), DATA=JSON.parse(dataEl.textContent);
  var reduce=matchMedia('(prefers-reduced-motion: reduce)'), FONT='"Schibsted Grotesk",system-ui,-apple-system,"Segoe UI",sans-serif';
  var MAXDOTS=8;

  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function day(d){return new Date(d+'T12:00:00Z').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',timeZone:'UTC'})}
  function when(a){return new Date(a.slice(0,10)+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'})+', '+a.slice(11,16)}
  function ver(t){return (t.match(/\d+/g)||[]).map(Number)}
  function cmpTag(a,b){var x=ver(a),y=ver(b);for(var i=0;i<Math.max(x.length,y.length);i++){var d=(x[i]||0)-(y[i]||0); if(d) return d} return 0}
  function css(v){return getComputedStyle(document.documentElement).getPropertyValue(v).trim()}
  function rgba(hex,a){var n=parseInt(hex.slice(1),16);return 'rgba('+(n>>16)+','+(n>>8&255)+','+(n&255)+','+a+')'}
  // a glass bubble: see-through colored shell, a crescent of light, a thin rim
  function glass(x,y,r,col,solid){
    var g=ctx.createRadialGradient(x,y+r*.15,r*.35,x,y,r);
    g.addColorStop(0,rgba(col,solid?.5:.18)); g.addColorStop(.75,rgba(col,solid?.85:.5)); g.addColorStop(1,rgba(col,.95));
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill();
    var lw=Math.max(1,r*.05); ctx.strokeStyle=col; ctx.lineWidth=lw; ctx.beginPath(); ctx.arc(x,y,r-lw/2,0,7); ctx.stroke();
    ctx.lineCap='round'; ctx.strokeStyle='rgba(255,255,255,.8)'; ctx.lineWidth=Math.max(1.4,r*.09);
    ctx.beginPath(); ctx.arc(x,y,r*.82,Math.PI*1.12,Math.PI*1.62); ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.35)'; ctx.lineWidth=Math.max(1,r*.05);
    ctx.beginPath(); ctx.arc(x,y,r*.82,Math.PI*.1,Math.PI*.3); ctx.stroke();
  }
  function rgba(hex,a){var c=hex.replace('#','');return 'rgba('+parseInt(c.substr(0,2),16)+','+parseInt(c.substr(2,2),16)+','+parseInt(c.substr(4,2),16)+','+a+')'}
  function J(){return window.cadJump||null}
  function releaseUrl(tool,tag){return 'https://github.com/'+tool.repo+'/releases/tag/'+encodeURIComponent(tag)}

  // The one-line summary of a release is the bold lead of the bullet that first linked it in Daily updates
  var titles={};
  function titleOf(tag){
    if(tag in titles) return titles[tag];
    var t='', at=J()&&J().firstAt(tag), run=at&&document.getElementById('run-'+at.replace(/[-:T]/g,''));
    if(run){
      var link=[].slice.call(run.querySelectorAll('a[href*="releases/tag/"]')).filter(function(a){
        return decodeURIComponent(a.getAttribute('href').split('releases/tag/')[1].replace(/[\/?#].*$/,''))===tag})[0];
      var li=link&&link.closest('li'), b=li&&li.querySelector('strong,b');
      if(b) t=b.textContent.replace(/^⚠️\s*/,'').trim();
    }
    return titles[tag]=t;
  }

  // ---- scene: tools on a ring, each tool's releases in a halo that always faces the reader ----
  var tools=DATA.tools, R=190, NS=1; // R = the ring's radius, NS = how much larger the nodes are drawn (on narrow screens)
  var rels=DATA.releases.slice().sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:cmpTag(a.tag,b.tag)});
  var toolN=tools.map(function(t,i){
    var a=-Math.PI/2+i*2*Math.PI/tools.length, mine=rels.filter(function(r){return r.tool===t.id});
    var img=new Image(); img.onload=function(){draw()}; img.src=t.logo;
    return {t:t,i:i,ang:a,x:Math.cos(a)*R,z:Math.sin(a)*R,n:mine.length,r:20+mine.length*1.6,img:img,rels:[],all:mine,sx:0,sy:0,sr:0};
  });
  var toolBy={}; toolN.forEach(function(n){toolBy[n.t.id]=n});
  var dots=[];
  toolN.forEach(function(tn){
    var shown=tn.all.length>MAXDOTS?MAXDOTS:tn.all.length;
    for(var i=0;i<shown;i++){
      var big=tn.all.length>MAXDOTS, more=big&&i===MAXDOTS-1, r=big?(more?tn.all[0]:tn.all[tn.all.length-(MAXDOTS-1)+i]):tn.all[i]; // with many releases the dots are the newest ones, and the +N dot stands for the older ones
      var ring=i<5?0:1, idx=ring?i-5:i, cnt=ring?shown-5:Math.min(shown,5);
      var step=cnt>1?Math.min(34,150/(cnt-1))*Math.PI/180:0;
      var d={r:r,tn:tn,id:r.tool+'|'+r.tag,more:more,extra:tn.all.length-(MAXDOTS-1),a:-Math.PI/2+(idx-(cnt-1)/2)*step,ring:ring,rad:r.action?9.5:8.5,sx:0,sy:0,sr:0};
      dots.push(d); tn.rels.push(d);
    }
  });
  var dotBy={}; dots.forEach(function(d){dotBy[d.id]=d});

  // ---- view and state ----
  var V0={yaw:0.35,pitch:0.42}, V={yaw:V0.yaw,pitch:V0.pitch}, hover=null, sel=null, drag=null, vel=0, moved=0, anim=null, started=false, onscreen=false;
  var W=0,H=0,dpr=1,D=1900,SCALE=1,VS=1,picked=false,framePending=false; // VS = how much taller the ring is drawn than the view gives (phones)
  function P(x,y,z){
    var cy=Math.cos(V.yaw),sy=Math.sin(V.yaw),cp=Math.cos(V.pitch),sp=Math.sin(V.pitch);
    var X=x*cy+z*sy,Z=-x*sy+z*cy,Y=y*cp-Z*sp,Z2=y*sp+Z*cp,s=D/(D+Z2+230)*SCALE;
    return {x:W/2+X*s,y:H/2+Y*s*VS+10,s:s,z:Z2};
  }
  // The starting angle where the fewest halos and names overlap
  function bestYaw(){
    var keep=V.yaw,best=1e18,by=keep;
    for(var k=0;k<96;k++){
      V.yaw=k/96*Math.PI*2;
      var T=toolN.map(function(tn){var p=P(tn.x,0,tn.z);return {x:p.x,y:p.y,r:tn.r*p.s*1.35*NS,n:tn.n}}),cost=0;
      T.forEach(function(a,i){
        T.forEach(function(b,j){
          if(i===j||!a.n) return;
          var hx=a.x,hy=a.y-a.r*1.15,Rr=a.r*2.5,d1=Math.hypot(hx-b.x,hy-b.y),o1=Rr+b.r-d1; if(o1>0) cost+=o1*o1;
          var lx=Math.max(Math.abs(hx-b.x)-60,0),ly=Math.max(Math.abs(hy-(b.y+b.r+12))-10,0),o2=Rr-Math.hypot(lx,ly); if(o2>0) cost+=o2*o2*1.5;
          if(j>i&&b.n){var o3=Rr*2-Math.hypot(hx-b.x,hy-(b.y-b.r*1.15)); if(o3>0) cost+=o3*o3}
        });
        // the halo and the name must stay inside the card
        var half=a.n?a.r*2.5:a.r, top=a.n?a.y-a.r*2.9:a.y-a.r;
        if(a.x-half<10||a.x+half>W-10||top<8||a.y+a.r+26>H-8) cost+=8000;
      });
      if(cost<best){best=cost;by=V.yaw}
    }
    V.yaw=keep; return by;
  }
  function size(){
    dpr=Math.min(2,devicePixelRatio||1);
    var r=box.getBoundingClientRect(); if(r.width<50) return;
    W=r.width; H=r.height;
    // narrow screens: a tighter ring and larger nodes; the scale makes the ring and the halos fit the width and the height
    var narrow=W<600, pit=narrow?0.9:0.42; R=narrow?164:220; NS=narrow?1.45:1.3; VS=narrow?1.85:1; BEND=narrow?1.4:1.8;
    toolN.forEach(function(t){t.x=Math.cos(t.ang)*R; t.z=Math.sin(t.ang)*R});
    SCALE=Math.min((W/2-6)/(R+(narrow?80:70)*NS),(H-20)/(2*R*Math.abs(Math.sin(pit))*VS+60+110*NS));
    if(!picked){picked=true; V0.pitch=pit; V.pitch=V0.pitch; V0.yaw=bestYaw(); V.yaw=V0.yaw}
    cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); draw();
  }

  // ---- drawing ----
  function related(){
    var f=sel||hover; if(!f) return null;
    var s={tools:{},dots:{}};
    if(f.k==='tool'){f.tn.rels.forEach(function(d){s.dots[d.id]=1}); s.tools[f.tn.t.id]=1}
    else {s.dots[f.d.id]=1; s.tools[f.d.tn.t.id]=1}
    return s;
  }
  // ---- the floor: a grid that bends into a dip at every tool (deeper for more releases), with the orbit sinking along it ----
  var BEND=1.8; // how deep the dips are (phones: less)
  function wy(x,z){var d=0; toolN.forEach(function(tn){var q=(x-tn.x)*(x-tn.x)+(z-tn.z)*(z-tn.z),sg=R*.3; d+=BEND*(16+14*Math.sqrt(tn.n))*Math.exp(-q/(2*sg*sg))}); return d}
  var GRAY=[138,147,166];
  function tint(x,z){ // the gray of the floor, pulled toward the color of the tools near this point
    var w=0,c=[0,0,0]; toolN.forEach(function(tn){var q=(x-tn.x)*(x-tn.x)+(z-tn.z)*(z-tn.z),sg=R*.3,k=Math.exp(-q/(2*sg*sg)),h=parseInt(tn.t.color.slice(1),16); w+=k; c[0]+=k*(h>>16); c[1]+=k*(h>>8&255); c[2]+=k*(h&255)});
    var m=1/(1+2*w); return {w:w,c:[0,1,2].map(function(j){return Math.round((GRAY[j]+2*c[j])*m)})};
  }
  // The grid does not move (only the view turns), so its points, dips and colors are worked out once per size and bend
  var fab=null,fabKey='';
  function fabBuild(){
    var L=R*1.75,S=40,k; fab=[]; fabKey=R+'|'+BEND;
    function line(f){
      var pts=[],segs=[],j; for(j=0;j<=S;j++){var q=f(-L+2*L*j/S); pts.push({x:q[0],z:q[1],y:26+wy(q[0],q[1])})}
      for(j=0;j<S;j++){var mx=(pts[j].x+pts[j+1].x)/2,mz=(pts[j].z+pts[j+1].z)/2,e=1-Math.hypot(mx,mz)/L; if(e>0){var cc=tint(mx,mz); segs.push({j:j,e:e,w:cc.w,c:cc.c.join(',')})}}
      fab.push({pts:pts,segs:segs});
    }
    for(k=-8;k<=8;k++){(function(g){line(function(u){return [g,u]}); line(function(u){return [u,g]})})(k*R*.22)}
  }
  function fabric(zmin,zmax){
    if(fabKey!==R+'|'+BEND) fabBuild();
    fab.forEach(function(ln){
      var pp=ln.pts.map(function(q){return P(q.x,q.y,q.z)});
      ln.segs.forEach(function(sg){
        var a=pp[sg.j],b=pp[sg.j+1],t=Math.max(0,Math.min(1,1-((a.z+b.z)/2-zmin)/((zmax-zmin)||1)));
        ctx.strokeStyle='rgba('+sg.c+','+((.1+.5*sg.w)*(.3+.7*t)*Math.min(1,sg.e*2.2)).toFixed(3)+')'; ctx.lineWidth=.9+.8*t; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
      });
    });
  }
  // the orbit takes the colors of the tools it passes; the near side is brighter and thicker, the far side fainter and thinner
  function drawRing(){
    var N=96,pts=[],i,zmin=1e9,zmax=-1e9,n=toolN.length;
    for(i=0;i<=N;i++){var a=i/N*Math.PI*2,q=P(Math.cos(a)*R,26+wy(Math.cos(a)*R,Math.sin(a)*R),Math.sin(a)*R); pts.push(q); zmin=Math.min(zmin,q.z); zmax=Math.max(zmax,q.z)}
    ctx.lineCap='round'; ctx.lineJoin='round';
    fabric(zmin,zmax);
    for(i=0;i<N;i++){
      var t=1-((pts[i].z+pts[i+1].z)/2-zmin)/((zmax-zmin)||1),u=((i+.5)/N*Math.PI*2-toolN[0].ang)/(Math.PI*2/n),k0=Math.floor(u),f=u-k0,
          c1=parseInt(toolN[((k0%n)+n)%n].t.color.slice(1),16),c2=parseInt(toolN[(((k0+1)%n)+n)%n].t.color.slice(1),16),
          c=[16,8,0].map(function(sh){var x=c1>>sh&255,y=c2>>sh&255; return Math.round(x+(y-x)*f)});
      ctx.strokeStyle='rgba('+c.join(',')+','+(.15+.7*t).toFixed(3)+')'; ctx.lineWidth=1+2.4*t; ctx.beginPath(); ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[i+1].x,pts[i+1].y); ctx.stroke();
    }
  }
  function draw(){
    if(!W) return; // drawing follows the reader's actions and resizes, so nothing runs while the card is off screen
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,W,H);
    var ink=css('--ink'),bg=css('--card2'),soft=css('--soft'),amber=css('--amber'),items=[],rel=related(),f=sel||hover;
    // the ring on the floor
    drawRing();
    toolN.forEach(function(tn){
      var p=P(tn.x,0,tn.z), r=tn.r*p.s*1.35*NS, on=!rel||rel.tools[tn.t.id];
      tn.sx=p.x; tn.sy=p.y; tn.sr=r;
      items.push({z:p.z,draw:function(){
        ctx.save(); ctx.globalAlpha=(on?1:.3)*Math.max(.55,Math.min(1,1-p.z/700));
        var sh=P(tn.x,26+wy(tn.x,tn.z),tn.z); ctx.fillStyle='rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(sh.x,sh.y,r*.95,r*.3,0,0,7); ctx.fill();
        glass(p.x,p.y,r,tn.t.color);
        var tr=r*.62; ctx.fillStyle='rgba(255,255,255,.93)'; ctx.beginPath(); ctx.arc(p.x,p.y,tr,0,7); ctx.fill();
        if(tn.img.complete&&tn.img.naturalWidth){ctx.save(); ctx.beginPath(); ctx.arc(p.x,p.y,tr,0,7); ctx.clip(); var sz=tn.t.fill?tr*2:tr*1.3; ctx.drawImage(tn.img,p.x-sz/2,p.y-sz/2,sz,sz); ctx.restore()}
        if(f&&f.k==='tool'&&f.tn===tn){ctx.globalAlpha=1; ctx.strokeStyle=ink; ctx.lineWidth=sel&&sel.tn===tn?3:1.8; ctx.beginPath(); ctx.arc(p.x,p.y,r+4,0,7); ctx.stroke()}
        ctx.restore();
      }});
    });
    dots.forEach(function(d){
      var tp=P(d.tn.x,0,d.tn.z), r=d.rad*tp.s*1.4*NS, rr=d.tn.sr+r+7+d.ring*(r*2.6+4), on=!rel||rel.dots[d.id];
      d.sx=d.tn.sx+Math.cos(d.a)*rr; d.sy=d.tn.sy+Math.sin(d.a)*rr; d.sr=r;
      items.push({z:tp.z-1,draw:function(){
        ctx.save(); ctx.globalAlpha=(on?1:.2)*Math.max(.5,Math.min(1,1-tp.z/800));
        glass(d.sx,d.sy,r,d.tn.t.color,d.more);
        if(d.more){ctx.fillStyle='#0b0f17'; ctx.font='800 '+Math.max(11,r*.8)+'px '+FONT; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('+'+d.extra,d.sx,d.sy+.5)}
        else if(d.r.action){
          var br=Math.max(5,r*.6); ctx.fillStyle='#fbe1d1'; ctx.beginPath(); ctx.arc(d.sx+r*.8,d.sy-r*.8,br,0,7); ctx.fill(); ctx.strokeStyle='#5d2a1a'; ctx.lineWidth=1; ctx.stroke();
          ctx.fillStyle='#5d2a1a'; ctx.font='800 '+Math.max(8,br*1.3)+'px '+FONT; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('!',d.sx+r*.8,d.sy-r*.8+.5);
        }
        if(f&&f.k==='dot'&&f.d===d){
          ctx.globalAlpha=1; ctx.strokeStyle=ink; ctx.lineWidth=sel&&sel.d===d?3:1.8; ctx.beginPath(); ctx.arc(d.sx,d.sy,r+3.5,0,7); ctx.stroke();
        }
        ctx.restore();
      }});
    });
    items.sort(function(a,b){return b.z-a.z}).forEach(function(it){it.draw()});
    placeSide();
  }
  // draw once per frame, whatever the number of events
  function redraw(){if(framePending) return; framePending=true; requestAnimationFrame(function(){framePending=false; draw()})}

  // ---- texts ----
  function toolTip(tn){
    var last=tn.all.length?tn.all[tn.all.length-1].date:null, warn=tn.all.some(function(r){return r.action});
    return '<b>'+esc(tn.t.short)+'</b><br><span class="m">'+(tn.n?tn.n+' release'+(tn.n===1?'':'s')+' this week, last on '+day(last):'No releases this week')+'</span>'+(warn?'<br><span class="w">! A release needs action</span>':'')+(tn.n?'<span class="go">Click to list its releases</span>':'');
  }
  function dotTip(d){
    if(d.more) return '<b>'+esc(d.tn.t.short)+'</b><br><span class="m">'+d.extra+' more releases this week</span><span class="go">Click to list them</span>';
    var r=d.r, t=titleOf(r.tag), at=J()&&J().firstAt(r.tag), h='<b>'+esc(d.tn.t.short)+' '+esc(r.tag)+'</b><br><span class="m">Released '+day(r.date)+'</span>';
    if(t) h+='<br>'+esc(t);
    if(r.action) h+='<br><span class="w">! '+(r.action.deadline?'Deadline '+day(r.action.deadline):'Needs action')+'</span>';
    if(at) h+='<br><span class="m">Reported '+when(at)+'</span>';
    return h+'<span class="go">'+(J()&&J().explained(r.tag)?'Click to read the update ↓':'Click to open it on GitHub ↗')+'</span>';
  }
  function renderSide(){
    side.hidden=!sel; side.innerHTML=''; if(!sel) return;
    var h;
    if(sel.k==='tool'||sel.d.more){
      var tn=sel.k==='tool'?sel.tn:sel.d.tn;
      h='<div class="wk-panel"><button type="button" class="wk-x" id="wkX">← Close</button><h3><img src="'+esc(tn.t.logo)+'" alt="">'+esc(tn.t.short)+'</h3><div class="m">'+(tn.n?tn.n+' release'+(tn.n===1?'':'s')+' this week':'No releases this week. Nothing to open here.')+'</div>';
      if(tn.n>8){ // many releases: one line of chips per day, so the panel stays shorter than the card
        var gs=[],gi={}; tn.all.slice().reverse().forEach(function(r){if(!(r.date in gi)){gi[r.date]=gs.length; gs.push({date:r.date,rs:[]})} gs[gi[r.date]].rs.push(r)});
        gs.forEach(function(g){h+='<div class="wk-grp"><div class="wk-gd">'+day(g.date)+'</div><div class="wk-chips">'+g.rs.map(function(r){return '<button type="button" data-id="'+esc(r.tool+'|'+r.tag)+'">'+esc(r.tag)+(r.action?' <span class="w">!</span>':'')+'</button>'}).join('')+'</div></div>'});
      } else if(tn.n){h+='<ul>'; tn.all.slice().reverse().forEach(function(r){h+='<li><button type="button" data-id="'+esc(r.tool+'|'+r.tag)+'"><b>'+esc(r.tag)+'</b><span class="m">'+day(r.date)+'</span>'+(r.action?'<span class="w">!</span>':'')+'</button></li>'}); h+='</ul>'}
      side.innerHTML=h+'</div>';
      [].forEach.call(side.querySelectorAll('li button,.wk-chips button'),function(b){
        var id=b.dataset.id;
        // a release that has no dot of its own (past the first few) is shown from its tool
        b.onclick=function(){pick({k:'dot',d:dotBy[id]||{id:id,r:rels.filter(function(r){return r.tool+'|'+r.tag===id})[0],tn:tn,more:false,sr:10}})};
        b.onmouseenter=function(){var d=dotBy[id]; if(d){hover={k:'dot',d:d}; redraw()}};
        b.onmouseleave=function(){hover=null; redraw()};
      });
    } else {
      var d=sel.d, r=d.r, t=titleOf(r.tag), at=J()&&J().firstAt(r.tag);
      h='<div class="wk-panel"><button type="button" class="wk-x" id="wkX">← Close</button><h3><img src="'+esc(d.tn.t.logo)+'" alt="">'+esc(d.tn.t.short)+' '+esc(r.tag)+'</h3><div class="m">Released '+day(r.date)+'</div>';
      if(t) h+='<p class="wk-t">'+esc(t)+'</p>';
      if(r.action) h+='<div class="w">! '+(r.action.deadline?'Deadline '+day(r.action.deadline):'Needs action')+'</div>';
      if(J()&&J().explained(r.tag)) h+='<div class="m">Reported '+when(at)+'</div><button type="button" class="wk-btn" id="wkGo">Read the update ↓</button>';
      else h+='<div class="m">No update explains it</div><a class="wk-btn" id="wkGh" href="'+esc(releaseUrl(d.tn.t,r.tag))+'" target="_blank" rel="noopener noreferrer">Open on GitHub ↗</a>';
      side.innerHTML=h+'</div>';
      var go=document.getElementById('wkGo'); if(go) go.onclick=function(){openRelease(d)};
    }
    document.getElementById('wkX').onclick=function(){pick(null)};
  }
  // The panel opens beside what was clicked, on the side with room, and follows it while the scene turns
  function placeSide(){
    if(!sel||side.hidden||getComputedStyle(side).position==='static') return;
    var pn=side.firstChild; if(pn&&pn.style) pn.style.maxHeight=(H-16)+'px'; // a very long list scrolls inside the panel, so the panel never grows taller than the card
    var ax,ay,ar;
    if(sel.k==='tool'){ax=sel.tn.sx;ay=sel.tn.sy;ar=sel.tn.sr*(sel.tn.n?1.95:1.25)+10}
    else if(!dotBy[sel.d.id]){ax=sel.d.tn.sx;ay=sel.d.tn.sy;ar=sel.d.tn.sr*1.95+10}
    else {ax=sel.d.sx;ay=sel.d.sy;ar=sel.d.sr+14}
    var w=side.offsetWidth||290,h=side.offsetHeight||200,gap=16,right=ax+ar+gap+w<=W-8,left=right?ax+ar+gap:ax-ar-gap-w;
    if(!right&&left<8) left=Math.min(W-w-8,Math.max(8,ax-w/2));
    var top=Math.min(H-h-8,Math.max(8,ay-60));
    side.style.left=left+'px'; side.style.top=top+'px';
    side.classList.toggle('r',right); side.classList.toggle('l',!right);
    side.style.setProperty('--ay',Math.max(18,Math.min(h-18,ay-top))+'px');
  }
  function pick(f){sel=f; hover=null; tip.hidden=true; renderSide(); draw()}
  // A release opens its update (with the usual frame and way back), or the release on GitHub when no update explains it
  function openRelease(d){
    var r=d.r, j=J();
    if(j&&j.explained(r.tag)){
      var cell=j.cellFor(r.tool,r.tag);
      if(cell){j.go(cell,null,{back:'↑ Back to this week at a glance',el:sec,tag:r.tag,focus:function(){cv.focus({preventScroll:true})}}); return}
    }
    window.open(releaseUrl(d.tn.t,r.tag),'_blank','noopener,noreferrer');
  }

  // ---- pointer, keyboard ----
  function pos(e){var r=cv.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top]}
  function hit(x,y){
    var best=null,bs=1e9;
    dots.forEach(function(d){var dd=Math.hypot(d.sx-x,d.sy-y); if(dd<=d.sr+4&&dd/d.sr<bs){best={k:'dot',d:d};bs=dd/d.sr}});
    toolN.forEach(function(tn){var dd=Math.hypot(tn.sx-x,tn.sy-y); if(dd<=tn.sr+3&&dd/tn.sr*0.9<bs){best={k:'tool',tn:tn};bs=dd/tn.sr*0.9}});
    return best;
  }
  function same(a,b){return a&&b&&a.k===b.k&&(a.k==='tool'?a.tn===b.tn:a.d===b.d)}
  function stopAnim(){if(anim){cancelAnimationFrame(anim);anim=null}}
  function tween(to,ms,done){
    stopAnim(); var from=V.yaw,t0=performance.now();
    if(reduce.matches) ms=1;
    (function s(t){var k=Math.min(1,(t-t0)/ms),e=1-Math.pow(1-k,3); V.yaw=from+(to-from)*e; draw(); if(k<1) anim=requestAnimationFrame(s); else {anim=null; if(done) done()}})(t0);
  }
  function reset(){
    pick(null); var dy=((V0.yaw-V.yaw+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;
    V.pitch=V0.pitch; tween(V.yaw+dy,520);
  }
  cv.addEventListener('pointerdown',function(e){cv.setPointerCapture(e.pointerId); drag={x:e.clientX}; moved=0; stopAnim(); vel=0; cv.classList.add('drag')});
  cv.addEventListener('pointermove',function(e){
    var p=pos(e);
    if(drag){var dx=e.clientX-drag.x; moved+=Math.abs(dx); V.yaw-=dx*.009; vel=-dx*.009; drag.x=e.clientX; tip.hidden=true; redraw(); return}
    var h=hit(p[0],p[1]);
    if(!same(h,hover)){hover=h; cv.classList.toggle('hit',!!h); redraw()}
    // no tooltip over the thing that is already open in the panel
    if(h&&!same(h,sel)){
      tip.innerHTML=h.k==='tool'?toolTip(h.tn):dotTip(h.d); tip.style.setProperty('--tc',(h.k==='tool'?h.tn:h.d.tn).t.color); tip.hidden=false;
      var w=tip.offsetWidth,hh=tip.offsetHeight; tip.style.left=Math.min(W-w-8,Math.max(8,p[0]+14))+'px'; tip.style.top=(p[1]+16+hh>H?p[1]-hh-12:p[1]+16)+'px';
    } else tip.hidden=true;
  });
  cv.addEventListener('pointerup',function(e){
    var wasClick=moved<5; drag=null; cv.classList.remove('drag'); if(!wasClick) {kick(); return}
    var p=pos(e), h=hit(p[0],p[1]);
    if(!h){if(sel) pick(null); return}
    if(h.k==='dot'&&!h.d.more&&same(h,sel)) openRelease(h.d); else pick(h);
  });
  cv.addEventListener('pointercancel',function(){drag=null; cv.classList.remove('drag')});
  cv.addEventListener('pointerleave',function(){if(!drag){hover=null; tip.hidden=true; redraw()}});
  cv.addEventListener('dblclick',reset);
  cv.addEventListener('keydown',function(e){
    var k=e.key,used=true;
    if(k==='ArrowLeft') V.yaw+=.14; else if(k==='ArrowRight') V.yaw-=.14; else if(k==='0') reset(); else if(k==='Escape') pick(null); else used=false;
    if(used){e.preventDefault(); redraw()}
  });
  resetBtn.onclick=reset;
  // a short flick keeps turning for a moment, then slows down
  function kick(){
    if(reduce.matches||Math.abs(vel)<.003) return;
    (function s(){if(drag||Math.abs(vel)<.0006){anim=null; return} V.yaw+=vel; vel*=.93; draw(); anim=requestAnimationFrame(s)})();
  }

  // ---- start when the card is on screen; one gentle turn the first time, so readers see it moves ----
  function hintOnce(){
    var seen; try{seen=localStorage.getItem('cad-wk-hint')}catch(e){}
    if(seen||reduce.matches) return;
    try{localStorage.setItem('cad-wk-hint','1')}catch(e){}
    var base=V.yaw; tween(base+.17,700,function(){if(!drag&&!sel) tween(base,700)});
  }
  sec.classList.add('wk-on'); box.hidden=false;
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      onscreen=es[0].isIntersecting;
      if(onscreen){var first=!started; started=true; size(); if(first) setTimeout(function(){if(onscreen&&!drag) hintOnce()},500)}
    },{threshold:.35}).observe(sec);
  } else {onscreen=true; started=true; size()}
  if(window.ResizeObserver) new ResizeObserver(function(){if(started) size()}).observe(box); else addEventListener('resize',function(){if(started) size()});
  // the light and dark switch changes the page colors; draw again with them
  new MutationObserver(function(){redraw()}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  matchMedia('(prefers-color-scheme: light)').addEventListener&&matchMedia('(prefers-color-scheme: light)').addEventListener('change',redraw);
  // read-only handle for the tests: where each node is on the screen
  window.cadWeekMap={points:function(){var r=cv.getBoundingClientRect();return toolN.map(function(t){return {id:t.t.id,x:r.left+t.sx,y:r.top+t.sy}}).concat(dots.map(function(d){return {id:d.id,x:r.left+d.sx,y:r.top+d.sy,more:d.more}}))},view:function(){return {yaw:V.yaw,v0:V0.yaw,sel:sel&&sel.k,hover:hover&&hover.k}},turn:function(y){V.yaw=y;draw()}};
})();
