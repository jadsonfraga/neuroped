/* ============================================================
   NeuroPed SDG — testes-diretos-engine.js
   ------------------------------------------------------------
   Motor dos 5 mini-testes diretos APLICADOS NA CRIANÇA.

   Filosofia clínica:
     - Apoio observacional, NÃO normatização psicométrica.
     - Cada teste gera um resultado bruto + linha p/ o laudo.
     - Sem rede, sem dado pessoal — só rodando no dispositivo.

   Testes inclusos:
     1) 🔢 Span de Dígitos        — memória operacional (forward/back)
     2) 🧠 Memória de Figuras     — memória visual de curto prazo
     3) 🔍 Atenção Visual         — busca seletiva (achar o alvo no grid)
     4) 🌗 Inibição (Dia/Noite)   — controle inibitório verbal
     5) 🎵 Consciência Fonológica — som inicial + rima

   API: testes-diretos.html monta cada teste invocando o builder dele.
   ============================================================ */
(function(){
  'use strict';
  if (window.NPDirectTestEngine) return;

  /* ---------- Util ---------- */
  function $(s, root){ return (root || document).querySelector(s); }
  function el(tag, attrs, kids){
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function(k){
      if (k === 'style') Object.assign(e.style, attrs[k]);
      else if (k === 'class') e.className = attrs[k];
      else if (k.indexOf('on') === 0) e[k] = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function(c){
      if (c == null) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }
  function shuffle(arr){
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }
  function sleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }

  /* Save result for laudo */
  var RESULTS_KEY = 'np_direct_tests_session_v1';
  function saveResult(testId, result){
    try {
      var all = JSON.parse(localStorage.getItem(RESULTS_KEY) || '{}');
      all[testId] = Object.assign({}, result, { at: Date.now() });
      localStorage.setItem(RESULTS_KEY, JSON.stringify(all));
    } catch(e){}
  }
  function loadAllResults(){
    try { return JSON.parse(localStorage.getItem(RESULTS_KEY) || '{}'); } catch(e){ return {}; }
  }
  function clearResults(){
    try { localStorage.removeItem(RESULTS_KEY); } catch(e){}
  }

  /* Microcelebration helpers */
  function celebrate(host, emoji, msg){
    var pop = el('div', {
      class: 'np-celebrate',
      style: {
        position: 'absolute', inset: '0', display: 'grid', placeItems: 'center',
        pointerEvents: 'none', zIndex: '5', animation: 'npCelebrate .8s ease-out'
      }
    }, [
      el('div', {
        style: {
          background: 'rgba(231,201,139,.18)',
          border: '1px solid rgba(231,201,139,.5)',
          borderRadius: '999px',
          padding: '14px 20px',
          font: '800 16px system-ui',
          color: '#f2dca6',
          boxShadow: '0 20px 50px -15px rgba(231,201,139,.6)'
        }
      }, [emoji + '  ' + msg])
    ]);
    host.style.position = host.style.position || 'relative';
    host.appendChild(pop);
    setTimeout(function(){ pop.remove(); }, 1400);
  }

  /* ============================================================
     TEST 1 — Span de Dígitos (forward + backward)
     ============================================================ */
  function buildDigitSpan(host, opts){
    opts = opts || {};
    host.innerHTML = '';
    var state = { phase: 'idle', mode: 'forward', currentLen: 3, attempts: 0, maxForward: 0, maxBackward: 0, lastSeq: [], userInput: [], showingIdx: 0, done: false };

    function render(){
      host.innerHTML = '';
      var modeChip = el('div', {
        style: { display: 'flex', gap: '8px', marginBottom: '10px', justifyContent: 'center', flexWrap: 'wrap' }
      }, [
        el('span', { style: badgeStyle(state.mode === 'forward') }, ['➡️ Direta']),
        el('span', { style: badgeStyle(state.mode === 'backward') }, ['⬅️ Inversa']),
        el('span', { style: { background:'rgba(231,201,139,.10)', color:'#e7c98b', padding:'4px 10px', borderRadius:'999px', fontSize:'12px', fontWeight:'800' } }, ['Tamanho: ' + state.currentLen])
      ]);
      host.appendChild(modeChip);

      if (state.phase === 'idle') {
        host.appendChild(el('div', { style: { textAlign:'center', padding:'30px 14px' } }, [
          el('p', { style: { color:'#cdc8ee', fontSize:'14px', margin:'0 0 14px' } }, [
            state.mode === 'forward'
              ? 'Vou mostrar uma sequência de números. Peça pra criança REPETIR na mesma ordem.'
              : 'Agora a sequência deve ser repetida DE TRÁS PRA FRENTE. Mais difícil.'
          ]),
          el('button', {
            class: 'np-cta',
            style: ctaStyle(),
            onclick: showSeq
          }, ['▶ Começar sequência'])
        ]));
        return;
      }

      if (state.phase === 'showing') {
        var bigBox = el('div', {
          style: {
            display:'grid', placeItems:'center', minHeight:'200px',
            background:'linear-gradient(135deg,#0b0a1a,#15143a)',
            borderRadius:'18px', border:'1px solid rgba(124,118,210,.3)',
            font:'900 72px/1 "Inter",system-ui', color:'#f2dca6',
            textShadow:'0 0 30px rgba(231,201,139,.5)'
          }
        }, [state.lastSeq[state.showingIdx] != null ? String(state.lastSeq[state.showingIdx]) : '•']);
        host.appendChild(bigBox);
        host.appendChild(el('p', { style: { color:'#8b86b8', textAlign:'center', fontSize:'12px', marginTop:'10px' } }, ['Memorize…']));
        return;
      }

      if (state.phase === 'input') {
        var prompt = el('p', { style: { color:'#cdc8ee', textAlign:'center', fontSize:'15px', margin:'0 0 14px' } }, [
          state.mode === 'forward' ? '👂 Repita na mesma ordem:' : '🔄 Repita de trás pra frente:'
        ]);
        host.appendChild(prompt);

        var inputBox = el('div', {
          style: {
            display:'flex', gap:'8px', justifyContent:'center', minHeight:'52px',
            padding:'12px', background:'rgba(20,18,46,.6)', borderRadius:'12px',
            border:'1px solid rgba(124,118,210,.3)', marginBottom:'12px',
            flexWrap:'wrap'
          }
        });
        state.userInput.forEach(function(d){
          inputBox.appendChild(el('span', {
            style: {
              width:'42px', height:'42px', display:'grid', placeItems:'center',
              background:'#7c79ff', color:'#fff', borderRadius:'10px',
              font:'800 22px system-ui', boxShadow:'0 6px 16px -6px rgba(124,118,210,.6)'
            }
          }, [String(d)]));
        });
        for (var i = state.userInput.length; i < state.lastSeq.length; i++) {
          inputBox.appendChild(el('span', {
            style: {
              width:'42px', height:'42px', borderRadius:'10px',
              background:'rgba(124,118,210,.10)', border:'1px dashed rgba(124,118,210,.3)'
            }
          }));
        }
        host.appendChild(inputBox);

        var pad = el('div', { style: { display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'8px' } });
        for (var n = 0; n <= 9; n++) {
          (function(num){
            pad.appendChild(el('button', {
              style: digitBtnStyle(),
              onclick: function(){
                if (state.userInput.length >= state.lastSeq.length) return;
                state.userInput.push(num);
                render();
                if (state.userInput.length === state.lastSeq.length) setTimeout(judge, 300);
              }
            }, [String(num)]));
          })(n);
        }
        host.appendChild(pad);

        host.appendChild(el('div', { style: { display:'flex', gap:'8px', marginTop:'10px', justifyContent:'center' } }, [
          el('button', {
            style: ghostBtnStyle(),
            onclick: function(){ state.userInput.pop(); render(); }
          }, ['⌫ Apagar']),
          el('button', {
            style: ghostBtnStyle(),
            onclick: function(){ state.userInput = []; render(); }
          }, ['🔄 Limpar'])
        ]));
        return;
      }

      if (state.phase === 'feedback') {
        var ok = isCorrect();
        host.appendChild(el('div', {
          style: {
            textAlign:'center', padding:'30px 14px', borderRadius:'18px',
            background: ok ? 'rgba(52,211,153,.10)' : 'rgba(248,113,113,.10)',
            border: '1px solid ' + (ok ? 'rgba(52,211,153,.4)' : 'rgba(248,113,113,.4)')
          }
        }, [
          el('div', { style: { fontSize:'56px', marginBottom:'8px' } }, [ok ? '✨' : '🌱']),
          el('p', { style: { color:'#fff', fontSize:'18px', fontWeight:'800', margin:'0 0 6px' } }, [
            ok ? 'Acertou!' : 'Não foi dessa vez'
          ]),
          el('p', { style: { color:'#cdc8ee', fontSize:'13px', margin:'4px 0 14px' } }, [
            'Sequência correta: ' + state.lastSeq.join(' - ')
          ]),
          el('button', { style: ctaStyle(), onclick: next }, [ok ? '▶ Próxima (mais longa)' : '🏁 Encerrar'])
        ]));
      }

      if (state.phase === 'done') {
        renderSummary();
      }
    }

    function isCorrect(){
      var expected = state.mode === 'forward' ? state.lastSeq.slice() : state.lastSeq.slice().reverse();
      if (state.userInput.length !== expected.length) return false;
      for (var i = 0; i < expected.length; i++) if (state.userInput[i] !== expected[i]) return false;
      return true;
    }

    function showSeq(){
      state.lastSeq = [];
      while (state.lastSeq.length < state.currentLen) {
        var d = Math.floor(Math.random() * 10);
        // evita repetição de adjacente
        if (!state.lastSeq.length || state.lastSeq[state.lastSeq.length - 1] !== d) state.lastSeq.push(d);
      }
      state.userInput = [];
      state.showingIdx = 0;
      state.phase = 'showing';
      render();
      var t = setInterval(function(){
        state.showingIdx++;
        if (state.showingIdx >= state.lastSeq.length) {
          clearInterval(t);
          setTimeout(function(){ state.phase = 'input'; render(); }, 350);
        } else {
          render();
        }
      }, 900);
    }

    function judge(){
      var ok = isCorrect();
      state.attempts++;
      if (ok) {
        if (state.mode === 'forward') state.maxForward = Math.max(state.maxForward, state.currentLen);
        else state.maxBackward = Math.max(state.maxBackward, state.currentLen);
        celebrate(host, '🌟', 'Acertou!');
      }
      state.phase = 'feedback';
      render();
    }

    function next(){
      var ok = isCorrect();
      if (ok && state.currentLen < 9) {
        state.currentLen++;
        state.phase = 'idle';
        render();
      } else {
        // erro — troca de modo ou termina
        if (state.mode === 'forward') {
          state.mode = 'backward';
          state.currentLen = 3;
          state.phase = 'idle';
          render();
        } else {
          state.phase = 'done';
          finish();
          render();
        }
      }
    }

    function finish(){
      state.done = true;
      saveResult('digit-span', {
        maxForward: state.maxForward,
        maxBackward: state.maxBackward,
        attempts: state.attempts,
        label: 'Span de Dígitos',
        line: 'Span direto: ' + state.maxForward + ' dígitos · Span inverso: ' + state.maxBackward + ' dígitos (' + state.attempts + ' tentativas)'
      });
    }

    function renderSummary(){
      host.appendChild(el('div', {
        style: {
          background:'linear-gradient(180deg,rgba(231,201,139,.10),rgba(124,118,210,.06))',
          border:'1px solid rgba(231,201,139,.4)', borderRadius:'18px', padding:'22px',
          textAlign:'center'
        }
      }, [
        el('div', { style: { fontSize:'48px', marginBottom:'8px' } }, ['🏆']),
        el('h3', { style: { margin:'0 0 14px', color:'#f2dca6', font:'700 20px Georgia,serif' } }, ['Span de Dígitos — Resultado']),
        el('div', { style: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', maxWidth:'400px', margin:'0 auto' } }, [
          el('div', { style: scoreBlock() }, [
            el('strong', { style: { display:'block', fontSize:'34px', color:'#f2dca6' } }, [String(state.maxForward)]),
            el('span', { style: { fontSize:'12px', color:'#cdc8ee' } }, ['Direta (forward)'])
          ]),
          el('div', { style: scoreBlock() }, [
            el('strong', { style: { display:'block', fontSize:'34px', color:'#f2dca6' } }, [String(state.maxBackward)]),
            el('span', { style: { fontSize:'12px', color:'#cdc8ee' } }, ['Inversa (backward)'])
          ])
        ]),
        el('p', { style: { color:'#a9a4d8', fontSize:'12.5px', margin:'14px 0 0', lineHeight:'1.55' } }, [
          'Referência clínica: span direto esperado ≈ idade em anos + 2; inverso ≈ idade − 1. Use como apoio, não como ponto de corte.'
        ]),
        el('button', { style: Object.assign({}, ctaStyle(), { marginTop:'14px' }), onclick: function(){ state = { phase:'idle', mode:'forward', currentLen:3, attempts:0, maxForward:0, maxBackward:0, lastSeq:[], userInput:[], showingIdx:0, done:false }; render(); } }, ['🔄 Refazer'])
      ]));
    }

    render();
  }

  /* ============================================================
     TEST 2 — Memória de Figuras
     ============================================================ */
  function buildPictureMemory(host){
    var POOL = ['🐶','🐱','🐰','🦊','🐻','🐼','🐯','🐸','🐵','🦁','🐮','🐷','🐔','🐧','🦆','🦉','🐢','🦋','🐝','🐞'];
    var state = { phase: 'idle', round: 1, totalRounds: 3, score: 0, target: [], options: [], pickedRight: 0, pickedWrong: 0, done: false };

    function render(){
      host.innerHTML = '';
      host.appendChild(headerProg(state.round, state.totalRounds, state.score));

      if (state.phase === 'idle') {
        host.appendChild(centerCard([
          el('div', { style: { fontSize:'56px', marginBottom:'8px' } }, ['🧠']),
          el('h3', { style: titleStyle() }, ['Memória de Figuras']),
          el('p', { style: descStyle() }, [
            'Vou mostrar 4 figurinhas por 4 segundos. Depois você precisa lembrar QUAIS apareceram.'
          ]),
          el('button', { style: ctaStyle(), onclick: startRound }, ['▶ Mostrar figurinhas'])
        ]));
        return;
      }

      if (state.phase === 'showing') {
        var grid = el('div', { style: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginTop:'12px' } });
        state.target.forEach(function(emoji){
          grid.appendChild(el('div', {
            style: {
              fontSize:'56px', height:'90px', display:'grid', placeItems:'center',
              background:'linear-gradient(135deg,rgba(124,118,210,.18),rgba(91,84,232,.14))',
              borderRadius:'14px', border:'1px solid rgba(124,118,210,.3)',
              animation:'npPop .4s ease-out'
            }
          }, [emoji]));
        });
        host.appendChild(grid);
        host.appendChild(el('p', { style: descStyle() }, ['👀 Memorize…']));
        return;
      }

      if (state.phase === 'pick') {
        host.appendChild(el('p', { style: descStyle() }, ['Toque nas que apareceram (' + state.target.length + '):']));
        var grid = el('div', { style: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginTop:'8px' } });
        state.options.forEach(function(emoji){
          var btn = el('button', {
            style: {
              fontSize:'46px', height:'82px', cursor:'pointer',
              background:'rgba(20,18,46,.4)', color:'#fff', border:'1px solid rgba(124,118,210,.3)',
              borderRadius:'14px', transition:'all .15s'
            },
            'data-emoji': emoji,
            onclick: function(){ pick(emoji, btn); }
          }, [emoji]);
          grid.appendChild(btn);
        });
        host.appendChild(grid);
        host.appendChild(el('div', { style: { display:'flex', justifyContent:'center', marginTop:'14px' } }, [
          el('button', { style: ctaStyle(), onclick: finishRound }, ['✓ Confirmar (' + state.pickedRight + '/' + state.target.length + ')'])
        ]));
        return;
      }

      if (state.phase === 'feedback') {
        var allRight = state.pickedRight === state.target.length && state.pickedWrong === 0;
        host.appendChild(centerCard([
          el('div', { style: { fontSize:'56px', marginBottom:'8px' } }, [allRight ? '🌟' : (state.pickedRight ? '🌱' : '🤔')]),
          el('h3', { style: titleStyle() }, [allRight ? 'Perfeito!' : (state.pickedRight + ' de ' + state.target.length + ' certas')]),
          el('p', { style: descStyle() }, ['Apareceram: ' + state.target.join(' ')]),
          el('button', { style: ctaStyle(), onclick: nextRound }, [state.round >= state.totalRounds ? '🏁 Ver resultado' : '▶ Próxima rodada'])
        ]));
        return;
      }

      if (state.phase === 'done') renderSummary();
    }

    function startRound(){
      state.pickedRight = 0; state.pickedWrong = 0;
      var pool = shuffle(POOL);
      state.target = pool.slice(0, 4);
      state.options = shuffle(state.target.concat(pool.slice(4, 8)));
      state.phase = 'showing';
      render();
      setTimeout(function(){ state.phase = 'pick'; render(); }, 4000);
    }

    function pick(emoji, btn){
      if (btn.dataset.picked) return;
      btn.dataset.picked = '1';
      btn.style.opacity = '.55';
      if (state.target.indexOf(emoji) >= 0) {
        state.pickedRight++;
        btn.style.background = 'rgba(52,211,153,.25)';
        btn.style.borderColor = '#34d399';
      } else {
        state.pickedWrong++;
        btn.style.background = 'rgba(248,113,113,.22)';
        btn.style.borderColor = '#f87171';
      }
      render(); // atualiza contador
    }

    function finishRound(){
      var roundScore = Math.max(0, state.pickedRight - state.pickedWrong);
      state.score += roundScore;
      if (state.pickedRight === state.target.length && state.pickedWrong === 0) celebrate(host, '🌟', 'Tudo certo!');
      state.phase = 'feedback';
      render();
    }

    function nextRound(){
      if (state.round >= state.totalRounds) {
        state.phase = 'done';
        finish();
        render();
      } else {
        state.round++;
        state.phase = 'idle';
        render();
      }
    }

    function finish(){
      saveResult('picture-memory', {
        score: state.score,
        maxPossible: state.totalRounds * 4,
        label: 'Memória de Figuras',
        line: 'Memória visual: ' + state.score + '/' + (state.totalRounds * 4) + ' (' + state.totalRounds + ' rodadas de 4 figuras)'
      });
    }

    function renderSummary(){
      var pct = Math.round(100 * state.score / (state.totalRounds * 4));
      host.appendChild(el('div', {
        style: {
          background:'linear-gradient(180deg,rgba(231,201,139,.10),rgba(124,118,210,.06))',
          border:'1px solid rgba(231,201,139,.4)', borderRadius:'18px', padding:'22px', textAlign:'center'
        }
      }, [
        el('div', { style: { fontSize:'48px', marginBottom:'8px' } }, ['🏆']),
        el('h3', { style: titleStyle() }, ['Memória de Figuras — Resultado']),
        el('div', { style: scoreBlock(true) }, [
          el('strong', { style: { display:'block', fontSize:'42px', color:'#f2dca6' } }, [pct + '%']),
          el('span', { style: { fontSize:'12px', color:'#cdc8ee' } }, [state.score + ' / ' + (state.totalRounds * 4) + ' pontos'])
        ]),
        el('button', { style: Object.assign({}, ctaStyle(), { marginTop:'14px' }), onclick: function(){ state = { phase:'idle', round:1, totalRounds:3, score:0, target:[], options:[], pickedRight:0, pickedWrong:0, done:false }; render(); } }, ['🔄 Refazer'])
      ]));
    }

    render();
  }

  /* ============================================================
     TEST 3 — Atenção Visual (encontre o alvo)
     ============================================================ */
  function buildVisualSearch(host){
    var TARGETS = [
      { target: '🐱', distractor: '🐶', name: 'gatinho entre os cachorrinhos' },
      { target: '🍎', distractor: '🍏', name: 'maçã vermelha entre as verdes' },
      { target: '⭐', distractor: '✨', name: 'estrela cheia entre as brilhantes' },
      { target: '🐝', distractor: '🦋', name: 'abelhinha entre as borboletas' },
      { target: '🌷', distractor: '🌹', name: 'tulipa entre as rosas' }
    ];
    var GRID_SIZE = 25; // 5x5
    var state = { phase: 'idle', round: 1, totalRounds: 5, targetCfg: null, grid: [], targetIdx: -1, startTime: 0, times: [], misses: 0, done: false };

    function render(){
      host.innerHTML = '';
      host.appendChild(headerProg(state.round, state.totalRounds));

      if (state.phase === 'idle') {
        host.appendChild(centerCard([
          el('div', { style: { fontSize:'56px', marginBottom:'8px' } }, ['🔍']),
          el('h3', { style: titleStyle() }, ['Atenção Visual']),
          el('p', { style: descStyle() }, [
            'Em cada rodada, eu te digo o que procurar. Toque ASSIM QUE achar.'
          ]),
          el('button', { style: ctaStyle(), onclick: startRound }, ['▶ Começar'])
        ]));
        return;
      }

      if (state.phase === 'search') {
        host.appendChild(el('div', {
          style: { textAlign:'center', padding:'10px 14px', marginBottom:'12px', background:'rgba(124,118,210,.10)', borderRadius:'12px', border:'1px solid rgba(124,118,210,.24)' }
        }, [
          el('p', { style: { margin:'0', color:'#f2dca6', fontWeight:'800', fontSize:'14px' } }, ['Encontre: ' + state.targetCfg.target + ' (' + state.targetCfg.name + ')'])
        ]));
        var grid = el('div', { style: { display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'4px' } });
        state.grid.forEach(function(emoji, i){
          var btn = el('button', {
            style: {
              fontSize:'30px', aspectRatio:'1', cursor:'pointer',
              background:'rgba(20,18,46,.5)', border:'1px solid rgba(124,118,210,.2)',
              borderRadius:'8px', padding:'0', transition:'all .12s'
            },
            onclick: function(){ click(i, btn); }
          }, [emoji]);
          grid.appendChild(btn);
        });
        host.appendChild(grid);
        return;
      }

      if (state.phase === 'feedback') {
        var t = state.times[state.times.length - 1];
        host.appendChild(centerCard([
          el('div', { style: { fontSize:'56px', marginBottom:'8px' } }, ['⚡']),
          el('h3', { style: titleStyle() }, ['Achou em ' + t.toFixed(1) + 's']),
          state.misses ? el('p', { style: descStyle() }, [state.misses + ' toque(s) errado(s) na rodada']) : null,
          el('button', { style: ctaStyle(), onclick: nextRound }, [state.round >= state.totalRounds ? '🏁 Ver resultado' : '▶ Próxima'])
        ]));
        return;
      }

      if (state.phase === 'done') renderSummary();
    }

    function startRound(){
      state.targetCfg = TARGETS[(state.round - 1) % TARGETS.length];
      state.grid = [];
      for (var i = 0; i < GRID_SIZE; i++) state.grid.push(state.targetCfg.distractor);
      state.targetIdx = Math.floor(Math.random() * GRID_SIZE);
      state.grid[state.targetIdx] = state.targetCfg.target;
      state.startTime = Date.now();
      state.misses = 0;
      state.phase = 'search';
      render();
    }

    function click(i, btn){
      if (i === state.targetIdx) {
        var t = (Date.now() - state.startTime) / 1000;
        state.times.push(t);
        btn.style.background = 'rgba(52,211,153,.45)';
        btn.style.borderColor = '#34d399';
        celebrate(host, '⚡', 'Achou!');
        setTimeout(function(){ state.phase = 'feedback'; render(); }, 500);
      } else {
        state.misses++;
        btn.style.background = 'rgba(248,113,113,.25)';
        btn.style.borderColor = '#f87171';
        setTimeout(function(){
          btn.style.background = 'rgba(20,18,46,.5)';
          btn.style.borderColor = 'rgba(124,118,210,.2)';
        }, 400);
      }
    }

    function nextRound(){
      if (state.round >= state.totalRounds) {
        state.phase = 'done';
        finish();
        render();
      } else {
        state.round++;
        state.phase = 'idle';
        render();
      }
    }

    function finish(){
      var avg = state.times.reduce(function(a,b){return a+b;}, 0) / state.times.length;
      saveResult('visual-search', {
        avgTime: avg,
        times: state.times,
        totalMisses: state.misses,
        rounds: state.totalRounds,
        label: 'Atenção Visual',
        line: 'Busca visual: ' + avg.toFixed(1) + 's média (' + state.totalRounds + ' rodadas)'
      });
    }

    function renderSummary(){
      var avg = state.times.reduce(function(a,b){return a+b;}, 0) / state.times.length;
      host.appendChild(el('div', {
        style: {
          background:'linear-gradient(180deg,rgba(231,201,139,.10),rgba(124,118,210,.06))',
          border:'1px solid rgba(231,201,139,.4)', borderRadius:'18px', padding:'22px', textAlign:'center'
        }
      }, [
        el('div', { style: { fontSize:'48px', marginBottom:'8px' } }, ['🏆']),
        el('h3', { style: titleStyle() }, ['Atenção Visual — Resultado']),
        el('div', { style: scoreBlock(true) }, [
          el('strong', { style: { display:'block', fontSize:'42px', color:'#f2dca6' } }, [avg.toFixed(1) + 's']),
          el('span', { style: { fontSize:'12px', color:'#cdc8ee' } }, ['Tempo médio em ' + state.totalRounds + ' rodadas'])
        ]),
        el('p', { style: { color:'#a9a4d8', fontSize:'12.5px', margin:'14px 0 0' } }, [
          'Tempos médios <3s sugerem boa atenção visual seletiva pra idade escolar.'
        ]),
        el('button', { style: Object.assign({}, ctaStyle(), { marginTop:'14px' }), onclick: function(){ state = { phase:'idle', round:1, totalRounds:5, targetCfg:null, grid:[], targetIdx:-1, startTime:0, times:[], misses:0, done:false }; render(); } }, ['🔄 Refazer'])
      ]));
    }

    render();
  }

  /* ============================================================
     TEST 4 — Inibição Dia/Noite
     ============================================================ */
  function buildDayNight(host){
    var PAIRS = [
      { word: 'DIA',   say: 'NOITE', emoji: '☀️', oposto: '🌙' },
      { word: 'NOITE', say: 'DIA',   emoji: '🌙', oposto: '☀️' },
      { word: 'PARE',  say: 'VAI',   emoji: '🛑', oposto: '✅' },
      { word: 'VAI',   say: 'PARE',  emoji: '✅', oposto: '🛑' }
    ];
    var state = { phase: 'idle', round: 0, totalRounds: 10, correct: 0, errors: 0, currentPair: null, startTime: 0, times: [], done: false };

    function render(){
      host.innerHTML = '';
      host.appendChild(headerProg(state.round, state.totalRounds, state.correct));

      if (state.phase === 'idle') {
        host.appendChild(centerCard([
          el('div', { style: { fontSize:'56px', marginBottom:'8px' } }, ['🌗']),
          el('h3', { style: titleStyle() }, ['Inibição — Dia/Noite']),
          el('p', { style: descStyle() }, [
            'Vou mostrar uma palavra. Toque no OPOSTO. Se aparecer ☀️ DIA, toque em 🌙 NOITE.'
          ]),
          el('button', { style: ctaStyle(), onclick: startRound }, ['▶ Começar'])
        ]));
        return;
      }

      if (state.phase === 'show') {
        host.appendChild(el('div', {
          style: {
            display:'grid', placeItems:'center', padding:'40px 14px', minHeight:'200px',
            background:'linear-gradient(135deg,#0b0a1a,#15143a)',
            borderRadius:'18px', border:'1px solid rgba(124,118,210,.3)', marginBottom:'14px'
          }
        }, [
          el('div', { style: { fontSize:'80px', marginBottom:'8px' } }, [state.currentPair.emoji]),
          el('div', { style: { font:'900 36px/1 system-ui', color:'#f2dca6', letterSpacing:'.04em' } }, [state.currentPair.word])
        ]));

        var opts = el('div', { style: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' } });
        var rightChoice = PAIRS.find(function(p){ return p.say === state.currentPair.say; });
        var wrongChoice = state.currentPair;
        var displayed = shuffle([rightChoice, wrongChoice]);
        displayed.forEach(function(choice){
          opts.appendChild(el('button', {
            style: {
              padding:'24px', fontSize:'42px', cursor:'pointer',
              background:'rgba(124,118,210,.10)', border:'1px solid rgba(124,118,210,.3)',
              borderRadius:'14px', display:'flex', flexDirection:'column', gap:'4px', alignItems:'center'
            },
            onclick: function(){ answer(choice); }
          }, [
            el('div', { style: { fontSize:'46px' } }, [choice === state.currentPair ? choice.emoji : choice.oposto]),
            el('div', { style: { fontSize:'15px', fontWeight:'800', color:'#cdc8ee' } }, [choice === state.currentPair ? choice.word : choice.say])
          ]));
        });
        host.appendChild(opts);
        return;
      }

      if (state.phase === 'done') renderSummary();
    }

    function startRound(){
      state.round = 1;
      next();
    }

    function next(){
      if (state.round > state.totalRounds) {
        state.phase = 'done';
        finish();
        render();
        return;
      }
      state.currentPair = PAIRS[Math.floor(Math.random() * PAIRS.length)];
      state.startTime = Date.now();
      state.phase = 'show';
      render();
    }

    function answer(choice){
      var ok = choice.say === state.currentPair.say;
      var t = (Date.now() - state.startTime) / 1000;
      state.times.push(t);
      if (ok) { state.correct++; celebrate(host, '🌟', 'Boa!'); }
      else state.errors++;
      state.round++;
      setTimeout(next, 600);
    }

    function finish(){
      var avg = state.times.reduce(function(a,b){return a+b;}, 0) / Math.max(1, state.times.length);
      saveResult('day-night', {
        correct: state.correct, errors: state.errors, totalRounds: state.totalRounds,
        avgTime: avg, accuracy: Math.round(100*state.correct/state.totalRounds),
        label: 'Inibição (Dia/Noite)',
        line: 'Inibição: ' + state.correct + '/' + state.totalRounds + ' acertos (' + Math.round(100*state.correct/state.totalRounds) + '%, média ' + avg.toFixed(1) + 's)'
      });
    }

    function renderSummary(){
      var pct = Math.round(100*state.correct/state.totalRounds);
      host.appendChild(el('div', {
        style: {
          background:'linear-gradient(180deg,rgba(231,201,139,.10),rgba(124,118,210,.06))',
          border:'1px solid rgba(231,201,139,.4)', borderRadius:'18px', padding:'22px', textAlign:'center'
        }
      }, [
        el('div', { style: { fontSize:'48px', marginBottom:'8px' } }, ['🏆']),
        el('h3', { style: titleStyle() }, ['Inibição — Resultado']),
        el('div', { style: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', maxWidth:'400px', margin:'0 auto' } }, [
          el('div', { style: scoreBlock() }, [
            el('strong', { style: { display:'block', fontSize:'34px', color:'#f2dca6' } }, [pct + '%']),
            el('span', { style: { fontSize:'12px', color:'#cdc8ee' } }, ['Acertos'])
          ]),
          el('div', { style: scoreBlock() }, [
            el('strong', { style: { display:'block', fontSize:'34px', color:'#f2dca6' } }, [String(state.errors)]),
            el('span', { style: { fontSize:'12px', color:'#cdc8ee' } }, ['Erros (responder o esperado)'])
          ])
        ]),
        el('p', { style: { color:'#a9a4d8', fontSize:'12.5px', margin:'14px 0 0' } }, [
          'Erros frequentes em "responder o automático" sugerem dificuldade de controle inibitório (componente executivo).'
        ]),
        el('button', { style: Object.assign({}, ctaStyle(), { marginTop:'14px' }), onclick: function(){ state = { phase:'idle', round:0, totalRounds:10, correct:0, errors:0, currentPair:null, startTime:0, times:[], done:false }; render(); } }, ['🔄 Refazer'])
      ]));
    }

    render();
  }

  /* ============================================================
     TEST 5 — Consciência Fonológica
     ============================================================ */
  function buildPhonological(host){
    var ROUNDS = [
      { q: 'Qual começa com o mesmo som de CASA?', options: ['🐈 Cachorro','🐎 Cavalo','🦊 Raposa'], correct: 1, sound: 'ca', hint: 'Caaaasa, Caaaavalo — o som CA é o mesmo no começo!' },
      { q: 'Qual rima com PÃO?', options: ['🐶 Cão','🐱 Gato','🐰 Coelho'], correct: 0, sound: 'ão', hint: 'PÃ-ÃO rima com CÃ-ÃO. Mesmo som no FINAL.' },
      { q: 'Quantos pedaços tem BO-NE-CA?', options: ['2','3','4'], correct: 1, sound: '3', hint: 'BO + NE + CA = 3 sílabas. Bata palma uma por uma.' },
      { q: 'Qual começa com o mesmo som de SOL?', options: ['🌙 Lua','🐍 Serpente','🌳 Árvore'], correct: 1, sound: 'so/se', hint: 'SSSSOL, SSSerpente — o som S é o mesmo no começo.' },
      { q: 'Qual rima com FLOR?', options: ['🎨 Cor','📚 Livro','🍎 Maçã'], correct: 0, sound: 'or', hint: 'FL-OR rima com C-OR. Mesmo som no final.' }
    ];
    var state = { phase: 'idle', round: 0, correct: 0, currentRound: null, picked: -1, done: false };

    function render(){
      host.innerHTML = '';
      host.appendChild(headerProg(state.round + 1, ROUNDS.length, state.correct));

      if (state.phase === 'idle') {
        host.appendChild(centerCard([
          el('div', { style: { fontSize:'56px', marginBottom:'8px' } }, ['🎵']),
          el('h3', { style: titleStyle() }, ['Consciência Fonológica']),
          el('p', { style: descStyle() }, [
            'Vou fazer 5 perguntas sobre sons das palavras. Leia em voz alta pra criança e veja qual ela escolhe.'
          ]),
          el('button', { style: ctaStyle(), onclick: startRound }, ['▶ Começar'])
        ]));
        return;
      }

      if (state.phase === 'pick') {
        var r = state.currentRound;
        host.appendChild(el('div', {
          style: {
            background:'linear-gradient(135deg,rgba(124,118,210,.14),rgba(91,84,232,.08))',
            border:'1px solid rgba(124,118,210,.3)', borderRadius:'18px', padding:'24px', marginBottom:'14px', textAlign:'center'
          }
        }, [
          el('div', { style: { fontSize:'42px', marginBottom:'6px' } }, ['🔊']),
          el('p', { style: { font:'800 18px/1.3 "Inter",system-ui', color:'#fff', margin:'0' } }, [r.q])
        ]));

        var opts = el('div', { style: { display:'grid', gap:'10px' } });
        r.options.forEach(function(opt, i){
          opts.appendChild(el('button', {
            style: {
              padding:'18px 16px', fontSize:'16px', fontWeight:'800', cursor:'pointer', textAlign:'left',
              background:'rgba(124,118,210,.08)', border:'1px solid rgba(124,118,210,.3)',
              borderRadius:'14px', color:'#fff', transition:'all .15s'
            },
            onclick: function(){ pick(i); }
          }, [opt]));
        });
        host.appendChild(opts);
        return;
      }

      if (state.phase === 'feedback') {
        var ok = state.picked === state.currentRound.correct;
        host.appendChild(centerCard([
          el('div', { style: { fontSize:'56px', marginBottom:'8px' } }, [ok ? '🌟' : '🌱']),
          el('h3', { style: titleStyle() }, [ok ? 'Isso!' : 'Quase!']),
          el('p', { style: descStyle() }, ['Resposta certa: ' + state.currentRound.options[state.currentRound.correct]]),
          el('p', { style: { color:'#e7c98b', fontSize:'13px', margin:'10px 0 14px', lineHeight:'1.55' } }, ['💡 ' + state.currentRound.hint]),
          el('button', { style: ctaStyle(), onclick: nextRound }, [state.round + 1 >= ROUNDS.length ? '🏁 Ver resultado' : '▶ Próxima'])
        ]));
        return;
      }

      if (state.phase === 'done') renderSummary();
    }

    function startRound(){
      state.round = 0;
      state.currentRound = ROUNDS[0];
      state.phase = 'pick';
      render();
    }

    function pick(i){
      state.picked = i;
      if (i === state.currentRound.correct) { state.correct++; celebrate(host, '🌟', 'Boa!'); }
      state.phase = 'feedback';
      render();
    }

    function nextRound(){
      state.round++;
      if (state.round >= ROUNDS.length) {
        state.phase = 'done';
        finish();
        render();
      } else {
        state.currentRound = ROUNDS[state.round];
        state.phase = 'pick';
        render();
      }
    }

    function finish(){
      saveResult('phonological', {
        correct: state.correct, total: ROUNDS.length,
        accuracy: Math.round(100*state.correct/ROUNDS.length),
        label: 'Consciência Fonológica',
        line: 'Consciência fonológica: ' + state.correct + '/' + ROUNDS.length + ' (rima, som inicial e sílabas)'
      });
    }

    function renderSummary(){
      var pct = Math.round(100*state.correct/ROUNDS.length);
      host.appendChild(el('div', {
        style: {
          background:'linear-gradient(180deg,rgba(231,201,139,.10),rgba(124,118,210,.06))',
          border:'1px solid rgba(231,201,139,.4)', borderRadius:'18px', padding:'22px', textAlign:'center'
        }
      }, [
        el('div', { style: { fontSize:'48px', marginBottom:'8px' } }, ['🏆']),
        el('h3', { style: titleStyle() }, ['Consciência Fonológica — Resultado']),
        el('div', { style: scoreBlock(true) }, [
          el('strong', { style: { display:'block', fontSize:'42px', color:'#f2dca6' } }, [state.correct + '/' + ROUNDS.length]),
          el('span', { style: { fontSize:'12px', color:'#cdc8ee' } }, [pct + '% de acertos'])
        ]),
        el('p', { style: { color:'#a9a4d8', fontSize:'12.5px', margin:'14px 0 0' } }, [
          'Apoio à alfabetização: < 3/5 sugere reforço em consciência fonológica antes da escrita formal.'
        ]),
        el('button', { style: Object.assign({}, ctaStyle(), { marginTop:'14px' }), onclick: function(){ state = { phase:'idle', round:0, correct:0, currentRound:null, picked:-1, done:false }; render(); } }, ['🔄 Refazer'])
      ]));
    }

    render();
  }

  /* ---------- Style helpers ---------- */
  function badgeStyle(active){
    return {
      background: active ? 'linear-gradient(135deg,#7c79ff,#5b54e8)' : 'rgba(124,118,210,.10)',
      color: active ? '#fff' : '#a9a4d8',
      padding: '4px 10px', borderRadius: '999px', fontSize:'12px', fontWeight:'800',
      border:'1px solid ' + (active ? 'transparent' : 'rgba(124,118,210,.24)')
    };
  }
  function ctaStyle(){
    return {
      background:'linear-gradient(180deg,#7c79ff,#5b54e8)', color:'#fff',
      border:'0', borderRadius:'14px', padding:'13px 22px',
      fontWeight:'800', fontSize:'14px', cursor:'pointer',
      boxShadow:'0 10px 26px -10px rgba(91,84,232,.7)',
      transition:'transform .15s'
    };
  }
  function ghostBtnStyle(){
    return {
      background:'rgba(124,118,210,.10)', color:'#cdc8ee',
      border:'1px solid rgba(124,118,210,.24)', borderRadius:'10px',
      padding:'9px 14px', fontWeight:'700', fontSize:'13px', cursor:'pointer'
    };
  }
  function digitBtnStyle(){
    return {
      background:'rgba(124,118,210,.08)', color:'#fff',
      border:'1px solid rgba(124,118,210,.3)', borderRadius:'12px',
      padding:'18px 8px', fontWeight:'800', fontSize:'22px', cursor:'pointer',
      fontFamily:'"Inter",system-ui', transition:'all .12s'
    };
  }
  function titleStyle(){
    return { margin:'0 0 8px', color:'#fff', font:'700 22px Georgia,serif' };
  }
  function descStyle(){
    return { color:'#cdc8ee', fontSize:'14px', lineHeight:'1.55', margin:'0 0 14px' };
  }
  function scoreBlock(big){
    return {
      background:'rgba(20,18,46,.5)', border:'1px solid rgba(124,118,210,.24)',
      borderRadius:'14px', padding: big ? '24px 18px' : '16px 12px', textAlign:'center'
    };
  }
  function centerCard(kids){
    return el('div', {
      style: { textAlign:'center', padding:'28px 16px', background:'rgba(124,118,210,.06)', borderRadius:'18px', border:'1px solid rgba(124,118,210,.22)' }
    }, kids);
  }
  function headerProg(current, total, score){
    var pct = Math.round(100 * (current - 1) / total);
    return el('div', { style: { marginBottom:'12px' } }, [
      el('div', { style: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px', fontSize:'11.5px', color:'#a9a4d8', fontWeight:'700', letterSpacing:'.04em' } }, [
        el('span', null, ['RODADA ' + current + ' / ' + total]),
        score != null ? el('span', { style: { color:'#e7c98b' } }, ['🌟 ' + score]) : null
      ]),
      el('div', { style: { height:'5px', background:'rgba(124,118,210,.14)', borderRadius:'999px', overflow:'hidden' } }, [
        el('div', { style: { height:'100%', width: pct + '%', background:'linear-gradient(90deg,#7c79ff,#e7c98b)', transition:'width .35s ease' } })
      ])
    ]);
  }

  /* ============================================================
     Exposed API
     ============================================================ */
  window.NPDirectTestEngine = {
    version: '1.0.0',
    digitSpan: buildDigitSpan,
    pictureMemory: buildPictureMemory,
    visualSearch: buildVisualSearch,
    dayNight: buildDayNight,
    phonological: buildPhonological,
    results: loadAllResults,
    clearResults: clearResults
  };
})();
