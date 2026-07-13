/* ============================================================
   abdrx portfolio — shared interactive behavior, loaded on every page
   (index.html and all 4 project subpages, via a relative <script src>).
   Every effect below checks for its own markup before doing anything,
   so this single file works unmodified across page templates that
   don't all share the same sections — no per-page forks to keep in sync.
   ============================================================ */
(function(){
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- theme toggle ----------
  // flips data-theme, and briefly arms a global soft cross-fade
  // (skipped under reduced motion) so nothing flashes.
  (function(){
    var btn = document.getElementById('themeToggle');
    if(!btn) return;
    var root = document.documentElement;
    var to;
    btn.addEventListener('click', function(){
      var cur = root.getAttribute('data-theme');
      var next = cur === 'dark' ? 'light' : 'dark';
      if(!reduce){
        root.classList.add('theme-transition');
        clearTimeout(to);
        to = setTimeout(function(){ root.classList.remove('theme-transition'); }, 500);
      }
      root.setAttribute('data-theme', next);
      try{ localStorage.setItem('abdrx-theme', next); }catch(e){}
    });
  })();

  // ---------- mobile menu ----------
  // accessible disclosure: hamburger toggles a dropdown panel, with a
  // real Tab/Shift+Tab focus trap while it's open, close on outside
  // click, close on Escape (returning focus to the trigger), close on
  // link click, and auto-close if the viewport is resized past the
  // desktop breakpoint while the panel is open.
  (function(){
    var btn = document.getElementById('menuToggle');
    var panel = document.getElementById('mobileMenu');
    if(!btn || !panel) return;
    var lastFocus = null;

    function focusableEls(){
      return Array.prototype.slice.call(panel.querySelectorAll('a[href], button:not([disabled])'));
    }
    function openMenu(){
      lastFocus = document.activeElement;
      panel.hidden = false;
      void panel.offsetHeight; // force reflow so the opening transition runs
      requestAnimationFrame(function(){ panel.classList.add('open'); });
      btn.setAttribute('aria-expanded','true');
      btn.setAttribute('aria-label','Close menu');
      document.addEventListener('keydown', onKeydown);
      document.addEventListener('click', onOutsideClick, true);
      var els = focusableEls();
      if(els.length) els[0].focus();
    }
    function closeMenu(returnFocus){
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded','false');
      btn.setAttribute('aria-label','Open menu');
      document.removeEventListener('keydown', onKeydown);
      document.removeEventListener('click', onOutsideClick, true);
      setTimeout(function(){ panel.hidden = true; }, reduce ? 0 : 240);
      if(returnFocus && lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }
    function onKeydown(e){
      if(e.key === 'Escape'){ e.stopPropagation(); closeMenu(true); return; }
      if(e.key === 'Tab'){
        var els = focusableEls();
        if(!els.length) return;
        var first = els[0], last = els[els.length-1];
        if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
      }
    }
    function onOutsideClick(e){
      if(panel.contains(e.target) || btn.contains(e.target)) return;
      closeMenu(false);
    }
    btn.addEventListener('click', function(){
      var open = btn.getAttribute('aria-expanded') === 'true';
      if(open) closeMenu(true); else openMenu();
    });
    panel.addEventListener('click', function(e){
      if(e.target.closest('a')) closeMenu(false);
    });
    window.addEventListener('resize', function(){
      if(window.innerWidth > 880 && btn.getAttribute('aria-expanded') === 'true') closeMenu(false);
    });
  })();

  // ---------- scroll-progress bar ----------
  // CSS handles it natively where animation-timeline:scroll() is
  // supported (zero scroll-listener cost); this rAF-throttled listener
  // is the fallback everywhere else.
  (function(){
    var bar = document.querySelector('.scroll-progress .bar');
    if(!bar) return;
    if(window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()')) return;
    var ticking = false;
    function update(){
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? Math.min(h.scrollTop / max, 1) : 0;
      bar.style.transform = 'scaleX(' + p + ')';
      ticking = false;
    }
    function onScroll(){ if(!ticking){ requestAnimationFrame(update); ticking = true; } }
    update();
    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', onScroll);
  })();

  // ---------- hero glow ----------
  // a very low-opacity radial glow that follows the pointer, full-bleed to
  // the viewport width (see .hero-glow's 100vw breakout in the CSS). Listens
  // on document, not .hero, since .hero itself is still the narrower
  // .wrap-constrained box — the glow visually extends past it, and a
  // listener scoped to .hero would never fire for pointer movement in that
  // extra margin. Position is computed against the glow's own (viewport-
  // wide) rect. Desktop, fine-pointer only; skipped under reduced motion.
  // Index only — no-ops on subpages, which have no .hero-glow element.
  (function(){
    var glow = document.querySelector('.hero-glow');
    if(!glow) return;
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if(!fine || reduce) return;
    var raf = null;
    document.addEventListener('pointermove', function(e){
      if(raf) return;
      raf = requestAnimationFrame(function(){
        var r = glow.getBoundingClientRect();
        if(r.height > 0 && e.clientY >= r.top && e.clientY <= r.bottom){
          glow.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
          glow.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
        }
        raf = null;
      });
    });
  })();

  // ---------- hero entrance: name types in, then the intro line, then the
  // terminal prompt below starts cycling. Index only. The real text is
  // already in the DOM (good for no-JS/SEO/AT); under reduced motion this
  // whole sequence is skipped and everything just shows as normal static
  // text with no typing/deleting at all. ----------
  (function(){
    var l1 = document.getElementById('heroL1');
    var l2 = document.getElementById('heroL2');
    var lead = document.getElementById('heroLead');
    var typeEl = document.getElementById('heroType');
    var phrases = [
      'leads a 22-product logistics ERP at Shypv',
      'built a payment gateway, PCI-DSS certified',
      'ships full-stack, backend to frontend'
    ];

    function cyclePrompt(){
      if(!typeEl) return;
      var pi = 0, ci = 0, deleting = false;
      function tick(){
        var word = phrases[pi];
        if(!deleting){
          ci++;
          typeEl.textContent = word.slice(0, ci);
          if(ci === word.length){ deleting = true; setTimeout(tick, 1700); return; }
          setTimeout(tick, 34 + Math.random() * 38);
        } else {
          ci--;
          typeEl.textContent = word.slice(0, ci);
          if(ci === 0){ deleting = false; pi = (pi + 1) % phrases.length; setTimeout(tick, 260); return; }
          setTimeout(tick, 20);
        }
      }
      tick();
    }

    if(reduce || !l1 || !l2){
      if(typeEl) typeEl.textContent = phrases[0];
      return;
    }

    var name1 = l1.textContent, name2 = l2.textContent;
    var leadText = lead ? lead.textContent.trim() : '';
    l1.textContent = '';
    l2.textContent = '';
    if(lead) lead.textContent = '';

    function typeInto(el, text, speed, done){
      var i = 0;
      (function step(){
        el.textContent = text.slice(0, i);
        if(i <= text.length){ i++; setTimeout(step, speed); }
        else if(done){ done(); }
      })();
    }

    typeInto(l1, name1, 55, function(){
      setTimeout(function(){
        typeInto(l2, name2, 55, function(){
          setTimeout(function(){
            if(lead) typeInto(lead, leadText, 11, cyclePrompt);
            else cyclePrompt();
          }, 250);
        });
      }, 160);
    });
  })();

  // ---------- magnetic tilt on project + skill cards ----------
  // Desktop, fine-pointer only; a no-op under reduced motion. Index
  // only — subpages have no .card/.cat elements, so this harmlessly
  // finds nothing there (subpages intentionally keep the plainer
  // .browser/.gallery-shot hover-lift instead of pointer-tracked tilt).
  // Sets an inline transform on pointermove, which intentionally
  // shadows the CSS .card:hover{transform} fallback while it's active
  // (see the comment on that rule in index.html's <style>). Toggles a
  // `tilting` class so `will-change:transform` is only paid for while
  // a tilt interaction is actually in flight, not permanently.
  (function(){
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if(reduce || !fine) return;
    var els = document.querySelectorAll('.card, .cat');
    els.forEach(function(el){
      var rect = null;
      el.addEventListener('pointerenter', function(){
        rect = el.getBoundingClientRect();
        el.classList.add('tilting');
        el.style.transition = 'transform .08s linear';
      });
      el.addEventListener('pointermove', function(e){
        if(!rect) rect = el.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width;
        var y = (e.clientY - rect.top) / rect.height;
        var rx = (0.5 - y) * 8;
        var ry = (x - 0.5) * 8;
        var tx = (x - 0.5) * 6;
        var ty = (y - 0.5) * 6 - 3;
        el.style.transform = 'perspective(700px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translate3d(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px,0) scale(1.015)';
      });
      el.addEventListener('pointerleave', function(){
        rect = null;
        el.style.transition = 'transform .5s var(--ease-settled, cubic-bezier(.16,.84,.28,1))';
        el.style.transform = '';
        el.addEventListener('transitionend', function te(ev){
          if(ev.propertyName === 'transform'){
            el.style.transition = '';
            el.classList.remove('tilting');
            el.removeEventListener('transitionend', te);
          }
        });
      });
    });
  })();

  // ---------- count-up for numeric stats ----------
  // shared by the hero manifest strip (index) and the project-page
  // stat strips; triggered once each number scrolls into view.
  (function(){
    var els = document.querySelectorAll('.manifest .k, .stat-strip .k');
    if(!els.length || reduce || !('IntersectionObserver' in window)) return;
    function parse(el){
      var raw = el.textContent.trim();
      var m = raw.match(/^(\d+(?:\.\d+)?)(.*)$/);
      if(!m) return null;
      var whole = m[1];
      var dot = whole.indexOf('.');
      return {
        value: parseFloat(whole),
        decimals: dot === -1 ? 0 : whole.length - dot - 1,
        pad: dot === -1 ? whole.length : dot,
        suffix: m[2],
        raw: raw
      };
    }
    function animate(el, d){
      var start = performance.now(), dur = 850;
      function frame(t){
        var p = Math.min((t - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        var cur = d.value * eased;
        var txt = d.decimals ? cur.toFixed(d.decimals) : String(Math.round(cur));
        if(!d.decimals && txt.length < d.pad) txt = '0'.repeat(d.pad - txt.length) + txt;
        el.textContent = txt + d.suffix;
        if(p < 1) requestAnimationFrame(frame); else el.textContent = d.raw;
      }
      requestAnimationFrame(frame);
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){
          var d = parse(e.target);
          if(d) animate(e.target, d);
          io.unobserve(e.target);
        }
      });
    }, {threshold:0.6});
    els.forEach(function(el){ io.observe(el); });
  })();

  // ---------- experience timeline draw ----------
  // the connecting line draws in as you scroll through the experience
  // section (a no-op, fully drawn, under reduced motion). Index only.
  (function(){
    var tl = document.querySelector('.timeline');
    if(!tl) return;
    if(reduce){ tl.style.setProperty('--tl-progress', '1'); return; }
    var ticking = false;
    function update(){
      var r = tl.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh - r.top) / (vh + r.height);
      p = Math.max(0, Math.min(1, p));
      tl.style.setProperty('--tl-progress', p.toFixed(3));
      ticking = false;
    }
    function onScroll(){ if(!ticking){ requestAnimationFrame(update); ticking = true; } }
    update();
    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', onScroll);
  })();

  // ---------- github combined commit feed ----------
  // fetches each account's public events from GitHub's REST API, merges
  // pushes/repo-creations across all three, and renders the most recent as
  // a flat feed — replacing what used to be three separate (often near-
  // empty) contribution heatmap images. Fetched lazily on first expand of
  // the <details> (not on page load — most visitors never open it), and
  // cached in sessionStorage for a few minutes so repeat views/opens in
  // the same session don't refetch. Fails soft to a plain status line
  // pointing at the profile links below if the API is unreachable or
  // rate-limited (60 req/hr per IP, unauthenticated). Index only.
  (function(){
    var details = document.querySelector('.gh-details');
    var statusEl = document.getElementById('ghFeedStatus');
    var listEl = document.getElementById('ghFeedList');
    if(!details || !statusEl || !listEl) return;

    var USERS = ['abdrx', 'abdrx2025', 'intermo'];
    var CACHE_KEY = 'abdrx-gh-feed-v1';
    var CACHE_MS = 10 * 60 * 1000;
    var loaded = false;

    function timeAgo(iso){
      var diff = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
      var units = [[31536000,'y'],[2592000,'mo'],[604800,'w'],[86400,'d'],[3600,'h'],[60,'m']];
      for(var i = 0; i < units.length; i++){
        var v = Math.floor(diff / units[i][0]);
        if(v >= 1) return v + units[i][1] + ' ago';
      }
      return 'just now';
    }

    // GitHub logs one PushEvent per `git push`, so an active day of small
    // commits comes back as many near-identical rows ("pushed 1 commit to
    // X" repeated). Aggregate consecutive pushes to the same repo (by the
    // same account) into a single summed entry instead.
    function aggregate(rawEvents){
      var pushGroups = {};
      var creates = [];
      rawEvents.forEach(function(e){
        var repo = e.repo && e.repo.name;
        var who = e.actor && e.actor.login;
        if(!repo || !who) return;
        if(e.type === 'PushEvent'){
          var commits = (e.payload && e.payload.commits) || [];
          var n = commits.length || 1;
          var last = commits[commits.length - 1];
          var key = who + '/' + repo;
          var g = pushGroups[key];
          if(!g){ g = pushGroups[key] = {repo: repo, who: who, commits: 0, when: e.created_at, sha: null}; }
          g.commits += n;
          if(new Date(e.created_at) > new Date(g.when)){
            g.when = e.created_at;
            if(last && last.sha) g.sha = last.sha;
          } else if(!g.sha && last && last.sha){
            g.sha = last.sha;
          }
        } else if(e.type === 'CreateEvent' && e.payload && e.payload.ref_type === 'repository'){
          creates.push({repo: repo, who: who, when: e.created_at});
        }
      });
      var items = Object.keys(pushGroups).map(function(k){
        var g = pushGroups[k];
        var url = g.sha ? 'https://github.com/' + g.repo + '/commit/' + g.sha : 'https://github.com/' + g.repo;
        return {
          url: url,
          text: 'pushed ' + g.commits + ' commit' + (g.commits === 1 ? '' : 's') + ' to <b>' + g.repo + '</b>',
          who: g.who,
          when: g.when
        };
      });
      creates.forEach(function(c){
        items.push({url: 'https://github.com/' + c.repo, text: 'created <b>' + c.repo + '</b>', who: c.who, when: c.when});
      });
      items.sort(function(a, b){ return new Date(b.when) - new Date(a.when); });
      return items;
    }

    function render(events){
      if(!events.length){
        statusEl.textContent = 'No recent public activity — see the profiles below.';
        return;
      }
      listEl.innerHTML = events.map(function(e){
        return '<li class="gh-feed-item"><a href="' + e.url + '" target="_blank" rel="noopener">' +
          '<span class="gh-feed-text">' + e.text + '</span>' +
          '<span class="gh-feed-meta"><span class="gh-feed-who">@' + e.who + '</span><span>' + timeAgo(e.when) + '</span></span>' +
          '</a></li>';
      }).join('');
      listEl.hidden = false;
      statusEl.hidden = true;
    }

    function fetchLive(){
      Promise.all(USERS.map(function(u){
        return fetch('https://api.github.com/users/' + u + '/events/public')
          .then(function(r){ return r.ok ? r.json() : []; })
          .catch(function(){ return []; });
      })).then(function(results){
        var raw = [];
        results.forEach(function(list){ raw = raw.concat(list || []); });
        var events = aggregate(raw).slice(0, 8);
        try{ sessionStorage.setItem(CACHE_KEY, JSON.stringify({t: Date.now(), events: events})); }catch(e){}
        render(events);
      }).catch(function(){
        statusEl.textContent = "Couldn't load live activity right now — see the profiles below.";
      });
    }

    function load(){
      try{
        var cached = sessionStorage.getItem(CACHE_KEY);
        if(cached){
          var parsed = JSON.parse(cached);
          if(Date.now() - parsed.t < CACHE_MS){ render(parsed.events); return; }
        }
      }catch(e){}
      fetchLive();
    }

    details.addEventListener('toggle', function(){
      if(details.open && !loaded){ loaded = true; load(); }
    });
  })();

  // ---------- scrollspy ----------
  // highlights the active nav link. Index only — subpages' nav links
  // point at ../index.html#section, so the a[href^="#"] selector below
  // naturally matches nothing there.
  (function(){
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"], .mobile-menu a[href^="#"]'));
    if(!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function(a){ var id=a.getAttribute('href').slice(1); var s=document.getElementById(id); if(s) map[id]=a; });
    var spy = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting){
          links.forEach(function(a){ a.style.color=''; });
          var a = map[e.target.id];
          if(a && !a.classList.contains('gh')) a.style.color='var(--text)';
        }
      });
    },{rootMargin:'-45% 0px -50% 0px'});
    Object.keys(map).forEach(function(id){ spy.observe(document.getElementById(id)); });
  })();

  // ---------- scroll reveal ----------
  // adds .in as each .reveal element scrolls into view, staggered by
  // sibling index. Toggles a `will-anim` class for the duration of the
  // transition only, so will-change isn't paid for permanently.
  (function(){
    var els = document.querySelectorAll('.reveal');
    if(!els.length) return;
    if(reduce || !('IntersectionObserver' in window)){ els.forEach(function(el){el.classList.add('in')}); return; }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){
          var el = e.target;
          var sibs = Array.prototype.slice.call(el.parentNode.querySelectorAll('.reveal'));
          var i = sibs.indexOf(el);
          el.style.transitionDelay = Math.min(i,5)*70 + 'ms';
          el.classList.add('will-anim');
          el.classList.add('in');
          el.addEventListener('transitionend', function onEnd(ev){
            if(ev.target !== el) return;
            el.classList.remove('will-anim');
            el.style.transitionDelay = '';
            el.removeEventListener('transitionend', onEnd);
          });
          io.unobserve(el);
        }
      });
    },{threshold:0.12, rootMargin:'0px 0px -10% 0px'});
    els.forEach(function(el){io.observe(el)});
  })();

})();
