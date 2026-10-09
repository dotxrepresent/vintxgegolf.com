
/* ===== SHARED KIT: reCAPTCHA and cookie notice ===== */
(function(){
  var SITE_KEY='6Lfe2uUtAAAAANqd8pV9O2XDxK7TEW1LigMhl99Z';
  var forms=[].slice.call(document.querySelectorAll('form[action*="formspree.io"]'));

  /* add honeypot, reCAPTCHA box and notice to every enquiry form */
  forms.forEach(function(f){
    if(!f.querySelector('input[name="_gotcha"]')){
      var hp=document.createElement('div');hp.className='kit-hp';hp.setAttribute('aria-hidden','true');
      hp.innerHTML='<label>Leave this field empty <input type="text" name="_gotcha" tabindex="-1" autocomplete="off"></label>';
      f.appendChild(hp);
    }
    var btn=f.querySelector('button[type="submit"],input[type="submit"]');
    var anchor=btn;while(anchor&&anchor.parentNode!==f)anchor=anchor.parentNode;
    var wrap=document.createElement('div');wrap.className='rc-wrap';
    wrap.innerHTML='<div class="rc-widget"></div><p class="rc-msg" role="alert">Please tick the box to confirm you are not a robot.</p>'+
      '<p class="rc-note">This site is protected by reCAPTCHA and the Google <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> apply.</p>';
    if(anchor)f.insertBefore(wrap,anchor);else f.appendChild(wrap);
    f._rcWrap=wrap;
  });

  window.kitRecaptchaReady=function(){
    forms.forEach(function(f){
      try{f._rcId=grecaptcha.render(f._rcWrap.querySelector('.rc-widget'),{sitekey:SITE_KEY,theme:'light',callback:function(){f._rcWrap.querySelector('.rc-msg').classList.remove('show')}})}catch(err){}
    });
  };
  if(forms.length){
    var s=document.createElement('script');
    s.src='https://www.google.com/recaptcha/api.js?onload=kitRecaptchaReady&render=explicit';
    s.async=true;s.defer=true;document.head.appendChild(s);
  }

  /* runs before each form's own send script */
  document.addEventListener('submit',function(e){
    var f=e.target;if(forms.indexOf(f)<0)return;
    var hp=f.querySelector('input[name="_gotcha"]');
    if(hp&&hp.value){e.preventDefault();e.stopImmediatePropagation();return}
    var ok=window.grecaptcha&&f._rcId!==undefined&&grecaptcha.getResponse(f._rcId);
    if(!ok){
      e.preventDefault();e.stopImmediatePropagation();
      f._rcWrap.querySelector('.rc-msg').classList.add('show');
      f._rcWrap.scrollIntoView({block:'center',behavior:'smooth'});
      return;
    }
    /* tokens are single use: refresh the box if the form is still showing afterwards */
    setTimeout(function(){if(f.offsetParent!==null){try{grecaptcha.reset(f._rcId)}catch(err){}}},6000);
  },true);

  /* cookie notice */
  var KEY='cookie-notice-ok',seen=false;
  try{seen=localStorage.getItem(KEY)==='1'}catch(err){}
  if(seen)return;
  var bar=document.createElement('div');bar.className='ck-bar';bar.setAttribute('role','region');bar.setAttribute('aria-label','Cookie notice');
  bar.innerHTML='<p>We only use essential cookies, including Google reCAPTCHA to protect our forms from spam. We do not use analytics, tracking or advertising cookies. <a href="#" class="ck-priv">Privacy and cookies</a></p><button type="button">OK</button>';
  document.body.appendChild(bar);
  requestAnimationFrame(function(){requestAnimationFrame(function(){bar.classList.add('show')})});
  bar.querySelector('.ck-priv').addEventListener('click',function(e){e.preventDefault();window.location.href='/privacy-policy';});
  bar.querySelector('button').addEventListener('click',function(){
    try{localStorage.setItem(KEY,'1')}catch(err){}
    bar.classList.remove('show');setTimeout(function(){bar.remove()},500);
  });
})();
