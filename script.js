/****************************************************
 * VARIÁVEIS GLOBAIS
 ****************************************************/
let deck = [];
let playerHand = [];
let banishedCards = [];
let gameStarted = false;
let gameEnded = false;

// Armazena o método atual de sort: "sequence", "group" ou null
let currentSortMethod = null;

/****************************************************
 * FUNÇÃO: CRIAR BARALHO (UNO 1–9, 4 cores, 2 cópias)
 ****************************************************/
function createDeck() {
  const colors = ["red", "blue", "green", "yellow"];
  const numbers = [1,2,3,4,5,6,7,8,9];
  let newDeck = [];

  for (let color of colors) {
    for (let num of numbers) {
      newDeck.push({color, value: num});
      newDeck.push({color, value: num});
    }
  }
  return newDeck;
}

/****************************************************
 * EMBARALHAR (Fisher-Yates)
 ****************************************************/
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/****************************************************
 * INICIAR JOGO
 ****************************************************/
function startGame() {
  resetGameState();

  // O jogo começa com 11 cartas
  for (let i = 0; i < 11; i++) {
    playerHand.push(deck.pop());
  }

  document.getElementById("gameSection").classList.remove("hidden");
  document.getElementById("message").textContent = "Jogo iniciado! Boa sorte.";
  gameStarted = true;
  gameEnded = false;

  renderHand();
  renderBanishedCards();
}

/****************************************************
 * REINICIAR JOGO (RESET TOTAL)
 ****************************************************/
function resetGameState() {
  deck = shuffle(createDeck());
  playerHand = [];
  banishedCards = [];
  gameStarted = false;
  gameEnded = false;
  currentSortMethod = null;

  // Remove destaque dos botões
  deactivateSortButtons();

  // Esconde a seção do jogo até clicar em "Iniciar Jogo"
  document.getElementById("gameSection").classList.add("hidden");
  document.getElementById("message").textContent = "";
}

/****************************************************
 * RENDERIZAR MÃO
 ****************************************************/
function renderHand() {
  const handDiv = document.getElementById("playerHand");
  handDiv.innerHTML = "";

  playerHand.forEach((card, index) => {
    const cardEl = document.createElement("div");
    cardEl.classList.add("card", card.color);
    cardEl.textContent = card.value;
    cardEl.setAttribute("data-value", card.value);

    // Clique descarta a carta (vai para banimento)
    cardEl.addEventListener("click", () => {
      discardCard(index);
    });
    handDiv.appendChild(cardEl);
  });
}

/****************************************************
 * RENDERIZAR CARTAS BANIDAS
 ****************************************************/
function renderBanishedCards() {
  const banishSection = document.getElementById("banishSection");
  const banishedDiv = document.getElementById("banishedCards");

  if (banishedCards.length === 0) {
    banishSection.classList.add("hidden");
    return;
  }
  banishSection.classList.remove("hidden");
  banishedDiv.innerHTML = "";

  banishedCards.forEach(card => {
    const cardEl = document.createElement("div");
    cardEl.classList.add("card", card.color);
    cardEl.textContent = card.value;
    cardEl.setAttribute("data-value", card.value);
    banishedDiv.appendChild(cardEl);
  });
}

/****************************************************
 * COMPRAR CARTA
 ****************************************************/
function drawCard() {
  if (!gameStarted || gameEnded) return;

  // Se já tem 12 cartas, não pode comprar
  if (playerHand.length === 12) {
    alert("Você está com 12 cartas, precisa descartar antes de comprar!");
    return;
  }

  if (deck.length === 0) {
    alert("O baralho acabou! Não foi possível comprar.");
    return;
  }

  // Compra uma carta
  const boughtCard = deck.pop();
  playerHand.push(boughtCard);

  // Renderiza a carta comprada
  renderBoughtCard(boughtCard);

  document.getElementById("message").textContent =
    "Você comprou uma carta. Agora deve descartar.";

  // Reaplica o sort atual, se existir
  if (currentSortMethod === "sequence") {
    sortBySequence(false);
  } else if (currentSortMethod === "group") {
    sortByGroup(false);
  }

  renderHand();
}

function renderBoughtCard(card) {
  const boughtCardDiv = document.getElementById("boughtCard");
  boughtCardDiv.innerHTML = ""; // Limpa o espaço para nova carta

  const cardEl = document.createElement("div");
  cardEl.classList.add("card", "bought-card", card.color);
  cardEl.textContent = card.value;
  cardEl.setAttribute("data-value", card.value);

  // Adiciona evento para descartar a própria carta comprada
  cardEl.addEventListener("click", () => {
    discardBoughtCard(card);
  });

  boughtCardDiv.appendChild(cardEl);
}

