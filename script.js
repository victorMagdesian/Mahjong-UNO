/****************************************************
 * VARIÁVEIS GLOBAIS
 ****************************************************/
let deck = [];
let playerHand = [];
let banishedCards = [];
let gameStarted = false;
let gameEnded = false;
let selectedSort = ""; // "sequence" ou "group"

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
 * INICIAR JOGO (mão com 12 cartas)
 ****************************************************/
function startGame() {
  resetGameState(); // Limpa baralho, mão e estado

  // Distribui 11 cartas (conforme seu código original)
  for (let i = 0; i < 11; i++) {
    playerHand.push(deck.pop());
  }

  // Exibe a seção do jogo
  document.getElementById("gameSection").classList.remove("hidden");
  document.getElementById("message").textContent = "Jogo iniciado!";
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
  selectedSort = ""; // Reinicia o método de ordenação

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

  // Reaplica a ordenação escolhida, se houver
  reapplySort();
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
 * COMPRAR CARTA (somente se tiver 12)
 ****************************************************/
function drawCard() {
  if (!gameStarted || gameEnded) return;

  // Se já tem 12, não pode comprar
  if (playerHand.length === 12) {
    alert("Você está com 12 cartas. Descarte antes de comprar novamente!");
    return;
  }

  if (deck.length === 0) {
    alert("O baralho acabou!");
    return;
  }

  // Compra 1 carta
  const newCard = deck.pop();
  playerHand.push(newCard);

  renderHand();
  document.getElementById("message").textContent = 
    "Você comprou uma carta. Agora deve descartar!";
}

/****************************************************
 * DESCARTAR CARTA
 ****************************************************/
function discardCard(cardIndex) {
  if (!gameStarted || gameEnded) return;

  // Se está com 11, deve comprar antes
  if (playerHand.length === 11) {
    alert("Você está com 11 cartas. Compre antes de descartar!");
    return;
  }

  // Remove a carta escolhida da mão (vai pra banidos)
  const discarded = playerHand.splice(cardIndex, 1)[0];
  banishedCards.push(discarded);

  renderHand();
  renderBanishedCards();
  document.getElementById("message").textContent = 
    `Você descartou ${discarded.value} de ${discarded.color}.`;

  if (checkWin()) {
    showVictoryScreen();
  }
}

/****************************************************
 * VERIFICAR SE PODE BATER (3/3/3/2)
 ****************************************************/
function checkWin() {
  if (!gameStarted || gameEnded) return;

  // Precisa ter pelo menos 11 cartas para verificar
  if (playerHand.length < 11) {
    document.getElementById("message").textContent =
      "Você não tem cartas suficientes para bater.";
    return false;
  }

  const currentHand = [...playerHand];
  if (canMahjong(currentHand)) {
    document.getElementById("message").textContent =
      "Parabéns! Você conseguiu bater (3/3/3/2)! Jogo encerrado.";
    gameEnded = true;
    return true;
  } else {
    document.getElementById("message").textContent =
      "Ainda não é possível bater.";
    return false;
  }
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
      return remaining.length === 2 && isPair(remaining);
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
 * ORGANIZAÇÃO DAS CARTAS
 * Agora utilizando "selectedSort" para manter a ordenação 
 * escolhida nas re-renderizações.
 ****************************************************/
function sortBySequence(updateMethod = true) {
  if (!gameStarted || gameEnded) return;

  if (updateMethod) {
    currentSortMethod = "sequence";
    selectedSort = "sequence"; // Armazena o método escolhido
    activateSortButton("btnSortSequence");
  }
  // Ordena: 1 e 9 têm prioridade no início; depois por cor e valor
  playerHand.sort((a, b) => {
    const isA19 = (a.value === 1 || a.value === 9);
    const isB19 = (b.value === 1 || b.value === 9);

    if (isA19 && !isB19) return -1;
    if (isB19 && !isA19) return 1;

    if (a.color < b.color) return -1;
    if (a.color > b.color) return 1;
    return a.value - b.value;
  });

  document.getElementById("message").textContent = 
    "Organizado por Sequência (1 e 9 no início).";
  renderHand();
}

function sortByGroup(updateMethod = true) {
  if (!gameStarted || gameEnded) return;

  if (updateMethod) {
    currentSortMethod = "group";
    selectedSort = "group"; // Armazena o método escolhido
    activateSortButton("btnSortGroup");
  }
  // Ordena: prioridade para 1 e 9; depois por valor, e em caso de empate, por cor
  playerHand.sort((a, b) => {
    const isA19 = (a.value === 1 || a.value === 9);
    const isB19 = (b.value === 1 || b.value === 9);

    if (isA19 && !isB19) return -1;
    if (isB19 && !isA19) return 1;

    if (a.value !== b.value) {
      return a.value - b.value;
    }
    return a.color.localeCompare(b.color);
  });

  document.getElementById("message").textContent = 
    "Organizado por Grupo (1 e 9 no início).";
  renderHand();
}

/****************************************************
 * NOVA FUNÇÃO: REAPLICAR A ORDENAÇÃO ESCOLHIDA
 ****************************************************/
function reapplySort() {
  if (!gameStarted || gameEnded) return;
  // Se a mão foi modificada e um método foi escolhido, reaplica a ordenação
  if (selectedSort === "sequence") {
    // Passa false para não sobrescrever novamente a variável de método
    sortBySequence(false);
  } else if (selectedSort === "group") {
    sortByGroup(false);
  }
}

/****************************************************
 * FUNÇÕES PARA ATIVAR/DESATIVAR BOTÕES DE SORT
 ****************************************************/
function activateSortButton(buttonId) {
  // Desativa todos
  deactivateSortButtons();

  // Ativa o botão específico
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

  // Ações do jogo
  document.getElementById("btnDraw").addEventListener("click", drawCard);
  document.getElementById("btnCheckWin").addEventListener("click", checkWin);

  // Botões para organizar as cartas
  document.getElementById("btnSortSequence").addEventListener("click", () => sortBySequence(true));
  document.getElementById("btnSortGroup").addEventListener("click", () => sortByGroup(true));

  // Modal de ajuda
  const btnHelp = document.getElementById("btnHelp");
  const helpModal = document.getElementById("helpModal");
  const closeModal = document.getElementById("closeModal");

  btnHelp.addEventListener("click", () => {
    helpModal.classList.remove("hidden");
  });

  closeModal.addEventListener("click", () => {
    helpModal.classList.add("hidden");
  });

  window.addEventListener("click", (event) => {
    if (event.target === helpModal) {
      helpModal.classList.add("hidden");
    }
  });
};
