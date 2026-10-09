/* Vintxge Golf site script */
(function(){
  'use strict';
  var STORE='vx-enquiry-basket';
  var $=function(s,r){return (r||document).querySelector(s)};
  var $$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};

  /* ---------- storage (safe) ---------- */
  function load(){try{return JSON.parse(localStorage.getItem(STORE))||[]}catch(e){return []}}
  function save(items){try{localStorage.setItem(STORE,JSON.stringify(items))}catch(e){}}
  var basket=load();

  /* ---------- helpers ---------- */
  function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function money(n){return '£'+Number(n).toFixed(0)}
  function stockFor(id,size){
    var card=document.querySelector('[data-id="'+id+'"][data-stock]');
    var src=card?card.getAttribute('data-stock'):(window.VX_STOCK&&window.VX_STOCK[id]?JSON.stringify(window.VX_STOCK[id]):null);
    if(!src)return Infinity;
    try{var s=JSON.parse(src);return s[size]||0}catch(e){return Infinity}
  }
  function inBasket(key){var it=basket.filter(function(i){return i.key===key})[0];return it?it.qty:0}

  /* ---------- basket drawer ---------- */
  var drawer=$('#bkDrawer'),overlay=$('#bkOverlay');
  function openBasket(){if(!drawer)return;render();drawer.classList.add('open');overlay.classList.add('open');drawer.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
  function closeBasket(){if(!drawer)return;drawer.classList.remove('open');overlay.classList.remove('open');drawer.setAttribute('aria-hidden','true');document.body.style.overflow=''}
  window.vxOpenBasket=openBasket;

  function updateCount(){
    var n=basket.reduce(function(a,i){return a+i.qty},0);
    $$('.bk-count').forEach(function(c){c.textContent=n});
    $$('.bk-btn').forEach(function(b){b.classList.toggle('has-items',n>0)});
  }

  function render(){
    updateCount();
    var list=$('#bkList'),sum=$('#bkSum'),step=$('#bkStep');
    if(!list)return;
    if(!basket.length){
      list.innerHTML='<p class="bk-empty">Your enquiry is empty. Add pieces from the <a href="/shop" style="text-decoration:underline">collection</a>, or start a <a href="/bespoke" style="text-decoration:underline">bespoke piece</a>.</p>';
      sum.innerHTML='';step.style.display='none';return;
    }
    step.style.display='block';
    list.innerHTML=basket.map(function(i,idx){
      var v=[i.variant,i.size?('Size '+i.size):''].filter(Boolean).join(' · ');
      var price=i.type==='stock'?money(i.price)+' each · In stock':(i.type==='custom'?'Bespoke · Quotation on enquiry':'By commission · Price on enquiry');
      return '<div class="bk-item"><img src="'+esc(i.img)+'" alt=""><div><b>'+esc(i.name)+'</b><div class="bk-var">'+esc(v)+(i.brief?'<br>'+esc(i.brief):'')+'</div><div class="bk-price">'+price+'</div>'+
        '<div class="qty"><button type="button" data-q="-1" data-i="'+idx+'" aria-label="Decrease">−</button><input type="number" min="1" value="'+i.qty+'" data-i="'+idx+'" aria-label="Quantity"><button type="button" data-q="1" data-i="'+idx+'" aria-label="Increase">+</button></div></div>'+
        '<button type="button" class="bk-rm" data-rm="'+idx+'">Remove</button></div>';
    }).join('');
    var stockTotal=basket.filter(function(i){return i.type==='stock'}).reduce(function(a,i){return a+i.price*i.qty},0);
    var bespoke=basket.filter(function(i){return i.type!=='stock'}).length;
    sum.innerHTML=(stockTotal?'In stock pieces: <strong>'+money(stockTotal)+'</strong><br>':'')+
      (bespoke?'Bespoke pieces: <strong>'+bespoke+'</strong>, quoted on enquiry<br>':'')+
      'Delivery and final pricing are confirmed personally when we reply. No payment is taken online.';
  }

  function setQty(idx,q){
    var it=basket[idx];if(!it)return;
    q=Math.max(1,parseInt(q,10)||1);
    if(it.type==='stock'){var max=stockFor(it.id,it.size);if(q>max){q=max;toast('Only '+max+' in size '+it.size)}}
    it.qty=q;save(basket);render();
  }
  document.addEventListener('click',function(e){
    var t=e.target;
    if(t.closest('.bk-btn')){e.preventDefault();openBasket();return}
    if(t.closest('.bk-close')||t===overlay){closeBasket();return}
    if(t.hasAttribute&&t.hasAttribute('data-rm')){basket.splice(+t.getAttribute('data-rm'),1);save(basket);render();return}
    if(t.hasAttribute&&t.hasAttribute('data-q')&&t.hasAttribute('data-i')){var i=+t.getAttribute('data-i');setQty(i,basket[i].qty+(+t.getAttribute('data-q')));return}
  });
  document.addEventListener('change',function(e){var t=e.target;if(t.matches&&t.matches('#bkList input[data-i]'))setQty(+t.getAttribute('data-i'),t.value)});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeBasket()});

  function addItem(item){
    var ex=basket.filter(function(i){return i.key===item.key})[0];
    if(ex&&item.type!=='custom'){ex.qty+=item.qty}else{basket.push(item)}
    save(basket);updateCount();
    toast('Added to your enquiry',true);
  }
  window.vxAddItem=addItem;

  /* ---------- toast ---------- */
  var tEl=null,tTimer=null;
  function toast(msg,withLink){
    if(!tEl){tEl=document.createElement('div');tEl.className='toast';tEl.setAttribute('role','status');document.body.appendChild(tEl)}
    tEl.innerHTML='<span>'+esc(msg)+'</span>'+(withLink?'<button type="button" class="bk-btn" style="color:var(--gold)">View enquiry</button>':'');
    tEl.classList.add('show');clearTimeout(tTimer);tTimer=setTimeout(function(){tEl.classList.remove('show')},3200);
  }

  /* ---------- product cards ---------- */
  $$('.p-card').forEach(function(card){
    var type=card.getAttribute('data-type');
    var stock=card.getAttribute('data-stock')?JSON.parse(card.getAttribute('data-stock')):null;
    var img=$('.p-media img',card),hint=$('.p-hint',card),qin=$('.qty input',card);
    $$('.chips',card).forEach(function(group){
      group.addEventListener('click',function(e){
        var c=e.target.closest('.chip');if(!c||c.disabled)return;
        $$('.chip',group).forEach(function(x){x.classList.remove('on');x.setAttribute('aria-pressed','false')});
        c.classList.add('on');c.setAttribute('aria-pressed','true');
        if(c.getAttribute('data-img')&&img){img.style.opacity=.2;setTimeout(function(){img.src=c.getAttribute('data-img');img.style.opacity=1},150)}
        if(hint)hint.textContent='';
        if(stock&&group.getAttribute('data-opt')==='size'&&qin){var max=stock[c.getAttribute('data-val')]||0;qin.max=max;if(+qin.value>max)qin.value=max}
      });
    });
    $$('.qty button',card).forEach(function(b){b.addEventListener('click',function(){var v=(parseInt(qin.value,10)||1)+(+b.getAttribute('data-step'));v=Math.max(1,v);if(qin.max&&v>+qin.max)v=+qin.max;qin.value=v})});
    var add=$('.p-add',card);
    if(add)add.addEventListener('click',function(){
      var opts={};var missing=null;
      $$('.chips',card).forEach(function(g){var on=$('.chip.on',g);if(on)opts[g.getAttribute('data-opt')]=on.getAttribute('data-val');else if(!missing)missing=g.getAttribute('data-label')});
      if(missing){hint.textContent='Please choose a '+missing.toLowerCase();return}
      var qty=Math.max(1,parseInt(qin?qin.value:1,10)||1);
      var id=card.getAttribute('data-id');
      var key=id+'|'+(opts.colour||card.getAttribute('data-variant')||'')+'|'+(opts.size||'');
      if(type==='stock'){
        var max=stock[opts.size]||0,already=inBasket(key);
        if(already+qty>max){hint.textContent=max-already>0?'Only '+(max-already)+' more available in '+opts.size:'All available '+opts.size+' are already in your enquiry';return}
      }
      var chosenImg=$('.chip.on[data-img]',card);
      addItem({key:key,id:id,name:card.getAttribute('data-name'),variant:opts.colour||card.getAttribute('data-variant')||'',size:opts.size||'',qty:qty,type:type,price:type==='stock'?+card.getAttribute('data-price'):null,img:chosenImg?chosenImg.getAttribute('data-img'):card.getAttribute('data-img')});
      if(hint)hint.textContent='';
    });
  });

  /* ---------- bespoke builder ---------- */
  var builder=$('#customBuilder');
  if(builder)builder.addEventListener('submit',function(e){
    e.preventDefault();
    var f=new FormData(builder);
    var garment=f.get('garment')||'Custom piece';
    var parts=[];
    ['base_colour','accent_colour','branding','sizes','deadline','notes'].forEach(function(k){var v=(f.get(k)||'').toString().trim();if(v)parts.push({base_colour:'Base colour',accent_colour:'Accent colour',branding:'Branding',sizes:'Sizes',deadline:'Needed by',notes:'Notes'}[k]+': '+v)});
    addItem({key:'custom|'+Date.now(),id:'custom',name:'Bespoke '+garment,variant:'Your own design',size:'',qty:Math.max(1,parseInt(f.get('quantity'),10)||1),type:'custom',price:null,img:builder.getAttribute('data-img')||'commission-detail-opt.jpeg',brief:parts.join(' · ')});
    builder.reset();
    openBasket();
  });

  /* ---------- basket enquiry form ---------- */
  var bkForm=$('#basketForm');
  if(bkForm)bkForm.addEventListener('submit',async function(e){
    e.preventDefault();
    if(!basket.length)return;
    var lines=basket.map(function(i,n){
      var v=[i.variant,i.size?('Size '+i.size):''].filter(Boolean).join(', ');
      var p=i.type==='stock'?(money(i.price)+' each, in stock'):(i.type==='custom'?'bespoke, quotation required':'by commission, price on enquiry');
      return (n+1)+'. '+i.name+(v?' ('+v+')':'')+' x'+i.qty+', '+p+(i.brief?'. Brief: '+i.brief:'');
    });
    var total=basket.filter(function(i){return i.type==='stock'}).reduce(function(a,i){return a+i.price*i.qty},0);
    bkForm.querySelector('[name="basket_summary"]').value=lines.join('\n');
    bkForm.querySelector('[name="basket_items"]').value=JSON.stringify(basket.map(function(i){return {name:i.name,variant:i.variant,size:i.size,qty:i.qty,type:i.type,price:i.price,brief:i.brief||''}}));
    bkForm.querySelector('[name="in_stock_total"]').value=total?money(total):'None';
    var btn=bkForm.querySelector('button[type="submit"]');btn.disabled=true;btn.textContent='Sending…';
    try{
      var res=await fetch(bkForm.action,{method:'POST',body:new FormData(bkForm),headers:{'Accept':'application/json'}});
      if(res.ok){basket=[];save(basket);updateCount();$('#bkList').innerHTML='';$('#bkSum').innerHTML='';bkForm.style.display='none';$('#bkDone').style.display='block'}
      else{btn.disabled=false;btn.textContent='Send enquiry';alert('Something went wrong. Please message @vintxgegolf on Instagram instead.')}
    }catch(err){btn.disabled=false;btn.textContent='Send enquiry';alert('Something went wrong. Please message @vintxgegolf on Instagram instead.')}
  });

  /* ---------- simple enquiry forms (contact, members) ---------- */
  function wire(id,succId,label){
    var form=document.getElementById(id),succ=document.getElementById(succId);if(!form)return;
    form.addEventListener('submit',async function(e){
      e.preventDefault();
      var btn=form.querySelector('button[type="submit"]');btn.disabled=true;btn.textContent='Sending…';
      try{
        var res=await fetch(form.action,{method:'POST',body:new FormData(form),headers:{'Accept':'application/json'}});
        if(res.ok){[].forEach.call(form.children,function(el){if(el!==succ)el.style.display='none'});succ.style.display='block'}
        else{btn.disabled=false;btn.textContent=label;alert('Something went wrong. Please message @vintxgegolf on Instagram instead.')}
      }catch(err){btn.disabled=false;btn.textContent=label;alert('Something went wrong. Please message @vintxgegolf on Instagram instead.')}
    });
  }
  wire('cForm','fSuccess','Send');
  wire('mApplyForm','mApplySuccess','Submit application');
  wire('mEnquiryForm','mEnquirySuccess','Send');

  /* ---------- members ---------- */
  window.togglePanel=function(id){
    var panel=document.getElementById(id),btn=panel.querySelector('.members-panel-btn'),body=panel.querySelector('.members-panel-body'),isOpen=body.classList.contains('open');
    $$('.members-panel-body').forEach(function(b){b.classList.remove('open')});$$('.members-panel-btn').forEach(function(b){b.classList.remove('open')});
    if(!isOpen){body.classList.add('open');btn.classList.add('open')}
  };
  window.checkMembersCode=function(){
    var code=document.getElementById('m-code').value.trim().toUpperCase(),valid=/^([A-Z]{2})?9898$/.test(code),error=document.getElementById('mCodeError');
    if(valid){document.getElementById('mCodeGate').style.display='none';document.getElementById('mEnquiryForm').style.display='flex';document.getElementById('m-code-hidden').value=code}
    else{error.style.display='block';document.getElementById('m-code').style.borderColor='#c0392b'}
  };

  /* ---------- nav ---------- */
  var hb=$('#hamburger'),mob=$('#mobNav'),mc=$('#mobClose');
  if(hb){hb.addEventListener('click',function(){mob.classList.add('open');document.body.style.overflow='hidden'});mc.addEventListener('click',function(){mob.classList.remove('open');document.body.style.overflow=''});$$('.mob-item',mob).forEach(function(a){a.addEventListener('click',function(){mob.classList.remove('open');document.body.style.overflow=''})})}

  updateCount();
})();