function discardBoughtCard(card) {
  if (!gameStarted || gameEnded) return;

  // Se está com 11 cartas, precisa comprar antes de descartar
  if (playerHand.length === 11) {
    alert("Você está com 11 cartas, deve comprar antes de descartar!");
    return;
  }

  // Remove a carta comprada da mão
  const index = playerHand.findIndex(
    (c) => c.value === card.value && c.color === card.color
  );
  if (index !== -1) {
    playerHand.splice(index, 1);
  }

  // Adiciona ao banimento
  banishedCards.push(card);

  document.getElementById("message").textContent = 
    `Você descartou a carta comprada: ${card.value} de ${card.color}.`;

  renderHand();
  renderBanishedCards();
  clearBoughtCard();

  // Verifica se o jogador venceu
  if (checkWin(playerHand)) {
    showVictoryScreen();
  }
}


function clearBoughtCard() {
  const boughtCardDiv = document.getElementById("boughtCard");
  boughtCardDiv.innerHTML = ""; // Limpa a área da carta comprada
}



/****************************************************
 * DESCARTAR CARTA
 ****************************************************/
function discardCard(cardIndex) {
  if (!gameStarted || gameEnded) return;

  // Se está com 11 cartas, precisa comprar antes de descartar
  if (playerHand.length === 11) {
    alert("Você está com 11 cartas, deve comprar antes de descartar!");
    return;
  }

  // Remove do array e manda para banidos
  const discarded = playerHand.splice(cardIndex, 1)[0];
  banishedCards.push(discarded);

  document.getElementById("message").textContent = 
    `Você descartou ${discarded.value} de ${discarded.color}.`;

  renderHand();
  renderBanishedCards();

  // Verifica se o jogador venceu
  if (checkWin(playerHand)) {
    showVictoryScreen();
  }
}



function showVictoryScreen() {
  const victoryScreen = document.getElementById("victoryScreen");
  victoryScreen.classList.remove("hidden");

  // Finaliza o jogo
  gameEnded = true;
  document.getElementById("message").textContent = "Parabéns! Você venceu o jogo!";
}


/****************************************************
 * VERIFICAR SE PODE BATER (3/3/3/2)
 ****************************************************/
function checkWin(hand) {
  // Ordena normal (por cor, depois valor)
  hand.sort((a, b) => {
    if (a.color === b.color) {
      return a.value - b.value;
    }
    return a.color.localeCompare(b.color);
  });

  function isRun(c) {
    if (c.length !== 3) return false;
    const [c1, c2, c3] = c;
    return (
      c1.color === c2.color &&
      c2.color === c3.color &&
      c2.value === c1.value + 1 &&
      c3.value === c2.value + 1
    );
  }

  function isGroup(c) {
    if (c.length !== 3) return false;
    const [c1, c2, c3] = c;
    return (
      c1.value === c2.value &&
      c2.value === c3.value &&
      c1.color !== c2.color &&
      c2.color !== c3.color &&
      c1.color !== c3.color
    );
  }

  function isPair(c) {
    return c.length === 2 && c[0].value === c[1].value;
  }

  // Gera combinações de 3
  let combos3 = [];
  for (let i = 0; i < hand.length - 2; i++) {
    for (let j = i + 1; j < hand.length - 1; j++) {
      for (let k = j + 1; k < hand.length; k++) {
        combos3.push([i, j, k]);
      }
    }
  }

  function attempt(remaining, sets = 0) {
    if (sets === 3) {
      // O que sobrar deve ser um par
      if (remaining.length === 2 && isPair(remaining)) {
        return true;
      }
      return false;
    }
    for (let combo of combos3) {
      let [x, y, z] = combo;
      if (
        x >= remaining.length ||
        y >= remaining.length ||
        z >= remaining.length
      ) {
        continue;
      }
      let testSet = [remaining[x], remaining[y], remaining[z]].sort(
        (a, b) => a.value - b.value
      );
      if (isRun(testSet) || isGroup(testSet)) {
        let newRem = remaining.filter(
          (_, idx) => idx !== x && idx !== y && idx !== z
        );
        if (attempt(newRem, sets + 1)) {
          return true;
        }
      }
    }
    return false;
  }

  return attempt(hand, 0);
}


/****************************************************
 * canMahjong: lógica simples p/ 3/3/3 + 2
 ****************************************************/
function canMahjong(hand) {
  // Ordena normal (por cor, depois valor)
  hand.sort((a, b) => {
    if (a.color === b.color) {
      return a.value - b.value;
    }
    return a.color.localeCompare(b.color);
  });

  function isRun(c) {
    if (c.length !== 3) return false;
    const [c1, c2, c3] = c;
    return (
      c1.color === c2.color &&
      c2.color === c3.color &&
      c2.value === c1.value + 1 &&
      c3.value === c2.value + 1
    );
  }

  function isGroup(c) {
    if (c.length !== 3) return false;
    const [c1, c2, c3] = c;
    return (
      c1.value === c2.value &&
      c2.value === c3.value &&
      c1.color !== c2.color &&
      c2.color !== c3.color &&
      c1.color !== c3.color
    );
  }

  function isPair(c) {
    return c.length === 2 && c[0].value === c[1].value;
  }

  // Gera combinações de 3
  let combos3 = [];
  for (let i = 0; i < hand.length - 2; i++) {
    for (let j = i + 1; j < hand.length - 1; j++) {
      for (let k = j + 1; k < hand.length; k++) {
        combos3.push([i, j, k]);
      }
    }
  }

  function attempt(remaining, sets = 0) {
    if (sets === 3) {
      // O que sobrar deve ser um par
      if (remaining.length === 2 && isPair(remaining)) {
        return true;
      }
      return false;
    }
    for (let combo of combos3) {
      let [x, y, z] = combo;
      if (
        x >= remaining.length ||
        y >= remaining.length ||
        z >= remaining.length
      ) {
        continue;
      }
      let testSet = [remaining[x], remaining[y], remaining[z]].sort(
        (a, b) => a.value - b.value
      );
      if (isRun(testSet) || isGroup(testSet)) {
        let newRem = remaining.filter(
          (_, idx) => idx !== x && idx !== y && idx !== z
        );
        if (attempt(newRem, sets + 1)) {
          return true;
        }
      }
    }
    return false;
  }

  return attempt(hand, 0);
}

