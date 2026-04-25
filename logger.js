/* ═══════════════════════════════════════════════════════
   CIBERGUARDA — logger.js
   Sistema de log de acessos e eventos do usuário.
   Os dados ficam salvos no localStorage do navegador.
   Para uso em produção real, substitua o localStorage
   por chamadas a uma API/backend próprio.
════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ──────────────────────────────
     CONFIGURAÇÃO
  ────────────────────────────── */
  const LOG_KEY     = 'ciberguarda_logs';    // chave no localStorage
  const SESSION_KEY = 'ciberguarda_session'; // chave da sessão atual
  const MAX_LOGS    = 500;                   // limite máximo de registros guardados

  /* ──────────────────────────────
     UTILITÁRIOS
  ────────────────────────────── */

  /** Retorna data/hora no formato brasileiro */
  function agora() {
    return new Date().toLocaleString('pt-BR', {
      day:    '2-digit', month:  '2-digit', year: 'numeric',
      hour:   '2-digit', minute: '2-digit', second: '2-digit',
    });
  }

  /** Gera um ID único de sessão */
  function gerarSessionId() {
    return 'sess_' + Math.random().toString(36).slice(2, 10).toUpperCase();
  }

  /** Detecta o tipo de dispositivo */
  function detectarDispositivo() {
    const ua = navigator.userAgent;
    if (/Mobi|Android|iPhone|iPad/i.test(ua)) return '📱 Mobile';
    if (/Tablet/i.test(ua)) return '📟 Tablet';
    return '🖥️ Desktop';
  }

  /** Detecta o navegador aproximado */
  function detectarNavegador() {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox'))  return 'Firefox';
    if (ua.includes('Edg'))      return 'Edge';
    if (ua.includes('OPR'))      return 'Opera';
    if (ua.includes('Chrome'))   return 'Chrome';
    if (ua.includes('Safari'))   return 'Safari';
    return 'Outro';
  }

  /** Detecta idioma do navegador */
  function detectarIdioma() {
    return navigator.language || 'desconhecido';
  }

  /* ──────────────────────────────
     SESSÃO DO USUÁRIO
  ────────────────────────────── */

  /** Obtém ou cria a sessão atual (dura enquanto a aba estiver aberta) */
  function obterSessao() {
    let sess = sessionStorage.getItem(SESSION_KEY);
    if (!sess) {
      sess = gerarSessionId();
      sessionStorage.setItem(SESSION_KEY, sess);
    }
    return sess;
  }

  /* ──────────────────────────────
     LEITURA / ESCRITA DE LOGS
  ────────────────────────────── */

  /** Lê todos os logs salvos */
  function lerLogs() {
    try {
      return JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    } catch {
      return [];
    }
  }

  /** Salva um novo registro de log */
  function salvarLog(entrada) {
    const logs = lerLogs();
    logs.unshift(entrada); // mais recente primeiro
    if (logs.length > MAX_LOGS) logs.splice(MAX_LOGS); // limita tamanho
    try {
      localStorage.setItem(LOG_KEY, JSON.stringify(logs));
    } catch (e) {
      console.warn('[CiberGuarda Logger] Não foi possível salvar log:', e);
    }
  }

  /* ──────────────────────────────
     API PÚBLICA
  ────────────────────────────── */

  /**
   * Registra um evento personalizado
   * @param {string} tipo  - Nome do evento
   * @param {object} extra - Dados adicionais (opcional)
   */
  window.logEvent = function (tipo, extra = {}) {
    const entrada = {
      id:         Date.now(),
      sessao:     obterSessao(),
      tipo,
      horario:    agora(),
      dispositivo: detectarDispositivo(),
      navegador:  detectarNavegador(),
      idioma:     detectarIdioma(),
      pagina:     document.title,
      ...extra,
    };
    salvarLog(entrada);
  };

  /**
   * Retorna todos os logs em ordem do mais recente
   */
  window.getLogs = function () {
    return lerLogs();
  };

  /**
   * Apaga todos os logs (use com cuidado!)
   */
  window.limparLogs = function () {
    localStorage.removeItem(LOG_KEY);
    console.info('[CiberGuarda Logger] Logs apagados.');
  };

  /**
   * Exporta os logs como arquivo JSON para download
   */
  window.exportarLogs = function () {
    const dados = JSON.stringify(lerLogs(), null, 2);
    const blob  = new Blob([dados], { type: 'application/json' });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement('a');
    a.href      = url;
    a.download  = `ciberguarda-logs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ──────────────────────────────
     LOG AUTOMÁTICO DE ACESSO
  ────────────────────────────── */

  // Registra acesso à página automaticamente
  window.logEvent('acesso_pagina', {
    referrer:    document.referrer || 'direto',
    resolucao:   `${screen.width}x${screen.height}`,
    online:      navigator.onLine,
    cookieHabil: navigator.cookieEnabled,
  });

  // Rastreia tempo de permanência ao sair
  window.addEventListener('beforeunload', () => {
    const inicio = parseInt(sessionStorage.getItem('cg_inicio') || Date.now(), 10);
    const segundos = Math.round((Date.now() - inicio) / 1000);
    window.logEvent('saida_pagina', { tempo_na_pagina_seg: segundos });
  });

  // Marca horário de entrada
  sessionStorage.setItem('cg_inicio', Date.now());

  // Rastreia cliques em seções da nav
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('nav a').forEach(link => {
      link.addEventListener('click', () => {
        window.logEvent('clique_nav', { destino: link.getAttribute('href') || link.textContent });
      });
    });

    // Rastreia interações com o testador de senha (sem guardar a senha!)
    const pwInput = document.getElementById('pwInput');
    if (pwInput) {
      let logouSenha = false;
      pwInput.addEventListener('input', () => {
        if (!logouSenha) {
          window.logEvent('usou_testador_senha');
          logouSenha = true; // só registra 1x por sessão
        }
      });
    }

    // Rastreia cliques no checklist
    document.querySelectorAll('.check-item').forEach((item, i) => {
      item.addEventListener('click', () => {
        const checked = item.classList.contains('checked');
        window.logEvent('checklist_item', { item: i + 1, acao: checked ? 'desmarcou' : 'marcou' });
      });
    });
  });

  console.info('[CiberGuarda Logger] ✅ Sistema de logs iniciado. Sessão:', obterSessao());

})();