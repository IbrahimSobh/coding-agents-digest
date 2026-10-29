// "Replay the week" in the 7-day brief. Data comes from _includes/brief.html:
// runs = every run's headline in the window (headlines.json), seen = release tags each check entry linked.
// Picking a run shows that run's headline and fades the releases the site only found later.
// Without this script the brief shows the latest headline and the full grid.
(function(){
  var dataEl=document.getElementById('rpData'), box=document.getElementById('replay');
  if(!dataEl||!box) return;
  var data=JSON.parse(dataEl.textContent), runs=data.runs;
  if(runs.length<2) return;
  var grid=box.querySelector('.rg'), track=document.getElementById('rpTrack'), over=box.querySelector('.rg-over');
  var cur=over.querySelector('.rg-cur'), curLabel=cur.querySelector('em'), shade=over.querySelector('.rg-shade');
  var head=document.getElementById('rpHead'), cap=document.getElementById('rpCap'), msg=document.getElementById('rpMsg'), back=document.getElementById('rpBack');
  var cells=[].slice.call(box.querySelectorAll('.rg-c[data-tags]')), totals=[].slice.call(box.querySelectorAll('.rg-t'));
  var still=matchMedia('(prefers-reduced-motion: reduce)');
  var DAYS=8, startMs=Date.parse(data.start+'T00:00:00Z'), last=runs.length-1, shown=last;

  // All times are Cairo local strings ("2026-10-27T08:12"), so plain string order is time order
  function local(s){return s.slice(0,16)}
  function pos(at){
    var d=Math.round((Date.parse(at.slice(0,10)+'T00:00:00Z')-startMs)/864e5);
    var m=+at.slice(11,13)*60+(+at.slice(14,16));
    return Math.max(0,Math.min(100,(d+m/1440)/DAYS*100));
  }
  function label(at){
    var d=new Date(at.slice(0,10)+'T12:00:00Z');
    return d.toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'})+', '+at.slice(11,16);
  }
  // Which headline version each run shows (1-based), and the week's number of versions
  var ver=[], n=0;
  runs.forEach(function(r,i){if(!i||r.h!==runs[i-1].h) n++; ver.push(n)});
  // Tags known at each run: every tag linked by check entries up to that run
  var seen=data.seen.slice().sort(function(a,b){return a.at<b.at?-1:1});
  function known(i){
    var at=local(runs[i].at), k={};
    seen.forEach(function(s){if(s.at<=at) s.tags.split(' ').forEach(function(t){if(t) k[t]=1})});
    return k;
  }

  // One button per run; big dots where the headline changed
  var dots=runs.map(function(r,i){
    var b=document.createElement('button');
    b.type='button';
    b.className='rg-dot'+(ver[i]!==(ver[i-1]||0)?' ch':'');
    b.style.left=pos(r.at)+'%';
    b.tabIndex=i===last?0:-1;
    b.setAttribute('aria-label','Run '+label(r.at)+(i===last?' (latest)':''));
    b.onfocus=function(){show(i)};
    b.onclick=function(e){e.stopPropagation();pin(i===pinned?null:i)};
    track.appendChild(b);
    return b;
  });

  function show(i){
    var changed=i!==shown;
    shown=i;
    var latest=i===last, k=latest?null:known(i);
    if(head.textContent!==runs[i].h){
      head.textContent=runs[i].h;
      if(changed&&!still.matches&&head.animate) head.animate(
        [{opacity:0,transform:'translateY(6px)',filter:'blur(3px)'},{opacity:1,transform:'none',filter:'blur(0)'}],
        {duration:260,easing:'cubic-bezier(.16,1,.3,1)'});
    }
    // Cells: count only the tags this run already knew; later ones become dashed outlines.
    // A release from an earlier day counts as known even if no entry linked it (bug-fix-only
    // releases are sometimes only counted); on the run's own day the entries' links decide.
    var rowsKnown={}, runDay=runs[i].at.slice(0,10);
    cells.forEach(function(c){
      var tags=c.dataset.tags.split(' '), early=c.dataset.day<runDay;
      var m=k?tags.filter(function(t){return early||k[t]}).length:tags.length;
      c.classList.toggle('on',m>0);
      c.classList.toggle('later',m===0);
      c.textContent=m>1?m:'';
      var row=c.style.gridRowStart;
      rowsKnown[row]=(rowsKnown[row]||0)+m;
    });
    totals.forEach(function(t){t.textContent=latest?t.dataset.n:(rowsKnown[t.style.gridRowStart]||0)});
    dots.forEach(function(d,j){
      d.classList.toggle('fut',j>i);
      d.setAttribute('aria-pressed',j===i);
      d.tabIndex=j===i?0:-1;
    });
    var p=pos(runs[i].at);
    cur.style.left=p+'%';
    curLabel.textContent=(latest?'Latest · ':'Replaying · ')+label(runs[i].at);
    // Keep the label inside the box near the edges
    curLabel.style.transform=p>80?'translateX(calc(-100% + 10px))':p<20?'translateX(-10px)':'';
    shade.style.left=p+'%';
    shade.hidden=latest;
    grid.classList.toggle('replaying',!latest);
    back.hidden=pinned===null&&latest;
    msg.textContent=latest
      ? 'Headline '+n+' of '+n+'. Hover a run to preview it, click or tap to pin it; arrow keys step through runs.'
      : (pinned===null?'Previewing ':'Pinned to ')+label(runs[i].at)+': headline '+ver[i]+' of '+n+'. Releases found after this run are dashed.';
  }

  // Hover previews a run; a click or tap pins it until another run is picked, the same run is
  // clicked again, Esc, or "Back to latest". While a run is pinned, hovering changes nothing.
  var pinned=null;
  function pin(i){pinned=i;show(i===null?last:i)}
  function nearest(e){
    var r=track.getBoundingClientRect(), x=(e.clientX-r.left)/r.width*100, best=0, bd=1e9;
    runs.forEach(function(run,i){var dd=Math.abs(pos(run.at)-x);if(dd<bd){bd=dd;best=i}});
    return best;
  }
  track.addEventListener('pointermove',function(e){if(e.pointerType==='mouse'&&pinned===null) show(nearest(e))});
  track.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse'&&pinned===null) show(last)});
  // A click or tap between the balls pins the nearest run
  track.addEventListener('click',function(e){var i=nearest(e);pin(i===pinned?null:i)});
  track.addEventListener('keydown',function(e){
    var j={ArrowLeft:shown-1,ArrowRight:shown+1,Home:0,End:last}[e.key];
    if(e.key==='Escape'){e.preventDefault();pin(null);dots[last].focus();return}
    if(j===undefined) return;
    e.preventDefault();
    j=Math.max(0,Math.min(last,j));
    pin(j);
    dots[j].focus();
  });
  back.onclick=function(){pin(null)};

  // The week's headlines differ in length. Reserve the height of the longest one, so changing the
  // headline never moves the grid (the ball under the mouse would slide away and a click would miss).
  function fitHead(){
    var keep=head.textContent, max=0;
    head.style.minHeight='';
    runs.forEach(function(r){head.textContent=r.h;max=Math.max(max,head.offsetHeight)});
    head.textContent=keep;
    head.style.minHeight=max+'px';
  }
  var rt;
  window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(fitHead,150)});
  if(document.fonts&&document.fonts.status!=='loaded') document.fonts.ready.then(fitHead);

  track.hidden=false; over.hidden=false; cap.hidden=false;
  box.classList.add('rp-on');
  fitHead();
  show(last);
})();
