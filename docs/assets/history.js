// Release history chart on the home page. Data comes from _includes/history.html (releases.json).
(function(){
  var dataEl=document.getElementById('histData'), canvas=document.getElementById('histChart');
  if(!dataEl||!canvas) return;
  if(!window.Chart){canvas.parentNode.innerHTML='<p class="hnote">The chart could not load.</p>';return;}
  var data=JSON.parse(dataEl.textContent), root=document.documentElement, DAY=864e5;

  function d0(s){return new Date(s+'T00:00:00')}
  function iso(d){return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
  function fmt(s,year){return d0(s).toLocaleDateString('en-GB',year?{day:'numeric',month:'short',year:'numeric'}:{day:'numeric',month:'short'})}

  // One slot per day, from the first release to the build date
  var dates=data.releases.map(function(r){return r.date}).sort();
  if(!dates.length) return;
  var start=dates[0], end=data.today>dates[dates.length-1]?data.today:dates[dates.length-1];
  var days=[];
  for(var t=d0(start).getTime();t<=d0(end).getTime();t+=DAY) days.push(iso(new Date(t)));
  var N=days.length, idx={};
  days.forEach(function(d,i){idx[d]=i});

  var tools=data.tools.map(function(t){
    var v=days.map(function(){return 0}), tags=days.map(function(){return []});
    data.releases.forEach(function(r){if(r.tool===t.id&&idx[r.date]!==undefined){v[idx[r.date]]++;tags[idx[r.date]].push(r.tag)}});
    return {id:t.id,name:t.name,color:t.color,v:v,tags:tags,on:true};
  });

  var range='all', mode='cum', shape='smooth', chart;

  function css(n){return getComputedStyle(root).getPropertyValue(n).trim()}
  function group(id,items,cur,cb,show){
    var el=document.getElementById(id);
    el.classList.toggle('hidden',show===false);
    el.innerHTML='';
    items.forEach(function(it){
      var b=document.createElement('span'), on=it[1]===cur;
      b.className='hbtn'+(on?' on':'');
      b.textContent=it[0];
      b.setAttribute('role','radio');b.setAttribute('aria-checked',on);b.tabIndex=0;
      b.onclick=function(){cb(it[1])};
      b.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();cb(it[1])}};
      el.appendChild(b);
    });
  }

  function draw(){
    group('histRange',[['1 Day',1],['1 Week',7],['1 Month',30],['All since '+fmt(start,true),'all']],range,function(v){range=v;draw()});
    // 1 Week = the same day last week to today, like the brief's 7-day window (8 calendar days)
    var len=range==='all'?N:Math.min(range===1?1:range+1,N);
    group('histMode',[['Cumulative','cum'],['Daily','day']],mode,function(v){mode=v;draw()},len>1);
    group('histShape',[['Smooth','smooth'],['Steps','steps']],shape,function(v){shape=v;draw()},len>1&&mode==='cum');

    var from=N-len, ds=days.slice(from);
    document.getElementById('histTitle').textContent='Release activity · '+(len===1?fmt(ds[0],true):fmt(ds[0],true)+' to '+fmt(ds[len-1],true));

    var lg=document.getElementById('histLegend');
    lg.innerHTML='';
    tools.forEach(function(t){
      var n=t.v.slice(from).reduce(function(a,b){return a+b},0), e=document.createElement('span');
      e.className='hleg'+(t.on?'':' off');
      e.innerHTML='<i class="d" style="background:'+t.color+'"></i>'+t.name+' <b>'+n+'</b>';
      e.onclick=function(){t.on=!t.on;draw()};
      lg.appendChild(e);
    });

    var vis=tools.filter(function(t){return t.on});
    var ink=css('--ink'), muted=css('--muted'), soft=css('--soft'), line=css('--line'), card=css('--card');
    var x={ticks:{color:soft,maxRotation:0,autoSkip:true,maxTicksLimit:canvas.parentNode.clientWidth<500?4:8},grid:{display:false},border:{color:line}};
    var y={beginAtZero:true,ticks:{color:soft,precision:0},grid:{color:line},border:{display:false}};
    var tip={backgroundColor:card,titleColor:ink,bodyColor:muted,borderColor:line,borderWidth:1,
      callbacks:{title:function(c){return c.length?fmt(ds[len===1?0:c[0].dataIndex],true):''},
        afterLabel:function(c){var t=vis[len===1?c.dataIndex:c.datasetIndex];return t.tags[from+(len===1?0:c.dataIndex)].join(', ')}}};
    var labels=ds.map(function(d){return fmt(d)}), cfg;

    if(len===1){
      // One day: a bar per tool, with the date written under the bars
      cfg={type:'bar',data:{labels:vis.map(function(t){return t.name}),datasets:[{data:vis.map(function(t){return t.v[N-1]}),backgroundColor:vis.map(function(t){return t.color}),borderRadius:4,maxBarThickness:18}]},
        options:{indexAxis:'y',scales:{x:Object.assign({},y,{suggestedMax:2,title:{display:true,text:'Releases on '+fmt(ds[0],true),color:ink}}),y:{ticks:{color:muted},grid:{display:false},border:{color:line}}}}};
    }else if(mode==='cum'){
      var smooth=shape==='smooth';
      cfg={type:'line',data:{labels:labels,datasets:vis.map(function(t){var a=0;return{label:t.name,data:t.v.slice(from).map(function(n){return a+=n}),borderColor:t.color,backgroundColor:t.color,borderWidth:2.5,
          stepped:smooth?false:'after',cubicInterpolationMode:smooth?'monotone':'default',tension:smooth?.4:0,pointRadius:len<=7?3:0,pointHoverRadius:4}})},
        options:{interaction:{mode:'index',intersect:false},scales:{x:x,y:y}}};
    }else{
      cfg={type:'bar',data:{labels:labels,datasets:vis.map(function(t){return{label:t.name,data:t.v.slice(from),backgroundColor:t.color,borderColor:card,borderWidth:1}})},
        options:{interaction:{mode:'index',intersect:false},scales:{x:Object.assign({},x,{stacked:true}),y:Object.assign({},y,{stacked:true})}}};
    }
    cfg.options.responsive=true;cfg.options.maintainAspectRatio=false;cfg.options.animation={duration:250};
    cfg.options.plugins={legend:{display:false},tooltip:tip};
    if(chart) chart.destroy();
    chart=new Chart(canvas,cfg);
  }

  // Redraw with the new colors when the light / dark toggle changes data-theme
  new MutationObserver(draw).observe(root,{attributes:true,attributeFilter:['data-theme']});
  draw();
  // The chart's controls make the page taller; redo a #section jump that happened before this ran
  var target=location.hash&&document.getElementById(location.hash.slice(1));
  if(target) target.scrollIntoView();
})();
