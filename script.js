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
   QUIZ DE CYBERSEGURANÇA
   15 perguntas cobrindo todos os temas
════════════════════════════════ */
const quizzes = [

  /* ── PHISHING ── */
  {
    tema: 'Phishing',
    from: 'suporte@bradesco-seguranca.com.br',
    subject: '⚠️ URGENTE: Sua conta foi bloqueada por atividade suspeita',
    body: `Prezado cliente,\n\nDetectamos atividade suspeita em sua conta. Para evitar o bloqueio definitivo, confirme seus dados agora:\n\n👉 http://bradesc0-seguro.com/verificar/12345\n\nBanco Bradesco S.A — Central de Segurança`,
    isPhishing: true,
    explanation: '🚨 PHISHING! Domínio falso (bradesco-seguranca.com.br ≠ bradesco.com.br), URL com "0" no lugar de "o" (bradesc0), urgência exagerada. Bancos nunca pedem dados por e-mail.'
  },
  {
    tema: 'Phishing',
    from: 'noreply@youtube.com',
    subject: 'Seu canal do YouTube — relatório mensal de desempenho',
    body: `Olá,\n\nSeu resumo de março está pronto. Veja as métricas no YouTube Studio:\n\n👉 https://studio.youtube.com/channel/analytics\n\nEquipe YouTube`,
    isPhishing: false,
    explanation: '✅ LEGÍTIMO! Domínio oficial @youtube.com, link aponta para studio.youtube.com, sem urgência nem pedido de dados pessoais.'
  },
  {
    tema: 'Phishing',
    from: 'premio@sorteio-ifood-oficial.net',
    subject: '🎉 Você ganhou R$500 em créditos iFood! Resgate agora',
    body: `Parabéns!\n\nVocê ganhou R$500,00! Para resgatar, confirme seu CPF e cartão de crédito (taxa de liberação: R$9,90):\n\n👉 http://bit.ly/ifood-premio-2024`,
    isPhishing: true,
    explanation: '🚨 PHISHING! Domínio falso (.net ≠ ifood.com.br), link encurtado (bit.ly), pede dados de cartão, cobra "taxa de liberação" — golpe clássico de engenharia social.'
  },

  /* ── WI-FI PÚBLICO ── */
  {
    tema: 'Wi-Fi Público',
    from: 'ti@empresa-parceira.com',
    subject: 'Acesse grátis: Wi-Fi "Aeroporto_Free" — sem senha necessária',
    body: `Prezado passageiro,\n\nO Wi-Fi gratuito do aeroporto está disponível. Conecte-se à rede "Aeroporto_Free" sem necessidade de senha.\n\nApós conectar, acesse seu internet banking normalmente pelo celular.\n\nBoa viagem!`,
    isPhishing: true,
    explanation: '🚨 PHISHING / ATAQUE! Redes Wi-Fi abertas sem senha em locais públicos são frequentemente armadilhas. Nunca acesse internet banking em Wi-Fi público — hackers podem interceptar todos os seus dados (ataque "Man in the Middle").'
  },
  {
    tema: 'Wi-Fi Público',
    from: 'noreply@starbucks.com.br',
    subject: 'Conecte-se ao Wi-Fi Starbucks — Portal de acesso',
    body: `Olá!\n\nPara usar o Wi-Fi gratuito Starbucks, acesse o portal em:\n\n👉 https://wifi.starbucks.com.br\n\nVocê precisará confirmar que tem 18 anos ou mais. Nenhum dado de pagamento é solicitado.\n\nBom café! ☕`,
    isPhishing: false,
    explanation: '✅ PARECE LEGÍTIMO! Domínio oficial, não pede dados financeiros, apenas confirmação de idade. Mesmo assim, evite acessar contas bancárias em redes públicas — prefira usar seus dados móveis.'
  },

  /* ── RANSOMWARE / MALWARE ── */
  {
    tema: 'Ransomware',
    from: 'rh@minhaempresa.com.br',
    subject: 'Holerite de Dezembro — abrir com urgência',
    body: `Olá,\n\nSegue em anexo o seu holerite referente ao mês de dezembro.\n\nPor favor, abra o arquivo "holerite_dez_2024.exe" para visualizar.\n\nAtenciosamente,\nRH`,
    isPhishing: true,
    explanation: '🚨 MALWARE! Departamentos de RH nunca enviam holerites em formato .exe — arquivos executáveis (.exe, .bat, .msi) enviados por e-mail são um sinal clássico de ransomware ou vírus. Holerites são sempre PDF.'
  },
  {
    tema: 'Ransomware',
    from: 'backup@dropbox.com',
    subject: 'Seu arquivo foi compartilhado: Relatório_Q4_2024.pdf',
    body: `João compartilhou um arquivo com você no Dropbox:\n\n📄 Relatório_Q4_2024.pdf\n\n👉 https://www.dropbox.com/s/abc123/Relatorio_Q4.pdf\n\nAcesse com sua conta Dropbox para visualizar.\n\nEquipe Dropbox`,
    isPhishing: false,
    explanation: '✅ PARECE LEGÍTIMO! Domínio oficial (@dropbox.com), link aponta para dropbox.com, arquivo em PDF (não executável), sem urgência ou pedido de dados. Confirme com o João se realmente enviou o arquivo antes de abrir.'
  },

  /* ── ENGENHARIA SOCIAL ── */
  {
    tema: 'Engenharia Social',
    from: 'suporte.tecnico@microsoft-help.net',
    subject: 'ALERTA: Vírus detectado no seu computador — ação imediata necessária',
    body: `Prezado usuário Windows,\n\nNossos sistemas detectaram um vírus crítico no seu computador (IP: 177.xx.xx.xx).\n\nPara remover imediatamente, ligue para nossa central: 0800-123-4567 ou baixe nossa ferramenta de remoção em: http://microsoft-help.net/remover\n\nMicrosoft Security Team`,
    isPhishing: true,
    explanation: '🚨 SCAM DE SUPORTE TÉCNICO! A Microsoft nunca entra em contato sem solicitação. Domínio falso (microsoft-help.net ≠ microsoft.com), número de telefone suspeito, link para site externo. Nunca ligue para números de e-mails não solicitados.'
  },
  {
    tema: 'Engenharia Social',
    from: 'contato@nubank.com.br',
    subject: 'Seu extrato de janeiro está disponível',
    body: `Olá, Marcos!\n\nSeu extrato de janeiro/2025 já está disponível no app.\n\nPara visualizar, acesse o app Nubank ou:\n👉 https://nubank.com.br/extrato\n\nNão reconhece essa conta? Acesse nubank.com.br/ajuda.\n\nNubank`,
    isPhishing: false,
    explanation: '✅ LEGÍTIMO! Domínio oficial @nubank.com.br, link aponta para nubank.com.br, não pede senha nem dados, sugere o app para visualizar. Sem urgência ou ameaça.'
  },

  /* ── LOJAS FALSAS / FRAUDES ── */
  {
    tema: 'Lojas Falsas',
    from: 'ofertas@amazon-br-descontos.shop',
    subject: '🔥 iPhone 15 Pro por R$899 — estoque limitadíssimo!',
    body: `OFERTA IMPERDÍVEL!\n\nIPhone 15 Pro — apenas R$899,00 (90% OFF)!\n\nEstoque: apenas 3 unidades!\n\n👉 COMPRAR AGORA: http://amazon-br-descontos.shop/iphone15\n\nOferta válida por apenas 2 horas!`,
    isPhishing: true,
    explanation: '🚨 LOJA FALSA! Domínio suspeito (.shop ≠ amazon.com.br), preço impossível (90% off em iPhone novo), estoque "limitadíssimo" e prazo de 2 horas são técnicas de pressão psicológica. Sempre verifique o CNPJ e o domínio oficial.'
  },
  {
    tema: 'Lojas Falsas',
    from: 'pedidos@magazineluiza.com.br',
    subject: 'Pedido #ML-2024-98765 confirmado — Smart TV 55"',
    body: `Olá, Ana!\n\nSeu pedido foi confirmado com sucesso.\n\n📦 Smart TV Samsung 55" QLED\n💰 R$ 2.849,00 (3x sem juros)\n🚚 Entrega prevista: 05/02/2025\n\nAcompanhe em: https://www.magazineluiza.com.br/pedidos\n\nMagazine Luiza`,
    isPhishing: false,
    explanation: '✅ LEGÍTIMO! Domínio oficial @magazineluiza.com.br, link aponta para o site correto, contém dados específicos do pedido, sem urgência nem pedido de dados adicionais.'
  },

  /* ── SENHAS E 2FA ── */
  {
    tema: 'Senhas & 2FA',
    from: 'seguranca@google-accounts-verify.com',
    subject: 'Alguém tentou acessar sua conta Google — confirme agora',
    body: `Detectamos uma tentativa de acesso à sua conta Google de um dispositivo desconhecido (Rússia).\n\nPara proteger sua conta, confirme sua senha atual:\n\n👉 http://google-accounts-verify.com/confirmar\n\nSe não confirmar em 1 hora, sua conta será suspensa.`,
    isPhishing: true,
    explanation: '🚨 PHISHING! Domínio falso (google-accounts-verify.com ≠ google.com), o Google nunca pede para confirmar senha por e-mail, ameaça de suspensão em 1 hora é pressão psicológica. Acesse sempre accounts.google.com diretamente.'
  },
  {
    tema: 'Senhas & 2FA',
    from: 'no-reply@accounts.google.com',
    subject: 'Código de verificação em duas etapas: 847293',
    body: `Seu código de verificação do Google:\n\n847293\n\nEsse código expira em 10 minutos. Se você não solicitou, ignore esta mensagem e considere trocar sua senha.\n\nEquipe de Segurança do Google`,
    isPhishing: false,
    explanation: '✅ LEGÍTIMO! Domínio oficial @accounts.google.com, apenas envia o código (não pede nada), avisa para ignorar se não solicitou. ATENÇÃO: nunca compartilhe esse código com ninguém — nem com quem diz ser do suporte.'
  },

  /* ── DADOS SENSÍVEIS ── */
  {
    tema: 'Dados Sensíveis',
    from: 'cadastro@serasa-limpa-nome.net',
    subject: 'Seu CPF foi negativado — limpe seu nome GRÁTIS agora',
    body: `Identificamos seu CPF na lista de inadimplentes.\n\nPara limpar seu nome GRATUITAMENTE, precisamos confirmar seus dados:\n\n• CPF completo\n• Data de nascimento\n• Nome completo da mãe\n• Número do RG\n\nResponda este e-mail com seus dados ou acesse:\nhttp://serasa-limpa-nome.net/limpar`,
    isPhishing: true,
    explanation: '🚨 GOLPE DE DADOS! Domínio falso (.net ≠ serasa.com.br), pede dados pessoais por e-mail (CPF, RG, nome da mãe = suficiente para roubo de identidade). O Serasa Limpa Nome é gratuito e acessado apenas em serasa.com.br.'
  },
  {
    tema: 'Dados Sensíveis',
    from: 'noreply@gov.br',
    subject: 'gov.br — Código de acesso à sua conta',
    body: `Olá!\n\nSeu código de acesso temporário ao gov.br:\n\n193847\n\nVálido por 10 minutos. Acesse em: https://acesso.gov.br\n\nSe não solicitou, ignore esta mensagem.\n\nEquipe gov.br`,
    isPhishing: false,
    explanation: '✅ LEGÍTIMO! Domínio oficial @gov.br, link para acesso.gov.br (domínio oficial), apenas envia código sem pedir dados, avisa para ignorar se não solicitou. Mesmo assim, nunca compartilhe esse código com terceiros.'
  },

];

