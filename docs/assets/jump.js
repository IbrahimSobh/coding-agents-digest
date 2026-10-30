// Release boxes in the 7-day grid: a tooltip on hover or focus, and a click (or Enter) jumps to the
// "Daily updates" entry that first linked the release. Jumping, the highlight and the "Back to the
// release grid" chip are one state: the URL points at the entry (#run-YYYYMMDDHHMM) while it lasts,
// and going back (the chip or the browser's Back button) clears all three.
// Without this script the boxes keep their plain title tooltip.
(function(){
  var dataEl=document.getElementById('rpData'), box=document.getElementById('replay');
  if(!dataEl||!box) return;
  var cells=[].slice.call(box.querySelectorAll('.rg-c[data-tags]'));
  if(!cells.length) return;
  // Earliest entry that linked each tag ("2026-10-27T08:12" -> "run-202610270812")
  var first={};
  JSON.parse(dataEl.textContent).seen.slice().sort(function(a,b){return a.at<b.at?-1:1}).forEach(function(s){
    s.tags.split(' ').forEach(function(t){if(t&&!first[t]) first[t]='run-'+s.at.replace(/[-:T]/g,'')});
  });
  function day(d){return new Date(d+'T12:00:00Z').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',timeZone:'UTC'})}

  var tip=document.createElement('div');
  tip.className='rg-tip'; tip.hidden=true; tip.setAttribute('aria-hidden','true');
  document.body.appendChild(tip);
  var chip=document.createElement('button');
  chip.type='button'; chip.className='rg-backchip'; chip.hidden=true;
  chip.textContent='↑ Back to the release grid';
  document.body.appendChild(chip);

  var jump=null, quietTip=false;   // jump = {hash, cell, tags, color, pushed}
  function showTip(c){
    if(quietTip) return;
    tip.textContent='';
    var d=document.createElement('i'); d.style.background=c.style.getPropertyValue('--c');
    var b=document.createElement('b'); b.textContent=c.dataset.name;
    tip.appendChild(d); tip.appendChild(b); tip.appendChild(document.createTextNode(' · '+day(c.dataset.day)));
    var t=document.createElement('span'); t.className='rg-tip-tags'; t.textContent=c.dataset.tags.split(' ').join(' · ');
    var g=document.createElement('span'); g.className='rg-tip-go'; g.textContent='Click to read the update ↓';
    tip.appendChild(t); tip.appendChild(g);
    tip.hidden=false;
    var r=c.getBoundingClientRect(), w=tip.offsetWidth;
    tip.style.left=(Math.max(8,Math.min(innerWidth-w-8,r.left+r.width/2-w/2))+scrollX)+'px';
    tip.style.top=(r.top+scrollY-tip.offsetHeight-8)+'px';
  }
  function hideTip(){tip.hidden=true}

  // Highlight the entries (and their lines for these tags) that the URL points at
  function mark(on){
    [].forEach.call(document.querySelectorAll('.run.jumped'),function(r){r.classList.remove('jumped')});
    [].forEach.call(document.querySelectorAll('.tl li.hit'),function(l){l.classList.remove('hit')});
    if(!on) return;
    var ids=jump.tags.map(function(t){return first[t]}).filter(Boolean);
    ids.forEach(function(id){
      var r=document.getElementById(id);
      if(!r) return;
      if(r.tagName==='DETAILS') r.open=true;
      r.style.setProperty('--jc',jump.color);
      r.classList.add('jumped');
      [].forEach.call(r.querySelectorAll('a[href*="releases/tag/"]'),function(a){
        var tag=a.getAttribute('href').split('releases/tag/')[1].replace(/[\/?#].*$/,'');
        if(jump.tags.indexOf(decodeURIComponent(tag))>-1) (a.closest('li')||a.parentNode).classList.add('hit');
      });
    });
  }
  function go(c){
    hideTip();
    var tags=c.dataset.tags.split(' ');
    var ids=tags.map(function(t){return first[t]}).filter(Boolean).sort();
    var id=ids.length?ids[0]:'day-'+c.dataset.day.replace(/-/g,'');
    var dest=document.getElementById(id);
    if(!dest) return;
    // A filter on another tool would hide the entry's lines: show all tools first
    var on=document.querySelector('#filters .chip.on');
    if(on&&on.dataset.f!=='all'&&on.dataset.f!==c.dataset.tool){var all=document.querySelector('#filters [data-f="all"]'); if(all) all.click()}
    jump={hash:'#'+id, cell:c, tags:tags, color:c.style.getPropertyValue('--c'), pushed:true};
    mark(true);
    if(location.hash===jump.hash) dest.scrollIntoView(); else location.hash=id;
    chip.hidden=false;
  }
  // Going back (or any other URL change) ends the jump
  addEventListener('hashchange',function(){
    if(jump&&location.hash===jump.hash) return;
    var c=jump&&jump.cell;
    mark(false); chip.hidden=true; jump=null;
    // Another entry address (a link, an edited URL, or Back to an earlier jump): frame that entry
    if(fromHash(true)) return;
    // Focus returns to the box (focus fires synchronously, so the flag only skips this one tooltip)
    if(c&&!location.hash){quietTip=true;c.focus({preventScroll:true});quietTip=false}
  });
  chip.onclick=function(){
    if(jump&&jump.pushed) history.back();
    else{
      // Arrived from a shared link: nothing to go back to, so scroll to the grid
      history.replaceState(null,'',location.pathname+location.search);
      mark(false); chip.hidden=true; jump=null;
      box.scrollIntoView({block:'center'});
    }
  };
  // The chip hides while the grid itself is on screen
  if('IntersectionObserver' in window) new IntersectionObserver(function(es){
    if(jump) chip.hidden=es[0].isIntersecting;
  }).observe(box);

  cells.forEach(function(c){
    c.removeAttribute('title');
    c.tabIndex=0; c.setAttribute('role','link');
    c.setAttribute('aria-label',c.dataset.name+', '+day(c.dataset.day)+': '+c.dataset.tags.split(' ').join(', ')+'. Read the update');
    c.addEventListener('mouseenter',function(){showTip(c)});
    c.addEventListener('mouseleave',hideTip);
    c.addEventListener('focus',function(){showTip(c)});
    c.addEventListener('blur',hideTip);
    c.addEventListener('click',function(){go(c)});
    c.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();go(c)}});
  });

  // An entry address without a click on a box (a shared link): frame the entry, no line highlight.
  // pushed = whether there is an in-page step to go back to.
  function fromHash(pushed){
    var r=/^#run-\d{12}$/.test(location.hash)&&document.getElementById(location.hash.slice(1));
    if(!r) return false;
    jump={hash:location.hash, cell:null, tags:[], color:'', pushed:pushed};
    if(r.tagName==='DETAILS') r.open=true;
    r.classList.add('jumped');
    chip.hidden=false;
    return true;
  }
  fromHash(false);
})();