/****************************************************
 * ORGANIZAÇÃO DAS CARTAS + 1 e 9 no INÍCIO
 * Com "modo" para não sobrescrever currentSortMethod.
 ****************************************************/
function sortBySequence(updateMethod = true) {
  if (!gameStarted || gameEnded) return;

  if (updateMethod) {
    currentSortMethod = "sequence";
    activateSortButton("btnSortSequence");
  }
  // Ordena tudo em uma passada:
  // 1) Coloca 1 e 9 no início
  // 2) Depois ordena por cor e valor
  playerHand.sort((a, b) => {
    const isA19 = (a.value === 1 || a.value === 9);
    const isB19 = (b.value === 1 || b.value === 9);

    // Prioridade total para 1 e 9
    if (isA19 && !isB19) return -1;
    if (isB19 && !isA19) return 1;

    // Se ambos ou nenhum é 1/9, ordena por cor e valor
    if (a.color < b.color) return -1;
    if (a.color > b.color) return 1;
    return a.value - b.value;
  });

  document.getElementById("message").textContent = 
    "Organizado por Sequências (1 e 9 no início).";
  renderHand();
}

function sortByGroup(updateMethod = true) {
  if (!gameStarted || gameEnded) return;

  if (updateMethod) {
    currentSortMethod = "group";
    activateSortButton("btnSortGroup");
  }
  // Ordena tudo em uma passada:
  // 1) Coloca 1 e 9 no início
  // 2) Depois ordena por valor, em caso de empate, por cor
  playerHand.sort((a, b) => {
    const isA19 = (a.value === 1 || a.value === 9);
    const isB19 = (b.value === 1 || b.value === 9);

    // Prioridade total para 1 e 9
    if (isA19 && !isB19) return -1;
    if (isB19 && !isA19) return 1;

    // Se ambos ou nenhum é 1/9, compara pelo valor
    if (a.value !== b.value) {
      return a.value - b.value;
    }
    // Se tiver o mesmo valor, compara cor
    return a.color.localeCompare(b.color);
  });

  document.getElementById("message").textContent = 
    "Organizado por Grupos (1 e 9 no início).";
  renderHand();
}

/****************************************************
 * FUNÇÕES PARA ATIVAR/DESATIVAR BOTÕES DE SORT
 ****************************************************/
function activateSortButton(buttonId) {
  // Desativa todos
  deactivateSortButtons();

  // Ativa o específico
  const btn = document.getElementById(buttonId);
  if (btn) {
    btn.classList.add("active");
  }
}

function deactivateSortButtons() {
  const switches = document.querySelectorAll(".sort-switch");
  switches.forEach(s => s.classList.remove("active"));
}

/****************************************************
 * EVENT LISTENERS
 ****************************************************/
window.onload = () => {
  // Botões iniciais
  document.getElementById("btnStart").addEventListener("click", startGame);
  document.getElementById("btnRestart").addEventListener("click", () => {
    resetGameState();
    document.getElementById("message").textContent =
      "Jogo reiniciado. Clique em 'Iniciar Jogo' para jogar novamente.";
  });

  // Ações de jogo
  document.getElementById("btnDraw").addEventListener("click", drawCard);
  document.getElementById("btnCheckWin").addEventListener("click", checkWin);

  // Organizações
  document.getElementById("btnSortSequence").addEventListener("click", () => sortBySequence(true));
  document.getElementById("btnSortGroup").addEventListener("click", () => sortByGroup(true));

  // Modal de ajuda
  const btnHelp = document.getElementById("btnHelp");
  const helpModal = document.getElementById("helpModal");
  const closeModal = document.getElementById("closeModal");

  // Abrir modal de ajuda
  btnHelp.addEventListener("click", () => {
    helpModal.classList.remove("hidden");
  });

  // Fechar modal ao clicar no X
  closeModal.addEventListener("click", () => {
    helpModal.classList.add("hidden");
  });

  // Fechar modal clicando no fundo
  window.addEventListener("click", (event) => {
    if (event.target === helpModal) {
      helpModal.classList.add("hidden");
    }
  });
};
