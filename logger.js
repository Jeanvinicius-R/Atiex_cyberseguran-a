/* ═══════════════════════════════════════════════════════
   CIBERGUARDA — logger.js
   Sistema de log de acessos usando Firebase Realtime DB.
   Todos os visitantes são registrados em tempo real
   no banco de dados central do Firebase.

   ⚠️  CONFIGURE AS CHAVES ABAIXO antes de publicar!
       Siga o passo a passo em COMO-PUBLICAR.md
════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════
     🔧 CONFIGURAÇÃO DO FIREBASE
     Cole aqui as suas chaves do projeto Firebase.
     Você encontra essas chaves em:
     Firebase Console → Seu projeto → Configurações ⚙️
     → Seus apps → SDK Firebase → Configuração
  ══════════════════════════════════════════════════════ */
  const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCi0yuJQAqES7jIebtkSeoYzYBjOlJUQZ0",
  authDomain: "ciberguarda.firebaseapp.com",
  databaseURL: "https://ciberguarda-default-rtdb.firebaseio.com",
  projectId: "ciberguarda",
  storageBucket: "ciberguarda.firebasestorage.app",
  messagingSenderId: "110278507200",
  appId: "1:110278507200:web:280293cb704d160fb78b25",
};


  /* ══════════════════════════════════════════════════════
     UTILITÁRIOS
  ══════════════════════════════════════════════════════ */

  /** Retorna data/hora no formato brasileiro */
  function agora() {
    return new Date().toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  }

  /** Gera ID único de sessão */
  function gerarSessionId() {
    return 'sess_' + Math.random().toString(36).slice(2, 10).toUpperCase();
  }

  /** Detecta tipo de dispositivo */
  function detectarDispositivo() {
    const ua = navigator.userAgent;
    if (/Mobi|Android|iPhone|iPad/i.test(ua)) return 'Mobile';
    if (/Tablet/i.test(ua)) return 'Tablet';
    return 'Desktop';
  }

  /** Detecta navegador */
  function detectarNavegador() {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edg'))     return 'Edge';
    if (ua.includes('OPR'))     return 'Opera';
    if (ua.includes('Chrome'))  return 'Chrome';
    if (ua.includes('Safari'))  return 'Safari';
    return 'Outro';
  }

  /** Obtém ou cria o ID de sessão */
  function obterSessao() {
    const KEY = 'cg_session_id';
    let sess = sessionStorage.getItem(KEY);
    if (!sess) {
      sess = gerarSessionId();
      sessionStorage.setItem(KEY, sess);
    }
    return sess;
  }

  /* ══════════════════════════════════════════════════════
     FIREBASE — inicialização e escrita
  ══════════════════════════════════════════════════════ */
  let db = null;

  function inicializarFirebase() {
    try {
      if (typeof firebase === 'undefined') {
        console.warn('[Logger] Firebase SDK não carregado.');
        return false;
      }
      if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
        const db = firebase.database();
      }
      db = firebase.database();
      console.info('[Logger] ✅ Firebase conectado. Sessão:', obterSessao());
      return true;
    } catch (e) {
      console.error('[Logger] Erro ao inicializar Firebase:', e);
      return false;
    }
  }

  function enviarParaFirebase(entrada) {
    if (!db) return;
    db.ref('logs').push(entrada)
      .catch(e => console.error('[Logger] Erro ao enviar log:', e));
  }

  /* ══════════════════════════════════════════════════════
     API PÚBLICA
  ══════════════════════════════════════════════════════ */

  /** Registra um evento e envia ao Firebase */
  window.logEvent = function (tipo, extra = {}) {
    const entrada = {
      sessao:      obterSessao(),
      tipo,
      horario:     agora(),
      timestamp:   Date.now(),
      dispositivo: detectarDispositivo(),
      navegador:   detectarNavegador(),
      idioma:      navigator.language || 'desconhecido',
      resolucao:   `${screen.width}x${screen.height}`,
      referrer:    document.referrer || 'direto',
      ...extra,
    };
    enviarParaFirebase(entrada);
  };

  /** Exporta array de logs como arquivo JSON */
  window.exportarLogs = function (logs) {
    const dados = JSON.stringify(logs, null, 2);
    const blob  = new Blob([dados], { type: 'application/json' });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement('a');
    a.href      = url;
    a.download  = `ciberguarda-logs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** Apaga todos os logs do Firebase */
  window.limparLogsFirebase = function () {
    if (!db) return Promise.reject('DB não inicializado');
    return db.ref('logs').remove();
  };

  /** Escuta logs em tempo real e chama callback a cada atualização */
  window.escutarLogs = function (callback) {
    if (!db) return;
    db.ref('logs').orderByChild('timestamp').on('value', snapshot => {
      const logs = [];
      snapshot.forEach(child => {
        logs.unshift({ id: child.key, ...child.val() });
      });
      callback(logs);
    });
  };

  /* ══════════════════════════════════════════════════════
     LOG AUTOMÁTICO DE ACESSO
  ══════════════════════════════════════════════════════ */

  function init() {
    if (!inicializarFirebase()) return;

    // Log de acesso à página
    window.logEvent('acesso_pagina');
    sessionStorage.setItem('cg_inicio', Date.now());

    // Log de saída com tempo de permanência
    window.addEventListener('beforeunload', () => {
      const inicio   = parseInt(sessionStorage.getItem('cg_inicio') || Date.now(), 10);
      const segundos = Math.round((Date.now() - inicio) / 1000);
      window.logEvent('saida_pagina', { tempo_na_pagina_seg: segundos });
    });

    // Cliques na nav
    document.querySelectorAll('nav a').forEach(link => {
      link.addEventListener('click', () => {
        window.logEvent('clique_nav', {
          destino: link.getAttribute('href') || link.textContent.trim(),
        });
      });
    });

    // Uso do testador de senha (sem salvar a senha!)
    const pwInput = document.getElementById('pwInput');
    if (pwInput) {
      let logouSenha = false;
      pwInput.addEventListener('input', () => {
        if (!logouSenha) {
          window.logEvent('usou_testador_senha');
          logouSenha = true;
        }
      });
    }

    // Cliques no checklist
    document.querySelectorAll('.check-item').forEach((item, i) => {
      item.addEventListener('click', () => {
        const marcou = !item.classList.contains('checked');
        window.logEvent('checklist_item', {
          item: i + 1,
          acao: marcou ? 'marcou' : 'desmarcou',
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();