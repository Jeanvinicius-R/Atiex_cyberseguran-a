/* ═══════════════════════════════════════════════════════
   CIBERGUARDA — script.js
   Lógica interativa: scroll, senha, quiz e checklist
════════════════════════════════════════════════════════ */

/* ════════════════════════════════
   MODAL DE VÍDEO
════════════════════════════════ */

/**
 * Abre o modal com o vídeo do YouTube
 * @param {string} videoId - ID do vídeo no YouTube
 * @param {string} titulo  - Título exibido no modal
 */
function openModal(videoId, titulo) {
  const modal  = document.getElementById('videoModal');
  const iframe = document.getElementById('modalIframe');
  const title  = document.getElementById('modalTitle');

  title.textContent = '🎬 ' + titulo;
  iframe.src = `https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1`;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden'; // trava scroll da página

  if (typeof logEvent === 'function') {
    logEvent('video_aberto', { videoId, titulo });
  }
}

/** Fecha o modal e para o vídeo */
function closeModal() {
  const modal  = document.getElementById('videoModal');
  const iframe = document.getElementById('modalIframe');
  modal.classList.remove('open');
  iframe.src = ''; // para o vídeo
  document.body.style.overflow = '';
}

/**
 * Fecha o modal ao clicar fora da caixa
 * @param {MouseEvent} e
 */
function closeModalOutside(e) {
  if (e.target === document.getElementById('videoModal')) closeModal();
}

// Fecha com tecla ESC
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

/* ════════════════════════════════
   FADE IN AO ROLAR A PÁGINA
════════════════════════════════ */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));


/* ════════════════════════════════
   TESTADOR DE FORÇA DE SENHA
════════════════════════════════ */

/**
 * Alterna visibilidade do campo de senha
 */
function togglePw() {
  const inp = document.getElementById('pwInput');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

/**
 * Verifica a senha e atualiza UI
 * @param {string} val - Valor atual do input
 */
function checkPassword(val) {
  const criteria = {
    len:   val.length >= 12,
    upper: /[A-Z]/.test(val),
    lower: /[a-z]/.test(val),
    num:   /[0-9]/.test(val),
    sym:   /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val),
    seq:   val.length > 0 && !/(012|123|234|345|456|567|678|789|abc|bcd|cde|def|qwerty|abcdef)/i.test(val),
  };

  setCriteria('c-len',   criteria.len);
  setCriteria('c-upper', criteria.upper);
  setCriteria('c-lower', criteria.lower);
  setCriteria('c-num',   criteria.num);
  setCriteria('c-sym',   criteria.sym);
  setCriteria('c-seq',   criteria.seq);

  const score  = Object.values(criteria).filter(Boolean).length;
  const fill   = document.getElementById('strengthFill');
  const text   = document.getElementById('strengthText');

  if (val.length === 0) {
    fill.style.width = '0%';
    text.textContent = 'Digite uma senha para começar';
    text.style.color = 'var(--muted)';
    return;
  }

  const levels = [
    { pct: 16,  color: '#ef4444', label: '🔴 Muito fraca — Quebraria em segundos' },
    { pct: 33,  color: '#ef4444', label: '🔴 Fraca — Adicione mais complexidade' },
    { pct: 50,  color: '#f59e0b', label: '🟡 Razoável — Pode melhorar' },
    { pct: 66,  color: '#f59e0b', label: '🟡 Boa — Quase lá!' },
    { pct: 83,  color: '#10b981', label: '🟢 Forte — Muito boa!' },
    { pct: 100, color: '#10b981', label: '🟢 Excelente — Senha muito segura!' },
  ];

  const level = levels[Math.min(score, 5)];
  fill.style.width      = level.pct + '%';
  fill.style.background = level.color;
  text.textContent      = level.label;
  text.style.color      = level.color;
}

/**
 * Marca/desmarca um critério de senha na UI
 * @param {string} id  - ID do elemento
 * @param {boolean} met - Se o critério foi atendido
 */
function setCriteria(id, met) {
  const el = document.getElementById(id);
  if (met) el.classList.add('met');
  else     el.classList.remove('met');
}


