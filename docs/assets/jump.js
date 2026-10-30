// Release boxes in the 7-day grid: a tooltip on hover or focus says which update explains each
// release, and a click (or Enter) jumps to the "Daily updates" entry that first linked it.
// A release chip in the Latest brief jumps the same way, and its way back is the brief.
// The entry gets a frame and a jump bar on top: "Back to the release grid", and for a box with
// several releases "release 1 of 2" with Previous / Next to the other releases' entries.
// The jump lasts while the URL points at the entry (#run-YYYYMMDDHHMM); going back ends it.
// Without this script the boxes keep their plain title tooltip.
(function(){
  var dataEl=document.getElementById('rpData'), box=document.getElementById('replay');
  if(!dataEl||!box) return;
  var cells=[].slice.call(box.querySelectorAll('.rg-c[data-tags]'));
  if(!cells.length) return;
  // Earliest entry that linked each tag, as Cairo minute strings ("2026-10-27T08:12")
  var first={};
  JSON.parse(dataEl.textContent).seen.slice().sort(function(a,b){return a.at<b.at?-1:1}).forEach(function(s){
    s.tags.split(' ').forEach(function(t){if(t&&!first[t]) first[t]=s.at});
  });
  function idOf(at){return 'run-'+at.replace(/[-:T]/g,'')}
  function when(at){return new Date(at.slice(0,10)+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'})+', '+at.slice(11,16)}
  function day(d){return new Date(d+'T12:00:00Z').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',timeZone:'UTC'})}
  function el(tag,cls,text){var e=document.createElement(tag); if(cls) e.className=cls; if(text) e.textContent=text; return e}
  function button(cls,text,fn){var b=el('button',cls,text); b.type='button'; b.onclick=fn; return b}
  // A box's releases in the order the site explained them; releases no update explains come last
  // Days between a release's publish day (the box) and the day an update first reported it
  function late(c,r){return r.at?Math.round((Date.parse(r.at.slice(0,10))-Date.parse(c.dataset.day))/864e5):0}
  // Wording: "released" = the tool published it (the box's day); "reported" = a check wrote it into Daily updates
  function later(d){return d===1?'a day later':d+' days later'}
  function lateText(d){return 'reported '+later(d)}
  function list(c){
    return c.dataset.tags.split(' ').map(function(t){return {tag:t, at:first[t]||null}})
      .sort(function(a,b){return !a.at?1:!b.at?-1:a.at<b.at?-1:1});
  }

  var tip=el('div','rg-tip'); tip.hidden=true; tip.setAttribute('aria-hidden','true');
  document.body.appendChild(tip);
  var chip=button('rg-backchip','',goGrid); chip.hidden=true;
  document.body.appendChild(chip);

  // jump = {c: the box (null for a shared link), rel: its releases, idx: the one shown,
  //         stack: entry addresses this jump added to the history, color}
  var jump=null, ours=null, quietTip=false;

  function backText(){return jump&&jump.a?'↑ Back to the brief':'↑ Back to the release grid'}

  function showTip(c){
    if(quietTip) return;
    tip.textContent='';
    var d=el('i'); d.style.background=c.style.getPropertyValue('--c');
    tip.appendChild(d); tip.appendChild(el('b','',c.dataset.name));
    tip.appendChild(el('span','rg-tip-rel','Released '+day(c.dataset.day)));
    list(c).forEach(function(r){
      var row=el('span','rg-tip-row'); row.appendChild(el('code','',r.tag));
      var d=late(c,r);
      row.appendChild(document.createTextNode(r.at?'  reported '+when(r.at)+(d>0?' · '+later(d):''):'  not explained in any update'));
      tip.appendChild(row);
    });
    tip.appendChild(el('span','rg-tip-go','Click to read the update ↓'));
    tip.hidden=false;
    var b=c.getBoundingClientRect(), w=tip.offsetWidth;
    tip.style.left=(Math.max(8,Math.min(innerWidth-w-8,b.left+b.width/2-w/2))+scrollX)+'px';
    tip.style.top=(b.top+scrollY-tip.offsetHeight-8)+'px';
  }
  function hideTip(){tip.hidden=true}

  function clear(){
    [].forEach.call(document.querySelectorAll('.run.jumped'),function(r){r.classList.remove('jumped')});
    [].forEach.call(document.querySelectorAll('.tl li.hit'),function(l){l.classList.remove('hit')});
    [].forEach.call(document.querySelectorAll('.jbar'),function(b){b.remove()});
  }
  // Frame the shown entry, tint its lines for the shown release, and put the jump bar on top
  function render(){
    clear();
    chip.textContent=backText();
    var cur=jump.rel[jump.idx], r=document.getElementById(idOf(cur.at));
    if(!r) return;
    if(r.tagName==='DETAILS') r.open=true;
    r.style.setProperty('--jc',jump.color);
    r.classList.add('jumped');
    if(cur.tag) [].forEach.call(r.querySelectorAll('a[href*="releases/tag/"]'),function(a){
      var t=decodeURIComponent(a.getAttribute('href').split('releases/tag/')[1].replace(/[\/?#].*$/,''));
      if(t===cur.tag) (a.closest('li')||a.parentNode).classList.add('hit');
    });
    var bar=el('div','jbar');
    bar.appendChild(button('jb-back',backText(),goGrid));
    if(jump.rel.length>1){
      var pos=el('span','jb-pos',jump.c.dataset.name+', ');
      pos.appendChild(el('b','','released '+day(jump.c.dataset.day)));
      pos.appendChild(document.createTextNode(': release '+(jump.idx+1)+' of '+jump.rel.length+' ('+cur.tag+')'));
      bar.appendChild(pos);
      var prev=jump.rel[jump.idx-1], next=jump.rel[jump.idx+1];
      if(prev&&prev.at) bar.appendChild(button('jb-nav','Previous: '+prev.tag+' (reported '+when(prev.at)+') ↓',function(){step(-1)}));
      if(next&&next.at) bar.appendChild(button('jb-nav','Next: '+next.tag+' (reported '+when(next.at)+') ↑',function(){step(1)}));
      jump.rel.forEach(function(x){if(!x.at) bar.appendChild(el('span','jb-none',x.tag+' was released, but no update explains it'))});
    }
    // The bar sits right above this tool's section, so the jump lands on the right lines even in
    // an entry that covers several tools; a shared link (no box) puts it on top of the entry
    var card=r.querySelector(':scope>div.card')||r;
    var sec=jump.c&&card.querySelector('.tool[data-tool="'+jump.c.dataset.tool+'"]');
    if(sec){bar.classList.add('mid'); sec.parentNode.insertBefore(bar,sec)}
    else card.insertBefore(bar,card.firstChild);
    return bar;
  }
  // Setting the address scrolls to the entry's top; then bring the bar (above the tool's lines) into view
  function setHash(id,bar){ours='#'+id; jump.stack.push(ours); location.hash=id; if(bar) bar.scrollIntoView({block:'start'})}
  function step(d){jump.idx+=d; setHash(idOf(jump.rel[jump.idx].at),render())}
  function goGrid(){
    if(jump&&jump.stack.length) history.go(-jump.stack.length);
    else end(true);
  }
  // scroll = true when there is no history step back to the grid (a shared link)
  function end(scroll){
    var c=jump&&(jump.a||jump.c);
    clear(); chip.hidden=true; jump=null;
    if(scroll){history.replaceState(null,'',location.pathname+location.search); box.scrollIntoView({block:'center'})}
    // Focus returns to the box (focus fires synchronously, so the flag only skips this one tooltip)
    if(c&&!location.hash){quietTip=true; c.focus({preventScroll:true}); quietTip=false}
  }
  // a = the chip clicked in the Latest brief, for a jump to its own release of the box
  function go(c,a){
    hideTip();
    var rel=list(c);
    if(!rel[0].at){ // no update explains any release of this box: go to its day in "Daily updates"
      var dh=document.getElementById('day-'+c.dataset.day.replace(/-/g,''));
      if(dh) dh.scrollIntoView();
      return;
    }
    // A filter on another tool would hide the entry's lines: show all tools first
    var on=document.querySelector('#filters .chip.on');
    if(on&&on.dataset.f!=='all'&&on.dataset.f!==c.dataset.tool){var all=document.querySelector('#filters [data-f="all"]'); if(all) all.click()}
    jump={c:c, a:a, rel:rel, idx:0, stack:[], color:c.style.getPropertyValue('--c')};
    if(a) rel.forEach(function(r,i){if(r.tag===a.dataset.tag) jump.idx=i});
    setHash(idOf(rel[0].at),render());
    chip.hidden=false;
  }
  // An entry address without a click on a box (a shared link, an edited URL): frame the entry with
  // a back-only bar. pushed = whether the history has an in-page step back to the grid.
  function fromHash(pushed){
    var m=/^#run-(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)$/.exec(location.hash);
    if(!m||!document.getElementById(location.hash.slice(1))) return false;
    jump={c:null, rel:[{tag:null, at:m[1]+'-'+m[2]+'-'+m[3]+'T'+m[4]+':'+m[5]}], idx:0, stack:pushed?[location.hash]:[], color:''};
    render();
    chip.hidden=false;
    return true;
  }
  addEventListener('hashchange',function(){
    if(jump&&location.hash===ours){ours=null; return}
    // Back or Forward between this jump's entries: follow it
    if(jump&&jump.c){
      var i=-1; jump.rel.forEach(function(x,j){if(x.at&&'#'+idOf(x.at)===location.hash) i=j});
      if(i>-1){jump.stack=jump.stack.slice(0,jump.stack.lastIndexOf(location.hash)+1); jump.idx=i; render(); return}
    }
    end(false);
    fromHash(true);
  });
  // The chip hides while the grid itself is on screen
  if('IntersectionObserver' in window) new IntersectionObserver(function(es){
    if(jump) chip.hidden=es[0].isIntersecting;
  }).observe(box);

  cells.forEach(function(c){
    c.removeAttribute('title');
    c.tabIndex=0; c.setAttribute('role','link');
    // A small corner mark when a release was reported on a later day than it was published
    // (published after that day's last check, or missed by it)
    var lateTags=list(c).filter(function(r){return late(c,r)>0});
    c.classList.toggle('late',lateTags.length>0);
    c.setAttribute('aria-label',c.dataset.name+', released '+day(c.dataset.day)+': '+c.dataset.tags.split(' ').join(', ')+
      lateTags.map(function(r){return '; '+r.tag+' '+lateText(late(c,r))}).join('')+'. Read the update');
    c.addEventListener('mouseenter',function(){showTip(c)});
    c.addEventListener('mouseleave',hideTip);
    c.addEventListener('focus',function(){showTip(c)});
    c.addEventListener('blur',hideTip);
    c.addEventListener('click',function(){go(c)});
    c.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();go(c)}});
  });
  // A chip whose release has a box and an update jumps like the box; any other chip stays a link to the release
  [].forEach.call(document.querySelectorAll('.rchip[data-tag]'),function(a){
    a.addEventListener('click',function(e){
      if(e.ctrlKey||e.metaKey||e.shiftKey||!first[a.dataset.tag]) return;
      var c=cells.filter(function(x){return x.dataset.tool===a.dataset.tool&&x.dataset.tags.split(' ').indexOf(a.dataset.tag)>-1})[0];
      if(!c) return;
      e.preventDefault(); go(c,a);
    });
  });
  fromHash(false);
})();