let currentQuiz = 0;
let quizScore   = 0;
let answered    = false;

/** Renderiza a pergunta atual do quiz */
function renderQuiz() {
  const q = quizzes[currentQuiz];

  document.getElementById('quizContainer').innerHTML = `
    <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem;">
      <span style="font-size:0.7rem;font-family:'Space Mono',monospace;color:var(--muted);">
        Pergunta ${currentQuiz + 1} de ${quizzes.length}
      </span>
      <span style="font-size:0.68rem;padding:0.2rem 0.5rem;border-radius:4px;background:rgba(0,229,255,0.1);color:var(--accent);font-family:'Space Mono',monospace;">
        ${q.tema}
      </span>
    </div>
    <h3 style="font-size:1rem;margin-bottom:1rem;">Esta mensagem é legítima ou phishing/golpe?</h3>
    <div class="quiz-email">
      <div class="email-from">De: ${q.from}</div>
      <div class="email-subject">Assunto: ${q.subject}</div>
      <div style="white-space:pre-line;color:var(--text);">${q.body}</div>
    </div>
    <div class="quiz-buttons">
      <button class="quiz-btn legit"    onclick="answer(false)">✅ É Legítima</button>
      <button class="quiz-btn phishing" onclick="answer(true)">🚨 É Phishing/Golpe</button>
    </div>
  `;

  document.getElementById('quizResult').className   = 'quiz-result';
  document.getElementById('quizResult').textContent = '';
  document.getElementById('nextBtn').style.display  = 'none';
  document.getElementById('quizProgress').textContent = `${currentQuiz + 1} / ${quizzes.length}`;
  document.getElementById('quizScore').style.display = 'none';
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

  const res     = document.getElementById('quizResult');
  res.textContent = q.explanation;
  res.className   = 'quiz-result show ' + (correct ? 'correct' : 'wrong');

  const isLast = currentQuiz === quizzes.length - 1;
  document.getElementById('nextBtn').style.display = isLast ? 'none' : 'inline-block';

  if (typeof logEvent === 'function') {
    logEvent('quiz_respondido', { pergunta: currentQuiz + 1, tema: q.tema, correto: correct });
  }

  if (isLast) {
    setTimeout(() => {
      const scoreBox = document.getElementById('quizScore');
      scoreBox.style.display = 'block';

      const pct = Math.round((quizScore / quizzes.length) * 100);
      let emoji, msg;
      if (pct === 100)      { emoji = '🏆'; msg = 'Perfeito! Você é um expert em segurança digital!'; }
      else if (pct >= 80)   { emoji = '🎯'; msg = 'Excelente! Você tem ótimo olho para golpes.'; }
      else if (pct >= 60)   { emoji = '👍'; msg = 'Bom resultado! Continue praticando.'; }
      else if (pct >= 40)   { emoji = '📚'; msg = 'Razoável. Releia os cards de ameaças acima.'; }
      else                  { emoji = '⚠️'; msg = 'Atenção! Leia com cuidado os temas abordados.'; }

      document.getElementById('scoreTxt').innerHTML = `
        <div style="font-size:2rem;margin-bottom:0.5rem;">${emoji}</div>
        <div style="font-size:1.1rem;font-weight:700;color:var(--text);margin-bottom:0.4rem;">
          ${quizScore} / ${quizzes.length} corretas (${pct}%)
        </div>
        <div style="color:var(--muted);font-size:0.85rem;margin-bottom:1rem;">${msg}</div>
        <button class="btn btn-secondary" onclick="reiniciarQuiz()" style="font-size:0.8rem;padding:0.5rem 1.2rem;">
          🔄 Tentar novamente
        </button>
      `;
    }, 500);
  }
}

/** Avança para a próxima pergunta */
function nextQuiz() {
  currentQuiz++;
  renderQuiz();
}

/** Reinicia o quiz do zero */
function reiniciarQuiz() {
  currentQuiz = 0;
  quizScore   = 0;
  answered    = false;
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