/* ════════════════════════════════
   QUIZ DE PHISHING
════════════════════════════════ */
const quizzes = [
  {
    from: 'suporte@bradesco-seguranca.com.br',
    subject: '⚠️ URGENTE: Sua conta foi bloqueada por atividade suspeita',
    body: `Prezado cliente,\n\nDetectamos atividade suspeita em sua conta. Para evitar o bloqueio definitivo, confirme seus dados agora clicando no link abaixo:\n\n👉 http://bradesc0-seguro.com/verificar/12345\n\nBanco Bradesco S.A — Central de Segurança`,
    isPhishing: true,
    explanation: '🚨 É PHISHING! Sinais: domínio suspeito (bradesco-seguranca.com.br ≠ bradesco.com.br), link com número no lugar de letra (bradesc0), tom de urgência exagerado e URL completamente diferente do banco real.'
  },
  {
    from: 'noreply@youtube.com',
    subject: 'Seu canal do YouTube — relatório mensal de desempenho',
    body: `Olá,\n\nSeu resumo de março está pronto. Veja as métricas de visualizações, inscritos e receita no YouTube Studio:\n\n👉 https://studio.youtube.com/channel/analytics\n\nEquipe YouTube`,
    isPhishing: false,
    explanation: '✅ É LEGÍTIMO! Domínio oficial (@youtube.com), link aponta para o domínio correto (studio.youtube.com), linguagem neutra sem urgência, sem pedido de dados pessoais.'
  },
  {
    from: 'premio@sorteio-ifood-oficial.net',
    subject: '🎉 Você ganhou R$500 em créditos iFood! Resgate agora',
    body: `Parabéns!\n\nVocê foi sorteado e ganhou R$500,00 em créditos iFood! Para resgatar, confirme seu CPF e número do cartão de crédito (para cobrir a taxa de liberação de R$9,90):\n\nResgate aqui: http://bit.ly/ifood-premio-2024`,
    isPhishing: true,
    explanation: '🚨 É PHISHING! Múltiplos sinais: domínio falso (.net em vez de ifood.com.br), link encurtado (bit.ly), pede dados de cartão, cobra "taxa de liberação" (golpe clássico), promessa irreal de prêmio.'
  },
  {
    from: 'atendimento@receita.fazenda.gov.br',
    subject: 'Confirmação de entrega da Declaração IRPF 2024',
    body: `Prezado contribuinte,\n\nInformamos que sua Declaração de Imposto de Renda 2024 foi recebida e está em processamento. O número de recibo é: 1.234.567.890-12.\n\nAcompanhe pelo e-CAC: https://cav.receita.fazenda.gov.br\n\nReceita Federal do Brasil`,
    isPhishing: false,
    explanation: '✅ Parece LEGÍTIMO! Domínio oficial (gov.br), link aponta para domínio correto da Receita Federal, sem pedido de dados ou urgência, tom formal e informativo. Atenção: sempre acesse pelo navegador digitando o endereço diretamente por segurança.'
  },
  {
    from: 'whatsapp-suporte@wpp-verificacao.com',
    subject: 'Seu WhatsApp será desativado em 24 horas',
    body: `Caro usuário,\n\nIdentificamos que sua conta do WhatsApp foi comprometida. Para evitar desativação, confirme seu número e o código de 6 dígitos que você receberá por SMS agora mesmo.\n\nResponda a este e-mail com o código. Prazo: 24h.\n\nEquipe WhatsApp`,
    isPhishing: true,
    explanation: '🚨 É PHISHING! Sinais: domínio completamente falso (wpp-verificacao.com), WhatsApp nunca pede código via e-mail, pede que você envie código por e-mail (esse código é o 2FA da sua conta!), urgência exagerada de 24h.'
  }
];

let currentQuiz = 0;
let quizScore   = 0;
let answered    = false;

/** Renderiza a pergunta atual do quiz */
function renderQuiz() {
  const q = quizzes[currentQuiz];

  document.getElementById('quizContainer').innerHTML = `
    <div style="font-size:0.82rem;color:var(--muted);margin-bottom:0.5rem;font-family:'Space Mono',monospace;">
      Mensagem ${currentQuiz + 1} de ${quizzes.length}
    </div>
    <h3 style="font-size:1rem;margin-bottom:1rem;">Esta mensagem é legítima ou phishing?</h3>
    <div class="quiz-email">
      <div class="email-from">De: ${q.from}</div>
      <div class="email-subject">Assunto: ${q.subject}</div>
      <div style="white-space:pre-line;color:var(--text);">${q.body}</div>
    </div>
    <div class="quiz-buttons">
      <button class="quiz-btn legit"    onclick="answer(false)">✅ É Legítima</button>
      <button class="quiz-btn phishing" onclick="answer(true)">🚨 É Phishing</button>
    </div>
  `;

  document.getElementById('quizResult').className   = 'quiz-result';
  document.getElementById('quizResult').textContent = '';
  document.getElementById('nextBtn').style.display  = 'none';
  document.getElementById('quizProgress').textContent = `${currentQuiz + 1} / ${quizzes.length}`;
  answered = false;
}

/**
 * Processa a resposta do usuário
 * @param {boolean} userSaysPhishing - true se o usuário acha que é phishing
 */
function answer(userSaysPhishing) {
  if (answered) return;
  answered = true;

  const q       = quizzes[currentQuiz];
  const correct = userSaysPhishing === q.isPhishing;
  if (correct) quizScore++;

  const res      = document.getElementById('quizResult');
  res.textContent = q.explanation;
  res.className   = 'quiz-result show ' + (correct ? 'correct' : 'wrong');

  const isLast = currentQuiz === quizzes.length - 1;
  document.getElementById('nextBtn').style.display = isLast ? 'none' : 'inline-block';

  // Registra interação no logger
  if (typeof logEvent === 'function') {
    logEvent('quiz_respondido', { pergunta: currentQuiz + 1, correto: correct });
  }

  if (isLast) {
    setTimeout(() => {
      document.getElementById('quizScore').style.display = 'block';
      const msgs = [
        'Tente estudar mais! Leia as explicações com atenção.',
        'Bom começo! Continue praticando.',
        'Não está mal! Fique atento aos detalhes.',
        'Muito bom! Você tem bom olho para golpes.',
        'Excelente! Você é um detector de phishing!',
      ];
      document.getElementById('scoreTxt').textContent =
        `Você acertou ${quizScore} de ${quizzes.length}. ${msgs[Math.min(quizScore - 1, 4)] || msgs[0]}`;
    }, 500);
  }
}

/** Avança para a próxima pergunta */
function nextQuiz() {
  currentQuiz++;
  renderQuiz();
}

// Inicia o quiz
renderQuiz();


/* ════════════════════════════════
   CHECKLIST INTERATIVO
════════════════════════════════ */

/**
 * Marca/desmarca um item do checklist
 * @param {HTMLElement} el - Elemento clicado
 */
function toggleCheck(el) {
  el.classList.toggle('checked');
  updateProgress();
}

/** Atualiza a barra de progresso do checklist */
function updateProgress() {
  const total = document.querySelectorAll('.check-item').length;
  const done  = document.querySelectorAll('.check-item.checked').length;

  document.getElementById('checkCount').textContent       = `${done} / ${total} concluídos`;
  document.getElementById('checkProgress').style.width    = (done / total * 100) + '%';
}